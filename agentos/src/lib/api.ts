import type { CustomAgent, AgentExecution, ExecutionStep } from '../types';

export const agentApi = {
  async getAgents(): Promise<CustomAgent[]> {
    const res = await fetch('/api/agents');
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to fetch agents' }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    const json = await res.json();
    return json.data;
  },

  async getAgent(id: string): Promise<CustomAgent> {
    const res = await fetch(`/api/agents/${encodeURIComponent(id)}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to fetch agent' }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    const json = await res.json();
    return json.data;
  },

  async createAgent(data: Partial<CustomAgent>): Promise<CustomAgent> {
    const res = await fetch('/api/agents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || `HTTP ${res.status}: Failed to create agent`);
    }
    return json.data;
  },

  async updateAgent(id: string, updates: Partial<CustomAgent>): Promise<CustomAgent> {
    const res = await fetch(`/api/agents/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || `HTTP ${res.status}: Failed to update agent`);
    }
    return json.data;
  },

  async deleteAgent(id: string): Promise<void> {
    const res = await fetch(`/api/agents/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || `HTTP ${res.status}: Failed to delete agent`);
    }
  },

  async killAllAgents(): Promise<{ success: boolean; message: string; data: { terminatedAgents: string[]; terminatedExecutions: string[] } }> {
    const res = await fetch('/api/agents/kill-all', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || `HTTP ${res.status}: Failed to kill running agents`);
    }
    return json;
  },


  async runAgent(
    id: string,
    task: string,
    onStep?: (step: ExecutionStep) => void
  ): Promise<AgentExecution> {
    const res = await fetch(`/api/agents/${encodeURIComponent(id)}/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
      },
      body: JSON.stringify({ task, stream: true }),
    });

    if (!res.ok && !res.headers.get('content-type')?.includes('text/event-stream')) {
      const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
      throw new Error(err.error || `Execution failed with HTTP ${res.status}`);
    }

    // Handle SSE streaming
    if (res.body && res.headers.get('content-type')?.includes('text/event-stream')) {
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let finalExecution: AgentExecution | null = null;
      let errorOccurred: string | null = null;

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n\n');
          buffer = lines.pop() || '';

          for (const block of lines) {
            if (!block.trim()) continue;
            let event = 'message';
            let dataStr = '';

            const blockLines = block.split('\n');
            for (const line of blockLines) {
              if (line.startsWith('event: ')) {
                event = line.slice(7).trim();
              } else if (line.startsWith('data: ')) {
                dataStr = line.slice(6).trim();
              }
            }

            if (!dataStr) continue;

            try {
              const data = JSON.parse(dataStr);
              if (event === 'step') {
                onStep?.(data);
              } else if (event === 'complete') {
                finalExecution = data.execution;
              } else if (event === 'error') {
                errorOccurred = data.error || 'Execution failed';
                finalExecution = data.execution;
              }
            } catch (err) {
              console.error('Failed to parse SSE data block:', err, dataStr);
            }
          }
        }
      } catch (streamErr: any) {
        throw new Error(streamErr.message || 'Stream connection error');
      }

      if (errorOccurred) {
        throw new Error(errorOccurred);
      }
      if (finalExecution) {
        return finalExecution;
      }
    }

    // Fallback JSON handling
    const json = await res.json();
    if (!json.success) {
      throw new Error(json.error || 'Execution failed');
    }
    return json.data;
  },

  async getExecutions(agentId?: string): Promise<AgentExecution[]> {
    const url = agentId ? `/api/agents/${encodeURIComponent(agentId)}/executions` : '/api/executions';
    const res = await fetch(url);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to fetch executions' }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    const json = await res.json();
    return json.data;
  },

  async getProviders(): Promise<any[]> {
    const res = await fetch('/api/providers');
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || [];
  },

  async planMission(
    goal: string,
    preferences?: any,
    budget?: number,
    maxAgents?: number,
    maxTime?: number
  ): Promise<any> {
    const res = await fetch('/api/missions/plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ goal, preferences, budget, maxAgents, maxTime }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Mission planning failed' }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    return res.json();
  },

  async executeMissionNode(
    missionGoal: string,
    agentId: string,
    nodeLabel: string,
    input?: string
  ): Promise<any> {
    const res = await fetch('/api/missions/node/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ missionGoal, agentId, nodeLabel, input }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Node execution failed' }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    return res.json();
  },
};

