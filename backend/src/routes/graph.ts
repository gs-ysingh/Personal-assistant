import { Router, Request, Response } from 'express';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { HumanMessage, BaseMessage, SystemMessage, AIMessage } from '@langchain/core/messages';
import multer from 'multer';
import { mcpTools } from '../tools/mcpTools';

export const graphRouter = Router();

// Configure multer for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Stream endpoint for graph workflow
graphRouter.post('/stream', upload.array('files', 10), async (req: Request, res: Response) => {
  try {
    const { message } = req.body;
    const files = req.files as Express.Multer.File[];

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const model = new ChatGoogleGenerativeAI({
      modelName: 'gemini-2.0-flash',
      temperature: 0.7,
      apiKey: process.env.GOOGLE_API_KEY,
      streaming: true,
    });
    
    const modelWithTools = model.bind({
      tools: mcpTools,
    });

    // Set headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Create message content with text and images
    const messageContent: any[] = [{ type: 'text', text: message }];

    // Add images/files if provided
    if (files && files.length > 0) {
      for (const file of files) {
        if (file.mimetype.startsWith('image/')) {
          messageContent.push({
            type: 'image_url',
            image_url: {
              url: `data:${file.mimetype};base64,${file.buffer.toString('base64')}`,
            },
          });
        } else {
          const fileText = file.buffer.toString('utf-8');
          messageContent.push({
            type: 'text',
            text: `\n\n[File: ${file.originalname}]\n${fileText}`,
          });
        }
      }
    }

    const messages = [
      new SystemMessage('You are a helpful AI assistant with access to tools. Use them when needed.'),
      new HumanMessage({ content: messageContent })
    ];
    
    // Check for tool calls first
    const firstResponse = await modelWithTools.invoke(messages);
    
    if (firstResponse.additional_kwargs?.tool_calls) {
      const toolCalls: any[] = [];
      
      for (const toolCall of firstResponse.additional_kwargs.tool_calls) {
        const tool = mcpTools.find(t => t.name === toolCall.function.name);
        if (tool) {
          const toolArgs = JSON.parse(toolCall.function.arguments);
          const toolResult = await tool.func(toolArgs);
          toolCalls.push({
            name: toolCall.function.name,
            args: toolArgs,
            result: toolResult,
          });
          
          res.write(`data: ${JSON.stringify({ 
            type: 'tool_call',
            name: toolCall.function.name,
            args: toolArgs,
            result: toolResult 
          })}\n\n`);
        }
      }
      
      const messagesWithTools = [
        ...messages,
        firstResponse,
        ...toolCalls.map(tc => new AIMessage({
          content: `Tool ${tc.name} result: ${tc.result}`,
        })),
      ];
      
      const stream = await model.stream(messagesWithTools);
      for await (const chunk of stream) {
        res.write(`data: ${JSON.stringify({ content: chunk.content })}\n\n`);
      }
    } else {
      const stream = await model.stream(messages);
      for await (const chunk of stream) {
        res.write(`data: ${JSON.stringify({ content: chunk.content })}\n\n`);
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.error('Stream error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to process stream request' });
    }
  }
});

// Simple workflow endpoint (now uses streaming)
graphRouter.post('/workflow', async (req: Request, res: Response) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const model = new ChatGoogleGenerativeAI({
      modelName: 'gemini-2.0-flash',
      temperature: 0.7,
      apiKey: process.env.GOOGLE_API_KEY,
    });
    
    const modelWithTools = model.bind({
      tools: mcpTools,
    });

    const messages = [
      new SystemMessage('You are a helpful AI assistant processing a workflow. You have access to tools like get_current_time, calculate, search_web, and get_weather.'),
      new HumanMessage(message)
    ];
    
    const response = await modelWithTools.invoke(messages);
    
    // Handle tool calls
    const toolCalls: any[] = [];
    let finalResponse = response.content;
    
    if (response.additional_kwargs?.tool_calls) {
      for (const toolCall of response.additional_kwargs.tool_calls) {
        const tool = mcpTools.find(t => t.name === toolCall.function.name);
        if (tool) {
          const toolArgs = JSON.parse(toolCall.function.arguments);
          const toolResult = await tool.func(toolArgs);
          toolCalls.push({
            name: toolCall.function.name,
            args: toolArgs,
            result: toolResult,
          });
        }
      }
      
      if (toolCalls.length > 0) {
        const messagesWithTools = [
          ...messages,
          response,
          ...toolCalls.map(tc => new AIMessage({
            content: `Tool ${tc.name} result: ${tc.result}`,
          })),
        ];
        const finalAIResponse = await model.invoke(messagesWithTools);
        finalResponse = finalAIResponse.content;
      }
    }

    res.json({
      response: finalResponse,
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
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
      modelName: 'gemini-2.0-flash',
      apiKey: process.env.GOOGLE_API_KEY,
    });
    
    const modelWithTools = model.bind({
      tools: mcpTools,
    });

    // Step 1: Create a plan
    const planningPrompt = [
      new SystemMessage('You are a planning assistant. You can use tools to gather information.'),
      new HumanMessage(`Create a step-by-step plan for: ${task}`)
    ];
    const planResponse = await modelWithTools.invoke(planningPrompt);

    // Step 2: Execute based on the plan
    const executionPrompt = [
      new SystemMessage('You are an execution assistant. Use available tools to help with the execution.'),
      new HumanMessage(`Based on this plan: ${planResponse.content}, provide a detailed execution strategy.`)
    ];
    const executionResponse = await modelWithTools.invoke(executionPrompt);

    res.json({
      plan: planResponse.content,
      execution: executionResponse.content,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Multi-step workflow error:', error);
    res.status(500).json({ error: 'Failed to process multi-step workflow' });
  }
});
