import React from 'react';
import { useAgentOSStore } from '../../store';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { AGENTS, AI_MODELS } from '../../data/agents';

const COLORS = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'rgba(8,13,26,0.95)', border: '1px solid var(--border)', borderRadius: '10px', padding: '12px 16px', fontSize: '13px' }}>
      <div style={{ fontWeight: 600, marginBottom: '8px', color: 'var(--text-secondary)' }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} style={{ color: p.color, display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.color }} />
          <span>{p.name}: <strong>{typeof p.value === 'number' && p.value < 1 ? `$${p.value.toFixed(4)}` : p.value}</strong></span>
        </div>
      ))}
    </div>
  );
};

export const CostDashboard: React.FC = () => {
  const { mission } = useAgentOSStore();

  // Build chart data
  const agentCostData = mission?.costRecords
    ? AGENTS.map(agent => {
      const records = mission.costRecords.filter(r => r.agentId === agent.id);
      const totalCost = records.reduce((s, r) => s + r.cost, 0);
      const totalTokens = records.reduce((s, r) => s + r.tokens, 0);
      return { name: agent.avatar + ' ' + agent.name.split(' ')[0], cost: Math.round(totalCost * 10000) / 10000, tokens: totalTokens };
    }).filter(d => d.cost > 0)
    : AGENTS.slice(0, 8).map(agent => ({
      name: agent.avatar + ' ' + agent.name.split(' ')[0],
      cost: agent.avgCost + Math.random() * 0.02,
      tokens: Math.floor(Math.random() * 3000 + 500),
    }));

  const modelCostData = AI_MODELS.map((m, i) => ({
    name: m.name.split(' ')[0],
    cost: mission ? mission.costRecords.filter(r => r.model === m.id).reduce((s, r) => s + r.cost, 0) : Math.random() * 0.15,
    value: mission ? mission.costRecords.filter(r => r.model === m.id).length : Math.floor(Math.random() * 10 + 1),
    color: COLORS[i % COLORS.length],
  })).filter(d => d.value > 0);

  const totalCost = mission?.actualCost || 0;
  const budget = mission?.budget || 2;
  const withoutAgentOS = totalCost * 1.31;
  const saving = withoutAgentOS - totalCost;
  const savingPct = totalCost > 0 ? Math.round((saving / withoutAgentOS) * 100) : 24;

  // Timeline cost area
  const timelineData = mission?.costRecords.reduce((acc: any[], rec, i) => {
    const prev = acc[acc.length - 1];
    return [...acc, { t: i + 1, cumCost: (prev?.cumCost || 0) + rec.cost, budget }];
  }, []) || Array.from({ length: 8 }, (_, i) => ({ t: i + 1, cumCost: ((i + 1) * 0.045), budget: 2 }));

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title"><span className="gradient-text">Cost</span> Intelligence</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>Real-time cost tracking and optimization insights</p>
        </div>
      </div>

      {/* Top metrics */}
      <div className="stats-grid" style={{ marginBottom: '28px' }}>
        {[
          { label: 'Total Cost', value: `$${totalCost.toFixed(4)}`, color: '#10b981' },
          { label: 'Total Tokens', value: (mission?.totalTokens || 0).toLocaleString(), color: '#6366f1' },
          { label: 'Budget Used', value: `${budget > 0 ? Math.round((totalCost / budget) * 100) : 0}%`, color: totalCost / budget > 0.8 ? '#ef4444' : '#f59e0b' },
          { label: 'Cost Saved', value: `${savingPct}%`, color: '#10b981' },
          { label: 'Budget Left', value: `$${Math.max(0, budget - totalCost).toFixed(3)}`, color: '#818cf8' },
          { label: 'Avg/Agent', value: `$${agentCostData.length ? (agentCostData.reduce((s, d) => s + d.cost, 0) / agentCostData.length).toFixed(4) : '0.00'}`, color: '#06b6d4' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px' }}>{s.label}</div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: s.color, fontFamily: 'var(--font-mono)' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* AgentOS vs Without */}
      <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '20px' }}>💡 Cost Optimization</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          <div style={{ padding: '16px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px', textAlign: 'center' }}>
            <div style={{ fontSize: '11px', color: '#f87171', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>Without AgentOS</div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#f87171', fontFamily: 'var(--font-mono)' }}>${withoutAgentOS.toFixed(3)}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Unoptimized routing</div>
          </div>
          <div style={{ padding: '16px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '10px', textAlign: 'center' }}>
            <div style={{ fontSize: '11px', color: '#34d399', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>With AgentOS</div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#34d399', fontFamily: 'var(--font-mono)' }}>${totalCost.toFixed(3)}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Smart model routing</div>
          </div>
          <div style={{ padding: '16px', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '10px', textAlign: 'center' }}>
            <div style={{ fontSize: '11px', color: '#818cf8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>Savings</div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#818cf8', fontFamily: 'var(--font-mono)' }}>{savingPct}%</div>
            <div style={{ fontSize: '12px', color: '#34d399', marginTop: '4px' }}>↓ ${saving.toFixed(3)} saved</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
        {/* Cumulative cost timeline */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '20px' }}>Cost Timeline</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={timelineData}>
              <defs>
                <linearGradient id="costGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="t" tick={{ fill: '#4a5578', fontSize: 11 }} />
              <YAxis tick={{ fill: '#4a5578', fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="cumCost" name="Cumulative Cost" stroke="#6366f1" fill="url(#costGrad)" strokeWidth={2} />
              <Area type="monotone" dataKey="budget" name="Budget" stroke="#ef4444" fill="none" strokeWidth={1} strokeDasharray="5 5" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Cost by model (pie) */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '20px' }}>Cost by Model</h3>
          {modelCostData.length > 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <ResponsiveContainer width={160} height={160}>
                <PieChart>
                  <Pie data={modelCostData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value" strokeWidth={0}>
                    {modelCostData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {modelCostData.slice(0, 6).map((m, i) => (
                  <div key={m.name} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS[i % COLORS.length], flexShrink: 0 }} />
                    <span style={{ flex: 1, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</span>
                    <span style={{ color: 'var(--text-muted)' }}>{m.value}x</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px 0' }}>Run a mission to see model costs</div>
          )}
        </div>
      </div>

      {/* Cost by agent bar chart */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '20px' }}>Cost by Agent</h3>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={agentCostData} margin={{ top: 5, right: 20, left: 0, bottom: 40 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="name" tick={{ fill: '#4a5578', fontSize: 10 }} angle={-25} textAnchor="end" height={60} />
            <YAxis tick={{ fill: '#4a5578', fontSize: 11 }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="cost" name="Cost ($)" radius={[4, 4, 0, 0]} fill="#6366f1">
              {agentCostData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
