'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, X, MessageSquare } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  listings?: any[];
  timestamp: string;
}

interface ChatWidgetProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ChatWidget({ isOpen, onClose }: ChatWidgetProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickPrompts = [
    'Top 5 tiềm năng cao ở Hà Nội',
    'Mặt bằng office Quận Ba Đình giá < 30tr',
    'So sánh giá/m2 Quận 1 và Phú Nhuận',
    'Diện tích > 50m2 ở Đà Nẵng'
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (message?: string) => {
    const textToSend = message || input.trim();
    if (!textToSend || loading) return;

    const userMessage: Message = {
      role: 'user',
      content: textToSend,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          conversationId: conversationId || undefined
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      if (data.conversationId) {
        setConversationId(data.conversationId);
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.answer || 'Không có phản hồi',
        listings: data.listings || [],
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      const errorMessage: Message = {
        role: 'assistant',
        content: `Lỗi: ${error.message}. Vui lòng thử lại.`,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-0 right-0 w-full md:w-[450px] h-[600px] md:h-[700px] bg-slate-900 border-l border-t border-white/10 shadow-2xl z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10 bg-gradient-to-r from-cyan-900/20 to-blue-900/20">
        <div className="flex items-center gap-3">
          <MessageSquare className="w-5 h-5 text-cyan-400" />
          <div>
            <h3 className="font-bold text-white">JFinder AI Assistant</h3>
            <p className="text-xs text-gray-400">Tìm kiếm mặt bằng thông minh</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <MessageSquare className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 mb-4">Hỏi tôi về mặt bằng phù hợp!</p>
            <div className="space-y-2">
              {quickPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(prompt)}
                  className="block w-full text-left px-3 py-2 text-sm bg-slate-800 hover:bg-slate-700 rounded-lg text-gray-300 transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-xl p-3 ${
                msg.role === 'user'
                  ? 'bg-cyan-600 text-white'
                  : 'bg-slate-800 text-gray-200'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>

              {/* Listings preview */}
              {msg.listings && msg.listings.length > 0 && (
                <div className="mt-3 pt-3 border-t border-white/10 space-y-2">
                  <p className="text-xs text-cyan-400 font-bold">
                    {msg.listings.length} mặt bằng tìm thấy:
                  </p>
                  {msg.listings.slice(0, 3).map((listing, i) => (
                    <div key={i} className="text-xs bg-slate-900/50 p-2 rounded">
                      <p className="font-semibold text-white">{listing.name}</p>
                      <p className="text-gray-400">
                        {listing.district}, {listing.province}
                      </p>
                      <p className="text-cyan-400">
                        {listing.price}tr/tháng • {listing.area}m² • Điểm: {listing.potentialScore}
                      </p>
                    </div>
                  ))}
                  {msg.listings.length > 3 && (
                    <p className="text-xs text-gray-500">
                      ...và {msg.listings.length - 3} mặt bằng khác
                    </p>
                  )}
                </div>
              )}

              <p className="text-xs text-gray-500 mt-2">
                {new Date(msg.timestamp).toLocaleTimeString('vi-VN')}
              </p>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-800 rounded-xl p-3">
              <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-white/10 bg-slate-900/50">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Hỏi về mặt bằng..."
            className="flex-1 bg-slate-800 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:border-cyan-500 outline-none"
            disabled={loading}
          />
          <button
            onClick={() => handleSend()}
            disabled={loading || !input.trim()}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg text-white transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
