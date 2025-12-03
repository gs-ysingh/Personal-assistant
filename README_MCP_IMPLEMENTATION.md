# MCP Tool Calling Implementation - Complete Guide

## Overview

Your Personal Assistant application now includes **Model Context Protocol (MCP)** integration with tool calling capabilities. The AI assistant can now use tools like calculators, time queries, web search, and weather information dynamically during conversations.

## What Was Implemented

### 1. MCP Server (`backend/src/mcp/server.ts`)
- Complete MCP server implementation following the protocol specification
- Four pre-built tools:
  - **get_current_time**: Get time in any timezone
  - **calculate**: Perform mathematical calculations
  - **search_web**: Search the web (simulated)
  - **get_weather**: Get weather information (simulated)
- Tool execution handlers with error handling
- Export functions for direct tool calling

### 2. LangChain Integration (`backend/src/tools/mcpTools.ts`)
- Converts MCP tools to LangChain `DynamicStructuredTool` format
- Type-safe implementation with proper TypeScript types
- Zod schema validation for tool inputs
- Ready-to-use with Google Gemini and other LangChain models

### 3. Enhanced API Routes
Both chat and graph routes now support tool calling:

#### Chat Routes (`backend/src/routes/chat.ts`)
- **POST `/api/chat`**: Non-streaming with tool support
- **POST `/api/chat/stream`**: Streaming with real-time tool execution

#### Graph Routes (`backend/src/routes/graph.ts`)
- **POST `/api/graph/stream`**: Streaming workflow with tools
- **POST `/api/graph/workflow`**: Simple workflow with tools
- **POST `/api/graph/multi-step`**: Multi-step planning with tools

### 4. Frontend Enhancements (`frontend/src/App.tsx` & `App.css`)
- Beautiful UI for displaying tool calls
- Shows tool name, arguments, and results
- Real-time streaming of tool execution
- Color-coded tool call boxes with distinct styling

## Quick Start

### 1. Install Dependencies (Already Done)
```bash
cd backend
npm install @modelcontextprotocol/sdk --legacy-peer-deps
```

### 2. Start the Application
```bash
npm run dev
```

### 3. Try Tool Calling
Open http://localhost:3000 and try these prompts:

**Time Queries:**
- "What time is it?"
- "What's the current time in Tokyo?"
- "Tell me the time in America/New_York timezone"

**Calculations:**
- "Calculate 25 * 4 + 100"
- "What's 1234 divided by 5?"
- "Compute (50 + 30) * 2"

**Weather (Simulated):**
- "What's the weather in London?"
- "Tell me the weather forecast for Paris"

**Search (Simulated):**
- "Search for TypeScript tutorials"
- "Look up information about LangChain"

**Combined Queries:**
- "What time is it in New York and what's 15 * 23?"
- "Calculate 100 / 4 and tell me the weather in Tokyo"

## Architecture

```
User Message
    ↓
Frontend (React)
    ↓
Backend API Routes (Express)
    ↓
LangChain + Google Gemini Model
    ↓
[Model decides to use tools]
    ↓
MCP Tools Layer
    ↓
MCP Server (Tool Execution)
    ↓
Tool Results → Model → Final Response
    ↓
Frontend (Display with Tool Cards)
```

## How It Works

1. **User sends a message** to the chat or graph endpoint
2. **Model analyzes** the message and determines if tools are needed
3. **Tool binding**: The model is bound with available MCP tools
4. **Tool invocation**: If needed, model returns tool calls with arguments
5. **Tool execution**: Backend executes the requested tools via MCP
6. **Result integration**: Tool results are sent back to the model
7. **Final response**: Model generates a response incorporating tool results
8. **UI display**: Frontend shows both tool calls and final response

## File Structure

```
backend/
├── src/
│   ├── mcp/
│   │   └── server.ts           # MCP server with tool definitions
│   ├── tools/
│   │   └── mcpTools.ts         # LangChain tool wrappers
│   └── routes/
│       ├── chat.ts             # Chat routes with tool support
│       └── graph.ts            # Graph routes with tool support

frontend/
└── src/
    ├── App.tsx                 # UI with tool call display
    └── App.css                 # Styling for tool cards
```

## Adding New Tools

To add a new tool, edit `backend/src/mcp/server.ts`:

### Step 1: Define the tool schema
```typescript
{
  name: 'translate_text',
  description: 'Translate text to another language',
  inputSchema: {
    type: 'object',
    properties: {
      text: {
        type: 'string',
        description: 'Text to translate',
      },
      target_language: {
        type: 'string',
        description: 'Target language code (e.g., "es", "fr", "de")',
      },
    },
    required: ['text', 'target_language'],
  },
}
```

### Step 2: Implement the handler
```typescript
async function handleTranslateText(args: any): Promise<string> {
  const { text, target_language } = args;
  // Your translation logic here
  return `Translated text: ${text} to ${target_language}`;
}
```

### Step 3: Add to executeToolCall
```typescript
case 'translate_text':
  return await handleTranslateText(args);
```

### Step 4: Add to mcpTools.ts
```typescript
const translateTextTool = new DynamicStructuredTool({
  name: 'translate_text',
  description: 'Translate text to another language',
  schema: z.object({
    text: z.string().describe('Text to translate'),
    target_language: z.string().describe('Target language code'),
  }),
  func: async (input) => {
    return await executeToolCall('translate_text', input);
  },
});

// Add to export array
export const mcpTools: DynamicStructuredTool[] = [
  getCurrentTimeTool,
  calculateTool,
  searchWebTool,
  getWeatherTool,
  translateTextTool, // Add here
];
```

## Testing

### Manual Testing
1. Start the dev server: `npm run dev`
2. Open http://localhost:3000
3. Try the example prompts above
4. Watch for tool call cards in the UI

### Type Checking
```bash
cd backend
npm run type-check
```

### Build Production
```bash
npm run build
```

## Production Considerations

### 1. Replace Simulated Tools
The current implementation includes simulated tools for demonstration. For production:

- **Weather**: Integrate OpenWeatherMap, WeatherAPI, etc.
- **Search**: Use Google Custom Search, Bing API, etc.
- **Add Authentication**: API keys, rate limiting, user quotas

### 2. Error Handling
- Add retry logic for failed tool calls
- Implement timeouts for long-running tools
- Better error messages for users

### 3. Security
- Validate all tool inputs
- Sanitize mathematical expressions (use mathjs library)
- Rate limit tool usage per user
- Add logging and monitoring

### 4. Performance
- Cache tool results when appropriate
- Implement concurrent tool execution for multiple tools
- Add tool execution metrics

## Troubleshooting

### Tools Not Being Called
- Ensure model has tools bound: `model.bind({ tools: mcpTools })`
- Check system message mentions available tools
- Review backend logs for tool execution errors

### Tool Results Not Displaying
- Check browser console for errors
- Verify SSE stream is receiving `type: 'tool_call'` events
- Inspect CSS styles for `.tool-calls` class

### TypeScript Errors
- Run `npm run type-check` in backend
- Ensure all tools are properly typed
- Check that mcpTools array has correct type annotation

## Dependencies

```json
{
  "@modelcontextprotocol/sdk": "^latest",
  "@langchain/core": "^0.3.0",
  "@langchain/google-genai": "^0.1.0",
  "zod": "^3.22.4"
}
```

## API Response Format

### With Tool Calls
```json
{
  "response": "The current time in Tokyo is 3:45 PM JST, and 25 * 4 equals 100.",
  "toolCalls": [
    {
      "name": "get_current_time",
      "args": { "timezone": "Asia/Tokyo" },
      "result": "November 20, 2025, 3:45:00 PM JST"
    },
    {
      "name": "calculate",
      "args": { "expression": "25 * 4" },
      "result": "Result: 100"
    }
  ],
  "timestamp": "2025-11-20T06:45:00.000Z"
}
```

## Streaming Events

Tool calls are streamed as special events:

```javascript
data: {"type":"tool_call","name":"calculate","args":{"expression":"2+2"},"result":"Result: 4"}

data: {"content":"Based on the calculation, "}
data: {"content":"2 + 2 equals 4."}
data: [DONE]
```

## Summary

✅ MCP server with 4 tools implemented
✅ LangChain integration complete
✅ Tool calling in chat routes (streaming + non-streaming)
✅ Tool calling in graph routes (all endpoints)
✅ Beautiful UI for tool call display
✅ Type-safe TypeScript implementation
✅ Full documentation and examples
✅ Ready for production deployment (after adding real APIs)

The implementation is complete and ready to use! Try it out with the example prompts above.
