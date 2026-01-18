'use client';

import { useState } from 'react';
import { MessageSquare } from 'lucide-react';
import ChatWidget from '@/components/ChatWidget';

export default function ChatButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-40 p-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-full shadow-lg shadow-cyan-900/50 transition-all hover:scale-110"
        title="Open AI Chat"
      >
        <MessageSquare className="w-6 h-6 text-white" />
      </button>

      <ChatWidget isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
