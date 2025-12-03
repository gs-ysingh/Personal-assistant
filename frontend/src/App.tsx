import { useState } from 'react';
import axios from 'axios';
import './App.css';

interface ToolCall {
  name: string;
  args: any;
  result: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  files?: { name: string; type: string; preview?: string }[];
  toolCalls?: ToolCall[];
}

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'chat' | 'graph'>('chat');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    // Store file info for display
    const fileInfo = selectedFiles.map(f => ({
      name: f.name,
      type: f.type,
      preview: f.type.startsWith('image/') ? URL.createObjectURL(f) : undefined,
    }));

    const userMessage: Message = { 
      role: 'user', 
      content: input,
      files: fileInfo.length > 0 ? fileInfo : undefined,
    };
    setMessages([...messages, userMessage]);
    const currentInput = input;
    const currentFiles = selectedFiles;
    setInput('');
    setSelectedFiles([]);
    setLoading(true);

    try {
      const endpoint = mode === 'chat' ? '/api/chat/stream' : '/api/graph/stream';
      
      // Create a placeholder message for streaming content
      const assistantMessageIndex = messages.length + 1;
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: '' },
      ]);

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('message', currentInput);
      currentFiles.forEach((file) => {
        formData.append('files', file);
      });

      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to fetch stream');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No reader available');
      }

      let accumulatedContent = '';
      const toolCalls: ToolCall[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              break;
            }
            try {
              const parsed = JSON.parse(data);
              
              // Handle tool calls
              if (parsed.type === 'tool_call') {
                toolCalls.push({
                  name: parsed.name,
                  args: parsed.args,
                  result: parsed.result,
                });
                
                setMessages((prev) => {
                  const newMessages = [...prev];
                  newMessages[assistantMessageIndex] = {
                    role: 'assistant',
                    content: accumulatedContent,
                    toolCalls: [...toolCalls],
                  };
                  return newMessages;
                });
              } else if (parsed.content) {
                // Handle regular content
                accumulatedContent += parsed.content;
                setMessages((prev) => {
                  const newMessages = [...prev];
                  newMessages[assistantMessageIndex] = {
                    role: 'assistant',
                    content: accumulatedContent,
                    toolCalls: toolCalls.length > 0 ? [...toolCalls] : undefined,
                  };
                  return newMessages;
                });
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (error) {
      console.error('Error:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Sorry, an error occurred. Please try again.',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const runMultiStepWorkflow = async () => {
    if (!input.trim()) return;

    setLoading(true);

    try {
      const response = await axios.post('/api/graph/multi-step', { task: input });

      const planMessage: Message = {
        role: 'assistant',
        content: `**Plan:**\n${response.data.plan}`,
      };
      const executionMessage: Message = {
        role: 'assistant',
        content: `**Execution:**\n${response.data.execution}`,
      };

      setMessages([
        ...messages,
        { role: 'user', content: input },
        planMessage,
        executionMessage,
      ]);
      setInput('');
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <header className="header">
        <h1>🦜 LangChain + LangGraph Assistant</h1>
        <div className="mode-selector">
          <button
            className={mode === 'chat' ? 'active' : ''}
            onClick={() => setMode('chat')}
          >
            Simple Chat
          </button>
          <button
            className={mode === 'graph' ? 'active' : ''}
            onClick={() => setMode('graph')}
          >
            Graph Workflow
          </button>
        </div>
      </header>

      <div className="chat-container">
        <div className="messages">
          {messages.map((msg, idx) => (
            <div key={idx} className={`message ${msg.role}`}>
              <strong>{msg.role === 'user' ? 'You' : 'Assistant'}:</strong>
              {msg.files && msg.files.length > 0 && (
                <div className="message-files">
                  {msg.files.map((file, fileIdx) => (
                    <div key={fileIdx} className="file-attachment">
                      {file.preview ? (
                        <img src={file.preview} alt={file.name} className="file-preview" />
                      ) : (
                        <div className="file-icon">📄 {file.name}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {msg.toolCalls && msg.toolCalls.length > 0 && (
                <div className="tool-calls">
                  <div className="tool-calls-header">🔧 Tools Used:</div>
                  {msg.toolCalls.map((toolCall, tcIdx) => (
                    <div key={tcIdx} className="tool-call">
                      <div className="tool-name">{toolCall.name}</div>
                      <div className="tool-args">
                        <strong>Args:</strong> {JSON.stringify(toolCall.args)}
                      </div>
                      <div className="tool-result">
                        <strong>Result:</strong> {toolCall.result}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <p>{msg.content}</p>
            </div>
          ))}
          {loading && (
            <div className="message assistant">
              <strong>Assistant:</strong>
              <p>Thinking...</p>
            </div>
          )}
        </div>

        {selectedFiles.length > 0 && (
          <div className="selected-files">
            {selectedFiles.map((file, idx) => (
              <div key={idx} className="selected-file">
                {file.type.startsWith('image/') ? (
                  <img src={URL.createObjectURL(file)} alt={file.name} className="file-preview-small" />
                ) : (
                  <span className="file-name">📄 {file.name}</span>
                )}
                <button onClick={() => removeFile(idx)} className="remove-file">×</button>
              </div>
            ))}
          </div>
        )}

        <div className="input-container">
          <input
            type="file"
            id="file-input"
            multiple
            accept="image/*,.txt,.pdf,.doc,.docx,.json,.csv"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
          <label htmlFor="file-input" className="file-button" title="Attach files">
            📎
          </label>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Type your message..."
            disabled={loading}
          />
          <button onClick={sendMessage} disabled={loading || !input.trim()}>
            Send
          </button>
          {mode === 'graph' && (
            <button
              onClick={runMultiStepWorkflow}
              disabled={loading || !input.trim()}
              className="secondary"
            >
              Multi-Step
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
