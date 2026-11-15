import React, { useState } from 'react';
import { useTrading } from '../../context/TradingContext';

export const MessagesView: React.FC = () => {
  const { messages, markMessageAsRead, unreadCount, setIsDrawerOpen } = useTrading();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="flex-1 flex flex-col bg-[#000000] text-white overflow-hidden select-none">
      <header className="h-14 px-3 flex items-center justify-between border-b border-[#14161b] bg-[#000000] shrink-0">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsDrawerOpen(true)}
            aria-label="القائمة"
            className="w-10 h-10 flex items-center justify-center text-white hover:bg-white/10 rounded-full cursor-pointer"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="w-6 h-6">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <div>
            <h1 className="text-[17px] font-bold text-white leading-tight">الرسائل</h1>
            <span className="text-[11px] text-[#8e9aa8]">
              {unreadCount > 0 ? `${unreadCount} رسائل غير مقروءة` : 'جميع الرسائل مقروءة'}
            </span>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto divide-y divide-[#14161b]">
        {messages.map((msg) => {
          const isExpanded = expandedId === msg.id;
          return (
            <div
              key={msg.id}
              onClick={() => {
                markMessageAsRead(msg.id);
                setExpandedId(isExpanded ? null : msg.id);
              }}
              className={`px-4 py-3 cursor-pointer transition-colors ${
                msg.read ? 'bg-[#000000] hover:bg-[#0a0c10]' : 'bg-[#0b1018] hover:bg-[#0f1622]'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[12px] font-semibold text-[#3897f0]">{msg.sender}</span>
                <span className="text-[11px] text-[#8e9aa8]">{msg.time}</span>
              </div>
              <h3 className={`text-[14px] mt-1 ${msg.read ? 'font-medium text-[#cfd8dc]' : 'font-bold text-white'}`}>
                {msg.title}
              </h3>
              <p className={`text-[12px] text-[#8e9aa8] mt-1 leading-relaxed ${isExpanded ? '' : 'line-clamp-2'}`}>
                {msg.content}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
