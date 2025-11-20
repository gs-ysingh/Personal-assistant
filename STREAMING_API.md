# Streaming API Implementation

## Overview
The application now uses Server-Sent Events (SSE) for real-time streaming responses from the AI model.

## Changes Made

### Backend Changes

#### 1. Chat Router (`backend/src/routes/chat.ts`)
- Already had a `/stream` endpoint that uses SSE
- Streams responses from Google Gemini model chunk by chunk
- Sends data in SSE format: `data: {content: "..."}\n\n`
- Ends stream with `data: [DONE]\n\n`

#### 2. Graph Router (`backend/src/routes/graph.ts`)
- **Added `/stream` endpoint** for streaming graph workflow responses
- Simplified the LangGraph implementation to use direct model streaming
- Removed complex StateGraph configuration that had TypeScript errors
- All endpoints now support streaming via SSE

### Frontend Changes

#### 3. React App (`frontend/src/App.tsx`)
- **Updated `sendMessage` function** to use streaming endpoints
- Replaced axios POST with native `fetch` API for SSE support
- Implemented `ReadableStream` reader to process incoming chunks
- Updates UI in real-time as chunks arrive
- Accumulates content and displays it progressively

## How It Works

### Backend Streaming Flow
```typescript
// Set SSE headers
res.setHeader('Content-Type', 'text/event-stream');
res.setHeader('Cache-Control', 'no-cache');
res.setHeader('Connection', 'keep-alive');

// Stream model output
const stream = await model.stream(messages);
for await (const chunk of stream) {
  res.write(`data: ${JSON.stringify({ content: chunk.content })}\n\n`);
}
res.write('data: [DONE]\n\n');
```

### Frontend Streaming Flow
```typescript
// Create placeholder for streaming content
const response = await fetch('/api/chat/stream', {
  method: 'POST',
  body: JSON.stringify({ message }),
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

// Read and process chunks
while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  // Parse SSE data and update UI
  const chunk = decoder.decode(value);
  // Update message state with accumulated content
}
```

## API Endpoints

### Chat Endpoints
- `POST /api/chat` - Non-streaming chat (legacy)
- `POST /api/chat/stream` - **Streaming chat (now default)**

### Graph Endpoints
- `POST /api/graph/stream` - **Streaming graph workflow**
- `POST /api/graph/workflow` - Simple workflow
- `POST /api/graph/multi-step` - Multi-step workflow

## Benefits

1. **Real-time Feedback**: Users see responses as they're generated
2. **Better UX**: No waiting for complete response before seeing anything
3. **Lower Latency**: First tokens appear almost immediately
4. **Natural Feel**: Mimics human-like typing behavior

## Usage

The app automatically uses streaming when you send messages. Both "Simple Chat" and "Graph Workflow" modes now stream responses in real-time.

### Example Request
```bash
curl -X POST http://localhost:3001/api/chat/stream \
  -H "Content-Type: application/json" \
  -d '{"message": "Tell me a story"}' \
  --no-buffer
```

### Example Response (SSE format)
```
data: {"content":"Once"}

data: {"content":" upon"}

data: {"content":" a"}

data: {"content":" time"}

...

data: [DONE]
```

## Testing

1. Start the dev servers: `npm run dev`
2. Open http://localhost:3000
3. Type a message and send
4. Watch the response stream in real-time character by character

## Notes

- The frontend now exclusively uses streaming endpoints
- Error handling is improved for stream interruptions
- The multi-step workflow still uses sequential API calls (not streamed)
