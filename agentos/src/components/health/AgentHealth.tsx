import React from 'react';
import { useAgentOSStore } from '../../store';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from 'recharts';

const StatusIndicator: React.FC<{ status: 'healthy' | 'busy' | 'failed' }> = ({ status }) => {
  const colors = { healthy: '#10b981', busy: '#f59e0b', failed: '#ef4444' };
  const labels = { healthy: '🟢 Healthy', busy: '🟡 Busy', failed: '🔴 Failed' };
  return (
    <span style={{ fontSize: '12px', fontWeight: 600, color: colors[status] }}>
      {labels[status]}
    </span>
  );
};

const GaugeMeter: React.FC<{ value: number; max?: number; color?: string; label: string; unit?: string }> = 
  ({ value, max = 100, color = '#6366f1', label, unit = '%' }) => {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <svg width="80" height="80" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r="32" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
          <circle
            cx="40" cy="40" r="32" fill="none"
            stroke={color} strokeWidth="6"
            strokeDasharray={`${(pct / 100) * 201} 201`}
            strokeLinecap="round"
            transform="rotate(-90 40 40)"
            style={{ transition: 'stroke-dasharray 0.5s ease' }}
          />
          <text x="40" y="44" textAnchor="middle" fill="white" fontSize="14" fontWeight="700" fontFamily="JetBrains Mono, monospace">
            {value}{unit === 'ms' ? '' : ''}
          </text>
        </svg>
      </div>
      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>{label}</div>
    </div>
  );
};

export const AgentHealth: React.FC = () => {
  const agents = useAgentOSStore(s => s.agents);

  const healthCounts = {
    healthy: agents.filter(a => a.healthStatus === 'healthy').length,
    busy: agents.filter(a => a.healthStatus === 'busy').length,
    failed: agents.filter(a => a.healthStatus === 'failed').length,
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title"><span className="gradient-text">Agent</span> Health</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>Real-time health monitoring for all agents</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div className="badge badge-success">🟢 {healthCounts.healthy} Healthy</div>
          <div className="badge badge-recovering">🟡 {healthCounts.busy} Busy</div>
          <div className="badge badge-failed">🔴 {healthCounts.failed} Failed</div>
        </div>
      </div>

      {/* Health grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
        {agents.map(agent => {
          const radarData = [
            { metric: 'Success', value: agent.successRate },
            { metric: 'CPU', value: 100 - agent.cpu },
            { metric: 'Memory', value: 100 - agent.memory },
            { metric: 'Uptime', value: 100 - (agent.failures / agent.requests) * 100 },
            { metric: 'Load', value: 100 - agent.currentWorkload },
          ];

          return (
            <div key={agent.id} className="glass-card" style={{ padding: '24px' }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <div style={{
                  width: 44, height: 44, borderRadius: '12px', fontSize: '22px',
                  background: `${agent.color}22`, border: `1px solid ${agent.color}44`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {agent.avatar}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '2px' }}>{agent.name}</div>
                  <StatusIndicator status={agent.healthStatus} />
                </div>
              </div>

              {/* Gauges */}
              <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '16px' }}>
                <GaugeMeter value={agent.cpu} color="#6366f1" label="CPU" />
                <GaugeMeter value={agent.memory} color="#06b6d4" label="Memory" />
                <GaugeMeter value={agent.currentWorkload} color={agent.currentWorkload > 80 ? '#ef4444' : '#f59e0b'} label="Load" />
              </div>

              {/* Stats row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '16px' }}>
                {[
                  { label: 'Requests', value: agent.requests.toLocaleString(), color: '#818cf8' },
                  { label: 'Latency', value: `${agent.latency}ms`, color: '#f59e0b' },
                  { label: 'Success %', value: `${agent.successRate}%`, color: '#10b981' },
                  { label: 'Failures', value: agent.failures.toString(), color: agent.failures > 10 ? '#ef4444' : '#4a5578' },
                ].map(m => (
                  <div key={m.label} style={{ textAlign: 'center', padding: '8px 4px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: m.color, fontFamily: 'var(--font-mono)' }}>{m.value}</div>
                    <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginTop: '2px' }}>{m.label}</div>
                  </div>
                ))}
              </div>

              {/* Token usage */}
              <div style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '11px', color: 'var(--text-muted)' }}>
                  <span>Token Usage</span>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>{(agent.tokenUsage / 1000).toFixed(0)}K</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${Math.min((agent.tokenUsage / 500000) * 100, 100)}%` }} />
                </div>
              </div>

              {/* Radar chart */}
              <div style={{ height: 120 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="rgba(255,255,255,0.1)" />
                    <PolarAngleAxis dataKey="metric" tick={{ fill: '#4a5578', fontSize: 9 }} />
                    <Radar dataKey="value" stroke={agent.color} fill={agent.color} fillOpacity={0.15} />
                    <Tooltip contentStyle={{ background: 'rgba(8,13,26,0.95)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px' }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
