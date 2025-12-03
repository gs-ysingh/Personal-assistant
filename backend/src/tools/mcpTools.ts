import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { executeToolCall } from '../mcp/server';

// Manually define tools for better type safety
const getCurrentTimeTool = new DynamicStructuredTool({
  name: 'get_current_time',
  description: 'Get the current date and time',
  schema: z.object({
    timezone: z.string().optional().describe('Timezone name (e.g., America/New_York, Europe/London)'),
  }),
  func: async (input) => {
    return await executeToolCall('get_current_time', input);
  },
});

const calculateTool = new DynamicStructuredTool({
  name: 'calculate',
  description: 'Perform mathematical calculations',
  schema: z.object({
    expression: z.string().describe('Mathematical expression to evaluate (e.g., "2 + 2", "sqrt(16)")'),
  }),
  func: async (input) => {
    return await executeToolCall('calculate', input);
  },
});

const searchWebTool = new DynamicStructuredTool({
  name: 'search_web',
  description: 'Search the web for information (simulated)',
  schema: z.object({
    query: z.string().describe('Search query'),
  }),
  func: async (input) => {
    return await executeToolCall('search_web', input);
  },
});

const getWeatherTool = new DynamicStructuredTool({
  name: 'get_weather',
  description: 'Get current weather information for a location (simulated)',
  schema: z.object({
    location: z.string().describe('City name or location'),
  }),
  func: async (input) => {
    return await executeToolCall('get_weather', input);
  },
});

// Export all tools as an array
export const mcpTools: DynamicStructuredTool[] = [
  getCurrentTimeTool,
  calculateTool,
  searchWebTool,
  getWeatherTool,
];
