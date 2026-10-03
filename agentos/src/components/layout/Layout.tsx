import React from 'react';
import { Sidebar } from './Sidebar';
import { useMissionEngine } from '../../hooks/useMissionEngine';
import { ApprovalGate } from '../approval/ApprovalGate';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { pendingApproval } = useMissionEngine();

  return (
    <div className="main-layout grid-bg">
      <Sidebar />
      <main className="page-content">
        {children}
      </main>
      {pendingApproval && <ApprovalGate approval={pendingApproval} />}
    </div>
  );
};
