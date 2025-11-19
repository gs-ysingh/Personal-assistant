import { useState } from 'react';
import axios from 'axios';
import './App.css';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'chat' | 'graph'>('chat');

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages([...messages, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const endpoint = mode === 'chat' ? '/api/chat' : '/api/graph/workflow';
      const response = await axios.post(endpoint, { message: input });

      const assistantMessage: Message = {
        role: 'assistant',
        content: response.data.response,
      };
      setMessages((prev) => [...prev, assistantMessage]);
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

        <div className="input-container">
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
