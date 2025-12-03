# LangChain and LangGraph TypeScript Project Setup

## Progress Tracking

- [x] Verify that the copilot-instructions.md file in the .github directory is created.
- [x] Clarify Project Requirements - Full-stack TypeScript with LangChain/LangGraph
- [x] Scaffold the Project - Created monorepo with frontend and backend workspaces
- [x] Customize the Project - Added LangChain routes, React UI components
- [x] Install Required Extensions - No additional extensions required
- [x] Compile the Project - Dependencies installed successfully
- [x] Create and Run Task - Use npm run dev to start both servers
- [x] Launch the Project - Ready to run with npm run dev
- [x] Ensure Documentation is Complete - README.md created with full instructions
- [x] MCP Tool Calling - Model Context Protocol integration complete

## Project Type
Full-stack TypeScript project with LangChain and LangGraph integration
- Frontend: React with Vite
- Backend: Node.js with Express
- Language: TypeScript
- AI Model: Google Gemini
- Tool Calling: MCP (Model Context Protocol) with 4 built-in tools

## MCP Tool Calling Features ✅

The application now supports dynamic tool calling via MCP:

### Available Tools
1. **get_current_time** - Get time in any timezone
2. **calculate** - Perform mathematical calculations
3. **search_web** - Search for information (simulated)
4. **get_weather** - Get weather data (simulated)

### Integration Points
- Backend: `backend/src/mcp/server.ts` - MCP server implementation
- Tools: `backend/src/tools/mcpTools.ts` - LangChain tool wrappers
- Routes: Chat and Graph routes support tool calling
- Frontend: Beautiful UI displaying tool calls with results

### Documentation
- **README_MCP_IMPLEMENTATION.md** - Complete implementation guide
- **MCP_TOOL_CALLING_GUIDE.md** - How to use and add new tools
- **README.md** - Updated with MCP information

## Setup Complete ✅

The project is ready to use! To get started:

1. Get your Google Gemini API key from: https://makersuite.google.com/app/apikey
2. Add your API key to `backend/.env` (GOOGLE_API_KEY)
3. Run `npm run dev` from the root directory
4. Access the application at http://localhost:3000

## Try Tool Calling

Open the application and try these prompts:
- "What time is it in Tokyo?"
- "Calculate 25 * 4 + 100"
- "What's the weather in London?"
- "What's 15 * 23 and what time is it in New York?"

The UI will show tool executions with arguments and results!
