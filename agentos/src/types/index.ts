export type AgentStatus = 'idle' | 'running' | 'success' | 'failed' | 'recovering' | 'waiting';
export type NodeStatus = 'pending' | 'running' | 'success' | 'failed' | 'recovering' | 'waiting' | 'approved' | 'rejected';
export type MissionStatus = 'idle' | 'planning' | 'running' | 'paused' | 'completed' | 'failed';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type ModelType = 'fast' | 'balanced' | 'reasoning' | 'coding' | 'vision';
export type AgentHealthStatus = 'healthy' | 'busy' | 'failed';

export interface Agent {
  id: string;
  name: string;
  role: string;
  avatar: string;
  skills: string[];
  models: ModelType[];
  avgExecutionTime: number; // seconds
  avgCost: number; // USD
  successRate: number; // 0-100
  currentWorkload: number; // 0-100
  status: AgentStatus;
  healthStatus: AgentHealthStatus;
  cpu: number;
  memory: number;
  requests: number;
  latency: number;
  failures: number;
  tokenUsage: number;
  color: string;
}

export interface AIModel {
  id: string;
  name: string;
  type: ModelType;
  provider: string;
  costPer1kTokens: number;
  avgLatency: number; // ms
  capabilities: string[];
  color: string;
}

export interface CustomAgent {
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
  duration?: number;
  model: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  result?: string;
  error?: string;
}

export interface ExecutionStep {
  step: string;
  message: string;
  timestamp: number;
}


export interface WorkflowNode {
  id: string;
  agentId: string;
  label: string;
  status: NodeStatus;
  dependencies: string[];
  startTime?: number;
  endTime?: number;
  tokenUsage?: number;
  cost?: number;
  model?: string;
  input?: string;
  output?: string;
  error?: string;
  retries?: number;
  isGate?: boolean;
  gateApproved?: boolean | null;
  failureRisk?: number;   // 0–100 live risk score
  preventiveRecovery?: boolean;
}

export interface AgentMessage {
  id: string;
  fromAgentId: string;
  toAgentId: string;
  content: string;
  timestamp: number;
  type: 'request' | 'response' | 'notification' | 'error';
}

export interface CostRecord {
  agentId: string;
  model: string;
  tokens: number;
  cost: number;
  timestamp: number;
}

export interface Mission {
  id: string;
  goal: string;
  status: MissionStatus;
  complexity: 'simple' | 'moderate' | 'complex' | 'epic';
  riskLevel: RiskLevel;
  estimatedCost: number;
  actualCost: number;
  estimatedTime: number; // seconds
  actualTime?: number;
  budget: number;
  maxAgents: number;
  maxTime: number; // seconds
  requiredAgents: string[];
  requiredTools: string[];
  nodes: WorkflowNode[];
  messages: AgentMessage[];
  costRecords: CostRecord[];
  startTime?: number;
  endTime?: number;
  totalTokens: number;
  modelDecisions: ModelDecision[];
  timeline: TimelineEvent[];
  workflowChanges: WorkflowChange[];
  failureRisks: Record<string, FailureRisk>;
  selectedStrategy?: string;
  qualityScore?: number;
}

export interface ModelDecision {
  taskId: string;
  taskDescription: string;
  requiredCapability: string;
  selectedModel: string;
  reason: string;
  alternatives: string[];
}

export interface TimelineEvent {
  id: string;
  nodeId: string;
  agentName: string;
  event: string;
  timestamp: number;
  type: 'start' | 'complete' | 'fail' | 'retry' | 'approval' | 'recovery' | 'message';
}

export interface ApprovalRequest {
  id: string;
  missionId: string;
  nodeId: string;
  action: string;
  description: string;
  risk: RiskLevel;
  estimatedImpact: string;
  status: 'pending' | 'approved' | 'rejected' | 'modified';
  timestamp: number;
}

export interface BudgetGuard {
  maxBudget: number;
  maxTime: number;
  maxAgents: number;
  currentSpend: number;
  currentTime: number;
  currentAgents: number;
}

// ─── AgentOS X: New Types ────────────────────────────────────────────────────

/** User's optimization preferences, 0–100 for each dimension */
export interface OptimizationPreferences {
  speed: number;
  cost: number;
  quality: number;
  safety: number;
  autonomy: number;
}

/** One simulated execution strategy */
export interface MissionStrategy {
  id: 'A' | 'B' | 'C';
  label: string;
  agents: string[];
  agentCount: number;
  estimatedCost: number;
  estimatedTime: number; // seconds
  riskLevel: RiskLevel;
  qualityScore: number;   // 0–100
  parallelTasks: number;
  tools: string[];
  reasoning: string;      // Why AgentOS X recommends / de-prioritises this
  recommended: boolean;
  models: string[];       // model names chosen
}

/** Agent Digital Twin — virtual performance profile used for simulation */
export interface AgentTwin {
  agentId: string;
  historicalSuccessRate: number;
  avgCost: number;
  avgLatency: number;   // seconds
  reliability: number;  // 0–100
  failurePattern: string;
  totalMissions: number;
  // Contribution to simulation
  predictedCostForTask: number;
  predictedLatencyForTask: number;
}

/** Live failure-risk score for an agent during execution */
export interface FailureRisk {
  agentId: string;
  riskScore: number;  // 0–100
  level: 'safe' | 'warning' | 'critical';
  reasons: string[];
  preventiveActionTaken: boolean;
}

/** A record of workflow self-modification during live execution */
export interface WorkflowChange {
  id: string;
  timestamp: number;
  reason: string;
  added: string[];    // agent ids added
  removed: string[];  // agent ids removed
}

/** Persisted memory of a completed mission for future reference */
export interface MissionMemoryRecord {
  id: string;
  goal: string;
  completedAt: number;
  duration: number;       // seconds
  totalCost: number;
  totalTokens: number;
  agentsUsed: string[];
  modelsUsed: string[];
  failureCount: number;
  recoveryCount: number;
  approvalCount: number;
  finalQualityScore: number; // 0–100
  strategy: string;          // 'A' | 'B' | 'C' | 'custom'
  keywords: string[];        // extracted from goal for similarity search
}

