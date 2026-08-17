import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage } from '../types';
import { MessageSquare, Send, X, ChevronDown, Sparkles } from 'lucide-react';
import { sounds } from '../audio/soundManager';

interface ChatWidgetProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

const QUICK_CHATS = [
  'GG! 🔥',
  'Check out my pet! 🦄',
  'Stage 6 is crazy hard! 😅',
  'Follow me! 🏃‍♂️',
  'Let\'s build together! 🛠️',
  'Nice hat! 🎩',
];

export const ChatWidget: React.FC<ChatWidgetProps> = ({
  messages,
  onSendMessage,
  isOpen,
  onToggle,
}) => {
  const [inputText, setInputText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    sounds.playCoin();
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const handleQuickChat = (text: string) => {
    sounds.playCoin();
    onSendMessage(text);
  };

  return (
    <div id="chat_widget_container" className="fixed bottom-24 left-4 sm:left-6 z-40 w-80 sm:w-96">
      {!isOpen ? (
        <button
          id="open_chat_btn"
          onClick={onToggle}
          className="flex items-center gap-2.5 bg-black/40 backdrop-blur-md border border-white/20 px-4 py-2.5 rounded-2xl text-white text-xs font-black shadow-xl hover:bg-black/60 transition-all hover:scale-105"
        >
          <MessageSquare className="w-4 h-4 text-emerald-400" />
          <span>Live Blox Chat</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        </button>
      ) : (
        <div className="bg-black/50 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl overflow-hidden flex flex-col h-80 animate-in slide-in-from-bottom-3 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-white/5 border-b border-white/10">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-black text-white tracking-wide uppercase">Blox Live Chat</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                5 Online
              </span>
            </div>
            <button
              id="minimize_chat_btn"
              onClick={onToggle}
              className="p-1 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          {/* Messages list matching Immersive UI */}
          <div ref={scrollRef} className="flex-1 p-3 overflow-y-auto space-y-2 text-xs">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`p-2.5 rounded-2xl backdrop-blur-sm border ${
                  m.isSystem
                    ? 'bg-amber-500/15 border-amber-500/30 text-amber-200 font-bold'
                    : 'bg-white/5 border-white/10 text-white'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-black" style={{ color: m.color }}>
                    {m.sender}:
                  </span>
                  <span className="text-[10px] text-white/40 font-mono">{m.time}</span>
                </div>
                <p className="text-white/90 mt-1 font-medium">{m.text}</p>
              </div>
            ))}
          </div>

          {/* Quick Chat Chips */}
          <div className="flex gap-1.5 px-3 py-2 overflow-x-auto no-scrollbar bg-black/40 border-t border-white/10">
            {QUICK_CHATS.map((qc, i) => (
              <button
                key={i}
                onClick={() => handleQuickChat(qc)}
                className="whitespace-nowrap px-3 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-[11px] text-white font-bold border border-white/15 transition-all hover:scale-105 active:scale-95"
              >
                {qc}
              </button>
            ))}
          </div>

          {/* Input Form */}
          <form onSubmit={handleSend} className="flex gap-2 p-3 bg-black/60 border-t border-white/10">
            <input
              id="chat_input_field"
              type="text"
              placeholder="Say something friendly..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 px-3.5 py-2 rounded-xl bg-white/10 border border-white/15 text-xs text-white placeholder:text-white/40 focus:outline-none focus:border-white/40"
            />
            <button
              id="send_chat_btn"
              type="submit"
              className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 border-b-4 border-emerald-800 text-slate-950 font-black transition-all active:border-b-0 active:translate-y-1 shadow-lg"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
