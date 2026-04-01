import React from 'react';
import { MapPin, Phone, Mail } from 'lucide-react';

// Official WeChat logo SVG (green #07C160)
const WeChatLogo = () => (
  <svg viewBox="0 0 40 40" width="20" height="20" fill="none">
    <ellipse cx="14.5" cy="17" rx="9.5" ry="7.5" fill="#07C160"/>
    <circle cx="11" cy="17" r="1.4" fill="white"/>
    <circle cx="16" cy="17" r="1.4" fill="white"/>
    <ellipse cx="25" cy="22" rx="8" ry="6" fill="#07C160" opacity="0.85"/>
    <circle cx="22.5" cy="22" r="1.2" fill="white"/>
    <circle cx="27" cy="22" r="1.2" fill="white"/>
  </svg>
);

// Official WeChat Work (企业微信) logo SVG (blue-green #1aad19 → corporate teal)
const WeComLogo = () => (
  <svg viewBox="0 0 40 40" width="20" height="20" fill="none">
    <rect x="6" y="8" width="28" height="22" rx="4" fill="#1E6FFF"/>
    <rect x="10" y="13" width="8" height="7" rx="2" fill="white" opacity="0.9"/>
    <rect x="22" y="13" width="8" height="7" rx="2" fill="white" opacity="0.9"/>
    <rect x="10" y="23" width="20" height="2.5" rx="1.2" fill="white" opacity="0.6"/>
    <rect x="17" y="29" width="6" height="3" rx="1" fill="#1E6FFF"/>
    <rect x="14" y="31.5" width="12" height="2" rx="1" fill="#1E6FFF"/>
  </svg>
);
import { useStore } from '../../store/useStore';
import { siteConfig } from '../../config/siteConfig';

const FOOTER_COLS = [
  {
    title: '关于正矿',
    links: [
      { label: '企业简介', tab: 'corporate' },
      { label: '组织架构', tab: 'orgchart' },
      { label: '发展历程', tab: 'history' },
      { label: '党建与社会责任', tab: 'party' },
      { label: '加入我们', tab: 'careers' },
    ]
  },
  {
    title: '行业情报',
    links: [
      { label: '行情中心', tab: 'market' },
      { label: '供应源动态', tab: 'supplywatch' },
      { label: '知识库', tab: 'knowledge' },
    ]
  },
  {
    title: '供应链服务',
    links: [
      { label: '全球海运追踪', tab: 'logistics' },
      { label: '供应链金融', tab: 'finance' },
    ]
  },
  {
    title: '协同工作台',
    links: [
      { label: '订单履约看板', tab: 'dashboard' },
      { label: '单证管理中心', tab: 'documents' },
      { label: '检验与结算', tab: 'settlement' },
      { label: '资金风控中心', tab: 'riskcontrol' },
    ]
  },
];

const Footer = () => {
  const { setActiveTab } = useStore();

  return (
    <footer className="bg-slate-900 text-slate-400 pt-16 pb-8 px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-6 gap-10">
        {/* Brand */}
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center gap-2 text-white">
            <img src={siteConfig.brand.logo} alt="logo" className="h-9 w-9 object-contain rounded-lg bg-white p-0.5" />
            <div>
              <div className="text-lg font-black leading-none">{siteConfig.brand.name}</div>
              <div className="text-[9px] text-slate-500 tracking-widest uppercase">{siteConfig.brand.englishFullName}</div>
            </div>
          </div>
          <p className="text-sm leading-relaxed">
            {siteConfig.brand.slogan}
          </p>
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2"><MapPin size={14} className="shrink-0 mt-0.5 text-blue-400" /><span>{siteConfig.contact.address}</span></div>
            <div className="flex items-center gap-2"><Phone size={14} className="text-blue-400" /><span>{siteConfig.contact.contactPerson} {siteConfig.contact.phone}</span></div>
            <div className="flex items-center gap-2"><Mail size={14} className="text-blue-400" /><span>{siteConfig.contact.email}</span></div>
          </div>
          <div className="flex gap-3 pt-1">
            <div className="relative group/qr">
              <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center hover:bg-[#07C160] transition cursor-pointer group" title="微信公众号">
                <WeChatLogo />
              </div>
              {/* QR Code Popup */}
              <div className="absolute bottom-full left-0 mb-3 w-32 bg-white p-2 rounded-xl shadow-2xl border border-slate-100 opacity-0 invisible group-hover/qr:opacity-100 group-hover/qr:visible transition-all scale-95 group-hover/qr:scale-100 z-50">
                <img src={siteConfig.social.wechatPublic.qrCode} alt="公众号二维码" className="w-full h-auto rounded-lg" onError={(e) => e.target.src='https://placehold.co/200?text=QR+CODE'} />
                <div className="text-[10px] text-slate-900 font-bold text-center mt-2">{siteConfig.social.wechatPublic.id}</div>
              </div>
            </div>

            <div className="relative group/qr">
              <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center hover:bg-[#1E6FFF] transition cursor-pointer group" title="企业微信">
                <WeComLogo />
              </div>
              {/* QR Code Popup */}
              <div className="absolute bottom-full left-0 mb-3 w-32 bg-white p-2 rounded-xl shadow-2xl border border-slate-100 opacity-0 invisible group-hover/qr:opacity-100 group-hover/qr:visible transition-all scale-95 group-hover/qr:scale-100 z-50">
                <img src={siteConfig.social.weCom.qrCode} alt="企业微信二维码" className="w-full h-auto rounded-lg" onError={(e) => e.target.src='https://placehold.co/200?text=WECOM+QR'} />
                <div className="text-[10px] text-slate-900 font-bold text-center mt-2">{siteConfig.social.weCom.desc}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Sitemap cols */}
        {FOOTER_COLS.map(col => (
          <div key={col.title}>
            <h4 className="text-white font-bold mb-4 uppercase text-[10px] tracking-widest">{col.title}</h4>
            <ul className="space-y-2.5 text-sm">
              {col.links.map(link => (
                <li key={link.tab}>
                  <button onClick={() => setActiveTab(link.tab)} className="hover:text-white transition text-left">{link.label}</button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="max-w-7xl mx-auto mt-12 pt-6 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center text-xs gap-3">
        <p>© 2024 {siteConfig.brand.fullName} 版权所有。{siteConfig.icp}</p>
        <div className="flex gap-5">
          <span className="hover:text-white cursor-pointer transition">隐私政策</span>
          <span className="hover:text-white cursor-pointer transition">服务条款</span>
          <span className="hover:text-white cursor-pointer transition">合规声明</span>
          <span className="hover:text-white cursor-pointer transition">网站地图</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
