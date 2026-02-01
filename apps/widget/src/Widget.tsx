import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

interface WidgetProps {
  botId: string;
  apiUrl?: string;
}

export function ChatWidget({ botId, apiUrl = 'http://localhost:3001' }: WidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState<any>(null);
  const [sessionId] = useState(() => Math.random().toString(36).substring(7));
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load bot config
    axios
      .get(`${apiUrl}/api/v1/chat/${botId}/config`)
      .then((res) => {
        setConfig(res.data);
        // Add welcome message
        setMessages([
          {
            id: '1',
            content: res.data.welcomeMessage || 'Hello! How can I help you?',
            role: 'assistant',
            timestamp: new Date(),
          },
        ]);
      })
      .catch((err) => console.error('Failed to load bot config:', err));
  }, [botId, apiUrl]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      role: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await axios.post(`${apiUrl}/api/v1/chat`, {
        botId,
        message: input,
        sessionId,
      });

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response.data.message,
        role: 'assistant',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!config) return null;

  return (
    <>
      {/* Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{ backgroundColor: config.color || '#6366f1' }}
          className="fixed bottom-6 right-6 w-16 h-16 rounded-full shadow-lg flex items-center justify-center text-white text-2xl hover:scale-110 transition-transform z-50"
        >
          💬
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-lg shadow-2xl flex flex-col z-50">
          {/* Header */}
          <div
            style={{ backgroundColor: config.color || '#6366f1' }}
            className="p-4 text-white rounded-t-lg flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              {config.avatar && (
                <img src={config.avatar} alt="" className="w-10 h-10 rounded-full" />
              )}
              <div>
                <div className="font-bold">{config.name}</div>
                <div className="text-sm opacity-90">Online</div>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white hover:opacity-80">
              ✕
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                {/* Author name above message */}
                <div className="text-xs text-gray-500 mb-1 px-1">
                  {msg.role === 'user' ? 'You' : config.name}
                </div>
                <div
                  className={`max-w-[80%] px-4 py-2 rounded-lg ${
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex flex-col items-start">
                {/* Bot name above typing indicator */}
                <div className="text-xs text-gray-500 mb-1 px-1">
                  {config.name}
                </div>
                <div className="bg-gray-100 px-4 py-2 rounded-lg">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Type a message..."
                className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
              />
              <button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                style={{ backgroundColor: config.color || '#6366f1' }}
                className="w-12 h-12 flex items-center justify-center text-white rounded-lg hover:opacity-90 disabled:opacity-50 transition-all"
                aria-label="Send message"
              >
                {/* Arrow Up Icon */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-6 h-6"
                >
                  <path d="M12 19V5M5 12l7-7 7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
