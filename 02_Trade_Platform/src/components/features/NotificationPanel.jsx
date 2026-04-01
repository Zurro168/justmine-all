import React, { useEffect, useRef } from 'react';
import { Bell, CheckCheck, AlertTriangle, Info, X } from 'lucide-react';

const NOTIFICATIONS = [
  { id: 1, type: 'warning', title: 'TT尾款逾期提醒', body: 'ORD-2024000 TT尾款已逾期6天，请及时跟进！', time: '2小时前', read: false },
  { id: 2, type: 'info', title: '提单电放通知', body: '您的提单 #BL4492 已完成电放，请安排提货。', time: '5小时前', read: false },
  { id: 3, type: 'success', title: '整单结算完成', body: 'ORD-2024003 已完成品位结算，对账单已生成。', time: '1天前', read: true },
  { id: 4, type: 'info', title: '港口拥堵预警', body: '连云港拥堵系数 α=1.18，ETA可能延迟24-48h。', time: '1天前', read: true },
  { id: 5, type: 'warning', title: '付款节点 - 14天', body: 'ORD-2024001 LC承兑 ¥320万 将于7月20日到期。', time: '2天前', read: true },
];

const TYPE_ICON = {
  warning: { Icon: AlertTriangle, bg: 'bg-orange-100', text: 'text-orange-600' },
  info:    { Icon: Info,          bg: 'bg-blue-100',   text: 'text-blue-600' },
  success: { Icon: CheckCheck,    bg: 'bg-green-100',  text: 'text-green-600' },
};

const NotificationPanel = ({ onClose }) => {
  const ref = useRef(null);
  const unread = NOTIFICATIONS.filter(n => !n.read).length;

  useEffect(() => {
    const handleClick = e => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  return (
    <div ref={ref} className="absolute right-0 top-full mt-2 w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden"
      style={{ animation: 'fadeInDown 0.15s ease' }}>
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <div className="flex items-center gap-2 font-bold text-slate-800">
          <Bell size={17} /> 消息通知
          {unread > 0 && <span className="bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">{unread}</span>}
        </div>
        <div className="flex items-center gap-3">
          <button className="text-xs text-blue-600 hover:underline font-medium">全部标已读</button>
          <button onClick={onClose}><X size={16} className="text-slate-400 hover:text-slate-600 transition" /></button>
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto divide-y divide-slate-50">
        {NOTIFICATIONS.map(n => {
          const t = TYPE_ICON[n.type];
          return (
            <div key={n.id} className={`flex gap-3 px-5 py-4 hover:bg-slate-50 transition-colors ${!n.read ? 'bg-blue-50/40' : ''}`}>
              <div className={`w-8 h-8 rounded-full ${t.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                <t.Icon size={14} className={t.text} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-semibold text-sm text-slate-800">{n.title}</span>
                  {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />}
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">{n.body}</p>
                <span className="text-[10px] text-slate-400 mt-1 block">{n.time}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 text-center">
        <button className="text-xs text-blue-600 font-semibold hover:underline">查看全部消息</button>
      </div>
    </div>
  );
};

export default NotificationPanel;
