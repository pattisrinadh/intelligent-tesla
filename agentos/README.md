# ⚡ AgentOS – Autonomous AI Agent Command Center

> Turn one complex request into an autonomous team of specialized AI agents.

![AgentOS](https://img.shields.io/badge/AgentOS-v1.0.0-6366f1?style=for-the-badge)
![Demo Mode](https://img.shields.io/badge/Demo%20Mode-Active-10b981?style=for-the-badge)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript)

---

## 🌟 What is AgentOS?

AgentOS is an intelligent command center where a user gives **one complex task in natural language**, and the system autonomously:

1. 🧠 **Understands** the user's goal
2. 🗂️ **Breaks it** into smaller subtasks
3. 👥 **Selects** specialized agents based on requirements
4. 📐 **Creates** an execution plan with dependency mapping
5. 🤖 **Routes** each task to the optimal AI model
6. ⚡ **Executes** agents in parallel where possible
7. 💬 **Enables** agent-to-agent communication
8. 🔄 **Automatically retries** failed tasks
9. 📊 **Monitors** tokens, cost, time, and success rate
10. 🚦 **Requests human approval** for sensitive operations
11. 📼 **Produces** a complete execution trace for replay

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone or navigate to the project
cd agentos

# Install dependencies
npm install

# Start development server
npm run dev
```

The app opens automatically at `http://localhost:5173`

### Environment Variables (Optional)

```bash
cp .env.example .env.local
# Edit .env.local with your settings
```

The app runs fully in **Demo Mode** without any API keys.

---

## 🎮 Demo Mode

AgentOS includes a complete simulation engine — no external APIs required.

**To run the demo mission:**
1. Click **"Run Demo Mission"** on the landing page or dashboard
2. Watch 11 agents execute autonomously
3. See real-time agent messages
4. Experience a simulated backend agent failure and recovery
5. Approve or reject the production deployment via the Human Gate
6. Replay the entire execution timeline

**Demo features:**
- ✅ Realistic token usage and cost generation
- ✅ Agent-to-agent communication simulation
- ✅ Random agent failure + automatic recovery
- ✅ Human approval gate for deployment
- ✅ Full execution timeline
- ✅ Cost optimization comparison

---

## 🏗️ Architecture

```
src/
├── components/
│   ├── landing/          # Landing page with animated agent graph
│   ├── layout/           # Sidebar + layout wrapper
│   ├── dashboard/        # Command center (mission input)
│   ├── mission/          # Mission control (workflow graph + messages)
│   ├── agents/           # Agent registry with skills + models
│   ├── cost/             # Cost intelligence dashboard
│   ├── health/           # Agent health monitoring
│   ├── replay/           # Mission replay timeline
│   └── approval/         # Human Gate approval overlay
├── hooks/
│   └── useMissionEngine.ts  # Autonomous execution engine
├── store/
│   └── index.ts          # Zustand state management
├── data/
│   └── agents.ts         # Agent registry + AI model catalog
└── types/
    └── index.ts          # TypeScript type definitions
```

---

## 🤖 Agent Registry

| Agent | Role | Specialization |
|-------|------|----------------|
| 🧠 Planner | Mission Architect | Task decomposition, workflow design |
| 🔍 Research | Intelligence Gatherer | Web search, fact verification |
| 🏗️ Architect | System Designer | Architecture, API design |
| 🎨 Frontend | UI Engineer | React, TypeScript, CSS |
| ⚙️ Backend | API Engineer | Python, Node.js, REST |
| 🗄️ Database | Data Architect | SQL, schema design |
| 🛡️ Security | Security Auditor | OWASP, vulnerability scanning |
| ✍️ Content | Content Creator | Copywriting, SEO |
| 🧪 Testing | QA Engineer | Unit/E2E testing |
| ✅ Review | Quality Controller | Code review, final approval |
| 🚀 Deploy | DevOps Engineer | Docker, CI/CD |
| 🖌️ UI/UX | Design Specialist | Wireframing, design systems |

---

## 🧠 AI Model Router

| Type | Models | Best For |
|------|--------|----------|
| ⚡ Fast | GPT-4o Mini, Claude Haiku | Simple tasks, high volume |
| ⚖️ Balanced | GPT-4o, Claude 3.5 Sonnet | General purpose |
| 🧮 Reasoning | o1 Preview, Claude Opus | Planning, complex analysis |
| 💻 Coding | GPT-4 Turbo, Claude Code | Code generation, debugging |
| 👁️ Vision | GPT-4o Vision | UI/UX, image analysis |

---

## 🔑 Key Features

### Dynamic Workflow Generation
Different mission types generate different workflows:
- **Website** → Planner → Research → UI/UX → Frontend → Content → Backend → Security → Testing → Review → Deploy
- **PDF Analysis** → Research → Database → Content → Review
- **API** → Planner → Architect → Database → Backend → Security → Testing → Review

### Human Gate Safety System
Before sensitive operations (deploy, delete, send), the system pauses and requires explicit human approval.

### Autonomous Recovery Engine
When an agent fails, the system automatically:
1. Retries with the same model
2. Switches to an alternate model
3. Routes to a backup agent
4. Continues the workflow

### Cost Intelligence
Real-time tracking with optimization comparison showing what the mission would cost without smart routing.

### Mission Replay
Complete chronological timeline of every agent action, with detailed input/output inspection for each step.

---

## 🎨 Design System

- **Theme:** Dark mode with glassmorphism panels
- **Colors:** Indigo/violet primary, cyan accents
- **Typography:** Inter + JetBrains Mono
- **Animations:** Framer Motion + CSS keyframes
- **Charts:** Recharts (Area, Bar, Pie, Radar)

---

## 📦 Tech Stack

| Category | Technology |
|----------|-----------|
| Frontend | React 18 + TypeScript |
| Build | Vite 5 |
| State | Zustand |
| Charts | Recharts |
| Icons | Lucide React |
| Animations | CSS Keyframes |

---

## 🗄️ Database Schema (Planned)

```sql
-- Core tables
users (id, email, name, created_at)
agents (id, name, role, skills, models, config)
missions (id, user_id, goal, status, budget, config)
tasks (id, mission_id, agent_id, status, input, output)
workflows (id, mission_id, nodes, edges)
executions (id, task_id, model, tokens, cost, duration)
agent_messages (id, from_agent, to_agent, content, timestamp)
approvals (id, mission_id, action, status, timestamp)
cost_records (id, mission_id, agent_id, model, tokens, cost)
telemetry (id, agent_id, cpu, memory, latency, timestamp)
```

---

## 🔧 Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
```

---

## 🏆 Hackathon Innovation

**The core innovation:** AgentOS doesn't just manage AI agents — it **autonomously plans, assembles, executes, optimizes, and monitors** an entire multi-agent workforce from a single natural language request.

Every step of the process is transparent and observable:
```
User Request → Autonomous Planning → Agent Selection → Model Routing
→ Parallel Execution → Agent Communication → Recovery → Human Approval
→ Cost Optimization → Final Result → Replay
```

---

## 📄 License

MIT License — Built for hackathon demonstration purposes.

---

*Built with ⚡ by AgentOS Team*
