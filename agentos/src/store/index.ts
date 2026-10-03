import { create } from 'zustand';
import type {
  Mission, ApprovalRequest, BudgetGuard, WorkflowNode, AgentMessage,
  TimelineEvent, ModelDecision, MissionStrategy, OptimizationPreferences,
  MissionMemoryRecord, FailureRisk, WorkflowChange,
} from '../types';
import { AGENTS, AI_MODELS } from '../data/agents';
import type { Agent } from '../types';
import { agentApi } from '../lib/api';

// ─── localStorage key ────────────────────────────────────────────────────────
const MEMORY_KEY = 'agentos_mission_memory';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function generateWorkflow(goal: string): string[] {
  const lower = goal.toLowerCase();
  if (lower.includes('pdf') || lower.includes('document') || lower.includes('analyze')) {
    return ['researcher', 'database', 'content', 'reviewer'];
  }
  if (lower.includes('cybersecurity') || lower.includes('security incident') || lower.includes('threat')) {
    return ['researcher', 'security', 'database', 'content', 'reviewer'];
  }
  if (lower.includes('api') && !lower.includes('website') && !lower.includes('app')) {
    return ['planner', 'architect', 'database', 'backend', 'security', 'testing', 'reviewer'];
  }
  if (lower.includes('website') || lower.includes('landing page') || lower.includes('portfolio')) {
    return ['planner', 'researcher', 'uiux', 'frontend', 'content', 'security', 'testing', 'reviewer', 'deployment'];
  }
  return ['planner', 'architect', 'database', 'backend', 'frontend', 'uiux', 'content', 'security', 'testing', 'reviewer', 'deployment'];
}

function getModelForAgent(agentId: string): string {
  const modelMap: Record<string, string> = {
    planner: 'o1-preview', researcher: 'gpt-4o-mini', architect: 'o1-preview',
    frontend: 'claude-code', backend: 'gpt-4-turbo', database: 'claude-code',
    security: 'claude-3-opus', content: 'claude-3-haiku', testing: 'gpt-4-turbo',
    reviewer: 'claude-3-sonnet', deployment: 'gpt-4o', uiux: 'gpt-4o-vision',
  };
  return modelMap[agentId] || 'gpt-4o';
}

function getModelForAgentWithPrefs(agentId: string, prefs: OptimizationPreferences): string {
  if (prefs.cost > 70 && prefs.quality < 60) {
    // Cost-optimised routing
    const cheapMap: Record<string, string> = {
      planner: 'claude-3-sonnet', researcher: 'gpt-4o-mini', architect: 'gpt-4o',
      frontend: 'gpt-4-turbo', backend: 'gpt-4-turbo', database: 'gpt-4-turbo',
      security: 'claude-3-sonnet', content: 'claude-3-haiku', testing: 'gpt-4-turbo',
      reviewer: 'claude-3-haiku', deployment: 'gpt-4o-mini', uiux: 'claude-3-sonnet',
    };
    return cheapMap[agentId] || 'gpt-4o-mini';
  }
  if (prefs.quality > 75) {
    // Quality-optimised routing (premium models)
    const qualityMap: Record<string, string> = {
      planner: 'o1-preview', researcher: 'claude-3-sonnet', architect: 'o1-preview',
      frontend: 'claude-code', backend: 'claude-code', database: 'o1-preview',
      security: 'claude-3-opus', content: 'gpt-4o', testing: 'claude-code',
      reviewer: 'claude-3-opus', deployment: 'gpt-4o', uiux: 'gpt-4o-vision',
    };
    return qualityMap[agentId] || 'claude-3-opus';
  }
  return getModelForAgent(agentId);
}

function getModelDecision(agentId: string, agentName: string): ModelDecision {
  const decisions: Record<string, ModelDecision> = {
    planner: { taskId: agentId, taskDescription: 'Mission planning and workflow decomposition', requiredCapability: 'Deep reasoning & strategic planning', selectedModel: 'o1 Preview', reason: 'Task requires multi-step reasoning to decompose complex goals into structured workflows.', alternatives: ['Claude 3 Opus', 'GPT-4o'] },
    researcher: { taskId: agentId, taskDescription: 'Information gathering and synthesis', requiredCapability: 'Fast, broad knowledge retrieval', selectedModel: 'GPT-4o Mini', reason: 'Research tasks benefit from fast inference with broad knowledge. Cost-optimized for high-volume queries.', alternatives: ['Claude 3 Haiku'] },
    architect: { taskId: agentId, taskDescription: 'System architecture design', requiredCapability: 'Deep reasoning & technical expertise', selectedModel: 'o1 Preview', reason: 'Architecture decisions require careful multi-step reasoning about trade-offs and long-term implications.', alternatives: ['Claude 3 Opus'] },
    frontend: { taskId: agentId, taskDescription: 'Frontend component generation', requiredCapability: 'Code generation (React/TypeScript)', selectedModel: 'Claude Code', reason: 'Specialized coding model with superior React/TypeScript output reliability and lower hallucination rate.', alternatives: ['GPT-4 Turbo'] },
    backend: { taskId: agentId, taskDescription: 'Backend API implementation', requiredCapability: 'Structured code generation', selectedModel: 'GPT-4 Turbo', reason: 'High structured-output reliability for REST API generation and minimal execution cost per function.', alternatives: ['Claude Code'] },
    database: { taskId: agentId, taskDescription: 'Database schema generation', requiredCapability: 'SQL/NoSQL schema design', selectedModel: 'Claude Code', reason: 'Exceptional SQL schema and migration script quality with strong understanding of normalization patterns.', alternatives: ['GPT-4 Turbo'] },
    security: { taskId: agentId, taskDescription: 'Security audit and vulnerability assessment', requiredCapability: 'Security reasoning & OWASP knowledge', selectedModel: 'Claude 3 Opus', reason: 'Security analysis requires deep reasoning to identify subtle vulnerabilities. Accuracy prioritized over cost.', alternatives: ['o1 Preview'] },
    content: { taskId: agentId, taskDescription: 'Content writing and copywriting', requiredCapability: 'Natural language generation', selectedModel: 'Claude 3 Haiku', reason: 'Content tasks require fluent writing at high throughput. Haiku provides excellent quality-to-cost ratio.', alternatives: ['GPT-4o Mini'] },
    testing: { taskId: agentId, taskDescription: 'Test suite generation and QA', requiredCapability: 'Code generation & test patterns', selectedModel: 'GPT-4 Turbo', reason: 'Test generation requires understanding of testing frameworks and generating executable, correct test cases.', alternatives: ['Claude Code'] },
    reviewer: { taskId: agentId, taskDescription: 'Final review and quality assurance', requiredCapability: 'Balanced analysis and synthesis', selectedModel: 'Claude 3.5 Sonnet', reason: 'Final review needs balanced capability — strong reasoning without the cost overhead of premium models.', alternatives: ['GPT-4o'] },
    deployment: { taskId: agentId, taskDescription: 'Deployment configuration and CI/CD', requiredCapability: 'DevOps & infrastructure code', selectedModel: 'GPT-4o', reason: 'Deployment tasks span multiple tool types (Dockerfile, YAML, shell scripts) requiring broad code capability.', alternatives: ['Claude Code'] },
    uiux: { taskId: agentId, taskDescription: 'UI/UX design and prototyping', requiredCapability: 'Vision + design understanding', selectedModel: 'GPT-4o Vision', reason: 'UI/UX tasks benefit from visual understanding capabilities to validate design patterns and accessibility.', alternatives: ['Claude 3.5 Sonnet'] },
  };
  return decisions[agentId] || { taskId: agentId, taskDescription: agentName, requiredCapability: 'General reasoning', selectedModel: 'GPT-4o', reason: 'Balanced capability selected for general task requirements.', alternatives: ['Claude 3.5 Sonnet'] };
}

function buildNodes(agentIds: string[]): WorkflowNode[] {
  return agentIds.map((agentId, index) => {
    const agent = AGENTS.find(a => a.id === agentId)!;
    const deps: string[] = [];
    if (agentId === 'researcher' && agentIds.includes('planner')) deps.push('planner');
    if (agentId === 'architect' && agentIds.includes('planner')) deps.push('planner');
    if (agentId === 'uiux' && agentIds.includes('researcher')) deps.push('researcher');
    if (agentId === 'uiux' && agentIds.includes('architect')) deps.push('architect');
    if (agentId === 'frontend' && agentIds.includes('uiux')) deps.push('uiux');
    if (agentId === 'frontend' && agentIds.includes('researcher')) deps.push('researcher');
    if (agentId === 'content' && agentIds.includes('researcher')) deps.push('researcher');
    if (agentId === 'backend' && agentIds.includes('architect')) deps.push('architect');
    if (agentId === 'database' && agentIds.includes('architect')) deps.push('architect');
    if (agentId === 'backend' && agentIds.includes('database')) deps.push('database');
    if (agentId === 'security' && agentIds.includes('backend')) deps.push('backend');
    if (agentId === 'security' && agentIds.includes('database')) deps.push('database');
    if (agentId === 'testing' && agentIds.includes('frontend')) deps.push('frontend');
    if (agentId === 'testing' && agentIds.includes('backend')) deps.push('backend');
    if (agentId === 'reviewer' && agentIds.includes('testing')) deps.push('testing');
    if (agentId === 'reviewer' && agentIds.includes('security')) deps.push('security');
    if (agentId === 'reviewer' && agentIds.includes('content')) deps.push('content');
    if (agentId === 'deployment' && agentIds.includes('reviewer')) deps.push('reviewer');
    if (deps.length === 0 && index > 0 && !['researcher','architect','uiux','frontend','content','backend','database','security','testing','reviewer','deployment'].includes(agentId)) {
      deps.push(agentIds[index - 1]);
    }
    const isGate = agentId === 'deployment';
    return { id: agentId, agentId, label: agent?.name || agentId, status: 'pending', dependencies: deps, model: getModelForAgent(agentId), input: `Execute ${agent?.role || agentId} tasks for the mission.`, isGate, gateApproved: isGate ? null : undefined };
  });
}

// ─── Mission Simulator Logic ──────────────────────────────────────────────────

export function generateStrategies(goal: string, prefs: OptimizationPreferences): MissionStrategy[] {
  const full = generateWorkflow(goal);
  const mid  = full.filter(a => !['uiux', 'content', 'researcher'].includes(a));
  const lean  = full.filter(a => !['uiux', 'content', 'researcher', 'security'].includes(a)).slice(0, 5);

  // Count parallel tasks: nodes with 2+ dependants at same depth
  const countParallel = (agents: string[]) => {
    const withDeps = agents.filter(a => ['frontend','backend','database','security','content','uiux'].includes(a));
    return Math.max(2, Math.floor(withDeps.length / 2));
  };

  const costFor = (agents: string[]) => agents.reduce((s, a) => {
    const ag = AGENTS.find(x => x.id === a);
    return s + (ag?.avgCost || 0.05);
  }, 0);

  const timeFor = (agents: string[], parallel: number) =>
    agents.reduce((s, a) => {
      const ag = AGENTS.find(x => x.id === a);
      return s + (ag?.avgExecutionTime || 20);
    }, 0) / (parallel * 0.7);

  const strategies: MissionStrategy[] = [
    {
      id: 'A', label: 'Comprehensive',
      agents: full, agentCount: full.length,
      estimatedCost: Math.round(costFor(full) * 100) / 100,
      estimatedTime: Math.round(timeFor(full, countParallel(full))),
      riskLevel: 'medium', qualityScore: 94,
      parallelTasks: countParallel(full),
      tools: ['Web Search', 'Code Executor', 'File System', 'Database', 'Browser Automation'],
      models: ['o1 Preview', 'Claude Code', 'GPT-4 Turbo', 'GPT-4o Vision'],
      reasoning: `Full agent coverage ensures the highest output quality with dedicated specialists for every layer. Recommended when quality and thoroughness are paramount.`,
      recommended: prefs.quality >= 70,
    },
    {
      id: 'B', label: 'Balanced',
      agents: mid, agentCount: mid.length,
      estimatedCost: Math.round(costFor(mid) * 100) / 100,
      estimatedTime: Math.round(timeFor(mid, countParallel(mid))),
      riskLevel: 'low', qualityScore: 91,
      parallelTasks: countParallel(mid),
      tools: ['Code Executor', 'File System', 'Database'],
      models: ['Claude 3.5 Sonnet', 'GPT-4 Turbo', 'Claude Code'],
      reasoning: `Balanced mix of specialist agents. Trims UX and research agents in favor of direct execution. Ideal when you need good results without over-engineering the workflow.`,
      recommended: prefs.quality < 70 && prefs.speed < 70,
    },
    {
      id: 'C', label: 'Lean & Fast',
      agents: lean, agentCount: lean.length,
      estimatedCost: Math.round(costFor(lean) * 100) / 100,
      estimatedTime: Math.round(timeFor(lean, Math.max(2, countParallel(lean)))),
      riskLevel: 'medium', qualityScore: 88,
      parallelTasks: Math.max(2, countParallel(lean)),
      tools: ['Code Executor', 'File System'],
      models: ['GPT-4o Mini', 'Claude 3 Haiku', 'GPT-4 Turbo'],
      reasoning: `Minimal agents, maximum speed. Security and design agents are skipped. Best for rapid prototypes, internal tools, or when cost is the primary constraint.`,
      recommended: prefs.cost >= 70 || prefs.speed >= 70,
    },
  ];

  // Ensure exactly one is recommended based on highest priority pref
  const maxPref = Math.max(prefs.quality, prefs.cost, prefs.speed, prefs.safety);
  if (maxPref === prefs.safety || maxPref === prefs.quality) {
    strategies.forEach(s => s.recommended = s.id === 'A');
  } else if (maxPref === prefs.cost) {
    strategies.forEach(s => s.recommended = s.id === 'C');
  } else {
    strategies.forEach(s => s.recommended = s.id === 'B');
  }

  return strategies;
}

// ─── Memory helpers ───────────────────────────────────────────────────────────

function loadMemory(): MissionMemoryRecord[] {
  try {
    const raw = localStorage.getItem(MEMORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveMemory(records: MissionMemoryRecord[]) {
  try { localStorage.setItem(MEMORY_KEY, JSON.stringify(records.slice(-50))); } catch {}
}

function extractKeywords(goal: string): string[] {
  const stopWords = new Set(['a','an','the','is','are','for','in','to','of','and','or','build','create','make','develop','design','generate']);
  return goal.toLowerCase().replace(/[^a-z0-9 ]/g, '').split(/\s+/).filter(w => w.length > 3 && !stopWords.has(w));
}

function similarityScore(a: string[], b: string[]): number {
  const setB = new Set(b);
  const common = a.filter(w => setB.has(w)).length;
  return common / Math.max(1, Math.max(a.length, b.length));
}

// ─── Demo messages ────────────────────────────────────────────────────────────

export const DEMO_MESSAGES: Omit<AgentMessage, 'id' | 'timestamp'>[] = [
  { fromAgentId: 'planner', toAgentId: 'architect', content: 'Mission parsed. Building system architecture for secure student management app.', type: 'request' },
  { fromAgentId: 'planner', toAgentId: 'researcher', content: 'Research best practices for student management systems and security requirements.', type: 'request' },
  { fromAgentId: 'researcher', toAgentId: 'architect', content: 'Research complete. Key requirements: role-based access, attendance tracking, grade management, parent portal.', type: 'response' },
  { fromAgentId: 'architect', toAgentId: 'database', content: 'Generate schema for users, students, courses, attendance, grades, and permissions tables.', type: 'request' },
  { fromAgentId: 'database', toAgentId: 'backend', content: 'Schema ready. 8 tables with proper foreign keys, indexes and RLS policies.', type: 'response' },
  { fromAgentId: 'architect', toAgentId: 'frontend', content: 'Design dashboard, student list, attendance tracker, and grade entry forms using React.', type: 'request' },
  { fromAgentId: 'backend', toAgentId: 'frontend', content: 'API endpoints available: /api/students, /api/attendance, /api/grades. JWT auth required.', type: 'notification' },
  { fromAgentId: 'frontend', toAgentId: 'testing', content: 'Frontend components complete. 23 components built. Ready for QA.', type: 'response' },
  { fromAgentId: 'security', toAgentId: 'backend', content: '⚠ Found SQL injection vulnerability in grade search endpoint. Patch required.', type: 'error' },
  { fromAgentId: 'backend', toAgentId: 'security', content: 'Patched. Implemented parameterized queries. Re-run security scan.', type: 'response' },
  { fromAgentId: 'security', toAgentId: 'reviewer', content: 'Security scan passed. No critical vulnerabilities. OWASP Top 10 compliance verified.', type: 'response' },
  { fromAgentId: 'testing', toAgentId: 'reviewer', content: 'All 147 tests passing. Coverage: 94%. Performance benchmarks within targets.', type: 'response' },
  { fromAgentId: 'reviewer', toAgentId: 'deployment', content: 'Code review passed. Production deployment approved. Awaiting human gate.', type: 'notification' },
];

// ─── Store Interface ──────────────────────────────────────────────────────────

interface AgentOSStore {
  // Navigation
  currentPage: 'landing' | 'dashboard' | 'mission' | 'agents' | 'cost' | 'health' | 'replay' | 'simulator' | 'memory';
  setPage: (page: AgentOSStore['currentPage']) => void;

  // Mission state
  mission: Mission | null;
  isPlanning: boolean;
  pendingApproval: ApprovalRequest | null;

  // Budget guard
  budgetGuard: BudgetGuard;
  setBudgetGuard: (guard: Partial<BudgetGuard>) => void;

  // Agents
  agents: Agent[];

  // ── AgentOS X ──
  preferences: OptimizationPreferences;
  setPreferences: (p: Partial<OptimizationPreferences>) => void;

  strategies: MissionStrategy[];
  selectedStrategy: MissionStrategy | null;
  isSimulating: boolean;
  aiPlanningStatus: string | null;
  pendingGoal: string;
  setPendingGoal: (goal: string) => void;
  runSimulator: (goal: string) => void;
  planWithChatGPT: (goal: string) => Promise<void>;
  executeStrategy: (strategy: MissionStrategy, budget: number, maxTime: number) => void;

  missionMemory: MissionMemoryRecord[];
  saveMissionToMemory: () => void;
  getSimilarMissions: (goal: string) => MissionMemoryRecord[];
  clearMemory: () => void;

  workflowChanges: WorkflowChange[];
  addWorkflowChange: (change: Omit<WorkflowChange, 'id' | 'timestamp'>) => void;

  // Existing actions
  startMission: (goal: string, budget: number, maxAgents: number, maxTime: number) => void;
  runDemoMission: () => void;
  approveMission: () => void;
  rejectMission: () => void;
  modifyApproval: (modification: string) => void;
  replayMission: () => void;
  resetMission: () => void;
  killAllAgents: () => Promise<{ terminatedAgents: string[]; terminatedExecutions: string[] }>;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useAgentOSStore = create<AgentOSStore>((set, get) => ({
  currentPage: 'landing',
  setPage: (page) => set({ currentPage: page }),

  mission: null,
  isPlanning: false,
  pendingApproval: null,

  budgetGuard: { maxBudget: 2.0, maxTime: 300, maxAgents: 12, currentSpend: 0, currentTime: 0, currentAgents: 0 },
  setBudgetGuard: (guard) => set((state) => ({ budgetGuard: { ...state.budgetGuard, ...guard } })),

  agents: AGENTS,

  // ── AgentOS X state ──
  preferences: { speed: 50, cost: 50, quality: 70, safety: 80, autonomy: 60 },
  setPreferences: (p) => set(state => ({ preferences: { ...state.preferences, ...p } })),

  strategies: [],
  selectedStrategy: null,
  isSimulating: false,
  aiPlanningStatus: null,
  pendingGoal: '',
  setPendingGoal: (goal) => set({ pendingGoal: goal }),

  planWithChatGPT: async (goal: string) => {
    set({ isSimulating: true, pendingGoal: goal, aiPlanningStatus: 'Analyzing objective with ChatGPT...' });
    try {
      const { preferences, budgetGuard } = get();
      const res = await agentApi.planMission(goal, preferences, budgetGuard.maxBudget, budgetGuard.maxAgents, budgetGuard.maxTime);
      if (res.plan?.strategies && Array.isArray(res.plan.strategies)) {
        set({
          strategies: res.plan.strategies,
          isSimulating: false,
          aiPlanningStatus: null,
          currentPage: 'simulator',
        });
        return;
      }
    } catch (err) {
      console.warn('ChatGPT planning fallback:', err);
    }
    const { preferences } = get();
    const strats = generateStrategies(goal, preferences);
    set({ strategies: strats, isSimulating: false, aiPlanningStatus: null, currentPage: 'simulator' });
  },

  runSimulator: (goal: string) => {
    get().planWithChatGPT(goal);
  },

  executeStrategy: (strategy, budget, maxTime) => {
    set({ isPlanning: true, selectedStrategy: strategy });
    const agentIds = strategy.agents;
    const nodes = buildNodes(agentIds);
    const modelDecisions = agentIds.map(id => getModelDecision(id, AGENTS.find(a => a.id === id)?.name || id));

    const mission: Mission = {
      id: `mission-${Date.now()}`,
      goal: get().pendingGoal,
      status: 'planning',
      complexity: agentIds.length <= 4 ? 'simple' : agentIds.length <= 7 ? 'moderate' : agentIds.length <= 10 ? 'complex' : 'epic',
      riskLevel: strategy.riskLevel,
      estimatedCost: strategy.estimatedCost,
      actualCost: 0,
      estimatedTime: strategy.estimatedTime,
      budget,
      maxAgents: agentIds.length,
      maxTime,
      requiredAgents: agentIds,
      requiredTools: strategy.tools,
      nodes,
      messages: [],
      costRecords: [],
      totalTokens: 0,
      modelDecisions,
      timeline: [],
      workflowChanges: [],
      failureRisks: {},
      selectedStrategy: strategy.id,
    };

    setTimeout(() => {
      set({ isPlanning: false, mission: { ...mission, status: 'planning' }, currentPage: 'mission' });
    }, 1500);
  },

  missionMemory: loadMemory(),
  saveMissionToMemory: () => {
    const { mission } = get();
    if (!mission || mission.status !== 'completed') return;
    const record: MissionMemoryRecord = {
      id: mission.id,
      goal: mission.goal,
      completedAt: Date.now(),
      duration: mission.actualTime || 0,
      totalCost: mission.actualCost,
      totalTokens: mission.totalTokens,
      agentsUsed: mission.requiredAgents,
      modelsUsed: [...new Set(mission.costRecords.map(r => r.model))],
      failureCount: mission.nodes.filter(n => n.retries && n.retries > 0).length,
      recoveryCount: mission.timeline.filter(e => e.type === 'recovery').length,
      approvalCount: mission.timeline.filter(e => e.type === 'approval').length,
      finalQualityScore: mission.qualityScore || 91,
      strategy: mission.selectedStrategy || 'A',
      keywords: extractKeywords(mission.goal),
    };
    const existing = loadMemory().filter(r => r.id !== record.id);
    const updated = [record, ...existing];
    saveMemory(updated);
    set({ missionMemory: updated });
  },
  getSimilarMissions: (goal: string) => {
    const kw = extractKeywords(goal);
    const mem = get().missionMemory;
    return mem
      .map(r => ({ record: r, score: similarityScore(kw, r.keywords) }))
      .filter(x => x.score > 0.25)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(x => x.record);
  },
  clearMemory: () => { saveMemory([]); set({ missionMemory: [] }); },

  workflowChanges: [],
  addWorkflowChange: (change) => {
    const c: WorkflowChange = { ...change, id: `wfc-${Date.now()}`, timestamp: Date.now() };
    set(state => ({ workflowChanges: [...state.workflowChanges, c] }));
    useAgentOSStore.setState(state => ({
      mission: state.mission ? { ...state.mission, workflowChanges: [...state.mission.workflowChanges, c] } : null,
    }));
  },

  startMission: (goal, budget, maxAgents, maxTime) => {
    set({ isPlanning: true });
    const agentIds = generateWorkflow(goal).slice(0, maxAgents);
    const nodes = buildNodes(agentIds);
    const modelDecisions = agentIds.map(id => getModelDecision(id, AGENTS.find(a => a.id === id)?.name || id));
    const mission: Mission = {
      id: `mission-${Date.now()}`,
      goal, status: 'planning',
      complexity: agentIds.length <= 4 ? 'simple' : agentIds.length <= 7 ? 'moderate' : agentIds.length <= 10 ? 'complex' : 'epic',
      riskLevel: goal.toLowerCase().includes('deploy') || goal.toLowerCase().includes('production') ? 'high' : 'medium',
      estimatedCost: agentIds.length * 0.045, actualCost: 0,
      estimatedTime: agentIds.length * 18,
      budget, maxAgents, maxTime,
      requiredAgents: agentIds,
      requiredTools: ['Web Search', 'Code Executor', 'File System', 'Database', 'Browser Automation'],
      nodes, messages: [], costRecords: [], totalTokens: 0, modelDecisions, timeline: [],
      workflowChanges: [], failureRisks: {},
    };
    setTimeout(() => { set({ isPlanning: false, mission: { ...mission, status: 'planning' }, currentPage: 'mission' }); }, 2000);
  },

  runDemoMission: () => {
    const goal = 'Build a secure student management web application';
    get().startMission(goal, 2.0, 11, 300);
  },

  approveMission: () => {
    const { pendingApproval, mission } = get();
    if (!pendingApproval || !mission) return;
    const updatedNodes = mission.nodes.map(n => n.id === pendingApproval.nodeId ? { ...n, gateApproved: true, status: 'running' as const } : n);
    set({ mission: { ...mission, nodes: updatedNodes }, pendingApproval: null });
  },

  rejectMission: () => {
    const { pendingApproval, mission } = get();
    if (!pendingApproval || !mission) return;
    const updatedNodes = mission.nodes.map(n => n.id === pendingApproval.nodeId ? { ...n, gateApproved: false, status: 'rejected' as const } : n);
    set({ mission: { ...mission, nodes: updatedNodes, status: 'failed' }, pendingApproval: null });
  },

  modifyApproval: (_modification: string) => {
    const { pendingApproval, mission } = get();
    if (!pendingApproval || !mission) return;
    set({ pendingApproval: null });
  },

  replayMission: () => { set({ currentPage: 'replay' }); },

  resetMission: () => {
    set({ mission: null, pendingApproval: null, strategies: [], selectedStrategy: null, pendingGoal: '', currentPage: 'dashboard' });
  },

  killAllAgents: async () => {
    try {
      const res = await agentApi.killAllAgents();
      const { mission, agents } = get();
      if (mission && mission.status === 'running') {
        const updatedNodes = mission.nodes.map(n =>
          n.status === 'running' || n.status === 'pending'
            ? { ...n, status: 'failed' as const, error: 'Terminated by Agent Terminator' }
            : n
        );
        set({
          mission: {
            ...mission,
            status: 'failed',
            nodes: updatedNodes,
            timeline: [
              ...mission.timeline,
              {
                id: `evt-${Date.now()}`,
                nodeId: 'emergency-kill',
                agentName: 'Agent Terminator',
                event: '☠️ EMERGENCY KILL PROTOCOL: All running agents and tasks terminated immediately',
                timestamp: Date.now(),
                type: 'fail',
              },
            ],
          },
        });
      }
      set({
        agents: agents.map(a => ({ ...a, status: 'idle', currentWorkload: 0 })),
      });
      return res.data;
    } catch (err) {
      console.error('Kill all agents error:', err);
      return { terminatedAgents: [], terminatedExecutions: [] };
    }
  },
}));


// Export helpers
export { AGENTS, AI_MODELS, getModelDecision, getModelForAgentWithPrefs };
