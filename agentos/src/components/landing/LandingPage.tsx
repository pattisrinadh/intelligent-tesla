import React, { useEffect, useState } from 'react';
import { useAgentOSStore } from '../../store';
import { Zap, ArrowRight, Play, Shield, Brain, Cpu, GitBranch, DollarSign, CheckCircle } from 'lucide-react';

const agentNodes = [
  { id: 'planner', label: '🧠 Planner', x: 50, y: 15, color: '#6366f1' },
  { id: 'researcher', label: '🔍 Research', x: 20, y: 40, color: '#06b6d4' },
  { id: 'architect', label: '🏗️ Architect', x: 80, y: 40, color: '#8b5cf6' },
  { id: 'frontend', label: '🎨 Frontend', x: 10, y: 65, color: '#f59e0b' },
  { id: 'backend', label: '⚙️ Backend', x: 50, y: 65, color: '#10b981' },
  { id: 'database', label: '🗄️ Database', x: 85, y: 65, color: '#f97316' },
  { id: 'security', label: '🛡️ Security', x: 30, y: 87, color: '#ef4444' },
  { id: 'testing', label: '🧪 Testing', x: 70, y: 87, color: '#14b8a6' },
];

const features = [
  { icon: Brain, title: 'Autonomous Planning', desc: 'Zero manual configuration. AgentOS understands your goal and builds the optimal workflow automatically.' },
  { icon: GitBranch, title: 'Parallel Execution', desc: 'Agents run simultaneously where dependencies allow, cutting execution time by up to 60%.' },
  { icon: Shield, title: 'Human Gate Safety', desc: 'Sensitive operations pause for human approval before execution. Full control, always.' },
  { icon: Cpu, title: 'Smart Model Routing', desc: 'Each task gets the perfect AI model — fast, coding, reasoning, or vision — based on requirements.' },
  { icon: DollarSign, title: 'Cost Intelligence', desc: 'Real-time cost tracking per agent, model, and mission with optimization recommendations.' },
  { icon: CheckCircle, title: 'Auto Recovery', desc: 'Failed agents automatically retry, switch models, or hand off to backup agents seamlessly.' },
];

const AnimatedOrb: React.FC<{ delay?: number; size?: number; top?: string; left?: string; right?: string; color?: string }> = 
  ({ delay = 0, size = 400, top, left, right, color = '#6366f1' }) => (
  <div style={{
    position: 'absolute',
    width: size, height: size,
    borderRadius: '50%',
    background: `radial-gradient(circle, ${color}18 0%, transparent 70%)`,
    top, left, right,
    animation: `float ${4 + delay}s ease-in-out infinite`,
    animationDelay: `${delay}s`,
    pointerEvents: 'none',
  }} />
);

export const LandingPage: React.FC = () => {
  const { setPage, runDemoMission } = useAgentOSStore();
  const [activeNode, setActiveNode] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTick(t => t + 1);
      const nodes = agentNodes.map(n => n.id);
      setActiveNode(nodes[Math.floor(Math.random() * nodes.length)]);
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
      {/* Background orbs */}
      <AnimatedOrb size={600} top="-200px" left="-100px" color="#6366f1" delay={0} />
      <AnimatedOrb size={400} top="100px" right="-100px" color="#8b5cf6" delay={2} />
      <AnimatedOrb size={300} top="60%" left="30%" color="#06b6d4" delay={1} />

      {/* Hero */}
      <section style={{ 
        maxWidth: '1200px', margin: '0 auto', padding: '100px 40px 60px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
        position: 'relative', zIndex: 1,
      }}>
        {/* Badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          padding: '8px 20px', borderRadius: '100px',
          background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.3)',
          marginBottom: '32px', animation: 'fadeInUp 0.6s ease',
        }}>
          <div className="live-dot" />
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#818cf8' }}>
            Autonomous AI Agent Runtime · Demo Mode Active
          </span>
        </div>

        {/* Title */}
        <h1 style={{
          fontSize: 'clamp(52px, 8vw, 88px)',
          fontWeight: 900,
          letterSpacing: '-0.04em',
          lineHeight: 1.0,
          marginBottom: '24px',
          animation: 'fadeInUp 0.6s ease 0.1s both',
        }}>
          <span className="gradient-text">Agent</span>
          <span style={{ color: '#f0f2ff' }}>OS</span>
        </h1>

        <h2 style={{
          fontSize: 'clamp(20px, 3vw, 28px)',
          fontWeight: 600,
          color: '#8892b0',
          marginBottom: '16px',
          maxWidth: '700px',
          animation: 'fadeInUp 0.6s ease 0.2s both',
        }}>
          Build, orchestrate and optimize your AI workforce.
        </h2>

        <p style={{
          fontSize: '17px',
          color: '#4a5578',
          maxWidth: '560px',
          marginBottom: '48px',
          lineHeight: 1.7,
          animation: 'fadeInUp 0.6s ease 0.3s both',
        }}>
          Turn one complex request into an autonomous team of specialized AI agents. 
          No manual configuration. No pipeline setup. Just results.
        </p>

        {/* CTA Buttons */}
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center', animation: 'fadeInUp 0.6s ease 0.4s both' }}>
          <button
            id="btn-launch"
            className="btn btn-primary"
            onClick={() => setPage('dashboard')}
            style={{ fontSize: '16px', padding: '14px 32px' }}
          >
            <Zap size={18} />
            Launch Command Center
            <ArrowRight size={16} />
          </button>
          <button
            id="btn-demo"
            className="btn btn-secondary"
            onClick={() => { runDemoMission(); }}
            style={{ fontSize: '16px', padding: '14px 32px' }}
          >
            <Play size={18} />
            Run Demo Mission
          </button>
        </div>

        {/* Stats row */}
        <div style={{
          display: 'flex', gap: '48px', marginTop: '64px', flexWrap: 'wrap', justifyContent: 'center',
          animation: 'fadeInUp 0.6s ease 0.5s both',
        }}>
          {[
            { value: '12+', label: 'Specialized Agents' },
            { value: '5', label: 'AI Model Types' },
            { value: '∞', label: 'Parallel Tasks' },
            { value: '100%', label: 'Demo Ready' },
          ].map(stat => (
            <div key={stat.label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-0.02em', color: '#f0f2ff' }}>
                {stat.value}
              </div>
              <div style={{ fontSize: '13px', color: '#4a5578', fontWeight: 500 }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Animated Workflow Visualization */}
      <section style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 40px 80px', position: 'relative', zIndex: 1 }}>
        <div style={{
          background: 'rgba(10, 15, 30, 0.8)',
          border: '1px solid var(--border)',
          borderRadius: '24px',
          padding: '40px',
          backdropFilter: 'blur(20px)',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Top bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '32px' }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ef4444' }} />
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#f59e0b' }} />
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#10b981' }} />
            <div style={{ flex: 1, textAlign: 'center', fontSize: '13px', color: '#4a5578', fontFamily: 'var(--font-mono)' }}>
              AgentOS — Autonomous Execution Engine
            </div>
            <div className="badge badge-running">
              <div className="live-dot" style={{ width: 6, height: 6 }} />
              Live
            </div>
          </div>

          {/* Agent graph */}
          <div style={{ position: 'relative', height: '320px' }}>
            {/* Connection lines */}
            <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
              <line x1="50%" y1="15%" x2="20%" y2="40%" stroke="rgba(99,102,241,0.3)" strokeWidth="1" strokeDasharray="4,4" />
              <line x1="50%" y1="15%" x2="80%" y2="40%" stroke="rgba(99,102,241,0.3)" strokeWidth="1" strokeDasharray="4,4" />
              <line x1="20%" y1="40%" x2="10%" y2="65%" stroke="rgba(6,182,212,0.3)" strokeWidth="1" strokeDasharray="4,4" />
              <line x1="80%" y1="40%" x2="50%" y2="65%" stroke="rgba(139,92,246,0.3)" strokeWidth="1" strokeDasharray="4,4" />
              <line x1="80%" y1="40%" x2="85%" y2="65%" stroke="rgba(139,92,246,0.3)" strokeWidth="1" strokeDasharray="4,4" />
              <line x1="10%" y1="65%" x2="30%" y2="87%" stroke="rgba(239,68,68,0.3)" strokeWidth="1" strokeDasharray="4,4" />
              <line x1="50%" y1="65%" x2="70%" y2="87%" stroke="rgba(16,185,129,0.3)" strokeWidth="1" strokeDasharray="4,4" />
            </svg>

            {/* Nodes */}
            {agentNodes.map(node => {
              const isActive = activeNode === node.id;
              return (
                <div
                  key={node.id}
                  style={{
                    position: 'absolute',
                    left: `${node.x}%`,
                    top: `${node.y}%`,
                    transform: 'translate(-50%, -50%)',
                    padding: '8px 16px',
                    borderRadius: '10px',
                    background: isActive ? `${node.color}22` : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${isActive ? node.color : 'rgba(255,255,255,0.08)'}`,
                    fontSize: '12px',
                    fontWeight: 600,
                    color: isActive ? node.color : '#8892b0',
                    transition: 'all 0.4s ease',
                    whiteSpace: 'nowrap',
                    boxShadow: isActive ? `0 0 20px ${node.color}44` : 'none',
                  }}
                >
                  {node.label}
                  {isActive && (
                    <div style={{
                      position: 'absolute', top: -3, right: -3,
                      width: 8, height: 8, borderRadius: '50%',
                      background: node.color,
                      animation: 'pulse-ring 1.5s ease-out infinite',
                    }} />
                  )}
                </div>
              );
            })}

            {/* Mission input */}
            <div style={{
              position: 'absolute', bottom: '0', left: '50%', transform: 'translateX(-50%)',
              fontSize: '11px', color: '#4a5578', fontFamily: 'var(--font-mono)',
              whiteSpace: 'nowrap',
            }}>
              &gt; "Build a secure student management web application"
            </div>
          </div>

          {/* Bottom stats */}
          <div style={{ display: 'flex', gap: '16px', marginTop: '32px', paddingTop: '24px', borderTop: '1px solid var(--border)' }}>
            {[
              { label: 'Agents Active', value: `${tick % 5 + 4}`, color: '#6366f1' },
              { label: 'Tokens Used', value: `${(tick * 847 + 12400).toLocaleString()}`, color: '#06b6d4' },
              { label: 'Cost So Far', value: `$${((tick * 0.012 + 0.08)).toFixed(3)}`, color: '#10b981' },
              { label: 'Tasks Done', value: `${tick % 6 + 2}/11`, color: '#f59e0b' },
            ].map(s => (
              <div key={s.label} style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: '20px', fontWeight: 800, color: s.color, fontFamily: 'var(--font-mono)' }}>{s.value}</div>
                <div style={{ fontSize: '11px', color: '#4a5578' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 40px 100px', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <h2 style={{ fontSize: '40px', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '16px' }}>
            The <span className="gradient-text">autonomous</span> difference
          </h2>
          <p style={{ color: '#8892b0', fontSize: '17px', maxWidth: '500px', margin: '0 auto' }}>
            AgentOS doesn't just run agents — it thinks, plans, and manages an entire AI workforce for you.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
          {features.map((feat, i) => {
            const Icon = feat.icon;
            return (
              <div
                key={feat.title}
                className="glass-card"
                style={{ padding: '28px', animation: `fadeInUp 0.5s ease ${i * 0.08}s both` }}
              >
                <div style={{
                  width: 44, height: 44,
                  background: 'rgba(99, 102, 241, 0.15)',
                  border: '1px solid rgba(99, 102, 241, 0.3)',
                  borderRadius: '12px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: '16px',
                }}>
                  <Icon size={20} color="#818cf8" />
                </div>
                <h3 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '8px' }}>{feat.title}</h3>
                <p style={{ fontSize: '14px', color: '#8892b0', lineHeight: 1.6 }}>{feat.desc}</p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
