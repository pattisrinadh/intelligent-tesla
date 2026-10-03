import React from 'react';
import type { ApprovalRequest } from '../../types';
import { useAgentOSStore } from '../../store';
import { AlertTriangle, CheckCircle, XCircle, Edit3, Shield } from 'lucide-react';

interface ApprovalGateProps {
  approval: ApprovalRequest;
}

const riskColors = {
  low: '#10b981',
  medium: '#f59e0b',
  high: '#ef4444',
  critical: '#dc2626',
};

export const ApprovalGate: React.FC<ApprovalGateProps> = ({ approval }) => {
  const { approveMission, rejectMission, modifyApproval } = useAgentOSStore();

  return (
    <div className="approval-gate">
      <div className="approval-card" style={{ animation: 'fadeInUp 0.4s ease' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '28px' }}>
          <div style={{
            width: 56, height: 56,
            background: 'rgba(245, 158, 11, 0.15)',
            border: '2px solid rgba(245, 158, 11, 0.4)',
            borderRadius: '16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'glow-pulse 2s ease-in-out infinite',
          }}>
            <Shield size={28} color="#f59e0b" />
          </div>
          <div>
            <div style={{ fontSize: '11px', color: '#f59e0b', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '4px' }}>
              ⚠ Human Gate — Approval Required
            </div>
            <div style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '-0.02em' }}>
              Sensitive Action Detected
            </div>
          </div>
        </div>

        {/* Action */}
        <div style={{
          padding: '20px',
          background: 'rgba(0,0,0,0.3)',
          border: '1px solid rgba(245, 158, 11, 0.2)',
          borderRadius: '12px',
          marginBottom: '20px',
        }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
            Requested Action
          </div>
          <div style={{ fontSize: '18px', fontWeight: 700, color: '#fbbf24', marginBottom: '12px' }}>
            {approval.action}
          </div>
          <div style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            {approval.description}
          </div>
        </div>

        {/* Risk + Impact */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '28px' }}>
          <div style={{ padding: '16px', background: 'rgba(0,0,0,0.2)', borderRadius: '10px' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 600, textTransform: 'uppercase' }}>Risk Level</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={16} color={riskColors[approval.risk]} />
              <span style={{ fontSize: '16px', fontWeight: 700, color: riskColors[approval.risk], textTransform: 'uppercase' }}>
                {approval.risk}
              </span>
            </div>
          </div>
          <div style={{ padding: '16px', background: 'rgba(0,0,0,0.2)', borderRadius: '10px' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 600, textTransform: 'uppercase' }}>Impact</div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              {approval.estimatedImpact}
            </div>
          </div>
        </div>

        {/* Workflow note */}
        <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '24px', padding: '12px', background: 'rgba(99,102,241,0.08)', borderRadius: '8px', border: '1px solid rgba(99,102,241,0.15)' }}>
          ℹ The entire workflow is paused and waiting for your decision. Agents cannot proceed without your approval.
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            id="btn-approve"
            className="btn btn-success"
            onClick={approveMission}
            style={{ flex: 1, padding: '14px' }}
          >
            <CheckCircle size={18} />
            Approve
          </button>
          <button
            id="btn-modify"
            className="btn btn-secondary"
            onClick={() => modifyApproval('User requested modification')}
            style={{ padding: '14px 20px' }}
          >
            <Edit3 size={18} />
            Modify
          </button>
          <button
            id="btn-reject"
            className="btn btn-danger"
            onClick={rejectMission}
            style={{ padding: '14px 20px' }}
          >
            <XCircle size={18} />
            Reject
          </button>
        </div>
      </div>
    </div>
  );
};
