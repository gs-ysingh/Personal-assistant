import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';

// Define available tools
const tools: Tool[] = [
  {
    name: 'get_current_time',
    description: 'Get the current date and time',
    inputSchema: {
      type: 'object',
      properties: {
        timezone: {
          type: 'string',
          description: 'Timezone name (e.g., America/New_York, Europe/London)',
        },
      },
    },
  },
  {
    name: 'calculate',
    description: 'Perform mathematical calculations',
    inputSchema: {
      type: 'object',
      properties: {
        expression: {
          type: 'string',
          description: 'Mathematical expression to evaluate (e.g., "2 + 2", "sqrt(16)")',
        },
      },
      required: ['expression'],
    },
  },
  {
    name: 'search_web',
    description: 'Search the web for information (simulated)',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_weather',
    description: 'Get current weather information for a location (simulated)',
    inputSchema: {
      type: 'object',
      properties: {
        location: {
          type: 'string',
          description: 'City name or location',
        },
      },
      required: ['location'],
    },
  },
];

// Tool handler functions
async function handleGetCurrentTime(args: any): Promise<string> {
  const timezone = args.timezone || 'UTC';
  try {
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = {
      timeZone: timezone,
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short',
    };
    return now.toLocaleString('en-US', options);
  } catch (error) {
    return `Current time: ${new Date().toISOString()}`;
  }
}

async function handleCalculate(args: any): Promise<string> {
  const expression = args.expression;
  try {
    // Safe evaluation using Function constructor for basic math
    // In production, use a proper math expression parser like mathjs
    const sanitized = expression.replace(/[^0-9+\-*/().\s]/g, '');
    const result = Function(`'use strict'; return (${sanitized})`)();
    return `Result: ${result}`;
  } catch (error) {
    return `Error calculating expression: ${error}`;
  }
}

async function handleSearchWeb(args: any): Promise<string> {
  const query = args.query;
  // Simulated search results
  return `Search results for "${query}":
1. Wikipedia article about ${query}
2. Latest news on ${query}
3. ${query} - Official website
(This is a simulated search. In production, integrate with a real search API.)`;
}

async function handleGetWeather(args: any): Promise<string> {
  const location = args.location;
  // Simulated weather data
  const conditions = ['Sunny', 'Cloudy', 'Rainy', 'Partly Cloudy'];
  const temp = Math.floor(Math.random() * 30) + 10;
  const condition = conditions[Math.floor(Math.random() * conditions.length)];
  
  return `Weather in ${location}:
Temperature: ${temp}°C
Conditions: ${condition}
Humidity: ${Math.floor(Math.random() * 40) + 40}%
(This is simulated weather data. In production, integrate with a real weather API.)`;
}

// Create and configure MCP server
export function createMCPServer(): Server {
  const server = new Server(
    {
      name: 'personal-assistant-mcp',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Register tool list handler
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools };
  });

  // Register tool call handler
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      let result: string;

      switch (name) {
        case 'get_current_time':
          result = await handleGetCurrentTime(args);
          break;
        case 'calculate':
          result = await handleCalculate(args);
          break;
        case 'search_web':
          result = await handleSearchWeb(args);
          break;
        case 'get_weather':
          result = await handleGetWeather(args);
          break;
        default:
          throw new Error(`Unknown tool: ${name}`);
      }

      return {
        content: [
          {
            type: 'text',
            text: result,
          },
        ],
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${errorMessage}`,
          },
        ],
        isError: true,
      };
    }
  });

  return server;
}

// Export tool execution function for direct use
export async function executeToolCall(toolName: string, args: any): Promise<string> {
  try {
    switch (toolName) {
      case 'get_current_time':
        return await handleGetCurrentTime(args);
      case 'calculate':
        return await handleCalculate(args);
      case 'search_web':
        return await handleSearchWeb(args);
      case 'get_weather':
        return await handleGetWeather(args);
      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Tool execution failed: ${errorMessage}`);
  }
}

// Export tools list
export { tools };
