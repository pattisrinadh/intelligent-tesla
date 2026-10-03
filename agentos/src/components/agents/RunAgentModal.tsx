import React, { useState } from 'react';
import type { CustomAgent, AgentExecution, ExecutionStep } from '../../types';
import { agentApi } from '../../lib/api';
import {
  X, Play, CheckCircle, AlertTriangle, Clock,
  Cpu, Copy, Check, Terminal, ArrowRight, RefreshCw, AlertCircle
} from 'lucide-react';

interface RunAgentModalProps {
  agent: CustomAgent;
  isOpen: boolean;
  onClose: () => void;
  onExecutionComplete?: (execution: AgentExecution) => void;
}

const SAMPLE_TASKS = [
  'Write a JavaScript function to reverse a string.',
  'Create a Python function that checks whether a number is prime.',
  'Write a TypeScript function to deeply merge two objects safely.',
  'Explain optimistic vs pessimistic locking with code examples.',
];

const TERMINATOR_TASKS = [
  'Terminate all running agents and abort active mission processes immediately.',
  'Emergency stop all runaway tasks, release system memory, and return swarm to ready state.',
  'Scan active agent processes, force-kill hung executions, and report freed resources.',
  'Audit swarm health, terminate rogue worker loops, and generate incident report.',
];

export const RunAgentModal: React.FC<RunAgentModalProps> = ({
  agent,
  isOpen,
  onClose,
  onExecutionComplete,
}) => {
  const isTerminator = agent.id === 'agent-terminator';
  const [task, setTask] = useState(
    isTerminator
      ? 'Terminate all running agents and abort active mission processes immediately.'
      : 'Write a JavaScript function to reverse a string.'
  );
  const [isRunning, setIsRunning] = useState(false);
  const [steps, setSteps] = useState<ExecutionStep[]>([]);
  const [currentStepMessage, setCurrentStepMessage] = useState<string | null>(null);
  const [execution, setExecution] = useState<AgentExecution | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);


  if (!isOpen) return null;

  const isDisabled = agent.status === 'OFFLINE';

  const handleRun = async () => {
    if (!task.trim()) {
      setError('Please provide a task or mission for the agent.');
      return;
    }
    if (isDisabled) {
      setError(`Agent '${agent.name}' is offline/disabled. Enable it in the registry first.`);
      return;
    }

    setIsRunning(true);
    setExecution(null);
    setError(null);
    setSteps([]);
    setCurrentStepMessage('Initiating agent execution pipeline...');

    try {
      const res = await agentApi.runAgent(agent.id, task.trim(), (step) => {
        setSteps(prev => [...prev, step]);
        setCurrentStepMessage(step.message);
      });

      setExecution(res);
      onExecutionComplete?.(res);
    } catch (err: any) {
      setError(err.message || 'Execution failed');
      setCurrentStepMessage(null);
    } finally {
      setIsRunning(false);
    }
  };

  const copyResult = () => {
    if (!execution?.result) return;
    navigator.clipboard.writeText(execution.result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
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
          maxWidth: '780px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-glow)',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 35px rgba(99, 102, 241, 0.25)',
          overflow: 'hidden',
          animation: 'fadeIn 0.2s ease',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(255, 255, 255, 0.02)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: '12px',
                background: `${agent.color || '#6366f1'}22`,
                border: `1px solid ${agent.color || '#6366f1'}44`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '22px',
              }}
            >
              {agent.avatar || '⚡'}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  Run {agent.name}
                </h2>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '100px',
                    background: isDisabled ? 'rgba(100,116,139,0.2)' : 'rgba(16, 185, 129, 0.15)',
                    color: isDisabled ? '#94a3b8' : '#10b981',
                    border: `1px solid ${isDisabled ? 'rgba(100,116,139,0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                  }}
                >
                  {agent.status}
                </span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {agent.role} · Model: <span style={{ color: '#818cf8', fontFamily: 'var(--font-mono)' }}>{agent.model}</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn btn-secondary"
            style={{ padding: '6px', borderRadius: '8px', color: 'var(--text-muted)' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div style={{ overflowY: 'auto', padding: '24px', flex: 1 }}>
          {isDisabled && (
            <div
              style={{
                marginBottom: '18px',
                padding: '12px 16px',
                borderRadius: '8px',
                background: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                color: '#fbbf24',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <AlertTriangle size={18} style={{ flexShrink: 0 }} />
              <span>This agent is currently disabled/offline. Enable it in Agent Registry to execute missions.</span>
            </div>
          )}

          {/* Task Input Box */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
              Task / Mission Description
            </label>
            <textarea
              rows={3}
              placeholder="Enter the task, requirement, or question for this agent..."
              value={task}
              disabled={isRunning}
              onChange={e => setTask(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '10px',
                background: 'var(--bg-glass)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
                fontSize: '13px',
                lineHeight: '1.5',
                outline: 'none',
                resize: 'vertical',
              }}
            />

            {/* Quick sample chips */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '10px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', alignSelf: 'center' }}>
                Try example:
              </span>
              {(isTerminator ? TERMINATOR_TASKS : SAMPLE_TASKS).map((st, i) => (
                <button
                  key={i}
                  type="button"
                  disabled={isRunning}
                  onClick={() => setTask(st)}
                  style={{
                    fontSize: '11px',
                    padding: '4px 10px',
                    borderRadius: '100px',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(99,102,241,0.5)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                >
                  {st.length > 38 ? st.slice(0, 38) + '…' : st}
                </button>
              ))}
            </div>
          </div>

          {/* Run Button */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Temperature: <span style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{agent.temperature ?? 0.7}</span> · Max tokens: <span style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{agent.maxTokens ?? 2048}</span>
            </div>
            <button
              onClick={handleRun}
              disabled={isRunning || isDisabled || !task.trim()}
              className="btn btn-primary"
              style={{
                padding: '10px 20px',
                fontSize: '13px',
                fontWeight: 700,
                opacity: isDisabled || !task.trim() ? 0.5 : 1,
              }}
            >
              {isRunning ? (
                <>
                  <RefreshCw size={14} className="spin" />
                  <span>Executing LLM...</span>
                </>
              ) : (
                <>
                  <Play size={14} fill="currentColor" />
                  <span>Run Agent</span>
                </>
              )}
            </button>
          </div>

          {/* Live Execution Stepper (Real-time logs) */}
          {(isRunning || steps.length > 0 || error) && (
            <div
              style={{
                marginBottom: '20px',
                padding: '16px',
                borderRadius: '10px',
                background: 'rgba(0, 0, 0, 0.35)',
                border: '1px solid var(--border)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Terminal size={14} /> Live Execution Pipeline
                </span>
                {isRunning && (
                  <span style={{ fontSize: '11px', color: '#818cf8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span className="live-dot" /> Live
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {steps.map((st, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '13px',
                      color: st.message.startsWith('✓') ? '#10b981' : '#f0f2ff',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    <span>{st.message}</span>
                  </div>
                ))}

                {isRunning && currentStepMessage && !steps.some(s => s.message === currentStepMessage) && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '13px',
                      color: '#818cf8',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    <RefreshCw size={12} className="spin" />
                    <span>{currentStepMessage}</span>
                  </div>
                )}

                {error && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '8px',
                      fontSize: '13px',
                      color: '#ef4444',
                      fontFamily: 'var(--font-mono)',
                      background: 'rgba(239, 68, 68, 0.1)',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      marginTop: '4px',
                    }}
                  >
                    <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                    <span>✕ Execution Failed: {error}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Execution Result */}
          {execution && execution.status === 'SUCCESS' && (
            <div
              style={{
                borderRadius: '12px',
                background: 'rgba(15, 23, 42, 0.7)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                overflow: 'hidden',
                animation: 'fadeIn 0.25s ease',
              }}
            >
              {/* Result Meta Bar */}
              <div
                style={{
                  padding: '12px 16px',
                  background: 'rgba(16, 185, 129, 0.08)',
                  borderBottom: '1px solid rgba(16, 185, 129, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '10px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle size={16} color="#10b981" />
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#10b981' }}>
                    Agent Completed Successfully
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '12px', color: 'var(--text-muted)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={13} />
                    <strong style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                      {execution.duration ? (execution.duration / 1000).toFixed(2) + 's' : '-'}
                    </strong>
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Cpu size={13} />
                    <strong style={{ color: '#818cf8', fontFamily: 'var(--font-mono)' }}>
                      {execution.totalTokens} tokens
                    </strong>
                    <span style={{ fontSize: '10px' }}>({execution.inputTokens} in / {execution.outputTokens} out)</span>
                  </span>
                  <button
                    onClick={copyResult}
                    className="btn btn-secondary"
                    style={{ fontSize: '11px', padding: '4px 8px', gap: '4px' }}
                  >
                    {copied ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              {/* Output Content */}
              <div style={{ padding: '16px 20px', maxHeight: '350px', overflowY: 'auto' }}>
                <pre
                  style={{
                    margin: 0,
                    fontSize: '13px',
                    lineHeight: '1.6',
                    fontFamily: 'var(--font-mono)',
                    color: '#e2e8f0',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  {execution.result}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
