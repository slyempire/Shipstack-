import React from 'react';
import { X } from 'lucide-react';

export interface DriverPortalChatMessage {
  sender: 'DRIVER' | 'DISPATCH' | 'WAREHOUSE';
  text: string;
  time: string;
}

interface DriverPortalChatOverlayProps {
  messages: DriverPortalChatMessage[];
  recipient: 'DISPATCH' | 'WAREHOUSE';
  newMessage: string;
  onChangeMessage: (value: string) => void;
  onSendMessage: () => void;
  onClose: () => void;
}

export const DriverPortalChatOverlay: React.FC<DriverPortalChatOverlayProps> = ({
  messages,
  recipient,
  newMessage,
  onChangeMessage,
  onSendMessage,
  onClose
}) => {
  return (
    <div className="fixed inset-0 z-[9100] bg-black/70 backdrop-blur-sm flex items-end justify-center p-4">
      <div className="w-full max-w-md rounded-[2rem] overflow-hidden bg-white shadow-2xl">
        <header className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-500">Live Dispatch Chat</p>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-900">{recipient}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-900">
            <X size={20} />
          </button>
        </header>

        <div className="max-h-96 overflow-y-auto p-4 space-y-3 bg-slate-50">
          {messages.map((msg, idx) => (
            <div key={idx} className={`rounded-3xl p-4 ${msg.sender === 'DRIVER' ? 'bg-slate-900 text-white self-end' : 'bg-white text-slate-900'} max-w-[85%] ${msg.sender === 'DRIVER' ? 'ml-auto' : ''}`}>
              <p className="text-[10px] uppercase tracking-[0.25em] opacity-50">{msg.sender}</p>
              <p className="mt-2 text-sm leading-snug">{msg.text}</p>
              <p className="text-[10px] opacity-40 mt-2">{msg.time}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3 p-4 border-t border-slate-200">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => onChangeMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 rounded-3xl border border-slate-200 px-4 py-3 text-sm outline-none"
          />
          <button
            onClick={onSendMessage}
            disabled={!newMessage.trim()}
            className="rounded-3xl bg-slate-900 px-4 py-3 text-sm font-black uppercase tracking-[0.2em] text-white disabled:opacity-40"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};
