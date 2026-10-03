import React from 'react';
import { useAgentOSStore } from './store';
import { Layout } from './components/layout/Layout';
import { LandingPage } from './components/landing/LandingPage';
import { Dashboard } from './components/dashboard/Dashboard';
import { MissionControl } from './components/mission/MissionControl';
import { AgentRegistry } from './components/agents/AgentRegistry';
import { CostDashboard } from './components/cost/CostDashboard';
import { AgentHealth } from './components/health/AgentHealth';
import { MissionReplay } from './components/replay/MissionReplay';

function App() {
  const currentPage = useAgentOSStore(s => s.currentPage);

  if (currentPage === 'landing') {
    return <LandingPage />;
  }

  return (
    <Layout>
      {currentPage === 'dashboard' && <Dashboard />}
      {currentPage === 'mission' && <MissionControl />}
      {currentPage === 'agents' && <AgentRegistry />}
      {currentPage === 'cost' && <CostDashboard />}
      {currentPage === 'health' && <AgentHealth />}
      {currentPage === 'replay' && <MissionReplay />}
    </Layout>
  );
}

export default App;
