import React from 'react';
import { useTrading } from '../context/TradingContext';
import { TabType } from '../types/mt5';

export const BottomTabBar: React.FC = () => {
  const { activeTab, setActiveTab, unreadCount } = useTrading();

  // Order in RTL: Rightmost = طلبات الأسعار -> الرسم البياني -> التداول -> السجل -> Leftmost = الرسائل
  const tabs: {
    id: TabType;
    label: string;
    badge?: number;
    icon: (isActive: boolean) => React.ReactNode;
  }[] = [
    {
      id: 'quotes',
      label: 'طلبات الأسعار',
      icon: () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" className="w-[21px] h-[21px]">
          <path d="M8 20V4M8 4L4.5 7.5M8 4L11.5 7.5" />
          <path d="M16 4V20M16 20L12.5 16.5M16 20L19.5 16.5" />
        </svg>
      )
    },
    {
      id: 'chart',
      label: 'الرسم البياني',
      icon: (isActive) => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className="w-[21px] h-[21px]">
          <line x1="8" y1="3" x2="8" y2="7" />
          <rect x="6" y="7" width="4" height="9" fill={isActive ? 'currentColor' : 'none'} rx="0.5" />
          <line x1="8" y1="16" x2="8" y2="21" />
          <line x1="16" y1="5" x2="16" y2="9" />
          <rect x="14" y="9" width="4" height="7" fill={isActive ? 'currentColor' : 'none'} rx="0.5" />
          <line x1="16" y1="16" x2="16" y2="20" />
        </svg>
      )
    },
    {
      id: 'trade',
      label: 'التداول',
      icon: () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" className="w-[21px] h-[21px]">
          <polyline points="4 16 9 11 13 14 20 7" />
          <circle cx="4" cy="16" r="1.5" fill="currentColor" />
          <circle cx="9" cy="11" r="1.5" fill="currentColor" />
          <circle cx="13" cy="14" r="1.5" fill="currentColor" />
          <circle cx="20" cy="7" r="1.8" fill="currentColor" />
        </svg>
      )
    },
    {
      id: 'history',
      label: 'السجل',
      icon: () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" className="w-[21px] h-[21px]">
          <path d="M12 8v4l2.8 2.2" />
          <path d="M3.5 12a8.5 8.5 0 1 1 2 5.5" />
          <polyline points="3.5 7.5 3.5 12.5 8.5 12.5" />
        </svg>
      )
    },
    {
      id: 'messages',
      label: 'الرسائل',
      badge: unreadCount,
      icon: () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className="w-[21px] h-[21px]">
          <path d="M19 14a2 2 0 0 1-2 2H9l-4 4V6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
          <line x1="8.5" y1="8.5" x2="15.5" y2="8.5" />
          <line x1="8.5" y1="12" x2="13" y2="12" />
        </svg>
      )
    }
  ];

  return (
    <nav className="w-full bg-[#090b0e] border-t border-[#181b21] py-1 px-1 flex items-center justify-around select-none z-40 shrink-0">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="flex-1 flex flex-col items-center justify-center py-1 min-h-[48px] cursor-pointer transition-colors"
          >
            <div
              className={`relative px-3.5 py-0.5 rounded-full flex items-center justify-center transition-colors ${
                isActive ? 'text-[#3897f0]' : 'text-[#8e9aa8] hover:text-[#cfd8dc]'
              }`}
            >
              {tab.icon(isActive)}
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className="absolute -top-1.5 -right-0.5 bg-[#ea4335] text-white text-[10px] font-num font-bold rounded-full min-w-[17px] h-[17px] px-1 flex items-center justify-center ring-2 ring-[#090b0e]">
                  {tab.badge}
                </span>
              )}
            </div>
            <span
              className={`text-[10.5px] font-semibold mt-0.5 whitespace-nowrap transition-colors ${
                isActive ? 'text-[#3897f0]' : 'text-[#8e9aa8]'
              }`}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
