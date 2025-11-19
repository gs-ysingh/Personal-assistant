# Quick Start Guide

## 🚀 Get Started in 3 Steps

### Step 1: Set up your Google Gemini API Key

1. Get your API key from: https://makersuite.google.com/app/apikey

2. Copy the example environment file:
   ```bash
   cp backend/.env.example backend/.env
   ```

3. Edit `backend/.env` and add your Google Gemini API key:
   ```env
   GOOGLE_API_KEY=your-gemini-api-key-here
   PORT=3001
   ```

### Step 2: Start the Application

Run both frontend and backend together:
```bash
npm run dev
```

This will start:
- ✅ Backend API at http://localhost:3001
- ✅ Frontend React app at http://localhost:3000

### Step 3: Open Your Browser

Navigate to: **http://localhost:3000**

## 🎯 What You Can Do

### Simple Chat Mode
- Ask questions and get AI responses using LangChain
- Direct interaction with Google's Gemini models

### Graph Workflow Mode
- Experience LangGraph's multi-step workflows
- See how complex AI tasks are broken down and executed

## 📝 Example Prompts

Try these in Simple Chat mode:
- "Explain TypeScript in simple terms"
- "Write a function to sort an array"
- "What is LangChain?"

Try these in Graph Workflow mode:
- Click "Multi-Step" with: "Plan a REST API for a todo app"
- The system will create a plan and execution strategy

## 🔧 Troubleshooting

**Problem:** "Cannot find Google API key" or API errors
- **Solution:** Make sure you created `backend/.env` with your Gemini API key from https://makersuite.google.com/app/apikey

**Problem:** "Port already in use"
- **Solution:** Stop other services on ports 3000/3001 or change ports in config

**Problem:** TypeScript errors in editor
- **Solution:** Run `npm install` again to ensure all types are installed

## 📚 Next Steps

- Read the full [README.md](README.md) for detailed documentation
- Explore `backend/src/routes/` to see LangChain and LangGraph examples
- Customize `frontend/src/App.tsx` to add your own features
- Check out the API endpoints at http://localhost:3001

Enjoy building with LangChain and LangGraph! 🦜
