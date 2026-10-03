import React from 'react';
import { useAgentOSStore } from '../../store';
import {
  LayoutDashboard, Zap, Users, DollarSign,
  Activity, PlayCircle, ChevronRight
} from 'lucide-react';

const navItems = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'Command Center' },
  { id: 'mission', icon: Zap, label: 'Mission Control' },
  { id: 'agents', icon: Users, label: 'Agent Registry' },
  { id: 'cost', icon: DollarSign, label: 'Cost Intelligence' },
  { id: 'health', icon: Activity, label: 'Agent Health' },
  { id: 'replay', icon: PlayCircle, label: 'Mission Replay' },
] as const;

export const Sidebar: React.FC = () => {
  const { currentPage, setPage, mission } = useAgentOSStore();

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo" style={{ cursor: 'pointer' }} onClick={() => setPage('landing')}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: 36, height: 36,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            borderRadius: '10px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '18px', boxShadow: '0 4px 15px rgba(99,102,241,0.4)',
          }}>
            ⚡
          </div>
          <div>
            <div style={{ fontSize: '16px', fontWeight: 800, letterSpacing: '-0.02em', color: '#f0f2ff' }}>
              AgentOS
            </div>
            <div style={{ fontSize: '10px', color: '#4a5578', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Command Center
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        <div style={{ fontSize: '10px', color: '#4a5578', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '8px 12px', marginBottom: '4px' }}>
          Navigation
        </div>
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          const hasMission = item.id === 'mission' && mission;
          return (
            <button
              key={item.id}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setPage(item.id)}
              id={`nav-${item.id}`}
            >
              <Icon size={16} />
              <span style={{ flex: 1 }}>{item.label}</span>
              {hasMission && (
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', flexShrink: 0 }} />
              )}
              {isActive && <ChevronRight size={14} style={{ opacity: 0.5 }} />}
            </button>
          );
        })}
      </nav>

      {/* Demo mode badge */}
      <div style={{ padding: '16px', borderTop: '1px solid var(--border)' }}>
        <div style={{
          padding: '12px',
          background: 'rgba(99, 102, 241, 0.1)',
          border: '1px solid rgba(99, 102, 241, 0.2)',
          borderRadius: '10px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <div className="live-dot" />
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#818cf8', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Demo Mode
            </span>
          </div>
          <div style={{ fontSize: '11px', color: '#4a5578' }}>
            Fully simulated AI agents
          </div>
        </div>
      </div>
    </aside>
  );
};
