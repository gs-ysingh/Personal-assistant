# LangChain + LangGraph Personal Assistant

A full-stack TypeScript application demonstrating LangChain and LangGraph integration with a React frontend and Node.js backend.

## 🏗️ Project Structure

```
Personal-assistant/
├── backend/                 # Node.js + Express + LangChain/LangGraph
│   ├── src/
│   │   ├── index.ts        # Express server entry point
│   │   └── routes/
│   │       ├── chat.ts     # Simple chat endpoints with LangChain
│   │       └── graph.ts    # LangGraph workflow endpoints
│   ├── package.json
│   └── tsconfig.json
├── frontend/               # React + TypeScript + Vite
│   ├── src/
│   │   ├── App.tsx        # Main application component
│   │   ├── App.css        # Application styles
│   │   ├── main.tsx       # React entry point
│   │   └── index.css      # Global styles
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
└── package.json           # Root workspace configuration
```

## 🚀 Features

### Backend
- **Express API Server** with TypeScript
- **LangChain Integration** for AI-powered chat
- **LangGraph Workflows** for multi-step AI operations
- **RESTful API Endpoints**:
  - `/api/chat` - Simple chat with LangChain
  - `/api/chat/stream` - Streaming chat responses
  - `/api/graph/workflow` - Single-step graph workflow
  - `/api/graph/multi-step` - Multi-step planning and execution

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Modern UI** with responsive design
- **Two Modes**:
  - Simple Chat: Direct LangChain conversations
  - Graph Workflow: Multi-step LangGraph operations

## 📋 Prerequisites

- **Node.js** 18 or higher
- **npm** or **yarn**
- **Google Gemini API Key** (required for LangChain)

## ⚙️ Setup Instructions

### 1. Install Dependencies

From the root directory:

```bash
npm install
```

This will install dependencies for both frontend and backend workspaces.

### 2. Configure Environment Variables

Create a `.env` file in the `backend` directory:

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` and add your Google Gemini API key:

```env
GOOGLE_API_KEY=your_google_gemini_api_key_here
PORT=3001
```

Get your API key from: https://makersuite.google.com/app/apikey

### 3. Run the Application

#### Option A: Run Both Frontend and Backend Together

```bash
npm run dev
```

This will start:
- Backend server at `http://localhost:3001`
- Frontend dev server at `http://localhost:3000`

#### Option B: Run Separately

**Start the backend:**
```bash
npm run dev:backend
```

**Start the frontend (in a new terminal):**
```bash
npm run dev:frontend
```

### 4. Access the Application

Open your browser and navigate to:
```
http://localhost:3000
```

## 🛠️ Available Scripts

### Root Level
- `npm run dev` - Run both frontend and backend concurrently
- `npm run dev:backend` - Run only backend
- `npm run dev:frontend` - Run only frontend
- `npm run build` - Build both frontend and backend
- `npm run start` - Start production backend server

### Backend
- `npm run dev --workspace=backend` - Start backend in development mode
- `npm run build --workspace=backend` - Build backend for production
- `npm run start --workspace=backend` - Start production backend

### Frontend
- `npm run dev --workspace=frontend` - Start frontend dev server
- `npm run build --workspace=frontend` - Build frontend for production
- `npm run preview --workspace=frontend` - Preview production build

## 📚 API Documentation

### Chat Endpoint
**POST** `/api/chat`

Request:
```json
{
  "message": "Hello, how are you?"
}
```

Response:
```json
{
  "response": "I'm doing well, thank you!",
  "timestamp": "2025-11-19T12:00:00.000Z"
}
```

### Graph Workflow Endpoint
**POST** `/api/graph/workflow`

Request:
```json
{
  "message": "Explain TypeScript"
}
```

Response:
```json
{
  "response": "TypeScript is a typed superset of JavaScript...",
  "messageCount": 2,
  "timestamp": "2025-11-19T12:00:00.000Z"
}
```

### Multi-Step Workflow Endpoint
**POST** `/api/graph/multi-step`

Request:
```json
{
  "task": "Plan a web application"
}
```

Response:
```json
{
  "plan": "1. Define requirements...",
  "execution": "Step 1: Start with...",
  "timestamp": "2025-11-19T12:00:00.000Z"
}
```

## 🔧 Technology Stack

### Backend
- **Node.js** & **Express** - Server framework
- **TypeScript** - Type-safe JavaScript
- **LangChain** - AI/LLM framework
- **LangGraph** - Workflow orchestration
- **Google Gemini** - LLM provider
- **tsx** - TypeScript execution

### Frontend
- **React 18** - UI library
- **TypeScript** - Type-safe JavaScript
- **Vite** - Build tool and dev server
- **Axios** - HTTP client
- **CSS3** - Styling

## 🎨 Customization

### Adding New LangChain Models

Edit `backend/src/routes/chat.ts` or `backend/src/routes/graph.ts` and modify the model configuration:

```typescript
const model = new ChatGoogleGenerativeAI({
  modelName: 'gemini-pro',  // Or 'gemini-pro-vision' for multimodal
  temperature: 0.7,
  apiKey: process.env.GOOGLE_API_KEY,
});
```

### Creating New Graph Workflows

Add new workflow definitions in `backend/src/routes/graph.ts`:

```typescript
const myWorkflow = new StateGraph<AgentState>({
  channels: { /* ... */ }
});

myWorkflow.addNode('step1', async (state) => { /* ... */ });
myWorkflow.addNode('step2', async (state) => { /* ... */ });

myWorkflow.addEdge('__start__', 'step1');
myWorkflow.addEdge('step1', 'step2');
myWorkflow.addEdge('step2', END);
```

## 🐛 Troubleshooting

### Port Already in Use
If ports 3000 or 3001 are already in use, you can change them:
- Frontend: Edit `frontend/vite.config.ts`
- Backend: Edit `backend/.env` (PORT variable)

### TypeScript Errors
Run type checking:
```bash
npm run type-check --workspace=backend
npm run type-check --workspace=frontend
```

### Missing Google API Key
Make sure you've created `backend/.env` with a valid Google Gemini API key. Get yours at https://makersuite.google.com/app/apikey

## 📝 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Feel free to submit issues and enhancement requests!

## 📖 Learn More

- [LangChain Documentation](https://js.langchain.com/docs/)
- [LangGraph Documentation](https://langchain-ai.github.io/langgraphjs/)
- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/)
