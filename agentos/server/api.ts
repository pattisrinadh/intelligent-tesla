import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { db, StoredAgent, AgentExecution } from './db';
import { ProviderFactory } from './providers';

export const app = express();

app.use(cors());
app.use(express.json());

// Mask API keys so client never sees plain secrets
function maskApiKey(key?: string): string {
  if (!key) return '';
  if (key.length <= 8) return '********';
  return `${key.slice(0, 4)}...${key.slice(-4)}`;
}

// ─── AGENTS ENDPOINTS ─────────────────────────────────────────────────────────

// GET /api/agents - List all agents
app.get('/api/agents', (_req: Request, res: Response) => {
  try {
    const agents = db.getAgents();
    res.json({ success: true, data: agents });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/agents - Create an agent
app.post('/api/agents', (req: Request, res: Response) => {
  try {
    const {
      name, id, description, role, systemPrompt,
      provider, model, temperature, maxTokens, capabilities,
    } = req.body;

    // Validate required fields
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Agent name is required.' });
    }
    if (!role || !role.trim()) {
      return res.status(400).json({ success: false, error: 'Agent role is required.' });
    }
    if (!systemPrompt || !systemPrompt.trim()) {
      return res.status(400).json({ success: false, error: 'Agent instructions (system prompt) are required.' });
    }

    const agentId = (id && id.trim())
      ? id.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-')
      : name.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-');

    const newAgent = db.createAgent({
      id: agentId,
      name: name.trim(),
      description: (description || '').trim(),
      role: role.trim(),
      systemPrompt: systemPrompt.trim(),
      provider: provider || 'bedrock',
      model: model || 'qwen.qwen3-coder-next',
      temperature: typeof temperature === 'number' ? temperature : 0.7,
      maxTokens: typeof maxTokens === 'number' ? maxTokens : 2048,
      capabilities: Array.isArray(capabilities) ? capabilities : ['Code Generation', 'Reasoning'],
      status: 'READY',
      avatar: '🤖',
      color: '#818cf8',
    });

    res.status(201).json({ success: true, data: newAgent });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// GET /api/agents/:id - Get single agent
app.get('/api/agents/:id', (req: Request, res: Response) => {
  const agent = db.getAgent(req.params.id);
  if (!agent) {
    return res.status(404).json({ success: false, error: `Agent '${req.params.id}' not found.` });
  }
  res.json({ success: true, data: agent });
});

// PUT /api/agents/:id - Update agent
app.put('/api/agents/:id', (req: Request, res: Response) => {
  try {
    const updated = db.updateAgent(req.params.id, req.body);
    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// DELETE /api/agents/:id - Delete agent
app.delete('/api/agents/:id', (req: Request, res: Response) => {
  const deleted = db.deleteAgent(req.params.id);
  if (!deleted) {
    return res.status(404).json({ success: false, error: `Agent '${req.params.id}' not found.` });
  }
  res.json({ success: true, message: 'Agent deleted successfully.' });
});

// POST /api/agents/kill-all - Emergency kill all running agents and executions
app.post('/api/agents/kill-all', (_req: Request, res: Response) => {
  try {
    const result = db.killAllRunningAgents();
    res.json({
      success: true,
      message: 'Emergency kill switch executed. All running agents and executions terminated.',
      data: result,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── EXECUTION PIPELINE ───────────────────────────────────────────────────────

// POST /api/agents/:id/run - Execute task using configured LLM
app.post('/api/agents/:id/run', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { task, stream } = req.body;

  if (!task || !task.trim()) {
    return res.status(400).json({ success: false, error: 'Task / Mission input is required.' });
  }

  const agent = db.getAgent(id);
  if (!agent) {
    return res.status(404).json({ success: false, error: `Agent '${id}' not found.` });
  }

  if (agent.status === 'OFFLINE') {
    return res.status(400).json({
      success: false,
      error: `Agent '${agent.name}' is currently disabled/offline. Enable the agent before running.`,
    });
  }

  // Check if this is the Agent Terminator or a kill directive
  const isKillTask =
    id === 'agent-terminator' ||
    task.toLowerCase().includes('kill') ||
    task.toLowerCase().includes('terminate') ||
    task.toLowerCase().includes('stop all');

  let killReport = '';
  if (isKillTask) {
    const killResult = db.killAllRunningAgents();
    killReport = `Emergency kill protocol executed. Force-stopped ${killResult.terminatedAgents.length} agents (${killResult.terminatedAgents.join(', ') || 'none active'}), aborted ${killResult.terminatedExecutions.length} running tasks. System returned to READY.`;
  }

  const executionId = `exec-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
  const startedAt = Date.now();

  const execution: AgentExecution = {
    executionId,
    agentId: agent.id,
    task: task.trim(),
    status: 'RUNNING',
    startedAt,
    model: agent.model,
    inputTokens: 0,
    outputTokens: 0,
    totalTokens: 0,
  };


  // If streaming is requested (Server-Sent Events)
  if (stream || req.headers.accept?.includes('text/event-stream')) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const sendEvent = (event: string, data: any) => {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    try {
      sendEvent('step', { step: 'started', message: '● Agent started', timestamp: Date.now() });
      await new Promise(r => setTimeout(r, 200));

      if (isKillTask) {
        sendEvent('step', {
          step: 'kill_switch',
          message: '☠️ Emergency Kill Switch Activated — Terminated all running agent processes',
          timestamp: Date.now(),
        });
        await new Promise(r => setTimeout(r, 300));
      }

      sendEvent('step', { step: 'loading_config', message: '✓ Loading agent configuration', timestamp: Date.now() });
      await new Promise(r => setTimeout(r, 200));

      sendEvent('step', { step: 'preparing_task', message: '✓ Preparing task', timestamp: Date.now() });
      await new Promise(r => setTimeout(r, 250));

      sendEvent('step', { step: 'thinking', message: '● Thinking...', timestamp: Date.now() });
      await new Promise(r => setTimeout(r, 300));

      sendEvent('step', { step: 'calling_model', message: `● Calling model ${agent.model}...`, timestamp: Date.now() });

      const providerConfig = db.getProvider(agent.provider);
      if (!providerConfig) {
        throw new Error(`Provider configuration required: Provider '${agent.provider}' is not configured.`);
      }

      const promptToUse = isKillTask
        ? `${task.trim()}\n\n[SYSTEM TERMINATION REPORT: ${killReport}]`
        : task.trim();

      const provider = ProviderFactory.create(providerConfig);
      const llmResult = await provider.execute(agent.systemPrompt, promptToUse, {
        model: agent.model,
        temperature: agent.temperature,
        maxTokens: agent.maxTokens,
      });

      sendEvent('step', { step: 'processing_response', message: '● Processing response...', timestamp: Date.now() });
      await new Promise(r => setTimeout(r, 200));

      sendEvent('step', { step: 'completed', message: '✓ Agent completed', timestamp: Date.now() });

      const completedAt = Date.now();
      execution.status = 'SUCCESS';
      execution.completedAt = completedAt;
      execution.duration = completedAt - startedAt;
      execution.model = llmResult.model;
      execution.inputTokens = llmResult.inputTokens;
      execution.outputTokens = llmResult.outputTokens;
      execution.totalTokens = llmResult.totalTokens;
      execution.result = llmResult.content;

      db.saveExecution(execution);

      sendEvent('complete', { execution });
      res.end();
    } catch (err: any) {
      const completedAt = Date.now();
      execution.status = 'FAILED';
      execution.completedAt = completedAt;
      execution.duration = completedAt - startedAt;
      execution.error = err.message || 'Execution failed';

      db.saveExecution(execution);

      sendEvent('error', {
        error: execution.error,
        execution,
      });
      res.end();
    }
    return;
  }

  // Non-streaming JSON flow
  try {
    const providerConfig = db.getProvider(agent.provider);
    if (!providerConfig) {
      throw new Error(`Provider configuration required: Provider '${agent.provider}' is not configured.`);
    }

    const promptToUse = isKillTask
      ? `${task.trim()}\n\n[SYSTEM TERMINATION REPORT: ${killReport}]`
      : task.trim();

    const provider = ProviderFactory.create(providerConfig);
    const llmResult = await provider.execute(agent.systemPrompt, promptToUse, {
      model: agent.model,
      temperature: agent.temperature,
      maxTokens: agent.maxTokens,
    });


    const completedAt = Date.now();
    execution.status = 'SUCCESS';
    execution.completedAt = completedAt;
    execution.duration = completedAt - startedAt;
    execution.model = llmResult.model;
    execution.inputTokens = llmResult.inputTokens;
    execution.outputTokens = llmResult.outputTokens;
    execution.totalTokens = llmResult.totalTokens;
    execution.result = llmResult.content;

    db.saveExecution(execution);
    res.json({ success: true, data: execution });
  } catch (err: any) {
    const completedAt = Date.now();
    execution.status = 'FAILED';
    execution.completedAt = completedAt;
    execution.duration = completedAt - startedAt;
    execution.error = err.message || 'Execution failed';

    db.saveExecution(execution);
    res.status(500).json({ success: false, error: err.message, data: execution });
  }
});

// GET /api/agents/:id/executions - Get history of runs for agent
app.get('/api/agents/:id/executions', (req: Request, res: Response) => {
  try {
    const executions = db.getExecutions(req.params.id);
    res.json({ success: true, data: executions });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/executions/:executionId - Get single execution
app.get('/api/executions/:executionId', (req: Request, res: Response) => {
  const execution = db.getExecution(req.params.executionId);
  if (!execution) {
    return res.status(404).json({ success: false, error: 'Execution not found.' });
  }
  res.json({ success: true, data: execution });
});

// ─── PROVIDERS ENDPOINTS ──────────────────────────────────────────────────────

// GET /api/providers - List configured providers (safe mask)
app.get('/api/providers', (_req: Request, res: Response) => {
  try {
    const providers = db.getProviders().map(p => ({
      ...p,
      apiKeyMasked: maskApiKey(p.apiKey),
      hasKey: !!p.apiKey,
      apiKey: undefined, // Never expose raw API key to client
    }));
    res.json({ success: true, data: providers });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/providers/test - Test provider connection
app.post('/api/providers/test', async (req: Request, res: Response) => {
  try {
    const { id } = req.body;
    const providerConfig = db.getProvider(id || 'bedrock');
    if (!providerConfig) {
      return res.status(400).json({ success: false, error: 'Provider configuration required' });
    }

    const provider = ProviderFactory.create(providerConfig);
    const testResult = await provider.testConnection();
    res.json(testResult);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── MISSION PLANNING WITH CHATGPT / REAL LLM ─────────────────────────────────

// Helper to extract JSON from LLM response
function extractJsonFromText(text: string): any {
  let cleaned = text.trim();
  // Strip ```json and ``` if present
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.slice(0, -3);
  }
  cleaned = cleaned.trim();
  return JSON.parse(cleaned);
}

// POST /api/missions/plan - Autonomous AI mission planning using ChatGPT / LLM
app.post('/api/missions/plan', async (req: Request, res: Response) => {
  const { goal, preferences, budget, maxAgents, maxTime } = req.body;

  if (!goal || !goal.trim()) {
    return res.status(400).json({ success: false, error: 'Mission objective is required.' });
  }

  const providerConfig = db.getProvider('bedrock') || db.getProviders()[0];
  if (!providerConfig) {
    return res.status(500).json({ success: false, error: 'No LLM provider configured' });
  }

  const systemPrompt = `You are the Autonomous Workforce Architect and Strategic Mission Planner for AgentOS.
The user submitted an objective. You must analyze the requirements, select specialized agents, calculate estimated cost/time, and generate 3 distinct execution strategies.

AVAILABLE SYSTEM AGENTS:
- 'planner': Requirements decomposition & roadmaps
- 'architect': System architecture, DB schemas, API contracts
- 'researcher': Tech stack evaluation & dependency investigation
- 'frontend': UI/UX implementation in React / Next.js
- 'backend': REST API, business logic, endpoints
- 'database': SQL/NoSQL schema, indexing, migrations
- 'security': OWASP audits, RBAC, auth, vulnerability check
- 'content': Technical copywriting, documentation
- 'testing': Unit, integration, E2E test suites
- 'reviewer': Code review, quality assurance & compliance
- 'deployment': Docker, CI/CD, cloud deployment
- 'uiux': Wireframing & user flow optimization

OUTPUT REQUIREMENTS:
You MUST respond with STRICT, VALID JSON ONLY. No conversational text.
Follow this exact JSON structure:
{
  "summary": "1-2 sentence executive summary of the architecture and approach",
  "complexity": "simple" | "moderate" | "complex" | "epic",
  "riskLevel": "low" | "medium" | "high" | "critical",
  "recommendedAgents": ["planner", "architect", "backend", ...],
  "strategies": [
    {
      "id": "A",
      "label": "Lean Autonomous Sprint",
      "agents": ["planner", "architect", "frontend", "backend", "deployment"],
      "agentCount": 5,
      "estimatedCost": 0.35,
      "estimatedTime": 45,
      "riskLevel": "medium",
      "qualityScore": 82,
      "parallelTasks": 2,
      "tools": ["TypeScript", "Next.js", "Docker"],
      "reasoning": "Fastest time-to-market. Minimal overhead with core agents executing in tight feedback loops.",
      "recommended": false,
      "models": ["qwen.qwen3-coder-next", "deepseek.v3.2"]
    },
    {
      "id": "B",
      "label": "Balanced Production Swarm",
      "agents": ["planner", "architect", "database", "backend", "frontend", "security", "testing", "reviewer"],
      "agentCount": 8,
      "estimatedCost": 0.82,
      "estimatedTime": 85,
      "riskLevel": "low",
      "qualityScore": 94,
      "parallelTasks": 3,
      "tools": ["TypeScript", "PostgreSQL", "JWT", "Docker", "Jest"],
      "reasoning": "Optimal production balance. Thorough security validation and test coverage without excessive latency.",
      "recommended": true,
      "models": ["qwen.qwen3-coder-next", "deepseek.v3.2"]
    },
    {
      "id": "C",
      "label": "Enterprise Zero-Trust Swarm",
      "agents": ["planner", "architect", "researcher", "database", "backend", "frontend", "security", "testing", "reviewer", "deployment"],
      "agentCount": 10,
      "estimatedCost": 1.45,
      "estimatedTime": 140,
      "riskLevel": "low",
      "qualityScore": 98,
      "parallelTasks": 4,
      "tools": ["TypeScript", "PostgreSQL", "OWASP ZAP", "Terraform", "Docker"],
      "reasoning": "Maximum quality and resilience. Complete threat modeling, double-pass reviews, and staging verification.",
      "recommended": false,
      "models": ["qwen.qwen3-coder-next", "deepseek.v3.2"]
    }
  ],
  "taskNodes": [
    {
      "id": "task-1",
      "agentId": "planner",
      "label": "Decompose Requirements & User Roles",
      "dependencies": []
    },
    {
      "id": "task-2",
      "agentId": "architect",
      "label": "System Architecture & API Specs",
      "dependencies": ["task-1"]
    },
    {
      "id": "task-3",
      "agentId": "database",
      "label": "Database Schema & RBAC Tables",
      "dependencies": ["task-2"]
    },
    {
      "id": "task-4",
      "agentId": "backend",
      "label": "Secure REST API & Auth Service",
      "dependencies": ["task-3"]
    },
    {
      "id": "task-5",
      "agentId": "frontend",
      "label": "Responsive Dashboards & UI Forms",
      "dependencies": ["task-4"]
    },
    {
      "id": "task-6",
      "agentId": "security",
      "label": "RBAC & OWASP Security Audit",
      "dependencies": ["task-4", "task-3"]
    },
    {
      "id": "task-7",
      "agentId": "testing",
      "label": "Automated Unit & Integration Tests",
      "dependencies": ["task-4", "task-5"]
    },
    {
      "id": "task-8",
      "agentId": "reviewer",
      "label": "Quality Audit & Final Sign-off",
      "dependencies": ["task-6", "task-7"]
    }
  ]
}`;

  try {
    const provider = ProviderFactory.create(providerConfig);
    const userPrompt = `Mission Objective: "${goal.trim()}"\nBudget constraint: $${budget || 2.0}\nMax Agents: ${maxAgents || 10}\nMax Time: ${maxTime || 300}s\nPreferences: ${JSON.stringify(preferences || {})}`;

    const llmResult = await provider.execute(systemPrompt, userPrompt, {
      model: 'qwen.qwen3-coder-next',
      temperature: 0.4,
      maxTokens: 3000,
      timeoutMs: 40000,
    });

    try {
      const plan = extractJsonFromText(llmResult.content);
      return res.json({
        success: true,
        source: 'chatgpt-real-llm',
        model: llmResult.model,
        tokens: llmResult.totalTokens,
        plan,
      });
    } catch (parseErr) {
      console.warn('Could not parse strict JSON from LLM output, falling back to structured representation:', parseErr);
      return res.json({
        success: true,
        source: 'chatgpt-raw',
        model: llmResult.model,
        tokens: llmResult.totalTokens,
        rawContent: llmResult.content,
      });
    }
  } catch (err: any) {
    console.error('LLM Planning error:', err);
    res.status(500).json({ success: false, error: err.message || 'LLM planning failed' });
  }
});

// POST /api/missions/node/execute - Real LLM execution for a mission node
app.post('/api/missions/node/execute', async (req: Request, res: Response) => {
  const { missionGoal, agentId, nodeLabel, input } = req.body;

  if (!missionGoal || !agentId) {
    return res.status(400).json({ success: false, error: 'missionGoal and agentId are required.' });
  }

  const providerConfig = db.getProvider('bedrock') || db.getProviders()[0];
  if (!providerConfig) {
    return res.status(500).json({ success: false, error: 'No LLM provider configured' });
  }

  const systemPrompt = `You are the autonomous agent '${agentId}' in the AgentOS AI workforce.
You are collaborating with other specialized agents to achieve the overarching mission: "${missionGoal}".
Your specific assigned task is: "${nodeLabel}".
Provide your professional, high-quality, structured output. Include code, architecture, schemas, or analysis appropriate for your role. Explain important decisions clearly.`;

  try {
    const provider = ProviderFactory.create(providerConfig);
    const llmResult = await provider.execute(systemPrompt, input || `Execute task: ${nodeLabel}`, {
      model: 'qwen.qwen3-coder-next',
      temperature: 0.7,
      maxTokens: 2048,
    });

    res.json({
      success: true,
      agentId,
      nodeLabel,
      model: llmResult.model,
      output: llmResult.content,
      tokens: llmResult.totalTokens,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export const agentosApiMiddleware = app;

