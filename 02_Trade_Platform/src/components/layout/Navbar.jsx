import React, { useState } from 'react';
import { Home, TrendingUp, Building2, Database, Search, Bell, Languages, LogIn, Ship, BookOpen, ChevronDown, FileText, Shield, DollarSign, Anchor, MapPin, Award, Briefcase, BarChart3, Users2, Globe, Terminal } from 'lucide-react';
import { useStore } from '../../store/useStore';
import SearchModal from '../features/SearchModal';
import NotificationPanel from '../features/NotificationPanel';
import LoginModal from '../features/LoginModal';
import { siteConfig } from '../../config/siteConfig';

const NAV_GROUPS = [
  {
    id: 'home', label: '首页', icon: Home, single: true,
  },
  {
    id: 'about_group', label: '关于我们', icon: Building2,
    children: [
      { id: 'corporate', label: '企业简介', icon: Award, desc: '公司介绍、核心优势与合作伙伴' },
      { id: 'orgchart', label: '组织架构', icon: Users2, desc: '公司治理结构动态可视化' },
      { id: 'history', label: '发展历程', icon: MapPin, desc: '2010-2024 里程碑时间轴' },
      { id: 'party', label: '党建与社会责任', icon: Shield, desc: '党建引领 · ESG报告' },
      { id: 'careers', label: '加入我们', icon: Briefcase, desc: '开放职位与简历投递' },
    ]
  },
  {
    id: 'intelligence_group', label: '行业情报', icon: TrendingUp,
    children: [
      { id: 'market', label: '行情中心', icon: BarChart3, desc: '锆、钛、金红石、独居石价格走势' },
      { id: 'supplywatch', label: '供应源动态', icon: Globe, desc: '莫桑比克、澳洲、越南产区周报' },
      { id: 'knowledge', label: '知识库', icon: BookOpen, desc: '贸易实务 / 矿产专题 / 供应链金融' },
    ]
  },
  {
    id: 'services_group', label: '供应链服务', icon: Ship,
    children: [
      { id: 'logistics', label: '全球海运追踪', icon: Anchor, desc: 'AIS 船位可视化 · 港口拥堵监测' },
      { id: 'finance', label: '供应链金融', icon: DollarSign, desc: '信用证融资 · 应收账款 · 融资计算器' },
    ]
  },
  {
    id: 'workbench_group', label: '协同工作台', icon: Database,
    children: [
      { id: 'dashboard', label: '订单履约看板', icon: FileText, desc: '合同→船运→清关→提货全链路' },
      { id: 'documents', label: '单证管理中心', icon: FileText, desc: '提单、化验报告、原产地证流转' },
      { id: 'settlement', label: '检验与结算', icon: BarChart3, desc: '品位扣减结算看板 · 自动对账' },
      { id: 'riskcontrol', label: '资金风控中心', icon: Shield, desc: 'TT/LC 额度看板 · 付款节点甘特图' },
      { id: 'aiconsole', label: 'AI 智能总控', icon: Terminal, desc: 'OpenClaw 系统全链路运维监控' },
      { id: 'sandbox', label: '模拟对话沙盒', icon: Terminal, desc: '内网全员公共测试群，云端双工同步' },
    ]
  },
];

const UNREAD_COUNT = 2;

const Navbar = () => {
  const { activeTab, setActiveTab, isLoggedIn, user, login, logout } = useStore();
  const [openGroup, setOpenGroup] = useState(null);
  const [showSearch, setShowSearch] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  const handleTabClick = (id) => {
    setActiveTab(id);
    setOpenGroup(null);
    window.location.hash = `#/${id}`;
  };

  const isGroupActive = (group) =>
    group.children?.some(c => c.id === activeTab);

  return (
    <>
      <nav
        className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 px-6 py-3"
        onMouseLeave={() => setOpenGroup(null)}
      >
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          {/* Logo + Nav */}
          <div className="flex items-center gap-8">
            {/* Logo — 2x size */}
            <div className="flex items-center gap-3.5 cursor-pointer shrink-0" onClick={() => handleTabClick('home')}>
              <img src={siteConfig.brand.logo} alt={siteConfig.brand.name} className="h-14 w-14 object-contain rounded-2xl shadow-sm border border-slate-100" />
              <div className="flex flex-col justify-between h-14 py-0.5">
                <div className="text-2xl font-black tracking-tighter leading-tight text-slate-900">{siteConfig.brand.name}</div>
                <div className="text-xs text-slate-400 font-bold uppercase tracking-[0.2em] leading-none">{siteConfig.brand.englishName}</div>
              </div>
            </div>

            {/* Nav groups */}
            <div className="hidden lg:flex gap-0.5 text-sm font-medium">
              {NAV_GROUPS.map(group => (
                <div
                  key={group.id}
                  className="relative"
                  onMouseEnter={() => !group.single && setOpenGroup(group.id)}
                >
                  {group.single ? (
                    <button
                      onClick={() => handleTabClick(group.id)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all ${activeTab === group.id ? 'text-blue-600 bg-blue-50' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}
                    >
                      <group.icon size={14} /> {group.label}
                    </button>
                  ) : (
                    <>
                      <button
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all ${isGroupActive(group) ? 'text-blue-600 bg-blue-50' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}
                      >
                        <group.icon size={14} /> {group.label}
                        <ChevronDown size={12} className={`transition-transform duration-200 ${openGroup === group.id ? 'rotate-180' : ''}`} />
                      </button>

                      {openGroup === group.id && (
                        <div className="absolute top-full left-0 mt-1.5 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 min-w-[260px]"
                          style={{ animation: 'fadeInDown 0.15s ease' }}>
                          {group.children.map(child => (
                            <button
                              key={child.id}
                              onClick={() => handleTabClick(child.id)}
                              className={`w-full text-left px-4 py-2.5 hover:bg-slate-50 transition-colors flex items-start gap-3 ${activeTab === child.id ? 'bg-blue-50' : ''}`}
                            >
                              <div className={`mt-0.5 p-1.5 rounded-lg ${activeTab === child.id ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
                                <child.icon size={13} />
                              </div>
                              <div>
                                <div className={`font-semibold text-sm ${activeTab === child.id ? 'text-blue-600' : 'text-slate-800'}`}>{child.label}</div>
                                <div className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{child.desc}</div>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {/* Search — functional */}
            <button
              onClick={() => setShowSearch(true)}
              className="p-2 hover:bg-slate-100 rounded-full transition text-slate-500 hover:text-blue-600"
              title="全局搜索 (Ctrl+K)"
            >
              <Search size={18} />
            </button>

            {/* Notifications — functional */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(v => !v)}
                className={`p-2 hover:bg-slate-100 rounded-full transition relative ${showNotifications ? 'text-blue-600 bg-blue-50' : 'text-slate-500'}`}
                title="消息通知"
              >
                <Bell size={18} />
                {UNREAD_COUNT > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[9px] text-white font-black">
                    {UNREAD_COUNT}
                  </span>
                )}
              </button>
              {showNotifications && <NotificationPanel onClose={() => setShowNotifications(false)} />}
            </div>

            <div className="h-5 w-px bg-slate-200 mx-1" />
            <button className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-blue-600 transition px-2 py-1 rounded hover:bg-slate-50">
              <Languages size={14} /> 中/EN
            </button>
            {isLoggedIn && user ? (
              <div className="flex items-center gap-2 ml-1 relative group">
                <div 
                  className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shadow-sm cursor-pointer transition-all border-2 ${
                    user.category === 'EMPLOYEE' ? 'bg-blue-600 text-white border-blue-200' :
                    user.category === 'UPSTREAM' ? 'bg-emerald-600 text-white border-emerald-200' :
                    user.category === 'DOWNSTREAM' ? 'bg-amber-600 text-white border-amber-200' :
                    'bg-indigo-600 text-white border-indigo-200'
                  }`}
                >
                  {user.avatar}
                </div>
                
                {/* Profile Dropdown on Hover */}
                <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 p-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-[60]">
                  <div className="font-bold text-slate-900 text-sm">{user.name}</div>
                  <div className="text-[10px] text-slate-500 font-medium uppercase tracking-wider mb-2">{user.role} · {user.company}</div>
                  <div className="h-px bg-slate-100 my-2" />
                  <button 
                    onClick={logout} 
                    className="w-full text-left text-xs text-red-500 hover:text-red-700 font-bold transition flex items-center gap-2"
                  >
                    <LogIn size={14} className="rotate-180" /> 退出登录
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={() => setShowLogin(true)} className="bg-slate-900 text-white px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 hover:bg-slate-800 transition shadow ml-1">
                <LogIn size={13} /> 登录
              </button>
            )}
          </div>
        </div>
        <style>{`@keyframes fadeInDown { from { opacity:0; transform:translateY(-6px); } to { opacity:1; transform:translateY(0); } }`}</style>
      </nav>

      {/* Search Modal — rendered outside nav for z-index */}
      {showSearch && <SearchModal onClose={() => setShowSearch(false)} />}
      <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} />
    </>
  );
};

export default Navbar;
