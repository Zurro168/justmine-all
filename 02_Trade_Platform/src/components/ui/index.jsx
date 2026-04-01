import React from 'react';
import { X, MessageCircle, FileText } from 'lucide-react';
import { siteConfig } from '../../config/siteConfig';

export const ConsultModal = ({ isOpen, onClose, type = 'wecom' }) => {
  if (!isOpen) return null;
  const config = type === 'wecom' ? siteConfig.social.weCom : siteConfig.social.wechatPublic;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden max-w-sm w-full relative animate-in zoom-in-95 duration-300">
        <button onClick={onClose} className="absolute top-6 right-6 p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600">
          <X size={20} />
        </button>
        <div className="p-10 text-center">
          <div className="mb-6 inline-block p-4 bg-blue-50 rounded-3xl text-blue-600">
            {type === 'wecom' ? <MessageCircle size={32} /> : <FileText size={32} />}
          </div>
          <h3 className="text-xl font-black text-slate-900 mb-2">{config.name}</h3>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-8">{config.desc || config.id}</p>
          
          <div className="bg-slate-50 p-6 rounded-[2rem] border-2 border-slate-100 mb-8 aspect-square flex items-center justify-center">
             <img src={config.qrCode} alt="QR Code" className="w-full h-auto rounded-xl shadow-sm" />
          </div>
          
          <p className="text-[11px] text-slate-400 font-medium leading-relaxed px-4">
            使用微信扫描上方二维码<br />即可咨询方案或关注我们的最新动态
          </p>
        </div>
      </div>
    </div>
  );
};

export const SectionTitle = ({ title, subtitle }) => (
  <div className="mb-8">
    <h2 className="text-3xl font-bold text-slate-800 border-l-4 border-blue-600 pl-4">{title}</h2>
    {subtitle && <p className="text-slate-500 mt-2 ml-5">{subtitle}</p>}
  </div>
);

export const Card = ({ children, className = "", onClick }) => (
  <div onClick={onClick} className={`bg-white rounded-xl border border-slate-200 shadow-sm p-6 ${className} ${onClick ? 'cursor-pointer hover:border-blue-300 transition-colors' : ''}`}>
    {children}
  </div>
);

export const InfoIcon = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="12" y1="16" x2="12" y2="12"></line>
    <line x1="12" y1="8" x2="12.01" y2="8"></line>
  </svg>
);
