import { useEffect, useRef, useCallback } from 'react';
import { useAgentOSStore } from '../store';
import type { WorkflowNode, AgentMessage, TimelineEvent, CostRecord, ApprovalRequest, FailureRisk, WorkflowChange } from '../types';
import { AGENTS, DEMO_MESSAGES } from '../store';
import { agentApi } from '../lib/api';

function randomBetween(min: number, max: number) { return Math.random() * (max - min) + min; }
function randomInt(min: number, max: number) { return Math.floor(randomBetween(min, max + 1)); }

// ─── Predictive Failure Detection ────────────────────────────────────────────

function computeFailureRisk(agentId: string, elapsedRatio: number): FailureRisk {
  const agent = AGENTS.find(a => a.id === agentId);
  if (!agent) return { agentId, riskScore: 0, level: 'safe', reasons: [], preventiveActionTaken: false };

  const reasons: string[] = [];
  let risk = 0;

  // Factor 1: historical failure rate
  const failRate = (agent.failures / Math.max(1, agent.requests)) * 100;
  if (failRate > 3) { risk += 25; reasons.push(`Historical failure rate: ${failRate.toFixed(1)}%`); }

  // Factor 2: current workload
  if (agent.currentWorkload > 80) { risk += 30; reasons.push(`High current workload: ${agent.currentWorkload}%`); }
  else if (agent.currentWorkload > 60) { risk += 15; reasons.push(`Elevated workload: ${agent.currentWorkload}%`); }

  // Factor 3: latency trend (simulated: increases over elapsed time)
  const latencyPressure = elapsedRatio * 40;
  if (latencyPressure > 20) { risk += latencyPressure; reasons.push(`Latency trending up: +${latencyPressure.toFixed(0)}%`); }

  // Factor 4: specific agents that are prone to failure
  if (agentId === 'backend') { risk += 15; reasons.push('API integration complexity'); }
  if (agentId === 'deployment') { risk += 10; reasons.push('External service dependency'); }
  if (agentId === 'testing' && elapsedRatio > 0.7) { risk += 10; reasons.push('Late-stage execution pressure'); }

  // Clamp 0–100
  risk = Math.min(100, Math.max(0, risk + (Math.random() * 10 - 5)));

  const level: FailureRisk['level'] = risk >= 70 ? 'critical' : risk >= 45 ? 'warning' : 'safe';

  return { agentId, riskScore: Math.round(risk), level, reasons, preventiveActionTaken: false };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useMissionEngine() {
  const mission = useAgentOSStore(s => s.mission);
  const pendingApproval = useAgentOSStore(s => s.pendingApproval);
  const engineRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const messageIndexRef = useRef(0);
  const messageTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const riskTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const workflowChangedRef = useRef(false);

  const addTimelineEvent = useCallback((event: Omit<TimelineEvent, 'id'>) => {
    useAgentOSStore.setState(state => {
      if (!state.mission) return state;
      return { mission: { ...state.mission, timeline: [...state.mission.timeline, { ...event, id: `evt-${Date.now()}-${Math.random()}` }] } };
    });
  }, []);

  const updateNode = useCallback((nodeId: string, updates: Partial<WorkflowNode>) => {
    useAgentOSStore.setState(state => {
      if (!state.mission) return state;
      return { mission: { ...state.mission, nodes: state.mission.nodes.map(n => n.id === nodeId ? { ...n, ...updates } : n) } };
    });
  }, []);

  const addMessage = useCallback((msg: Omit<AgentMessage, 'id' | 'timestamp'>) => {
    useAgentOSStore.setState(state => {
      if (!state.mission) return state;
      const newMsg: AgentMessage = { ...msg, id: `msg-${Date.now()}-${Math.random()}`, timestamp: Date.now() };
      return { mission: { ...state.mission, messages: [...state.mission.messages, newMsg] } };
    });
  }, []);

  const addCost = useCallback((record: Omit<CostRecord, 'timestamp'>) => {
    useAgentOSStore.setState(state => {
      if (!state.mission) return state;
      const costRecord: CostRecord = { ...record, timestamp: Date.now() };
      return {
        mission: {
          ...state.mission,
          costRecords: [...state.mission.costRecords, costRecord],
          actualCost: Math.round((state.mission.actualCost + record.cost) * 10000) / 10000,
          totalTokens: state.mission.totalTokens + record.tokens,
        },
      };
    });
  }, []);

  const updateFailureRisk = useCallback((agentId: string, risk: FailureRisk) => {
    useAgentOSStore.setState(state => {
      if (!state.mission) return state;
      return { mission: { ...state.mission, failureRisks: { ...state.mission.failureRisks, [agentId]: risk } } };
    });
  }, []);

  const executeNode = useCallback(async (node: WorkflowNode) => {
    const agent = AGENTS.find(a => a.id === node.agentId);
    if (!agent) return;

    // Mark as running
    updateNode(node.id, { status: 'running', startTime: Date.now() });
    addTimelineEvent({ nodeId: node.id, agentName: agent.name, event: `${agent.name} started`, timestamp: Date.now(), type: 'start' });

    // Update agent workload
    useAgentOSStore.setState(state => ({
      agents: state.agents.map(a => a.id === agent.id ? { ...a, status: 'running', currentWorkload: Math.min(100, a.currentWorkload + 40) } : a),
    }));

    const execTime = randomBetween(agent.avgExecutionTime * 800, agent.avgExecutionTime * 1400);
    const willFail = node.agentId === 'backend' && Math.random() > 0.7;

    // ── Predictive failure monitoring ──
    let elapsedRatio = 0;
    const riskCheckInterval = setInterval(() => {
      elapsedRatio = Math.min(1, elapsedRatio + 0.15);
      const risk = computeFailureRisk(node.agentId, elapsedRatio);
      updateFailureRisk(node.agentId, risk);

      // ── Self-Optimizing Workflow: if risk critical, emit workflow change ──
      if (risk.level === 'critical' && !workflowChangedRef.current && node.agentId === 'backend') {
        workflowChangedRef.current = true;
        const change: Omit<WorkflowChange, 'id' | 'timestamp'> = {
          reason: `${agent.name} execution exceeded predicted latency — preventive load balancing activated`,
          added: [],
          removed: [],
        };
        useAgentOSStore.getState().addWorkflowChange(change);
        addMessage({ fromAgentId: 'system', toAgentId: node.agentId, content: `⚡ Self-Optimizing Workflow: ${agent.name} showing critical risk (${risk.riskScore}%). Activating load distribution.`, type: 'notification' });
        addTimelineEvent({ nodeId: node.id, agentName: 'Workflow Engine', event: `Workflow optimized — critical risk mitigated for ${agent.name}`, timestamp: Date.now(), type: 'recovery' });
      }
    }, 1200);

    await new Promise(resolve => setTimeout(resolve, execTime));
    clearInterval(riskCheckInterval);

    if (willFail) {
      updateNode(node.id, { status: 'failed', error: 'API timeout: connection reset after 30s', retries: 0, failureRisk: 85 });
      addTimelineEvent({ nodeId: node.id, agentName: agent.name, event: `${agent.name} failed — API timeout`, timestamp: Date.now(), type: 'fail' });
      addMessage({ fromAgentId: 'system', toAgentId: node.agentId, content: `❌ ${agent.name} failed: API timeout. Initiating recovery engine...`, type: 'error' });

      await new Promise(resolve => setTimeout(resolve, 1500));
      updateNode(node.id, { status: 'recovering', retries: 1 });
      addTimelineEvent({ nodeId: node.id, agentName: agent.name, event: `Recovery Engine: switching to alternate model`, timestamp: Date.now(), type: 'recovery' });
      addMessage({ fromAgentId: 'recovery', toAgentId: node.agentId, content: `🔄 Preventive Recovery Activated — switching to Claude Code model. Retry 1/3…`, type: 'notification' });

      await new Promise(resolve => setTimeout(resolve, execTime * 0.5));
    }

    // Gate check for deployment
    if (node.isGate) {
      updateNode(node.id, { status: 'waiting' });
      addTimelineEvent({ nodeId: node.id, agentName: agent.name, event: `⚠ Human Gate triggered — deployment approval required`, timestamp: Date.now(), type: 'approval' });

      const approval: ApprovalRequest = {
        id: `approval-${Date.now()}`,
        missionId: useAgentOSStore.getState().mission?.id || '',
        nodeId: node.id,
        action: 'Deploy application to production',
        description: 'AgentOS X is requesting permission to deploy the completed application to the production environment.',
        risk: 'high',
        estimatedImpact: 'Application goes live. Affects ~500 potential users. Irreversible without rollback.',
        status: 'pending',
        timestamp: Date.now(),
      };
      useAgentOSStore.setState({ pendingApproval: approval });

      await new Promise<void>(resolve => {
        const check = setInterval(() => {
          const state = useAgentOSStore.getState();
          if (!state.pendingApproval || state.pendingApproval.status !== 'pending') { clearInterval(check); resolve(); }
        }, 500);
        setTimeout(() => { clearInterval(check); useAgentOSStore.setState({ pendingApproval: null }); resolve(); }, 30000);
      });

      const nodeState = useAgentOSStore.getState().mission?.nodes.find(n => n.id === node.id);
      if (nodeState?.status === 'rejected') return;
    }

    // Success
    const tokens = randomInt(800, 4000);
    const model = useAgentOSStore.getState().mission?.nodes.find(n => n.id === node.id)?.model || 'gpt-4o';
    const modelCosts: Record<string, number> = { 'o1-preview': 0.015, 'claude-3-opus': 0.015, 'gpt-4-turbo': 0.01, 'claude-code': 0.008, 'gpt-4o': 0.005, 'claude-3-sonnet': 0.003, 'gpt-4o-vision': 0.005, 'claude-3-haiku': 0.00025, 'gpt-4o-mini': 0.00015 };
    const cost = (tokens / 1000) * (modelCosts[model] || 0.005);
    addCost({ agentId: node.agentId, model, tokens, cost: Math.round(cost * 10000) / 10000 });

    const outputMap: Record<string, string> = {
      planner: 'Mission decomposed into 11 subtasks. Workflow graph generated. Dependencies mapped. Estimated completion: 4 minutes.',
      researcher: 'Research complete. Found 47 relevant sources. Key requirements extracted: RBAC, attendance tracking, grade management, parent portal, audit logs.',
      architect: 'System architecture designed. Microservices pattern selected. 3-tier architecture with PostgreSQL, Node.js API, React frontend.',
      database: 'Schema generated: 8 tables (users, students, courses, attendance, grades, parents, permissions, audit_logs). Migrations ready.',
      backend: 'API implementation complete. 34 endpoints created. JWT authentication, rate limiting, input validation implemented.',
      frontend: 'Frontend built. 23 React components. Dashboard, student list, attendance tracker, grade entry, parent portal views.',
      uiux: 'Design system created. Component library with 45 variants. Dark/light mode. WCAG 2.1 AA compliant.',
      content: 'All UI copy written. 234 strings localized. Help documentation drafted. Email templates created.',
      security: 'Security audit complete. 0 critical, 2 medium (fixed), 5 low (acknowledged). OWASP Top 10 compliant.',
      testing: '147 tests written. Unit: 89, Integration: 38, E2E: 20. Coverage: 94%. All tests passing.',
      reviewer: 'Final review complete. Code quality: A. Documentation: complete. Ready for production deployment.',
      deployment: 'Application deployed successfully. Docker containers running. Health checks passing. CDN configured.',
    };

    // Attempt real ChatGPT / LLM execution for the assigned task
    let realOutput = outputMap[node.agentId] || 'Task completed successfully.';
    let realTokens = tokens;
    try {
      const currentGoal = useAgentOSStore.getState().mission?.goal || '';
      const execRes = await agentApi.executeMissionNode(currentGoal, node.agentId, node.label);
      if (execRes && execRes.output) {
        realOutput = execRes.output;
        if (execRes.tokens) realTokens = execRes.tokens;
      }
    } catch (e) {
      console.warn('Real node LLM execution fallback:', e);
    }

    const finalRisk = computeFailureRisk(node.agentId, 1.0);
    finalRisk.riskScore = Math.max(0, finalRisk.riskScore - 50); // drops to safe after success
    finalRisk.level = 'safe';
    updateFailureRisk(node.agentId, finalRisk);

    updateNode(node.id, {
      status: 'success', endTime: Date.now(), tokenUsage: realTokens,
      cost: Math.round(cost * 10000) / 10000,
      output: realOutput,
      failureRisk: 0,
    });

    addTimelineEvent({ nodeId: node.id, agentName: agent.name, event: `${agent.name} completed`, timestamp: Date.now(), type: 'complete' });
    useAgentOSStore.setState(state => ({
      agents: state.agents.map(a => a.id === agent.id ? { ...a, status: 'idle', currentWorkload: Math.max(0, a.currentWorkload - 40) } : a),
    }));
  }, [updateNode, addTimelineEvent, addCost, addMessage, updateFailureRisk]);

  const runMission = useCallback(async () => {
    const { mission: m } = useAgentOSStore.getState();
    if (!m || m.status !== 'planning') return;

    await new Promise(r => setTimeout(r, 1500));
    startTimeRef.current = Date.now();

    useAgentOSStore.setState(state => ({
      mission: state.mission ? { ...state.mission, status: 'running', startTime: Date.now() } : null,
    }));

    const nodes = m.nodes;
    const completed = new Set<string>();
    const running = new Set<string>();

    const canRun = (node: WorkflowNode) =>
      !completed.has(node.id) && !running.has(node.id) &&
      node.dependencies.every(d => completed.has(d));

    let safety = 0;
    while (completed.size < nodes.length && safety < 100) {
      safety++;
      const currentState = useAgentOSStore.getState();
      if (currentState.mission?.status === 'failed') break;

      const ready = nodes.filter(n => {
        const cur = currentState.mission?.nodes.find(nn => nn.id === n.id);
        return cur?.status === 'pending' && canRun(n);
      });

      if (ready.length === 0) { await new Promise(r => setTimeout(r, 200)); continue; }

      const execPromises = ready.map(async node => {
        running.add(node.id);
        await executeNode(node);
        running.delete(node.id);
        completed.add(node.id);
      });

      await Promise.all(execPromises);
    }

    const finalState = useAgentOSStore.getState();
    if (finalState.mission && finalState.mission.status !== 'failed') {
      const qualityScore = 88 + Math.round(Math.random() * 8);
      useAgentOSStore.setState(state => ({
        mission: state.mission ? {
          ...state.mission, status: 'completed', endTime: Date.now(),
          actualTime: Math.round((Date.now() - startTimeRef.current) / 1000),
          qualityScore,
        } : null,
      }));

      // Auto-save to memory
      setTimeout(() => useAgentOSStore.getState().saveMissionToMemory(), 500);
    }
  }, [executeNode]);

  // Stream messages during running
  useEffect(() => {
    if (!mission || mission.status !== 'running') return;
    messageTimerRef.current = setInterval(() => {
      if (messageIndexRef.current < DEMO_MESSAGES.length) {
        const msg = DEMO_MESSAGES[messageIndexRef.current];
        addMessage(msg);
        messageIndexRef.current++;
      } else {
        if (messageTimerRef.current) clearInterval(messageTimerRef.current);
      }
    }, 2800);
    return () => { if (messageTimerRef.current) clearInterval(messageTimerRef.current); };
  }, [mission?.status, addMessage]);

  // Trigger execution engine
  useEffect(() => {
    if (!mission || mission.status !== 'planning') return;
    engineRef.current = setTimeout(() => { runMission(); }, 100);
    return () => { if (engineRef.current) clearTimeout(engineRef.current); };
  }, [mission?.id, mission?.status, runMission]);

  // Clear risk timer on unmount
  useEffect(() => {
    return () => {
      if (riskTimerRef.current) clearInterval(riskTimerRef.current);
    };
  }, []);

  return { mission, pendingApproval };
}
