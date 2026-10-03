import React, { useState } from 'react';
import { useAgentOSStore } from '../../store';
import { AGENTS } from '../../data/agents';
import type { WorkflowNode } from '../../types';
import { CheckCircle, XCircle, AlertCircle, Clock, RefreshCw, Zap, MessageSquare, ChevronRight, Brain } from 'lucide-react';

const statusConfig = {
  pending: { icon: Clock, color: '#4a5578', label: 'Pending' },
  running: { icon: Zap, color: '#6366f1', label: 'Running' },
  success: { icon: CheckCircle, color: '#10b981', label: 'Done' },
  failed: { icon: XCircle, color: '#ef4444', label: 'Failed' },
  recovering: { icon: RefreshCw, color: '#f59e0b', label: 'Recovering' },
  waiting: { icon: AlertCircle, color: '#06b6d4', label: 'Awaiting Approval' },
  approved: { icon: CheckCircle, color: '#10b981', label: 'Approved' },
  rejected: { icon: XCircle, color: '#ef4444', label: 'Rejected' },
};

const NodeCard: React.FC<{ node: WorkflowNode; onClick: () => void }> = ({ node, onClick }) => {
  const agent = AGENTS.find(a => a.id === node.agentId);
  const cfg = statusConfig[node.status] || statusConfig.pending;
  const Icon = cfg.icon;
  const isRunning = node.status === 'running';
  const isRecovering = node.status === 'recovering';

  return (
    <div
      className={`workflow-node ${node.status}`}
      onClick={onClick}
      style={{ cursor: 'pointer' }}
    >
      {isRunning && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'var(--gradient-primary)', borderRadius: '2px 2px 0 0', overflow: 'hidden' }}>
          <div style={{ height: '100%', background: 'white', width: '30%', animation: 'shimmer 1.5s linear infinite', backgroundSize: '200% 100%' }} />
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
        <span style={{ fontSize: '20px' }}>{agent?.avatar}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>{agent?.name}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{agent?.role}</div>
        </div>
        <Icon size={14} color={cfg.color} className={isRunning || isRecovering ? 'animate-spin' : ''} />
      </div>
      <div className={`badge badge-${node.status}`} style={{ fontSize: '10px' }}>
        {cfg.label}
      </div>
      {node.tokenUsage && (
        <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          {node.tokenUsage.toLocaleString()} tokens · ${node.cost?.toFixed(4)}
        </div>
      )}
    </div>
  );
};

const NodeDetail: React.FC<{ node: WorkflowNode; onClose: () => void }> = ({ node, onClose }) => {
  const agent = AGENTS.find(a => a.id === node.agentId);
  const mission = useAgentOSStore(s => s.mission);
  const decision = mission?.modelDecisions.find(d => d.taskId === node.agentId);

  return (
    <div style={{
      position: 'fixed', top: 0, right: 0, bottom: 0, width: '420px',
      background: 'rgba(8, 13, 26, 0.98)',
      border: '1px solid var(--border)',
      backdropFilter: 'blur(20px)',
      padding: '24px',
      overflowY: 'auto',
      zIndex: 200,
      animation: 'slideInRight 0.3s ease',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '28px' }}>{agent?.avatar}</span>
          <div>
            <div style={{ fontSize: '16px', fontWeight: 700 }}>{agent?.name}</div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{agent?.role}</div>
          </div>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px' }}>
          <XCircle size={20} />
        </button>
      </div>

      {/* Status */}
      <div className={`badge badge-${node.status}`} style={{ marginBottom: '20px' }}>
        {statusConfig[node.status]?.label}
      </div>

      {/* Metrics */}
      {node.tokenUsage && (
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>Execution Metrics</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {[
              { label: 'Tokens', value: node.tokenUsage.toLocaleString(), color: '#6366f1' },
              { label: 'Cost', value: `$${node.cost?.toFixed(4)}`, color: '#10b981' },
              { label: 'Duration', value: node.startTime && node.endTime ? `${((node.endTime - node.startTime) / 1000).toFixed(1)}s` : '—', color: '#f59e0b' },
              { label: 'Retries', value: String(node.retries ?? 0), color: node.retries ? '#ef4444' : '#4a5578' },
            ].map(m => (
              <div key={m.label} style={{ padding: '12px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>{m.label}</div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: m.color, fontFamily: 'var(--font-mono)' }}>{m.value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Model decision */}
      {decision && (
        <div style={{ marginBottom: '20px', padding: '16px', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <Brain size={14} color="#818cf8" />
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Why This Model?
            </span>
          </div>
          <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
            Selected: <span style={{ color: '#818cf8' }}>{decision.selectedModel}</span>
          </div>
          <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>
            Capability: <span style={{ color: 'var(--text-secondary)' }}>{decision.requiredCapability}</span>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            {decision.reason}
          </div>
          <div style={{ marginTop: '12px', fontSize: '11px', color: 'var(--text-muted)' }}>
            Alternatives considered: {decision.alternatives.join(', ')}
          </div>
        </div>
      )}

      {/* Output */}
      {node.output && (
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>Output</div>
          <div className="terminal-text" style={{ lineHeight: 1.6 }}>{node.output}</div>
        </div>
      )}

      {/* Error */}
      {node.error && (
        <div style={{ padding: '12px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px' }}>
          <div style={{ fontSize: '12px', color: '#f87171' }}><strong>Error:</strong> {node.error}</div>
        </div>
      )}
    </div>
  );
};

// Simple visual workflow graph
const WorkflowGraph: React.FC<{ nodes: WorkflowNode[]; onSelect: (n: WorkflowNode) => void }> = ({ nodes, onSelect }) => {
  // Group nodes by dependency depth
  const getDepth = (nodeId: string, visited = new Set<string>()): number => {
    if (visited.has(nodeId)) return 0;
    visited.add(nodeId);
    const node = nodes.find(n => n.id === nodeId);
    if (!node || node.dependencies.length === 0) return 0;
    return 1 + Math.max(...node.dependencies.map(d => getDepth(d, new Set(visited))));
  };

  const depths = nodes.map(n => ({ node: n, depth: getDepth(n.id) }));
  const maxDepth = Math.max(...depths.map(d => d.depth));

  const layers: WorkflowNode[][] = Array.from({ length: maxDepth + 1 }, () => []);
  depths.forEach(({ node, depth }) => layers[depth].push(node));

  return (
    <div style={{ padding: '24px', overflowX: 'auto' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', minWidth: '600px' }}>
        {layers.map((layer, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
            {layer.map(node => (
              <NodeCard key={node.id} node={node} onClick={() => onSelect(node)} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export const MissionControl: React.FC = () => {
  const { mission, setPage } = useAgentOSStore();
  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null);
  const [activeTab, setActiveTab] = useState<'workflow' | 'messages' | 'decisions'>('workflow');

  if (!mission) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px', gap: '16px' }}>
        <div style={{ fontSize: '48px' }}>🚀</div>
        <h2 style={{ fontSize: '24px', fontWeight: 700 }}>No Active Mission</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Go to the Command Center to start a mission</p>
        <button className="btn btn-primary" onClick={() => setPage('dashboard')}>
          <Zap size={16} /> Open Command Center
        </button>
      </div>
    );
  }

  const completedNodes = mission.nodes.filter(n => n.status === 'success').length;
  const totalNodes = mission.nodes.length;
  const progress = totalNodes > 0 ? (completedNodes / totalNodes) * 100 : 0;

  return (
    <div style={{ paddingRight: selectedNode ? '440px' : '0', transition: 'padding-right 0.3s' }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <h1 className="page-title">Mission Control</h1>
            <div className={`badge badge-${mission.status}`}>
              {mission.status === 'running' && <div className="live-dot" style={{ width: 6, height: 6 }} />}
              {mission.status.toUpperCase()}
            </div>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', maxWidth: '600px' }}>
            {mission.goal}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {mission.status === 'completed' && (
            <button className="btn btn-secondary" onClick={() => setPage('replay')}>
              View Replay →
            </button>
          )}
          <button className="btn btn-secondary" onClick={() => setPage('dashboard')}>
            New Mission
          </button>
        </div>
      </div>

      {/* Mission stats */}
      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        {[
          { label: 'Progress', value: `${completedNodes}/${totalNodes}`, sub: `${progress.toFixed(0)}%`, color: '#6366f1' },
          { label: 'Tokens Used', value: mission.totalTokens.toLocaleString(), color: '#06b6d4' },
          { label: 'Actual Cost', value: `$${mission.actualCost.toFixed(4)}`, sub: `Budget: $${mission.budget}`, color: '#10b981' },
          { label: 'Complexity', value: mission.complexity.toUpperCase(), color: '#f59e0b' },
          { label: 'Risk Level', value: mission.riskLevel.toUpperCase(), color: mission.riskLevel === 'high' ? '#ef4444' : '#f59e0b' },
          { label: 'Agents', value: mission.requiredAgents.length.toString(), color: '#8b5cf6' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px' }}>{s.label}</div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: s.color, fontFamily: 'var(--font-mono)', letterSpacing: '-0.01em' }}>{s.value}</div>
            {s.sub && <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{s.sub}</div>}
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div style={{ marginBottom: '24px' }}>
        <div className="progress-bar" style={{ height: '6px' }}>
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', background: 'var(--bg-glass)', borderRadius: '10px', padding: '4px', width: 'fit-content' }}>
        {(['workflow', 'messages', 'decisions'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '8px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600,
              background: activeTab === tab ? 'rgba(99,102,241,0.3)' : 'transparent',
              color: activeTab === tab ? '#818cf8' : 'var(--text-secondary)',
              transition: 'all 0.2s',
            }}
          >
            {tab === 'workflow' && '⚡'} {tab === 'messages' && '💬'} {tab === 'decisions' && '🧠'}{' '}
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
            {tab === 'messages' && mission.messages.length > 0 && (
              <span style={{ marginLeft: '6px', background: 'rgba(99,102,241,0.3)', borderRadius: '100px', padding: '0 6px', fontSize: '11px' }}>
                {mission.messages.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Workflow graph */}
      {activeTab === 'workflow' && (
        <div className="glass-card" style={{ overflow: 'hidden' }}>
          <WorkflowGraph nodes={mission.nodes} onSelect={setSelectedNode} />
        </div>
      )}

      {/* Agent messages */}
      {activeTab === 'messages' && (
        <div className="glass-card" style={{ padding: '24px', maxHeight: '600px', overflowY: 'auto' }}>
          {mission.messages.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>
              <MessageSquare size={32} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
              <div>No agent messages yet. Start a mission to see agent communication.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {mission.messages.map(msg => {
                const fromAgent = AGENTS.find(a => a.id === msg.fromAgentId);
                const toAgent = AGENTS.find(a => a.id === msg.toAgentId);
                return (
                  <div key={msg.id} className={`msg-bubble ${msg.type}`}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <span style={{ fontSize: '16px' }}>{fromAgent?.avatar || '🤖'}</span>
                      <span style={{ fontSize: '13px', fontWeight: 700 }}>{fromAgent?.name || msg.fromAgentId}</span>
                      <ChevronRight size={12} color="var(--text-muted)" />
                      <span style={{ fontSize: '16px' }}>{toAgent?.avatar || '🤖'}</span>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>{toAgent?.name || msg.toAgentId}</span>
                      <span style={{ marginLeft: 'auto', fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, paddingLeft: '24px' }}>
                      {msg.content}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Model decisions */}
      {activeTab === 'decisions' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '16px' }}>
          {mission.modelDecisions.map(d => {
            const agent = AGENTS.find(a => a.id === d.taskId);
            return (
              <div key={d.taskId} className="glass-card" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  <span style={{ fontSize: '20px' }}>{agent?.avatar}</span>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700 }}>{agent?.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--accent-primary)', fontWeight: 600 }}>{d.selectedModel}</div>
                  </div>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  <strong style={{ color: 'var(--text-secondary)' }}>Capability:</strong> {d.requiredCapability}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '8px' }}>
                  {d.reason}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Considered: {d.alternatives.join(', ')}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Node detail panel */}
      {selectedNode && (
        <NodeDetail node={selectedNode} onClose={() => setSelectedNode(null)} />
      )}
    </div>
  );
};
