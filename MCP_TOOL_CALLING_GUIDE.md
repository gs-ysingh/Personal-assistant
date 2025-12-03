# MCP (Model Context Protocol) Tool Calling Guide

This guide explains how to use the MCP server integration with tool calling in your LangChain + LangGraph application.

## Overview

The application now supports MCP (Model Context Protocol) server integration, allowing the AI assistant to use various tools during conversations. Tools are executed dynamically based on the conversation context.

## Available Tools

### 1. **get_current_time**
Get the current date and time, optionally in a specific timezone.

**Example usage:**
- "What time is it?"
- "What's the current time in New York?"

**Parameters:**
- `timezone` (optional): Timezone name (e.g., "America/New_York", "Europe/London")

### 2. **calculate**
Perform mathematical calculations.

**Example usage:**
- "Calculate 25 * 4 + 100"
- "What's the square root of 144?"

**Parameters:**
- `expression` (required): Mathematical expression to evaluate

### 3. **search_web**
Search the web for information (currently simulated).

**Example usage:**
- "Search for information about TypeScript"
- "Look up the latest news on AI"

**Parameters:**
- `query` (required): Search query string

### 4. **get_weather**
Get weather information for a location (currently simulated).

**Example usage:**
- "What's the weather in London?"
- "Tell me the weather in Tokyo"

**Parameters:**
- `location` (required): City name or location

## How It Works

### Backend Architecture

1. **MCP Server** (`backend/src/mcp/server.ts`):
   - Defines available tools with their schemas
   - Implements tool execution handlers
   - Follows MCP protocol specifications

2. **LangChain Integration** (`backend/src/tools/mcpTools.ts`):
   - Converts MCP tools to LangChain DynamicStructuredTools
   - Handles schema conversion from JSON Schema to Zod
   - Provides easy integration with LangChain agents

3. **Route Handlers** (`backend/src/routes/chat.ts` and `graph.ts`):
   - Bind tools to the ChatGoogleGenerativeAI model
   - Detect when the model wants to use tools
   - Execute tools and provide results back to the model
   - Support both streaming and non-streaming responses

### Tool Execution Flow

1. User sends a message
2. The AI model analyzes the message and determines if tools are needed
3. If tools are required, the model returns tool calls with arguments
4. Backend executes the requested tools
5. Tool results are sent back to the model
6. Model generates a final response incorporating tool results
7. Response (including tool call information) is sent to the frontend

## API Endpoints

### Chat with Tool Support

**POST** `/api/chat`
- Non-streaming chat with tool calling
- Returns tool calls in the response

**POST** `/api/chat/stream`
- Streaming chat with tool calling
- Streams tool calls and final response via SSE

### Graph Workflow with Tool Support

**POST** `/api/graph/stream`
- Streaming graph workflow with tool calling

**POST** `/api/graph/workflow`
- Simple workflow with tool calling

**POST** `/api/graph/multi-step`
- Multi-step workflow with tool calling

## Frontend Display

The UI now displays tool calls in a special format showing:
- Tool name
- Arguments passed to the tool
- Result returned by the tool

## Adding New Tools

To add a new tool to the MCP server:

1. **Define the tool in `backend/src/mcp/server.ts`:**

```typescript
{
  name: 'your_tool_name',
  description: 'Description of what your tool does',
  inputSchema: {
    type: 'object',
    properties: {
      param1: {
        type: 'string',
        description: 'Description of parameter',
      },
    },
    required: ['param1'],
  },
}
```

2. **Implement the handler function:**

```typescript
async function handleYourTool(args: any): Promise<string> {
  const param1 = args.param1;
  // Implement your tool logic
  return `Result from your tool`;
}
```

3. **Add to the switch statement in `executeToolCall`:**

```typescript
case 'your_tool_name':
  return await handleYourTool(args);
```

4. **Rebuild and restart the server**

## Example Conversations

### Example 1: Time and Calculation
```
User: What time is it in Tokyo, and what's 25 * 4?
Assistant: [Uses get_current_time and calculate tools]
```

### Example 2: Weather Query
```
User: What's the weather like in Paris?
Assistant: [Uses get_weather tool]
```

### Example 3: Complex Query
```
User: Search for TypeScript tutorials and tell me the current time
Assistant: [Uses search_web and get_current_time tools]
```

## Testing Tool Calling

1. Start the application:
   ```bash
   npm run dev
   ```

2. Open http://localhost:3000

3. Try these example prompts:
   - "What time is it?"
   - "Calculate 15 * 23 + 47"
   - "What's the weather in London?"
   - "Search for LangChain documentation"
   - "What's 100 divided by 4, and what time is it in New York?"

## Production Considerations

The current implementation includes simulated tools for demonstration. For production:

1. **Replace simulated tools with real APIs:**
   - Integrate actual weather API (OpenWeatherMap, WeatherAPI, etc.)
   - Use real search API (Google Search, Bing, etc.)
   - Add authentication and rate limiting

2. **Add error handling:**
   - Handle API failures gracefully
   - Implement retry logic
   - Add timeout handling

3. **Enhance security:**
   - Validate all tool inputs
   - Sanitize mathematical expressions properly (use mathjs library)
   - Implement API key management
   - Add rate limiting per user

4. **Monitor tool usage:**
   - Log all tool calls
   - Track execution times
   - Monitor API costs

## Troubleshooting

### Tools not being called
- Check that the model has tools bound: `model.bind({ tools: mcpTools })`
- Verify system message mentions available tools
- Check console logs for errors during tool execution

### Tool results not displaying
- Verify frontend is handling `type: 'tool_call'` messages
- Check that CSS styles for `.tool-calls` are loaded
- Inspect network tab for SSE messages

### Tool execution errors
- Check tool handler implementation
- Verify input validation
- Review error messages in backend logs
