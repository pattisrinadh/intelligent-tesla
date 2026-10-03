import React, { useState } from 'react';
import { useAgentOSStore } from '../../store';
import { AGENTS } from '../../data/agents';
import type { MissionStrategy } from '../../types';
import { Zap, CheckCircle, Clock, DollarSign, Shield, Star, Play, BarChart2, Sliders, ArrowRight, Cpu } from 'lucide-react';

const riskColors = { low: '#10b981', medium: '#f59e0b', high: '#ef4444', critical: '#dc2626' };
const strategyColors = { A: '#6366f1', B: '#06b6d4', C: '#10b981' };

const RadarBar: React.FC<{ label: string; value: number; color: string }> = ({ label, value, color }) => (
  <div style={{ marginBottom: '8px' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
      <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
      <span style={{ fontFamily: 'var(--font-mono)', color }}>{value}%</span>
    </div>
    <div className="progress-bar">
      <div className="progress-fill" style={{ width: `${value}%`, background: `linear-gradient(90deg, ${color}99, ${color})`, transition: 'width 0.6s ease' }} />
    </div>
  </div>
);

const StrategyCard: React.FC<{
  strategy: MissionStrategy;
  isSelected: boolean;
  onSelect: () => void;
  onExecute: () => void;
}> = ({ strategy, isSelected, onSelect, onExecute }) => {
  const color = strategyColors[strategy.id];
  const qualityColor = strategy.qualityScore >= 93 ? '#10b981' : strategy.qualityScore >= 90 ? '#f59e0b' : '#ef4444';

  return (
    <div
      onClick={onSelect}
      style={{
        padding: '24px', borderRadius: '16px', cursor: 'pointer', transition: 'all 0.3s ease',
        background: isSelected ? `${color}12` : 'rgba(255,255,255,0.03)',
        border: `2px solid ${isSelected ? color : 'rgba(255,255,255,0.08)'}`,
        position: 'relative', overflow: 'hidden',
        boxShadow: isSelected ? `0 0 30px ${color}30` : 'none',
      }}
    >
      {/* Recommended badge */}
      {strategy.recommended && (
        <div style={{
          position: 'absolute', top: 12, right: 12,
          background: 'linear-gradient(135deg, #f59e0b, #d97706)',
          color: '#000', fontSize: '10px', fontWeight: 800,
          padding: '3px 10px', borderRadius: '100px', letterSpacing: '0.08em',
          display: 'flex', alignItems: 'center', gap: '4px',
        }}>
          <Star size={10} />
          RECOMMENDED
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <div style={{
          width: 40, height: 40, borderRadius: '10px',
          background: `${color}22`, border: `1px solid ${color}44`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '16px', fontWeight: 900, color, fontFamily: 'var(--font-mono)',
        }}>
          {strategy.id}
        </div>
        <div>
          <div style={{ fontSize: '17px', fontWeight: 700 }}>Strategy {strategy.id}</div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{strategy.label}</div>
        </div>
      </div>

      {/* Core metrics grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
        {[
          { icon: DollarSign, label: 'Est. Cost', value: `$${strategy.estimatedCost.toFixed(2)}`, color: '#10b981' },
          { icon: Clock, label: 'Est. Time', value: `${Math.floor(strategy.estimatedTime / 60)}m ${strategy.estimatedTime % 60}s`, color: '#f59e0b' },
          { icon: Cpu, label: 'Agents', value: `${strategy.agentCount}`, color },
          { icon: BarChart2, label: 'Quality', value: `${strategy.qualityScore}%`, color: qualityColor },
        ].map(m => {
          const Icon = m.icon;
          return (
            <div key={m.label} style={{ padding: '10px', background: 'rgba(0,0,0,0.25)', borderRadius: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <Icon size={12} color={m.color} />
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{m.label}</span>
              </div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: m.color, fontFamily: 'var(--font-mono)' }}>{m.value}</div>
            </div>
          );
        })}
      </div>

      {/* Risk + Parallel */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <div style={{ padding: '6px 12px', borderRadius: '100px', fontSize: '12px', fontWeight: 700, color: riskColors[strategy.riskLevel], background: `${riskColors[strategy.riskLevel]}15`, border: `1px solid ${riskColors[strategy.riskLevel]}30` }}>
          <Shield size={11} style={{ display: 'inline', marginRight: 4 }} />
          {strategy.riskLevel.toUpperCase()} RISK
        </div>
        <div style={{ padding: '6px 12px', borderRadius: '100px', fontSize: '12px', fontWeight: 600, color: '#818cf8', background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.2)' }}>
          ⚡ {strategy.parallelTasks} parallel tasks
        </div>
      </div>

      {/* Agent avatars */}
      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '14px' }}>
        {strategy.agents.map(agentId => {
          const agent = AGENTS.find(a => a.id === agentId);
          return (
            <div key={agentId} title={agent?.name} style={{
              width: 28, height: 28, borderRadius: '8px', fontSize: '14px',
              background: `${agent?.color || '#6366f1'}22`, border: `1px solid ${agent?.color || '#6366f1'}33`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {agent?.avatar}
            </div>
          );
        })}
      </div>

      {/* Models */}
      <div style={{ marginBottom: '14px' }}>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>Models</div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {strategy.models.map(m => (
            <span key={m} style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '100px', background: `${color}15`, border: `1px solid ${color}30`, color }}>
              {m}
            </span>
          ))}
        </div>
      </div>

      {/* Reasoning */}
      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.6, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '12px', marginBottom: '16px' }}>
        {strategy.reasoning}
      </div>

      {/* Execute button */}
      {isSelected && (
        <button
          id={`btn-execute-strategy-${strategy.id}`}
          className="btn btn-primary"
          onClick={e => { e.stopPropagation(); onExecute(); }}
          style={{ width: '100%', animation: 'fadeInUp 0.3s ease' }}
        >
          <Play size={16} />
          Execute Strategy {strategy.id}
          <ArrowRight size={14} />
        </button>
      )}
    </div>
  );
};

export const MissionSimulator: React.FC = () => {
  const { strategies, isSimulating, pendingGoal, executeStrategy, setPage, budgetGuard, strategies: strats } = useAgentOSStore();
  const [selectedId, setSelectedId] = useState<'A' | 'B' | 'C' | null>(null);
  const [budget] = useState(budgetGuard.maxBudget);
  const [maxTime] = useState(budgetGuard.maxTime);
  const [compareMode, setCompareMode] = useState(false);

  const recommended = strats.find(s => s.recommended);

  if (isSimulating) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '24px' }}>
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: 'rgba(99,102,241,0.15)', border: '2px solid rgba(99,102,241,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: 'glow-pulse 1.5s ease-in-out infinite',
        }}>
          <span style={{ fontSize: '36px' }}>🧪</span>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '22px', fontWeight: 700, marginBottom: '8px' }}>Simulating Strategies…</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Analyzing "{pendingGoal}" across multiple execution paths</div>
        </div>
        <div style={{ display: 'flex', gap: '24px', fontSize: '13px', color: 'var(--text-muted)' }}>
          {['Analyzing task graph', 'Profiling agent twins', 'Predicting costs', 'Scoring quality'].map((step, i) => (
            <div key={step} style={{ display: 'flex', alignItems: 'center', gap: '6px', animation: `fadeInUp 0.3s ease ${i * 0.15}s both` }}>
              <div className="live-dot" style={{ width: 6, height: 6 }} />
              {step}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!strategies.length) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px', gap: '16px' }}>
        <div style={{ fontSize: '48px' }}>🧪</div>
        <h2 style={{ fontSize: '24px', fontWeight: 700 }}>No Simulation Running</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Enter a mission in the Command Center to simulate strategies</p>
        <button className="btn btn-primary" onClick={() => setPage('dashboard')}>
          <Zap size={16} /> Go to Command Center
        </button>
      </div>
    );
  }

  const selectedStrategy = strategies.find(s => s.id === selectedId);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title"><span className="gradient-text">Mission</span> Simulator</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '4px', maxWidth: '600px', fontSize: '14px' }}>
            "{pendingGoal}"
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className="btn btn-secondary"
            style={{ fontSize: '12px', padding: '8px 16px', background: compareMode ? 'rgba(99,102,241,0.15)' : '', border: compareMode ? '1px solid rgba(99,102,241,0.4)' : '' }}
            onClick={() => setCompareMode(!compareMode)}
          >
            <BarChart2 size={14} /> Compare Mode
          </button>
          <button className="btn btn-secondary" style={{ fontSize: '12px', padding: '8px 16px' }} onClick={() => setPage('dashboard')}>
            <Sliders size={14} /> Adjust Preferences
          </button>
        </div>
      </div>

      {/* Recommendation banner */}
      {recommended && (
        <div style={{
          marginBottom: '24px', padding: '16px 24px',
          background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)',
          borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '16px',
        }}>
          <Star size={20} color="#f59e0b" />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#fbbf24', marginBottom: '4px' }}>
              AgentOS X Recommends: Strategy {recommended.id} — {recommended.label}
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Based on your optimization preferences: {recommended.agentCount} agents · ${recommended.estimatedCost.toFixed(2)} · {recommended.qualityScore}% quality
            </div>
          </div>
          <button
            className="btn btn-primary"
            style={{ fontSize: '13px', padding: '10px 20px', flexShrink: 0 }}
            onClick={() => executeStrategy(recommended, budget, maxTime)}
          >
            <Play size={14} /> Execute Recommended
          </button>
        </div>
      )}

      {/* Compare view */}
      {compareMode ? (
        <div className="glass-card" style={{ padding: '24px', marginBottom: '24px', overflowX: 'auto' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '20px' }}>Strategy Comparison</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--text-muted)', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase' }}>Metric</th>
                {strategies.map(s => (
                  <th key={s.id} style={{ textAlign: 'center', padding: '8px 12px', color: strategyColors[s.id], fontWeight: 700 }}>
                    Strategy {s.id} {s.recommended && '⭐'}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { metric: 'Agent Count', fn: (s: MissionStrategy) => `${s.agentCount}` },
                { metric: 'Estimated Cost', fn: (s: MissionStrategy) => `$${s.estimatedCost.toFixed(2)}` },
                { metric: 'Estimated Time', fn: (s: MissionStrategy) => `${Math.floor(s.estimatedTime/60)}m ${s.estimatedTime%60}s` },
                { metric: 'Quality Score', fn: (s: MissionStrategy) => `${s.qualityScore}%` },
                { metric: 'Risk Level', fn: (s: MissionStrategy) => s.riskLevel.toUpperCase() },
                { metric: 'Parallel Tasks', fn: (s: MissionStrategy) => `${s.parallelTasks}` },
                { metric: 'Tools Required', fn: (s: MissionStrategy) => `${s.tools.length}` },
              ].map((row, ri) => (
                <tr key={row.metric} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: ri % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent' }}>
                  <td style={{ padding: '10px 12px', color: 'var(--text-secondary)', fontWeight: 500 }}>{row.metric}</td>
                  {strategies.map(s => (
                    <td key={s.id} style={{ padding: '10px 12px', textAlign: 'center', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                      {row.fn(s)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {/* Strategy cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
        {strategies.map(s => (
          <StrategyCard
            key={s.id}
            strategy={s}
            isSelected={selectedId === s.id}
            onSelect={() => setSelectedId(s.id)}
            onExecute={() => executeStrategy(s, budget, maxTime)}
          />
        ))}
      </div>

      {/* Quick execute row */}
      {!selectedId && (
        <div style={{ marginTop: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
          Click any strategy card to select it, then execute — or click Execute Recommended above
        </div>
      )}
    </div>
  );
};
