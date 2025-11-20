import { Router, Request, Response } from 'express';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { HumanMessage, BaseMessage, SystemMessage } from '@langchain/core/messages';
import multer from 'multer';

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

    const messages = [new HumanMessage({ content: messageContent })];
    const stream = await model.stream(messages);

    for await (const chunk of stream) {
      res.write(`data: ${JSON.stringify({ content: chunk.content })}\n\n`);
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

    const messages = [
      new SystemMessage('You are a helpful AI assistant processing a workflow.'),
      new HumanMessage(message)
    ];
    
    const response = await model.invoke(messages);

    res.json({
      response: response.content,
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

    // Step 1: Create a plan
    const planningPrompt = new HumanMessage(
      `Create a step-by-step plan for: ${task}`
    );
    const planResponse = await model.invoke([planningPrompt]);

    // Step 2: Execute based on the plan
    const executionPrompt = new HumanMessage(
      `Based on this plan: ${planResponse.content}, provide a detailed execution strategy.`
    );
    const executionResponse = await model.invoke([executionPrompt]);

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
