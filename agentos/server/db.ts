import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, 'data');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const AGENTS_FILE = path.join(DATA_DIR, 'agents.json');
const EXECUTIONS_FILE = path.join(DATA_DIR, 'executions.json');
const PROVIDERS_FILE = path.join(DATA_DIR, 'providers.json');

export interface StoredAgent {
  id: string;
  name: string;
  description: string;
  role: string;
  systemPrompt: string;
  provider: string;
  model: string;
  temperature: number;
  maxTokens: number;
  capabilities: string[];
  status: 'READY' | 'RUNNING' | 'FAILED' | 'OFFLINE';
  createdAt: number;
  updatedAt: number;
  totalRuns: number;
  successfulRuns: number;
  failedRuns: number;
  lastExecution?: number;
  avatar?: string;
  color?: string;
}

export interface AgentExecution {
  executionId: string;
  agentId: string;
  task: string;
  status: 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED';
  startedAt: number;
  completedAt?: number;
  duration?: number; // ms
  model: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  result?: string;
  error?: string;
}

export interface LLMProviderConfig {
  id: string;
  name: string;
  type: 'openai-compatible' | 'bedrock' | 'openai';
  baseUrl: string;
  apiKey: string;
  defaultModel: string;
  models: string[];
  isDefault?: boolean;
}

// ─── Default Sample Data ──────────────────────────────────────────────────────

const DEFAULT_PROVIDERS: LLMProviderConfig[] = [
  {
    id: 'bedrock',
    name: 'AWS Bedrock Mantle (OpenAI-Compatible)',
    type: 'openai-compatible',
    baseUrl: 'https://bedrock-mantle.us-east-1.api.aws/v1',
    apiKey: process.env.BEDROCK_API_KEY || 'your-bedrock-api-key',
    defaultModel: 'qwen.qwen3-coder-next',
    models: [
      'qwen.qwen3-coder-next',
      'deepseek.v3.2',
      'qwen.qwen3-32b',
      'zai.glm-4.7-flash',
    ],
    isDefault: true,
  },
];

const DEFAULT_AGENT: StoredAgent = {
  id: 'code-builder',
  name: 'Code Builder',
  role: 'Software Engineer',
  description: 'Builds software solutions from natural-language requirements.',
  systemPrompt: `You are Code Builder, a professional software engineering AI agent. Understand the user's requirement, reason about the solution, provide implementation details, and generate high-quality code when requested. Clearly explain important decisions and mention assumptions when necessary.`,
  provider: 'bedrock',
  model: 'qwen.qwen3-coder-next',
  temperature: 0.7,
  maxTokens: 2048,
  capabilities: ['Code Generation', 'Reasoning', 'Testing'],
  status: 'READY',
  createdAt: Date.now(),
  updatedAt: Date.now(),
  totalRuns: 0,
  successfulRuns: 0,
  failedRuns: 0,
  avatar: '⚡',
  color: '#6366f1',
};

export const TERMINATOR_AGENT: StoredAgent = {
  id: 'agent-terminator',
  name: 'Agent Terminator',
  role: 'Process Killer & Swarm Sentinel',
  description: 'Emergency watchdog agent that force-terminates all active agent executions, aborts runaway workflows, and safely resets system resources.',
  systemPrompt: `You are the Agent Terminator, an emergency system supervisor and rogue process killer in AgentOS.
Your primary mission is to protect the agent swarm from runaway execution loops, unconstrained budget depletion, and frozen agent processes.
When requested to terminate or kill running agents:
1. Acknowledge the emergency kill protocol.
2. Confirm that all running agent worker processes and mission tasks have been terminated.
3. List the terminated agents and freed resources.
4. Report that system health has returned to STANDBY/READY state.
Keep your response commanding, precise, and authoritative.`,
  provider: 'bedrock',
  model: 'qwen.qwen3-coder-next',
  temperature: 0.3,
  maxTokens: 2048,
  capabilities: ['Process Termination', 'Emergency Kill Switch', 'System Watchdog', 'Reasoning', 'API Calls'],
  status: 'READY',
  createdAt: Date.now(),
  updatedAt: Date.now(),
  totalRuns: 0,
  successfulRuns: 0,
  failedRuns: 0,
  avatar: '☠️',
  color: '#ef4444',
};

// ─── JSON File Helpers ────────────────────────────────────────────────────────

function readJson<T>(filePath: string, fallback: T): T {
  try {
    if (!fs.existsSync(filePath)) {
      writeJson(filePath, fallback);
      return fallback;
    }
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data) as T;
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
    return fallback;
  }
}

function writeJson<T>(filePath: string, data: T): void {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error(`Error writing ${filePath}:`, err);
  }
}

// ─── Database Operations ──────────────────────────────────────────────────────

export const db = {
  // Providers
  getProviders(): LLMProviderConfig[] {
    const list = readJson<LLMProviderConfig[]>(PROVIDERS_FILE, DEFAULT_PROVIDERS);
    return list.map(p => {
      if ((!p.apiKey || p.apiKey === 'YOUR_BEDROCK_API_KEY' || p.apiKey === 'your-bedrock-api-key') && process.env.BEDROCK_API_KEY) {
        return { ...p, apiKey: process.env.BEDROCK_API_KEY };
      }
      return p;
    });
  },

  getProvider(id: string): LLMProviderConfig | undefined {
    const providers = this.getProviders();
    return providers.find(p => p.id === id) || providers.find(p => p.isDefault) || providers[0];
  },

  saveProvider(provider: LLMProviderConfig): void {
    const providers = this.getProviders();
    const idx = providers.findIndex(p => p.id === provider.id);
    if (idx >= 0) {
      providers[idx] = provider;
    } else {
      providers.push(provider);
    }
    writeJson(PROVIDERS_FILE, providers);
  },

  // Agents
  getAgents(): StoredAgent[] {
    const agents = readJson<StoredAgent[]>(AGENTS_FILE, [DEFAULT_AGENT, TERMINATOR_AGENT]);
    let modified = false;

    if (!agents.some(a => a.id === 'agent-terminator')) {
      agents.push(TERMINATOR_AGENT);
      modified = true;
    }

    if (modified) {
      this.saveAgents(agents);
    }
    return agents;
  },

  killAllRunningAgents(): {
    terminatedAgents: string[];
    terminatedExecutions: string[];
  } {
    const agents = this.getAgents();
    const terminatedAgents: string[] = [];

    agents.forEach(a => {
      if (a.status === 'RUNNING') {
        a.status = 'READY';
        a.updatedAt = Date.now();
        terminatedAgents.push(a.id);
      }
    });
    this.saveAgents(agents);

    const executions = readJson<AgentExecution[]>(EXECUTIONS_FILE, []);
    const terminatedExecutions: string[] = [];

    executions.forEach(e => {
      if (e.status === 'RUNNING' || e.status === 'PENDING') {
        e.status = 'FAILED';
        e.completedAt = Date.now();
        e.duration = e.startedAt ? Date.now() - e.startedAt : 0;
        e.error = 'Terminated by Agent Terminator emergency kill protocol';
        terminatedExecutions.push(e.executionId);
      }
    });
    writeJson(EXECUTIONS_FILE, executions);

    return { terminatedAgents, terminatedExecutions };
  },


  getAgent(id: string): StoredAgent | undefined {
    return this.getAgents().find(a => a.id === id);
  },

  saveAgents(agents: StoredAgent[]): void {
    writeJson(AGENTS_FILE, agents);
  },

  createAgent(agent: Omit<StoredAgent, 'createdAt' | 'updatedAt' | 'totalRuns' | 'successfulRuns' | 'failedRuns'> & Partial<StoredAgent>): StoredAgent {
    const agents = this.getAgents();
    const existing = agents.find(a => a.id === agent.id);
    if (existing) {
      throw new Error(`Agent with ID '${agent.id}' already exists.`);
    }

    const newAgent: StoredAgent = {
      ...agent,
      status: agent.status || 'READY',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      totalRuns: 0,
      successfulRuns: 0,
      failedRuns: 0,
      avatar: agent.avatar || '🤖',
      color: agent.color || '#818cf8',
    };

    agents.unshift(newAgent);
    this.saveAgents(agents);
    return newAgent;
  },

  updateAgent(id: string, updates: Partial<StoredAgent>): StoredAgent {
    const agents = this.getAgents();
    const idx = agents.findIndex(a => a.id === id);
    if (idx === -1) {
      throw new Error(`Agent with ID '${id}' not found.`);
    }

    agents[idx] = {
      ...agents[idx],
      ...updates,
      updatedAt: Date.now(),
    };

    this.saveAgents(agents);
    return agents[idx];
  },

  deleteAgent(id: string): boolean {
    const agents = this.getAgents();
    const filtered = agents.filter(a => a.id !== id);
    if (filtered.length === agents.length) {
      return false;
    }
    this.saveAgents(filtered);
    return true;
  },

  // Executions
  getExecutions(agentId?: string): AgentExecution[] {
    const executions = readJson<AgentExecution[]>(EXECUTIONS_FILE, []);
    if (agentId) {
      return executions.filter(e => e.agentId === agentId);
    }
    return executions;
  },

  getExecution(executionId: string): AgentExecution | undefined {
    return this.getExecutions().find(e => e.executionId === executionId);
  },

  saveExecution(execution: AgentExecution): void {
    const executions = readJson<AgentExecution[]>(EXECUTIONS_FILE, []);
    const idx = executions.findIndex(e => e.executionId === execution.executionId);
    if (idx >= 0) {
      executions[idx] = execution;
    } else {
      executions.unshift(execution);
    }
    writeJson(EXECUTIONS_FILE, executions);

    // Update agent statistics
    try {
      const agent = this.getAgent(execution.agentId);
      if (agent) {
        const totalRuns = agent.totalRuns + 1;
        const successfulRuns = execution.status === 'SUCCESS' ? agent.successfulRuns + 1 : agent.successfulRuns;
        const failedRuns = execution.status === 'FAILED' ? agent.failedRuns + 1 : agent.failedRuns;
        this.updateAgent(agent.id, {
          totalRuns,
          successfulRuns,
          failedRuns,
          lastExecution: execution.completedAt || Date.now(),
          status: 'READY',
        });
      }
    } catch (err) {
      console.error('Error updating agent run stats:', err);
    }
  },
};
