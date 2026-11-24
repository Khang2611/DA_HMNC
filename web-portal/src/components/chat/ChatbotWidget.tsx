import React, { useState } from 'react';
import { MessageSquare, Sparkles, X, Send, Bot, Shield } from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
}

export const ChatbotWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'bot',
      text: 'Xin chào quý khách! Tôi là Trợ lý AI VinaTrust Bank. Tôi có thể hỗ trợ quý khách tra cứu số dư, hướng dẫn chuyển tiền, mở thẻ hoặc kết nối chuyên viên hỗ trợ 24/7.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: input.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');

    // Placeholder response ready for Part 3
    setTimeout(() => {
      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: 'Cảm ơn quý khách đã gửi tin nhắn. Tính năng trò chuyện AI đang sẵn sàng kết nối API ở Phần 3!',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, botMsg]);
    }, 600);
  };

  return (
    <div className="fixed bottom-6 right-6 z-40">
      {/* Floating Pill Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-brand-secondary to-brand-primary text-brand-dark font-semibold shadow-floating hover:opacity-95 active:scale-95 transition-all"
        >
          <div className="w-6 h-6 rounded-full bg-brand-dark/20 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-brand-dark" />
          </div>
          <span className="text-xs tracking-wide">Trợ lý AI VinaTrust</span>
          <span className="w-2 h-2 rounded-full bg-emerald-700 animate-ping" />
        </button>
      )}

      {/* Expanded Chat Window */}
      {isOpen && (
        <div className="glass-card w-80 sm:w-96 rounded-2xl overflow-hidden shadow-floating border border-brand-borderMauve/40 flex flex-col h-[480px]">
          {/* Header */}
          <div className="p-3.5 bg-brand-surfaceL2/90 border-b border-brand-borderSubtle flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-secondary to-brand-primary p-0.5 flex items-center justify-center">
                <div className="w-full h-full bg-brand-surfaceL1 rounded-xl flex items-center justify-center">
                  <Bot className="w-4 h-4 text-brand-secondary" />
                </div>
              </div>
              <div>
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  Trợ lý AI VinaTrust Bank
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-semibold">
                    Online
                  </span>
                </h4>
                <p className="text-[10px] text-brand-light/50">Hỗ trợ tự động 24/7</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-brand-light/60 hover:text-white p-1 rounded-lg hover:bg-brand-surfaceL1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-3.5 overflow-y-auto space-y-3 text-xs">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[82%] p-3 rounded-2xl ${
                    m.sender === 'user'
                      ? 'bg-gradient-to-r from-brand-secondary to-brand-primary text-brand-dark rounded-br-none font-medium'
                      : 'bg-brand-surfaceL2/90 border border-brand-borderMauve/20 text-brand-light rounded-bl-none'
                  }`}
                >
                  <p>{m.text}</p>
                  <span
                    className={`block text-[9px] mt-1 text-right ${
                      m.sender === 'user' ? 'text-brand-dark/60' : 'text-brand-light/40'
                    }`}
                  >
                    {m.timestamp}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Prompts */}
          <div className="px-3 py-1.5 border-t border-brand-borderSubtle/60 flex items-center gap-1.5 overflow-x-auto text-[10px]">
            <button
              type="button"
              onClick={() => setInput('Kiểm tra hạn mức chuyển khoản')}
              className="px-2.5 py-1 rounded-full bg-brand-surfaceL2 border border-brand-borderMauve/20 text-brand-light/70 hover:text-white shrink-0"
            >
              Hạn mức chuyển tiền?
            </button>
            <button
              type="button"
              onClick={() => setInput('Cách mở thẻ tín dụng ảo')}
              className="px-2.5 py-1 rounded-full bg-brand-surfaceL2 border border-brand-borderMauve/20 text-brand-light/70 hover:text-white shrink-0"
            >
              Mở thẻ ảo?
            </button>
          </div>

          {/* Input Form */}
          <form onSubmit={handleSend} className="p-3 bg-brand-surfaceL1/90 border-t border-brand-borderSubtle flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Nhập câu hỏi của bạn..."
              className="glass-input flex-1 px-3 py-2 rounded-xl text-xs"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="btn-primary p-2 rounded-xl shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

