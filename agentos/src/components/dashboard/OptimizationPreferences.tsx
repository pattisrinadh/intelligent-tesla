import React from 'react';
import { useAgentOSStore } from '../../store';
import { Zap, DollarSign, Star, Shield, Cpu } from 'lucide-react';

const prefConfig = [
  { key: 'quality' as const, label: 'Quality', icon: Star, color: '#818cf8', description: 'Uses stronger reasoning models, adds review agents' },
  { key: 'speed' as const, label: 'Speed', icon: Zap, color: '#f59e0b', description: 'Maximizes parallelism, chooses low-latency models' },
  { key: 'cost' as const, label: 'Cost', icon: DollarSign, color: '#10b981', description: 'Prefers cheaper models, trims redundant agents' },
  { key: 'safety' as const, label: 'Safety', icon: Shield, color: '#ef4444', description: 'Adds security agents, requires human approval' },
  { key: 'autonomy' as const, label: 'Autonomy', icon: Cpu, color: '#06b6d4', description: 'Minimizes human gates, enables self-healing' },
];

export const OptimizationPreferences: React.FC = () => {
  const { preferences, setPreferences } = useAgentOSStore();

  const topPriority = prefConfig.reduce((best, p) =>
    preferences[p.key] > preferences[best.key] ? p : best, prefConfig[0]);

  return (
    <div className="glass-card" style={{ padding: '24px', marginBottom: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '2px' }}>Mission Priorities</h3>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Influence strategy generation and agent/model selection</p>
        </div>
        <div style={{ fontSize: '11px', color: topPriority.color, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 12px', background: `${topPriority.color}15`, border: `1px solid ${topPriority.color}30`, borderRadius: '100px' }}>
          <topPriority.icon size={12} />
          Priority: {topPriority.label}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {prefConfig.map(({ key, label, icon: Icon, color, description }) => {
          const value = preferences[key];
          const blocks = Math.round(value / 10);
          return (
            <div key={key}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                <Icon size={14} color={color} />
                <span style={{ fontSize: '13px', fontWeight: 600, flex: 1 }}>{label}</span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', maxWidth: '200px', textAlign: 'right' }}>{description}</span>
                <span style={{ fontSize: '13px', fontWeight: 700, color, fontFamily: 'var(--font-mono)', minWidth: '36px', textAlign: 'right' }}>
                  {value}%
                </span>
              </div>
              <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
                {Array.from({ length: 10 }).map((_, i) => (
                  <div
                    key={i}
                    onClick={() => setPreferences({ [key]: (i + 1) * 10 })}
                    style={{
                      flex: 1, height: 6, borderRadius: '2px', cursor: 'pointer',
                      background: i < blocks ? color : 'rgba(255,255,255,0.08)',
                      transition: 'all 0.15s ease',
                      opacity: i < blocks ? 1 : 0.4,
                    }}
                    onMouseEnter={e => { e.currentTarget.style.opacity = '0.8'; }}
                    onMouseLeave={e => { e.currentTarget.style.opacity = i < blocks ? '1' : '0.4'; }}
                  />
                ))}
                <input
                  type="range" min={10} max={100} step={10}
                  value={value}
                  onChange={e => setPreferences({ [key]: parseInt(e.target.value) })}
                  style={{ width: '80px', accentColor: color, marginLeft: '8px' }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
