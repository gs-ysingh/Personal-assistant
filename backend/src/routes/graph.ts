import { Router, Request, Response } from 'express';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { StateGraph, END } from '@langchain/langgraph';
import { HumanMessage, BaseMessage } from '@langchain/core/messages';

export const graphRouter = Router();

// Define the state interface for our graph
interface AgentState {
  messages: BaseMessage[];
  nextStep?: string;
}

// Create a simple LangGraph workflow
graphRouter.post('/workflow', async (req: Request, res: Response) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const model = new ChatGoogleGenerativeAI({
      modelName: 'gemini-pro',
      temperature: 0.7,
      apiKey: process.env.GOOGLE_API_KEY,
    });

    // Define the graph nodes
    const processMessage = async (state: AgentState) => {
      const response = await model.invoke(state.messages);
      return {
        messages: [...state.messages, response],
        nextStep: 'end',
      };
    };

    // Build the graph
    const workflow = new StateGraph<AgentState>({
      channels: {
        messages: {
          value: (prev: BaseMessage[], next: BaseMessage[]) => next,
          default: () => [],
        },
        nextStep: {
          value: (prev?: string, next?: string) => next || prev,
          default: () => undefined,
        },
      },
    });

    // Add nodes
    workflow.addNode('process', processMessage);

    // Add edges
    workflow.addEdge('__start__', 'process');
    workflow.addEdge('process', END);

    // Compile the graph
    const app = workflow.compile();

    // Run the workflow
    const result = await app.invoke({
      messages: [new HumanMessage(message)],
    });

    res.json({
      response: result.messages[result.messages.length - 1].content,
      messageCount: result.messages.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Graph workflow error:', error);
    res.status(500).json({ error: 'Failed to process graph workflow' });
  }
});

// Multi-step workflow example
graphRouter.post('/multi-step', async (req: Request, res: Response) => {
  try {
    const { task } = req.body;

    if (!task) {
      return res.status(400).json({ error: 'Task is required' });
    }

    const model = new ChatGoogleGenerativeAI({
      modelName: 'gemini-pro',
      apiKey: process.env.GOOGLE_API_KEY,
    });

    // Define nodes for multi-step processing
    const planTask = async (state: AgentState) => {
      const planningPrompt = new HumanMessage(
        `Create a step-by-step plan for: ${task}`
      );
      const response = await model.invoke([planningPrompt]);
      return {
        messages: [...state.messages, response],
        nextStep: 'execute',
      };
    };

    const executeTask = async (state: AgentState) => {
      const lastMessage = state.messages[state.messages.length - 1];
      const executionPrompt = new HumanMessage(
        `Based on this plan: ${lastMessage.content}, provide a detailed execution strategy.`
      );
      const response = await model.invoke([executionPrompt]);
      return {
        messages: [...state.messages, response],
        nextStep: 'end',
      };
    };

    // Build multi-step graph
    const workflow = new StateGraph<AgentState>({
      channels: {
        messages: {
          value: (prev: BaseMessage[], next: BaseMessage[]) => next,
          default: () => [],
        },
        nextStep: {
          value: (prev?: string, next?: string) => next || prev,
          default: () => undefined,
        },
      },
    });

    workflow.addNode('plan', planTask);
    workflow.addNode('execute', executeTask);

    workflow.addEdge('__start__', 'plan');
    workflow.addEdge('plan', 'execute');
    workflow.addEdge('execute', END);

    const app = workflow.compile();

    const result = await app.invoke({
      messages: [],
    });

    res.json({
      plan: result.messages[0]?.content || '',
      execution: result.messages[1]?.content || '',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Multi-step workflow error:', error);
    res.status(500).json({ error: 'Failed to process multi-step workflow' });
  }
});
