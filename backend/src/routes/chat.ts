import { Router, Request, Response } from 'express';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { HumanMessage, SystemMessage, AIMessage } from '@langchain/core/messages';
import multer from 'multer';
import { mcpTools } from '../tools/mcpTools';

export const chatRouter = Router();

// Configure multer for file uploads (store in memory)
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Simple chat endpoint using LangChain
chatRouter.post('/', upload.array('files', 10), async (req: Request, res: Response) => {
  try {
    const { message } = req.body;
    const files = req.files as Express.Multer.File[];

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Initialize ChatGoogleGenerativeAI model with tool binding
    const model = new ChatGoogleGenerativeAI({
      modelName: 'gemini-2.0-flash',
      temperature: 0.7,
      apiKey: process.env.GOOGLE_API_KEY,
    });
    
    const modelWithTools = model.bind({
      tools: mcpTools,
    });

    // Create message content with text and images
    const messageContent: any[] = [{ type: 'text', text: message }];

    // Add images/files if provided
    if (files && files.length > 0) {
      for (const file of files) {
        // Check if file is an image
        if (file.mimetype.startsWith('image/')) {
          messageContent.push({
            type: 'image_url',
            image_url: {
              url: `data:${file.mimetype};base64,${file.buffer.toString('base64')}`,
            },
          });
        } else {
          // For non-image files, include filename and content as text
          const fileText = file.buffer.toString('utf-8');
          messageContent.push({
            type: 'text',
            text: `\n\n[File: ${file.originalname}]\n${fileText}`,
          });
        }
      }
    }

    // Create messages
    const messages = [
      new SystemMessage('You are a helpful AI assistant that can analyze images and files. You have access to tools like get_current_time, calculate, search_web, and get_weather. Use them when appropriate.'),
      new HumanMessage({ content: messageContent }),
    ];
    
    // Invoke the model with tools
    const response = await modelWithTools.invoke(messages);
    
    // Check if model wants to use tools
    const toolCalls: any[] = [];
    let finalResponse = response.content;
    
    if (response.additional_kwargs?.tool_calls) {
      // Execute tool calls
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
      
      // If tools were called, get final response with tool results
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
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Failed to process chat request' });
  }
});

// Stream chat endpoint
chatRouter.post('/stream', upload.array('files', 10), async (req: Request, res: Response) => {
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

    // Create message content with text and images
    const messageContent: any[] = [{ type: 'text', text: message }];

    // Add images/files if provided
    if (files && files.length > 0) {
      for (const file of files) {
        // Check if file is an image
        if (file.mimetype.startsWith('image/')) {
          messageContent.push({
            type: 'image_url',
            image_url: {
              url: `data:${file.mimetype};base64,${file.buffer.toString('base64')}`,
            },
          });
        } else {
          // For non-image files, include filename and content as text
          const fileText = file.buffer.toString('utf-8');
          messageContent.push({
            type: 'text',
            text: `\n\n[File: ${file.originalname}]\n${fileText}`,
          });
        }
      }
    }

    const messages = [
      new SystemMessage('You are a helpful AI assistant that can analyze images and files. You have access to tools like get_current_time, calculate, search_web, and get_weather. Use them when appropriate.'),
      new HumanMessage({ content: messageContent }),
    ];

    // Set headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    console.log("messages with files", files?.length || 0);

    // First pass - check for tool calls
    const firstResponse = await modelWithTools.invoke(messages);
    
    if (firstResponse.additional_kwargs?.tool_calls) {
      // Execute tool calls and send results
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
          
          // Stream tool call info
          res.write(`data: ${JSON.stringify({ 
            type: 'tool_call',
            name: toolCall.function.name,
            args: toolArgs,
            result: toolResult 
          })}\n\n`);
        }
      }
      
      // Stream final response with tool results
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
      // No tool calls, stream normally
      const stream = await model.stream(messages);
      for await (const chunk of stream) {
        res.write(`data: ${JSON.stringify({ content: chunk.content })}\n\n`);
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.error('Stream error:', error);
    res.status(500).json({ error: 'Failed to process stream request' });
  }
});
