import React, { useState } from 'react';
import { useAgentOSStore } from '../../store';
import { AGENTS } from '../../data/agents';
import { Database, Trash2, Zap, Clock, DollarSign, CheckCircle, RefreshCw, Shield, TrendingUp } from 'lucide-react';

function formatTimeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (mins > 0) return `${mins}m ago`;
  return 'just now';
}

export const MissionMemory: React.FC = () => {
  const { missionMemory, clearMemory, getSimilarMissions, mission, setPage } = useAgentOSStore();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string | null>(null);

  const filtered = search
    ? missionMemory.filter(m => m.goal.toLowerCase().includes(search.toLowerCase()) || m.keywords.some(k => k.includes(search.toLowerCase())))
    : missionMemory;

  const selectedRecord = missionMemory.find(r => r.id === selected);
  const similarToCurrent = mission ? getSimilarMissions(mission.goal) : [];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title"><span className="gradient-text">Mission</span> Memory</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
            {missionMemory.length} mission{missionMemory.length !== 1 ? 's' : ''} recorded · Persistent cross-session learning
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {missionMemory.length > 0 && (
            <button className="btn btn-danger" style={{ fontSize: '12px', padding: '8px 16px' }} onClick={() => { if (confirm('Clear all mission memory?')) clearMemory(); }}>
              <Trash2 size={14} /> Clear Memory
            </button>
          )}
        </div>
      </div>

      {/* Similar to current mission banner */}
      {similarToCurrent.length > 0 && (
        <div style={{
          marginBottom: '24px', padding: '16px 24px',
          background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.25)',
          borderRadius: '12px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <TrendingUp size={18} color="#818cf8" />
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#818cf8' }}>
              This mission resembles {similarToCurrent.length} previous mission{similarToCurrent.length > 1 ? 's' : ''}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {similarToCurrent.map(r => (
              <div key={r.id} style={{
                padding: '8px 14px', borderRadius: '8px',
                background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)',
                fontSize: '12px', cursor: 'pointer',
              }} onClick={() => setSelected(r.id)}>
                <div style={{ fontWeight: 600, marginBottom: '2px' }}>{r.goal.slice(0, 50)}{r.goal.length > 50 ? '…' : ''}</div>
                <div style={{ color: 'var(--text-muted)' }}>
                  {r.agentsUsed.length} agents · ${r.totalCost.toFixed(3)} · {r.finalQualityScore}% quality
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {missionMemory.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px', gap: '16px' }}>
          <Database size={64} style={{ opacity: 0.2 }} />
          <h2 style={{ fontSize: '22px', fontWeight: 700 }}>No Mission Memory Yet</h2>
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', maxWidth: '400px' }}>
            Complete a mission to start building memory. AgentOS X will learn from each execution to optimize future missions.
          </p>
          <button className="btn btn-primary" onClick={() => setPage('dashboard')}>
            <Zap size={16} /> Run Your First Mission
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: selectedRecord ? '1fr 400px' : '1fr', gap: '24px', alignItems: 'start' }}>
          {/* List */}
          <div>
            {/* Search */}
            <input
              placeholder="Search mission history…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%', padding: '10px 16px', marginBottom: '16px',
                background: 'var(--bg-glass)', border: '1px solid var(--border)',
                borderRadius: '10px', color: 'var(--text-primary)', fontSize: '14px', outline: 'none',
              }}
            />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filtered.map((record, idx) => {
                const isSelected = selected === record.id;
                return (
                  <div
                    key={record.id}
                    className="glass-card"
                    onClick={() => setSelected(isSelected ? null : record.id)}
                    style={{
                      padding: '20px', cursor: 'pointer',
                      border: `1px solid ${isSelected ? 'rgba(99,102,241,0.5)' : 'var(--border)'}`,
                      background: isSelected ? 'rgba(99,102,241,0.08)' : 'var(--bg-glass)',
                      animation: `fadeInUp 0.3s ease ${idx * 0.05}s both`,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                      {/* Strategy badge */}
                      <div style={{
                        width: 36, height: 36, borderRadius: '8px', flexShrink: 0,
                        background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '14px', fontWeight: 800, color: '#818cf8', fontFamily: 'var(--font-mono)',
                      }}>
                        {record.strategy}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {record.goal}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '10px' }}>
                          {formatTimeAgo(record.completedAt)} · {record.agentsUsed.length} agents
                        </div>

                        {/* Stats row */}
                        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                          {[
                            { icon: DollarSign, value: `$${record.totalCost.toFixed(3)}`, color: '#10b981' },
                            { icon: Clock, value: `${record.duration}s`, color: '#f59e0b' },
                            { icon: TrendingUp, value: `${record.finalQualityScore}%`, color: '#818cf8' },
                            { icon: RefreshCw, value: `${record.recoveryCount} recovery`, color: record.recoveryCount > 0 ? '#f59e0b' : '#4a5578' },
                            { icon: Shield, value: `${record.approvalCount} approval`, color: record.approvalCount > 0 ? '#06b6d4' : '#4a5578' },
                          ].map((s, i) => {
                            const Icon = s.icon;
                            return (
                              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: s.color }}>
                                <Icon size={12} />
                                {s.value}
                              </div>
                            );
                          })}
                        </div>

                        {/* Agent avatars */}
                        <div style={{ display: 'flex', gap: '4px', marginTop: '10px', flexWrap: 'wrap' }}>
                          {record.agentsUsed.map(agentId => {
                            const agent = AGENTS.find(a => a.id === agentId);
                            return (
                              <div key={agentId} title={agent?.name} style={{
                                width: 22, height: 22, borderRadius: '6px', fontSize: '12px',
                                background: `${agent?.color || '#6366f1'}22`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                              }}>
                                {agent?.avatar}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div style={{ flexShrink: 0 }}>
                        <CheckCircle size={16} color="#10b981" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Detail panel */}
          {selectedRecord && (
            <div className="glass-card" style={{ padding: '24px', position: 'sticky', top: '32px', animation: 'slideInRight 0.3s ease' }}>
              <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '4px', lineHeight: 1.4 }}>
                {selectedRecord.goal}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '20px' }}>
                Completed {formatTimeAgo(selectedRecord.completedAt)}
              </div>

              {/* Key metrics */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
                {[
                  { label: 'Total Cost', value: `$${selectedRecord.totalCost.toFixed(4)}`, color: '#10b981' },
                  { label: 'Duration', value: `${selectedRecord.duration}s`, color: '#f59e0b' },
                  { label: 'Tokens', value: `${(selectedRecord.totalTokens / 1000).toFixed(1)}K`, color: '#818cf8' },
                  { label: 'Quality', value: `${selectedRecord.finalQualityScore}%`, color: '#06b6d4' },
                  { label: 'Failures', value: selectedRecord.failureCount.toString(), color: selectedRecord.failureCount > 0 ? '#ef4444' : '#4a5578' },
                  { label: 'Recoveries', value: selectedRecord.recoveryCount.toString(), color: selectedRecord.recoveryCount > 0 ? '#f59e0b' : '#4a5578' },
                ].map(m => (
                  <div key={m.label} style={{ padding: '10px', background: 'rgba(0,0,0,0.25)', borderRadius: '8px' }}>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px' }}>{m.label}</div>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: m.color, fontFamily: 'var(--font-mono)' }}>{m.value}</div>
                  </div>
                ))}
              </div>

              <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>Models Used</div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '16px' }}>
                {selectedRecord.modelsUsed.map(m => (
                  <span key={m} style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '100px', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', color: '#818cf8' }}>{m}</span>
                ))}
              </div>

              <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>Keywords</div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '20px' }}>
                {selectedRecord.keywords.map(k => (
                  <span key={k} style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '100px', background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.2)', color: '#22d3ee' }}>{k}</span>
                ))}
              </div>

              <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => { useAgentOSStore.setState({ pendingGoal: selectedRecord.goal }); setPage('dashboard'); }}>
                <Zap size={14} /> Re-run This Mission
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
