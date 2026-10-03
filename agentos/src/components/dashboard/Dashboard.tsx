import React, { useState, useEffect } from 'react';
import { useAgentOSStore } from '../../store';
import { AGENTS } from '../../data/agents';
import { OptimizationPreferences } from './OptimizationPreferences';
import { Zap, Settings, Play, ChevronDown, AlertTriangle, FlaskConical, Database, TrendingUp } from 'lucide-react';

const EXAMPLE_PROMPTS = [
  'Build a secure student management web application',
  'Create a landing page for an AI cybersecurity startup',
  'Build a full-stack e-commerce platform with payment integration',
  'Analyze a PDF document and generate a comprehensive report',
  'Create a REST API for a social media analytics platform',
];

export const Dashboard: React.FC = () => {
  const { startMission, runDemoMission, mission, budgetGuard, setBudgetGuard, setPage, runSimulator, getSimilarMissions, missionMemory, pendingGoal, setPendingGoal, isSimulating, aiPlanningStatus } = useAgentOSStore();
  const [goal, setGoal] = useState(pendingGoal || '');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [maxBudget, setMaxBudget] = useState(budgetGuard.maxBudget);
  const [maxAgents, setMaxAgents] = useState(budgetGuard.maxAgents);
  const [maxTime, setMaxTime] = useState(budgetGuard.maxTime);

  // Sync pending goal from store (e.g. re-run from memory)
  useEffect(() => { if (pendingGoal) setGoal(pendingGoal); }, [pendingGoal]);

  const similar = goal.length > 10 ? getSimilarMissions(goal) : [];

  const handleSimulate = () => {
    if (!goal.trim()) return;
    setBudgetGuard({ maxBudget, maxAgents, maxTime });
    setPendingGoal(goal.trim());
    runSimulator(goal.trim());
  };

  const handleDirectRun = () => {
    if (!goal.trim()) return;
    setBudgetGuard({ maxBudget, maxAgents, maxTime });
    startMission(goal.trim(), maxBudget, maxAgents, maxTime);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <span className="gradient-text">Command</span> Center
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
            Describe your mission. AgentOS X plans, simulates, and executes autonomously.
          </p>
        </div>
        {mission && (
          <button className="btn btn-primary" onClick={() => setPage('mission')}>
            <Zap size={16} /> View Active Mission
          </button>
        )}
      </div>

      {/* Mission Memory suggestions */}
      {similar.length > 0 && (
        <div style={{ marginBottom: '16px', padding: '14px 20px', background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <TrendingUp size={16} color="#818cf8" />
          <span style={{ fontSize: '13px', color: '#818cf8', fontWeight: 600 }}>
            Mission Memory: {similar.length} similar past mission{similar.length > 1 ? 's' : ''} found
          </span>
          <div style={{ flex: 1, display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {similar.slice(0, 2).map(r => (
              <span key={r.id} style={{ fontSize: '11px', color: 'var(--text-muted)', padding: '2px 10px', background: 'rgba(0,0,0,0.2)', borderRadius: '100px' }}>
                ${r.totalCost.toFixed(3)} · {r.finalQualityScore}% quality
              </span>
            ))}
          </div>
          <button className="btn btn-secondary" style={{ fontSize: '11px', padding: '5px 12px' }} onClick={() => setPage('memory')}>
            <Database size={12} /> View Memory
          </button>
        </div>
      )}

      {/* Main input */}
      <div className="glass-card" style={{ padding: '32px', marginBottom: '20px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0 }}>
            Mission Objective
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 12px', background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '100px' }}>
            <span className="live-dot" style={{ width: '6px', height: '6px', background: '#10b981' }} />
            <span style={{ fontSize: '11px', color: '#818cf8', fontWeight: 700 }}>
              ChatGPT Autonomous Planning Engine
            </span>
          </div>
        </div>

        <textarea
          id="mission-input"
          value={goal}
          onChange={e => { setGoal(e.target.value); setPendingGoal(e.target.value); }}
          placeholder="Describe what you want to build or accomplish…&#10;&#10;Example: Build a secure student management web application with role-based access, attendance tracking, and grade management."
          style={{
            width: '100%', minHeight: '140px',
            background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)',
            borderRadius: '12px', padding: '16px', fontSize: '16px',
            color: 'var(--text-primary)', resize: 'vertical',
            fontFamily: 'Inter, sans-serif', lineHeight: 1.6,
            outline: 'none', transition: 'border-color 0.2s',
          }}
          onFocus={e => e.target.style.borderColor = 'rgba(99,102,241,0.6)'}
          onBlur={e => e.target.style.borderColor = 'var(--border)'}
        />

        {/* Live ChatGPT Planning Banner */}
        {isSimulating && (
          <div style={{
            marginTop: '16px', padding: '14px 18px',
            background: 'rgba(99, 102, 241, 0.12)',
            border: '1px solid rgba(99, 102, 241, 0.4)',
            borderRadius: '10px',
            display: 'flex', alignItems: 'center', gap: '12px',
            animation: 'fadeIn 0.2s ease',
          }}>
            <FlaskConical size={18} className="spin" color="#818cf8" />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#818cf8' }}>
                {aiPlanningStatus || 'ChatGPT Backend Planning Active...'}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Decomposing objective into specialized agents, calculating risk, and estimating multi-model strategies
              </div>
            </div>
          </div>
        )}

        {/* Example prompts */}
        <div style={{ marginTop: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', alignSelf: 'center' }}>Try:</span>
          {EXAMPLE_PROMPTS.slice(0, 3).map(p => (
            <button key={p} onClick={() => { setGoal(p); setPendingGoal(p); }}
              style={{ fontSize: '11px', padding: '4px 12px', borderRadius: '20px', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', color: '#818cf8', cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.2)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.1)'; }}
            >
              {p.length > 45 ? p.slice(0, 45) + '…' : p}
            </button>
          ))}
        </div>

        {/* Advanced settings */}
        <div style={{ marginTop: '20px' }}>
          <button className="btn btn-secondary" style={{ fontSize: '13px', padding: '8px 16px' }} onClick={() => setShowAdvanced(!showAdvanced)}>
            <Settings size={14} /> Budget Guard
            <ChevronDown size={14} style={{ transform: showAdvanced ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
          </button>
        </div>

        {showAdvanced && (
          <div style={{ marginTop: '16px', padding: '20px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', borderRadius: '12px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', animation: 'fadeInUp 0.3s ease' }}>
            {[
              { label: 'Max Budget (USD)', value: maxBudget, min: 0.1, max: 10, step: 0.1, format: (v: number) => `$${v.toFixed(1)}`, color: '#10b981', setter: setMaxBudget },
              { label: 'Max Agents', value: maxAgents, min: 1, max: 12, step: 1, format: (v: number) => `${v}`, color: '#818cf8', setter: setMaxAgents },
              { label: 'Max Time (seconds)', value: maxTime, min: 30, max: 600, step: 30, format: (v: number) => `${v}s`, color: '#f59e0b', setter: setMaxTime },
            ].map(s => (
              <div key={s.label}>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px', fontWeight: 600 }}>{s.label}</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input type="range" min={s.min} max={s.max} step={s.step} value={s.value}
                    onChange={e => s.setter(parseFloat(e.target.value) as any)}
                    style={{ flex: 1, accentColor: '#6366f1' }} />
                  <span style={{ fontSize: '14px', fontWeight: 700, color: s.color, minWidth: '50px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                    {s.format(s.value)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '24px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            id="btn-simulate"
            className="btn btn-primary"
            onClick={handleSimulate}
            disabled={!goal.trim() || isSimulating}
            style={{ fontSize: '15px', padding: '14px 28px', background: 'linear-gradient(135deg, #6366f1, #06b6d4)' }}
          >
            <FlaskConical size={18} className={isSimulating ? 'spin' : ''} />
            {isSimulating ? 'Planning with ChatGPT...' : 'Simulate Strategies'}
          </button>
          <button
            id="btn-run-direct"
            className="btn btn-secondary"
            onClick={handleDirectRun}
            disabled={!goal.trim() || isSimulating}
            style={{ padding: '14px 22px' }}
          >
            <Zap size={16} />
            Direct Execute
          </button>
          <button id="btn-run-demo" className="btn btn-secondary" onClick={() => runDemoMission()} style={{ padding: '14px 22px' }}>
            <Play size={16} /> Demo Mission
          </button>
        </div>

        <div style={{ marginTop: '12px', fontSize: '12px', color: 'var(--text-muted)' }}>
          💡 <strong>Simulate Strategies</strong> queries ChatGPT in the backend to architect 3 execution plans with cost/time tradeoffs before running.
        </div>
      </div>


      {/* Optimization Preferences */}
      <OptimizationPreferences />

      {/* Quick stats row */}
      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        {[
          { label: 'Available Agents', value: AGENTS.filter(a => a.status === 'idle').length, total: AGENTS.length, color: '#10b981' },
          { label: 'AI Models', value: 9, total: 9, color: '#6366f1' },
          { label: 'Mission Status', value: mission ? mission.status.toUpperCase() : 'STANDBY', color: mission ? '#f59e0b' : '#4a5578', isText: true },
          { label: 'Memory Records', value: missionMemory.length.toString(), color: '#06b6d4', isText: true },
        ].map(stat => (
          <div key={stat.label} className="stat-card">
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px' }}>{stat.label}</div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: stat.color, fontFamily: stat.isText ? 'Inter' : 'var(--font-mono)', letterSpacing: stat.isText ? '-0.01em' : '0' }}>
              {stat.isText ? stat.value : `${stat.value}`}
              {!stat.isText && (stat as any).total && <span style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: 400 }}>/{(stat as any).total}</span>}
            </div>
          </div>
        ))}
      </div>

      {/* Agent registry preview */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Agent Registry Preview</h3>
          <button className="btn btn-secondary" style={{ fontSize: '12px', padding: '6px 14px' }} onClick={() => setPage('agents')}>View All</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
          {AGENTS.slice(0, 6).map(agent => (
            <div key={agent.id} style={{ padding: '14px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ fontSize: '24px' }}>{agent.avatar}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{agent.name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: agent.healthStatus === 'healthy' ? '#10b981' : agent.healthStatus === 'busy' ? '#f59e0b' : '#ef4444' }} />
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{agent.successRate}% success</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mission in progress warning */}
      {mission && mission.status !== 'completed' && mission.status !== 'failed' && (
        <div style={{ marginTop: '16px', padding: '14px 20px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <AlertTriangle size={16} color="#f59e0b" />
          <span style={{ fontSize: '14px', color: '#fbbf24' }}>
            Mission in progress: <strong>"{mission.goal.slice(0, 60)}{mission.goal.length > 60 ? '…' : ''}"</strong>
          </span>
          <button className="btn btn-secondary" style={{ fontSize: '12px', padding: '6px 14px', marginLeft: 'auto' }} onClick={() => setPage('mission')}>
            View →
          </button>
        </div>
      )}
    </div>
  );
};
