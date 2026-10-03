import React, { useState, useEffect } from 'react';
import { useAgentOSStore } from '../../store';
import { AGENTS, AI_MODELS } from '../../data/agents';
import type { CustomAgent, AgentExecution } from '../../types';
import { agentApi } from '../../lib/api';
import { CreateAgentModal } from './CreateAgentModal';
import { RunAgentModal } from './RunAgentModal';
import { AgentDetails } from './AgentDetails';
import {
  Search, Plus, Play, Settings, Copy, Power,
  Trash2, Eye, Bot, Sparkles, RefreshCw, CheckCircle,
  AlertTriangle, Clock, Layers, Cpu
} from 'lucide-react';

export const AgentRegistry: React.FC = () => {
  const { agents: systemAgents, killAllAgents } = useAgentOSStore();
  const [activeTab, setActiveTab] = useState<'workforce' | 'system'>('workforce');
  const [customAgents, setCustomAgents] = useState<CustomAgent[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'ready' | 'offline'>('all');
  const [killNotice, setKillNotice] = useState<string | null>(null);

  // Modals & Navigation state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<CustomAgent | null>(null);
  const [runningAgent, setRunningAgent] = useState<CustomAgent | null>(null);
  const [detailsAgentId, setDetailsAgentId] = useState<string | null>(null);

  // System agent inspect state
  const [selectedSystemAgent, setSelectedSystemAgent] = useState<string | null>(null);

  // Load custom agents from persistent backend database
  const loadCustomAgents = async () => {
    try {
      setLoading(true);
      const data = await agentApi.getAgents();
      setCustomAgents(data);
    } catch (err) {
      console.error('Failed to load custom agents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomAgents();
  }, []);

  const handleToggleStatus = async (agent: CustomAgent, e: React.MouseEvent) => {
    e.stopPropagation();
    const newStatus = agent.status === 'OFFLINE' ? 'READY' : 'OFFLINE';
    try {
      await agentApi.updateAgent(agent.id, { status: newStatus });
      loadCustomAgents();
    } catch (err) {
      console.error('Failed to toggle status:', err);
    }
  };

  const handleDuplicate = async (agent: CustomAgent, e: React.MouseEvent) => {
    e.stopPropagation();
    const duplicateId = `${agent.id}-copy-${Math.random().toString(36).substr(2, 4)}`;
    try {
      await agentApi.createAgent({
        id: duplicateId,
        name: `${agent.name} (Copy)`,
        role: agent.role,
        description: agent.description,
        systemPrompt: agent.systemPrompt,
        provider: agent.provider,
        model: agent.model,
        temperature: agent.temperature,
        maxTokens: agent.maxTokens,
        capabilities: [...agent.capabilities],
        status: 'READY',
      });
      loadCustomAgents();
    } catch (err) {
      console.error('Failed to duplicate agent:', err);
    }
  };

  const handleDelete = async (agent: CustomAgent, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete '${agent.name}'?`)) return;
    try {
      await agentApi.deleteAgent(agent.id);
      loadCustomAgents();
    } catch (err) {
      console.error('Failed to delete agent:', err);
    }
  };

  // If viewing detailed view of a specific custom agent
  if (detailsAgentId) {
    return (
      <AgentDetails
        agentId={detailsAgentId}
        onBack={() => {
          setDetailsAgentId(null);
          loadCustomAgents();
        }}
        onRunAgent={agent => setRunningAgent(agent)}
        onEditAgent={agent => {
          setEditingAgent(agent);
          setIsCreateOpen(true);
        }}
      />
    );
  }

  // Filter custom agents
  const filteredCustom = customAgents.filter(a => {
    const matchSearch =
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.role.toLowerCase().includes(search.toLowerCase()) ||
      (a.description || '').toLowerCase().includes(search.toLowerCase()) ||
      a.capabilities.some(c => c.toLowerCase().includes(search.toLowerCase()));

    const matchFilter =
      filterStatus === 'all' ||
      (filterStatus === 'ready' && a.status === 'READY') ||
      (filterStatus === 'offline' && a.status === 'OFFLINE');

    return matchSearch && matchFilter;
  });

  // Filter system agents
  const filteredSystem = systemAgents.filter(a => {
    return (
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.role.toLowerCase().includes(search.toLowerCase()) ||
      a.skills.some(s => s.toLowerCase().includes(search.toLowerCase()))
    );
  });

  const selectedSys = systemAgents.find(a => a.id === selectedSystemAgent);

  return (
    <div>
      {/* Page Header */}
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 className="page-title">
            <span className="gradient-text">Agent</span> Registry
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
            Create, configure and autonomously execute real AI agents with dedicated LLMs
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            onClick={async () => {
              if (!window.confirm('Emergency Kill Switch: Stop all running agent processes and abort active missions?')) return;
              const res = await killAllAgents();
              setKillNotice(`Terminated ${res.terminatedAgents.length} agents and ${res.terminatedExecutions.length} active executions. Swarm returned to READY.`);
              loadCustomAgents();
              setTimeout(() => setKillNotice(null), 6000);
            }}
            className="btn btn-secondary"
            title="Emergency Kill Switch: Abort all active agent tasks immediately"
            style={{
              padding: '10px 16px',
              fontSize: '13px',
              fontWeight: 700,
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              color: '#f87171',
              gap: '6px',
            }}
          >
            <span>☠️</span>
            <span>Kill All Running Agents</span>
          </button>

          <button
            onClick={() => {
              setEditingAgent(null);
              setIsCreateOpen(true);
            }}
            className="btn btn-primary"
            style={{
              padding: '10px 20px',
              fontSize: '14px',
              fontWeight: 700,
              boxShadow: '0 4px 20px rgba(99, 102, 241, 0.4)',
              gap: '8px',
            }}
          >
            <Plus size={18} />
            <span>Create Agent</span>
          </button>
        </div>
      </div>

      {/* Emergency Kill Notice Banner */}
      {killNotice && (
        <div style={{
          marginBottom: '20px', padding: '14px 18px',
          background: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid rgba(239, 68, 68, 0.4)',
          borderRadius: '10px',
          color: '#fca5a5',
          display: 'flex', alignItems: 'center', gap: '10px',
          animation: 'fadeIn 0.2s ease',
        }}>
          <span style={{ fontSize: '18px' }}>☠️</span>
          <span style={{ fontSize: '13px', fontWeight: 600 }}>{killNotice}</span>
        </div>
      )}


      {/* Navigation Tabs (Workforce vs System) */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setActiveTab('workforce')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: activeTab === 'workforce' ? 'rgba(99,102,241,0.2)' : 'transparent',
              color: activeTab === 'workforce' ? '#818cf8' : 'var(--text-secondary)',
              borderBottom: activeTab === 'workforce' ? '2px solid #6366f1' : 'none',
            }}
          >
            <Bot size={16} />
            <span>Autonomous Workforce ({customAgents.length})</span>
            <span style={{ fontSize: '10px', background: 'rgba(99,102,241,0.3)', padding: '2px 6px', borderRadius: '100px', color: '#818cf8' }}>
              REAL LLM
            </span>
          </button>

          <button
            onClick={() => setActiveTab('system')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: activeTab === 'system' ? 'rgba(99,102,241,0.2)' : 'transparent',
              color: activeTab === 'system' ? '#818cf8' : 'var(--text-secondary)',
              borderBottom: activeTab === 'system' ? '2px solid #6366f1' : 'none',
            }}
          >
            <Sparkles size={16} />
            <span>Mission Swarm Agents ({systemAgents.length})</span>
          </button>
        </div>

        <button
          onClick={loadCustomAgents}
          className="btn btn-secondary"
          style={{ padding: '6px 12px', fontSize: '12px', gap: '6px' }}
        >
          <RefreshCw size={13} className={loading ? 'spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            placeholder={activeTab === 'workforce' ? "Search workforce agents, roles, capabilities…" : "Search swarm agents, skills, roles…"}
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', padding: '10px 12px 10px 40px',
              background: 'var(--bg-glass)', border: '1px solid var(--border)',
              borderRadius: '10px', color: 'var(--text-primary)', fontSize: '14px', outline: 'none',
            }}
          />
        </div>

        {activeTab === 'workforce' && (
          <div style={{ display: 'flex', gap: '8px' }}>
            {(['all', 'ready', 'offline'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilterStatus(f)}
                className="btn btn-secondary"
                style={{
                  fontSize: '12px', padding: '8px 16px',
                  background: filterStatus === f ? 'rgba(99,102,241,0.2)' : 'var(--bg-glass)',
                  color: filterStatus === f ? '#818cf8' : 'var(--text-secondary)',
                  border: `1px solid ${filterStatus === f ? 'rgba(99,102,241,0.4)' : 'var(--border)'}`,
                }}
              >
                {f === 'all' ? 'All Status' : f.toUpperCase()}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* TAB 1: Real Custom Workforce Grid */}
      {activeTab === 'workforce' && (
        <div>
          {filteredCustom.length === 0 ? (
            <div
              className="glass-card"
              style={{
                padding: '48px',
                textAlign: 'center',
                background: 'rgba(15, 23, 42, 0.4)',
                border: '1px dashed var(--border)',
              }}
            >
              <Bot size={40} color="var(--text-muted)" style={{ margin: '0 auto 12px auto' }} />
              <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 6px 0' }}>
                No workforce agents found
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 20px 0' }}>
                Create your first specialized agent or adjust your search filter.
              </p>
              <button
                onClick={() => {
                  setEditingAgent(null);
                  setIsCreateOpen(true);
                }}
                className="btn btn-primary"
                style={{ margin: '0 auto', gap: '6px' }}
              >
                <Plus size={16} /> Create Agent
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
              {filteredCustom.map(agent => {
                const isOffline = agent.status === 'OFFLINE';
                const isTerminator = agent.id === 'agent-terminator';
                const successRate =
                  agent.totalRuns > 0
                    ? Math.round((agent.successfulRuns / agent.totalRuns) * 100)
                    : 100;

                return (
                  <div
                    key={agent.id}
                    className="glass-card"
                    style={{
                      padding: '20px',
                      display: 'flex',
                      flexDirection: 'column',
                      background: isTerminator ? 'rgba(239, 68, 68, 0.04)' : 'var(--bg-glass)',
                      border: isTerminator ? '1px solid rgba(239, 68, 68, 0.45)' : '1px solid var(--border)',
                      boxShadow: isTerminator ? '0 0 20px rgba(239, 68, 68, 0.15)' : 'none',
                      borderRadius: '14px',
                      transition: 'all 0.2s ease',
                      opacity: isOffline ? 0.75 : 1,
                    }}
                  >
                    {/* Top Row: Avatar, Name, Status */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '14px' }}>
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: '12px',
                          background: `${agent.color || '#6366f1'}22`,
                          border: `1px solid ${agent.color || '#6366f1'}44`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '22px',
                          flexShrink: 0,
                        }}
                      >
                        {agent.avatar || '🤖'}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', flexWrap: 'wrap' }}>
                          <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {agent.name}
                          </h3>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            {isTerminator && (
                              <span style={{ fontSize: '9px', fontWeight: 800, padding: '2px 6px', borderRadius: '4px', background: 'rgba(239, 68, 68, 0.2)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.4)' }}>
                                KILL SWITCH
                              </span>
                            )}
                            <span
                              style={{
                                fontSize: '10px',
                                fontWeight: 700,
                                padding: '2px 8px',
                                borderRadius: '100px',
                                background: isOffline ? 'rgba(100,116,139,0.2)' : 'rgba(16, 185, 129, 0.15)',
                                color: isOffline ? '#94a3b8' : '#10b981',
                                border: `1px solid ${isOffline ? 'rgba(100,116,139,0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                                flexShrink: 0,
                              }}
                            >
                              {agent.status}
                            </span>
                          </div>
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                          {agent.role}
                        </div>
                      </div>
                    </div>


                    {/* Description */}
                    <p
                      style={{
                        fontSize: '12px',
                        color: 'var(--text-secondary)',
                        lineHeight: '1.4',
                        margin: '0 0 14px 0',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        minHeight: '34px',
                      }}
                    >
                      {agent.description || 'No description provided.'}
                    </p>

                    {/* Model & Config Pill */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', padding: '6px 10px', background: 'rgba(0,0,0,0.25)', borderRadius: '8px', fontSize: '11px' }}>
                      <Cpu size={13} color="#818cf8" />
                      <span style={{ color: 'var(--text-muted)' }}>Model:</span>
                      <strong style={{ color: '#818cf8', fontFamily: 'var(--font-mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {agent.model}
                      </strong>
                    </div>

                    {/* Stats Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', marginBottom: '14px' }}>
                      <div style={{ padding: '6px', background: 'rgba(0,0,0,0.2)', borderRadius: '6px', textAlign: 'center' }}>
                        <div style={{ fontSize: '13px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                          {agent.totalRuns}
                        </div>
                        <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>Runs</div>
                      </div>
                      <div style={{ padding: '6px', background: 'rgba(0,0,0,0.2)', borderRadius: '6px', textAlign: 'center' }}>
                        <div style={{ fontSize: '13px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#10b981' }}>
                          {successRate}%
                        </div>
                        <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>Success</div>
                      </div>
                      <div style={{ padding: '6px', background: 'rgba(0,0,0,0.2)', borderRadius: '6px', textAlign: 'center' }}>
                        <div style={{ fontSize: '13px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#fbbf24' }}>
                          {agent.lastExecution ? new Date(agent.lastExecution).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Never'}
                        </div>
                        <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>Last Run</div>
                      </div>
                    </div>

                    {/* Capabilities Tags */}
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '16px', flex: 1, alignItems: 'flex-start' }}>
                      {agent.capabilities && agent.capabilities.slice(0, 3).map(cap => (
                        <span
                          key={cap}
                          style={{
                            fontSize: '10px',
                            padding: '3px 8px',
                            borderRadius: '100px',
                            background: 'rgba(99, 102, 241, 0.1)',
                            border: '1px solid rgba(99, 102, 241, 0.2)',
                            color: '#818cf8',
                            fontWeight: 600,
                          }}
                        >
                          {cap}
                        </span>
                      ))}
                      {agent.capabilities && agent.capabilities.length > 3 && (
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)', alignSelf: 'center' }}>
                          +{agent.capabilities.length - 3}
                        </span>
                      )}
                    </div>

                    {/* Card Actions Footer */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
                      <button
                        onClick={() => setRunningAgent(agent)}
                        disabled={isOffline}
                        className="btn btn-primary"
                        style={{
                          flex: 1,
                          padding: '6px 12px',
                          fontSize: '12px',
                          fontWeight: 700,
                          justifyContent: 'center',
                          gap: '6px',
                          opacity: isOffline ? 0.5 : 1,
                          background: isTerminator ? 'linear-gradient(135deg, #b91c1c, #ef4444)' : undefined,
                          border: isTerminator ? 'none' : undefined,
                          boxShadow: isTerminator ? '0 2px 10px rgba(239, 68, 68, 0.4)' : undefined,
                        }}
                      >
                        {isTerminator ? <span>☠️</span> : <Play size={12} fill="currentColor" />}
                        <span>{isTerminator ? 'Kill Protocol' : 'Run'}</span>
                      </button>


                      <button
                        onClick={() => setDetailsAgentId(agent.id)}
                        className="btn btn-secondary"
                        title="View Details & History"
                        style={{ padding: '6px', borderRadius: '8px' }}
                      >
                        <Eye size={14} />
                      </button>

                      <button
                        onClick={() => {
                          setEditingAgent(agent);
                          setIsCreateOpen(true);
                        }}
                        className="btn btn-secondary"
                        title="Edit Configuration"
                        style={{ padding: '6px', borderRadius: '8px' }}
                      >
                        <Settings size={14} />
                      </button>

                      <button
                        onClick={(e) => handleDuplicate(agent, e)}
                        className="btn btn-secondary"
                        title="Duplicate Agent"
                        style={{ padding: '6px', borderRadius: '8px' }}
                      >
                        <Copy size={14} />
                      </button>

                      <button
                        onClick={(e) => handleToggleStatus(agent, e)}
                        className="btn btn-secondary"
                        title={isOffline ? 'Enable Agent' : 'Disable Agent'}
                        style={{
                          padding: '6px',
                          borderRadius: '8px',
                          color: isOffline ? '#10b981' : 'var(--text-muted)',
                        }}
                      >
                        <Power size={14} />
                      </button>

                      <button
                        onClick={(e) => handleDelete(agent, e)}
                        className="btn btn-secondary"
                        title="Delete Agent"
                        style={{ padding: '6px', borderRadius: '8px', color: '#ef4444' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: System Swarm Agents (Preserved from existing UI) */}
      {activeTab === 'system' && (
        <div style={{ display: 'grid', gridTemplateColumns: selectedSystemAgent ? '1fr 380px' : '1fr', gap: '24px', alignItems: 'start' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {filteredSystem.map(agent => {
              const isSelected = selectedSystemAgent === agent.id;
              return (
                <div
                  key={agent.id}
                  className="glass-card"
                  onClick={() => setSelectedSystemAgent(isSelected ? null : agent.id)}
                  style={{
                    padding: '20px', cursor: 'pointer',
                    border: isSelected ? '1px solid rgba(99,102,241,0.5)' : '1px solid var(--border)',
                    background: isSelected ? 'rgba(99,102,241,0.08)' : 'var(--bg-glass)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: '12px',
                      background: `${agent.color}22`, border: `1px solid ${agent.color}44`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px',
                    }}>
                      {agent.avatar}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '14px', fontWeight: 700 }}>{agent.name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{agent.role}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{
                        width: 8, height: 8, borderRadius: '50%',
                        background: agent.healthStatus === 'healthy' ? '#10b981' : agent.healthStatus === 'busy' ? '#f59e0b' : '#ef4444',
                      }} />
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{agent.healthStatus}</span>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                    {[
                      { label: 'Success', value: `${agent.successRate}%`, color: '#10b981' },
                      { label: 'Avg Cost', value: `$${agent.avgCost.toFixed(2)}`, color: '#6366f1' },
                      { label: 'Avg Time', value: `${agent.avgExecutionTime}s`, color: '#f59e0b' },
                    ].map(s => (
                      <div key={s.label} style={{ textAlign: 'center', padding: '8px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: s.color, fontFamily: 'var(--font-mono)' }}>{s.value}</div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{s.label}</div>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {agent.skills.slice(0, 3).map(skill => (
                      <span key={skill} style={{
                        fontSize: '10px', padding: '3px 8px', borderRadius: '100px',
                        background: `${agent.color}15`, border: `1px solid ${agent.color}30`,
                        color: agent.color, fontWeight: 600,
                      }}>
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {selectedSys && (
            <div className="glass-card" style={{ padding: '24px', position: 'sticky', top: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <div style={{ fontSize: '36px' }}>{selectedSys.avatar}</div>
                <div>
                  <div style={{ fontSize: '18px', fontWeight: 700 }}>{selectedSys.name}</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{selectedSys.role}</div>
                </div>
              </div>

              <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '12px' }}>All Skills</div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '20px' }}>
                {selectedSys.skills.map(skill => (
                  <span key={skill} style={{
                    fontSize: '12px', padding: '4px 10px', borderRadius: '100px',
                    background: `${selectedSys.color}15`, border: `1px solid ${selectedSys.color}30`,
                    color: selectedSys.color, fontWeight: 600,
                  }}>
                    {skill}
                  </span>
                ))}
              </div>

              <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '12px' }}>Compatible Models</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {selectedSys.models.map(modelType => {
                  const model = AI_MODELS.find(m => m.type === modelType);
                  return model ? (
                    <div key={modelType} style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '10px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px',
                    }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: model.color, flexShrink: 0 }} />
                      <span style={{ fontSize: '13px', fontWeight: 600 }}>{model.name}</span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: 'auto' }}>{model.provider}</span>
                    </div>
                  ) : null;
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create / Edit Agent Modal */}
      <CreateAgentModal
        isOpen={isCreateOpen}
        onClose={() => {
          setIsCreateOpen(false);
          setEditingAgent(null);
        }}
        editingAgent={editingAgent}
        onSuccess={() => {
          loadCustomAgents();
        }}
      />

      {/* Live Run Agent Modal */}
      {runningAgent && (
        <RunAgentModal
          agent={runningAgent}
          isOpen={!!runningAgent}
          onClose={() => setRunningAgent(null)}
          onExecutionComplete={() => {
            loadCustomAgents();
          }}
        />
      )}
    </div>
  );
};
