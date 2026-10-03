import React, { useState, useEffect } from 'react';
import type { CustomAgent, AgentExecution } from '../../types';
import { agentApi } from '../../lib/api';
import {
  ArrowLeft, Play, Clock, Cpu, CheckCircle,
  AlertTriangle, RefreshCw, Copy, Check, Terminal, X,
  Layers, Settings, Sparkles, Activity
} from 'lucide-react';

interface AgentDetailsProps {
  agentId: string;
  onBack: () => void;
  onRunAgent: (agent: CustomAgent) => void;
  onEditAgent: (agent: CustomAgent) => void;
}

export const AgentDetails: React.FC<AgentDetailsProps> = ({
  agentId,
  onBack,
  onRunAgent,
  onEditAgent,
}) => {
  const [agent, setAgent] = useState<CustomAgent | null>(null);
  const [executions, setExecutions] = useState<AgentExecution[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedExecution, setSelectedExecution] = useState<AgentExecution | null>(null);
  const [copied, setCopied] = useState(false);
  const [quickTask, setQuickTask] = useState('');
  const [isQuickRunning, setIsQuickRunning] = useState(false);
  const [quickError, setQuickError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [agentData, execData] = await Promise.all([
        agentApi.getAgent(agentId),
        agentApi.getExecutions(agentId),
      ]);
      setAgent(agentData);
      setExecutions(execData);
    } catch (err) {
      console.error('Failed to load agent details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [agentId]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px', gap: '12px' }}>
        <RefreshCw size={24} className="spin" color="#818cf8" />
        <span style={{ color: 'var(--text-secondary)' }}>Loading agent details...</span>
      </div>
    );
  }

  if (!agent) {
    return (
      <div style={{ padding: '32px', textAlign: 'center' }}>
        <p style={{ color: '#ef4444' }}>Agent not found</p>
        <button onClick={onBack} className="btn btn-secondary">
          <ArrowLeft size={16} /> Back to Registry
        </button>
      </div>
    );
  }

  const successRate =
    agent.totalRuns > 0
      ? Math.round((agent.successfulRuns / agent.totalRuns) * 100)
      : 100;

  const totalTokens = executions.reduce((acc, curr) => acc + (curr.totalTokens || 0), 0);
  const avgDuration =
    executions.length > 0
      ? Math.round(
          executions.reduce((acc, curr) => acc + (curr.duration || 0), 0) / executions.length
        )
      : 0;

  const handleQuickRun = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTask.trim()) return;

    setIsQuickRunning(true);
    setQuickError(null);
    try {
      const res = await agentApi.runAgent(agent.id, quickTask.trim());
      setSelectedExecution(res);
      setQuickTask('');
      loadData();
    } catch (err: any) {
      setQuickError(err.message || 'Execution failed');
    } finally {
      setIsQuickRunning(false);
    }
  };

  return (
    <div style={{ animation: 'fadeIn 0.2s ease' }}>
      {/* Top Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <button onClick={onBack} className="btn btn-secondary" style={{ gap: '8px' }}>
          <ArrowLeft size={16} /> Back to Agent Registry
        </button>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => onEditAgent(agent)} className="btn btn-secondary" style={{ gap: '6px' }}>
            <Settings size={14} /> Edit Configuration
          </button>
          <button
            onClick={() => onRunAgent(agent)}
            className="btn btn-primary"
            disabled={agent.status === 'OFFLINE'}
            style={{ gap: '6px' }}
          >
            <Play size={14} fill="currentColor" /> Run Agent
          </button>
        </div>
      </div>

      {/* Main Grid: Left Overview & Right History */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px', alignItems: 'start' }}>
        {/* Left Column: Profile, Instructions, Capabilities, Quick Run */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Header Card */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: '14px',
                  background: `${agent.color || '#6366f1'}22`,
                  border: `1px solid ${agent.color || '#6366f1'}44`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '28px',
                }}
              >
                {agent.avatar || '⚡'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <h1 style={{ fontSize: '22px', fontWeight: 800, margin: 0 }}>{agent.name}</h1>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '3px 10px',
                      borderRadius: '100px',
                      background: agent.status === 'OFFLINE' ? 'rgba(100,116,139,0.2)' : 'rgba(16, 185, 129, 0.15)',
                      color: agent.status === 'OFFLINE' ? '#94a3b8' : '#10b981',
                      border: `1px solid ${agent.status === 'OFFLINE' ? 'rgba(100,116,139,0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                    }}
                  >
                    {agent.status}
                  </span>
                </div>
                <div style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {agent.role} · ID: <code style={{ fontFamily: 'var(--font-mono)', color: '#818cf8' }}>{agent.id}</code>
                </div>
              </div>
            </div>

            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.5', margin: '0 0 16px 0' }}>
              {agent.description || 'No description provided.'}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', padding: '12px', background: 'rgba(0,0,0,0.25)', borderRadius: '10px' }}>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Model</div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#818cf8', fontFamily: 'var(--font-mono)' }}>{agent.model}</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Provider</div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>{agent.provider}</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Created</div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {new Date(agent.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>

          {/* System Prompt / Instructions */}
          <div className="glass-card" style={{ padding: '20px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Terminal size={14} /> System Instructions
            </div>
            <div
              style={{
                padding: '14px',
                borderRadius: '8px',
                background: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid var(--border)',
                fontSize: '13px',
                lineHeight: '1.6',
                fontFamily: 'var(--font-mono)',
                color: '#cbd5e1',
                whiteSpace: 'pre-wrap',
                maxHeight: '180px',
                overflowY: 'auto',
              }}
            >
              {agent.systemPrompt}
            </div>
          </div>

          {/* Capabilities */}
          <div className="glass-card" style={{ padding: '20px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Layers size={14} /> Enabled Capabilities
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {agent.capabilities && agent.capabilities.length > 0 ? (
                agent.capabilities.map(cap => (
                  <span
                    key={cap}
                    style={{
                      fontSize: '12px',
                      padding: '5px 12px',
                      borderRadius: '100px',
                      background: 'rgba(99, 102, 241, 0.15)',
                      border: '1px solid rgba(99, 102, 241, 0.3)',
                      color: '#818cf8',
                      fontWeight: 600,
                    }}
                  >
                    ✓ {cap}
                  </span>
                ))
              ) : (
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No explicit capabilities enabled</span>
              )}
            </div>
          </div>

          {/* Quick Run Box */}
          <div className="glass-card" style={{ padding: '20px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sparkles size={14} /> Quick Run Task
            </div>
            <form onSubmit={handleQuickRun}>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="text"
                  placeholder="Ask this agent to perform a task directly..."
                  value={quickTask}
                  onChange={e => setQuickTask(e.target.value)}
                  disabled={isQuickRunning || agent.status === 'OFFLINE'}
                  style={{
                    flex: 1,
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: 'var(--bg-glass)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                    outline: 'none',
                  }}
                />
                <button
                  type="submit"
                  disabled={isQuickRunning || agent.status === 'OFFLINE' || !quickTask.trim()}
                  className="btn btn-primary"
                  style={{ minWidth: '100px', justifyContent: 'center' }}
                >
                  {isQuickRunning ? <RefreshCw size={14} className="spin" /> : <Play size={14} fill="currentColor" />}
                  <span>{isQuickRunning ? 'Running' : 'Run'}</span>
                </button>
              </div>
              {quickError && (
                <div style={{ marginTop: '8px', fontSize: '12px', color: '#ef4444' }}>
                  ✕ {quickError}
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Right Column: Performance KPIs & Execution History */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Performance KPIs */}
          <div className="glass-card" style={{ padding: '20px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Activity size={14} /> Performance Metrics
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              <div style={{ padding: '12px', background: 'rgba(0,0,0,0.25)', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Total Runs</div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                  {agent.totalRuns}
                </div>
              </div>
              <div style={{ padding: '12px', background: 'rgba(0,0,0,0.25)', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Success Rate</div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#10b981', fontFamily: 'var(--font-mono)' }}>
                  {successRate}%
                </div>
              </div>
              <div style={{ padding: '12px', background: 'rgba(0,0,0,0.25)', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Failed Runs</div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: agent.failedRuns > 0 ? '#ef4444' : 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  {agent.failedRuns}
                </div>
              </div>
              <div style={{ padding: '12px', background: 'rgba(0,0,0,0.25)', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Avg Latency</div>
                <div style={{ fontSize: '16px', fontWeight: 800, color: '#fbbf24', fontFamily: 'var(--font-mono)' }}>
                  {avgDuration > 0 ? (avgDuration / 1000).toFixed(2) + 's' : '-'}
                </div>
              </div>
              <div style={{ padding: '12px', background: 'rgba(0,0,0,0.25)', borderRadius: '8px', textAlign: 'center', gridColumn: 'span 2' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Total Tokens Used</div>
                <div style={{ fontSize: '16px', fontWeight: 800, color: '#818cf8', fontFamily: 'var(--font-mono)' }}>
                  {totalTokens.toLocaleString()} tokens
                </div>
              </div>
            </div>
          </div>

          {/* Execution History Table */}
          <div className="glass-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={14} /> Execution History ({executions.length})
              </div>
              <button onClick={loadData} className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '11px' }}>
                <RefreshCw size={12} /> Refresh
              </button>
            </div>

            {executions.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                No executions recorded yet. Click <strong>Run Agent</strong> to execute a task.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '8px 6px' }}>Task</th>
                      <th style={{ padding: '8px 6px' }}>Status</th>
                      <th style={{ padding: '8px 6px' }}>Duration</th>
                      <th style={{ padding: '8px 6px' }}>Tokens</th>
                      <th style={{ padding: '8px 6px' }}>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {executions.map(exec => (
                      <tr
                        key={exec.executionId}
                        onClick={() => setSelectedExecution(exec)}
                        style={{
                          borderBottom: '1px solid rgba(255,255,255,0.04)',
                          cursor: 'pointer',
                          transition: 'background 0.15s ease',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(99,102,241,0.08)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <td style={{ padding: '10px 6px', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 600 }}>
                          {exec.task}
                        </td>
                        <td style={{ padding: '10px 6px' }}>
                          <span
                            style={{
                              fontSize: '10px',
                              fontWeight: 700,
                              padding: '2px 6px',
                              borderRadius: '4px',
                              background: exec.status === 'SUCCESS' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                              color: exec.status === 'SUCCESS' ? '#10b981' : '#f87171',
                            }}
                          >
                            {exec.status}
                          </span>
                        </td>
                        <td style={{ padding: '10px 6px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                          {exec.duration ? (exec.duration / 1000).toFixed(1) + 's' : '-'}
                        </td>
                        <td style={{ padding: '10px 6px', fontFamily: 'var(--font-mono)', color: '#818cf8' }}>
                          {exec.totalTokens || 0}
                        </td>
                        <td style={{ padding: '10px 6px', color: 'var(--text-muted)' }}>
                          {new Date(exec.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Execution Details Modal (when clicking on an execution) */}
      {selectedExecution && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(8px)',
            padding: '20px',
          }}
        >
          <div
            className="glass-card"
            style={{
              width: '100%',
              maxWidth: '720px',
              maxHeight: '85vh',
              display: 'flex',
              flexDirection: 'column',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-glow)',
              borderRadius: '16px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0 }}>
                  Execution Details
                </h3>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  ID: {selectedExecution.executionId}
                </span>
              </div>
              <button
                onClick={() => setSelectedExecution(null)}
                className="btn btn-secondary"
                style={{ padding: '6px' }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>
                  Task
                </div>
                <div style={{ padding: '10px 12px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', fontSize: '13px' }}>
                  {selectedExecution.task}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '16px' }}>
                <div style={{ padding: '8px', background: 'rgba(0,0,0,0.2)', borderRadius: '6px', textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Status</div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: selectedExecution.status === 'SUCCESS' ? '#10b981' : '#ef4444' }}>
                    {selectedExecution.status}
                  </div>
                </div>
                <div style={{ padding: '8px', background: 'rgba(0,0,0,0.2)', borderRadius: '6px', textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Model</div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#818cf8', fontFamily: 'var(--font-mono)' }}>
                    {selectedExecution.model}
                  </div>
                </div>
                <div style={{ padding: '8px', background: 'rgba(0,0,0,0.2)', borderRadius: '6px', textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Duration</div>
                  <div style={{ fontSize: '12px', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                    {selectedExecution.duration ? (selectedExecution.duration / 1000).toFixed(2) + 's' : '-'}
                  </div>
                </div>
                <div style={{ padding: '8px', background: 'rgba(0,0,0,0.2)', borderRadius: '6px', textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Tokens</div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#818cf8', fontFamily: 'var(--font-mono)' }}>
                    {selectedExecution.totalTokens || 0}
                  </div>
                </div>
              </div>

              {selectedExecution.error && (
                <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', color: '#f87171', fontSize: '13px', marginBottom: '16px' }}>
                  <strong>Error:</strong> {selectedExecution.error}
                </div>
              )}

              {selectedExecution.result && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                      LLM Output Result
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(selectedExecution.result || '');
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                      className="btn btn-secondary"
                      style={{ fontSize: '11px', padding: '3px 8px' }}
                    >
                      {copied ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                      <span>{copied ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <pre
                    style={{
                      margin: 0,
                      padding: '14px',
                      background: 'rgba(0,0,0,0.5)',
                      borderRadius: '8px',
                      fontSize: '12px',
                      lineHeight: '1.6',
                      fontFamily: 'var(--font-mono)',
                      color: '#e2e8f0',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      maxHeight: '300px',
                      overflowY: 'auto',
                    }}
                  >
                    {selectedExecution.result}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
