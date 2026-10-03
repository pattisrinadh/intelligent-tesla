import React, { useState } from 'react';
import { useAgentOSStore } from '../../store';
import { AGENTS } from '../../data/agents';
import { PlayCircle, CheckCircle, XCircle, RefreshCw, AlertCircle, Zap, Clock, DollarSign } from 'lucide-react';
import type { TimelineEvent, WorkflowNode } from '../../types';

const typeIcons = {
  start: Zap,
  complete: CheckCircle,
  fail: XCircle,
  retry: RefreshCw,
  approval: AlertCircle,
  recovery: RefreshCw,
  message: PlayCircle,
};

const typeColors = {
  start: '#6366f1',
  complete: '#10b981',
  fail: '#ef4444',
  retry: '#f59e0b',
  approval: '#06b6d4',
  recovery: '#f59e0b',
  message: '#8b5cf6',
};

const NodeDetail: React.FC<{ node: WorkflowNode }> = ({ node }) => {
  const agent = AGENTS.find(a => a.id === node.agentId);
  return (
    <div style={{ padding: '20px', background: 'rgba(0,0,0,0.3)', borderRadius: '12px', animation: 'fadeInUp 0.3s ease' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        <span style={{ fontSize: '24px' }}>{agent?.avatar}</span>
        <div>
          <div style={{ fontSize: '15px', fontWeight: 700 }}>{agent?.name}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{agent?.role}</div>
        </div>
        <div className={`badge badge-${node.status}`} style={{ marginLeft: 'auto' }}>{node.status}</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '16px' }}>
        {[
          { icon: DollarSign, label: 'Cost', value: node.cost ? `$${node.cost.toFixed(4)}` : '—' },
          { icon: Zap, label: 'Tokens', value: node.tokenUsage?.toLocaleString() || '—' },
          { icon: Clock, label: 'Duration', value: node.startTime && node.endTime ? `${((node.endTime - node.startTime) / 1000).toFixed(1)}s` : '—' },
        ].map(m => {
          const Icon = m.icon;
          return (
            <div key={m.label} style={{ padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', textAlign: 'center' }}>
              <Icon size={14} color="var(--text-muted)" style={{ margin: '0 auto 4px' }} />
              <div style={{ fontSize: '15px', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{m.value}</div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{m.label}</div>
            </div>
          );
        })}
      </div>

      {node.model && (
        <div style={{ marginBottom: '12px', fontSize: '13px' }}>
          <span style={{ color: 'var(--text-muted)' }}>Model: </span>
          <span style={{ fontWeight: 600, color: '#818cf8' }}>{node.model}</span>
        </div>
      )}

      {node.output && (
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Output</div>
          <div className="terminal-text" style={{ lineHeight: 1.6 }}>{node.output}</div>
        </div>
      )}

      {node.error && (
        <div style={{ padding: '10px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px' }}>
          <div style={{ fontSize: '12px', color: '#f87171' }}>Error: {node.error}</div>
        </div>
      )}
    </div>
  );
};

export const MissionReplay: React.FC = () => {
  const { mission, setPage } = useAgentOSStore();
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);

  if (!mission || mission.timeline.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px', gap: '16px' }}>
        <div style={{ fontSize: '48px' }}>📼</div>
        <h2 style={{ fontSize: '24px', fontWeight: 700 }}>No Replay Available</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Complete a mission to enable replay</p>
        <button className="btn btn-primary" onClick={() => setPage('dashboard')}>
          <Zap size={16} /> Start a Mission
        </button>
      </div>
    );
  }

  const selectedNode = selectedEvent
    ? mission.nodes.find(n => n.id === selectedEvent.nodeId)
    : null;

  const startTime = mission.timeline[0]?.timestamp || Date.now();

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title"><span className="gradient-text">Mission</span> Replay</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '4px', maxWidth: '600px' }}>
            {mission.goal}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div className={`badge badge-${mission.status}`}>{mission.status.toUpperCase()}</div>
        </div>
      </div>

      {/* Summary bar */}
      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        {[
          { label: 'Total Events', value: mission.timeline.length, color: '#6366f1' },
          { label: 'Duration', value: mission.actualTime ? `${mission.actualTime}s` : '—', color: '#f59e0b' },
          { label: 'Total Cost', value: `$${mission.actualCost.toFixed(4)}`, color: '#10b981' },
          { label: 'Total Tokens', value: mission.totalTokens.toLocaleString(), color: '#06b6d4' },
          { label: 'Agents Used', value: mission.requiredAgents.length, color: '#8b5cf6' },
          { label: 'Messages', value: mission.messages.length, color: '#ec4899' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px' }}>{s.label}</div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: s.color, fontFamily: 'var(--font-mono)' }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '24px', alignItems: 'start' }}>
        {/* Timeline */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '20px' }}>Execution Timeline</h3>
          <div style={{ position: 'relative' }}>
            {/* Vertical line */}
            <div style={{ position: 'absolute', left: '19px', top: 0, bottom: 0, width: '2px', background: 'var(--border)', zIndex: 0 }} />
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', position: 'relative', zIndex: 1 }}>
              {mission.timeline.map((event, idx) => {
                const Icon = typeIcons[event.type] || PlayCircle;
                const color = typeColors[event.type] || '#4a5578';
                const isSelected = selectedEvent?.id === event.id;
                const elapsed = ((event.timestamp - startTime) / 1000).toFixed(1);
                const agent = AGENTS.find(a => a.name === event.agentName);

                return (
                  <div
                    key={event.id}
                    onClick={() => setSelectedEvent(isSelected ? null : event)}
                    style={{
                      display: 'flex', gap: '16px', cursor: 'pointer',
                      padding: '10px 12px', borderRadius: '10px',
                      background: isSelected ? `${color}10` : 'transparent',
                      border: `1px solid ${isSelected ? color + '40' : 'transparent'}`,
                      transition: 'all 0.2s',
                      animation: `fadeInUp 0.3s ease ${idx * 0.05}s both`,
                    }}
                    onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                    onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                  >
                    {/* Icon */}
                    <div style={{
                      width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                      background: `${color}20`, border: `2px solid ${color}60`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Icon size={16} color={color} />
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                        <span style={{ fontSize: '14px', fontWeight: 600 }}>{event.event}</span>
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', gap: '12px' }}>
                        <span style={{ fontFamily: 'var(--font-mono)' }}>T+{elapsed}s</span>
                        <span>{new Date(event.timestamp).toLocaleTimeString()}</span>
                      </div>
                    </div>

                    {/* Agent avatar */}
                    {agent && (
                      <span style={{ fontSize: '18px', alignSelf: 'center' }}>{agent.avatar}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Event detail */}
        <div>
          {selectedEvent && selectedNode ? (
            <div>
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
                  Selected Event
                </div>
                <div style={{ fontSize: '16px', fontWeight: 700 }}>{selectedEvent.event}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
                  {new Date(selectedEvent.timestamp).toLocaleTimeString()}
                </div>
              </div>
              <NodeDetail node={selectedNode} />
            </div>
          ) : (
            <div className="glass-card" style={{ padding: '32px', textAlign: 'center' }}>
              <PlayCircle size={40} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
              <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                Click any timeline event to inspect its details
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
