import React, { useState, useEffect, useMemo } from 'react';
import { X, Search, FileText, BarChart3, BookOpen, Ship, DollarSign, Shield, Building2, MapPin } from 'lucide-react';
import { useStore } from '../../store/useStore';

const SEARCH_INDEX = [
  // Pages
  { type: 'page', label: '首页', tab: 'home', icon: Building2, desc: '正矿供应链主页' },
  { type: 'page', label: '行情中心', tab: 'market', icon: BarChart3, desc: '锆英砂、钛精矿、金红石价格趋势' },
  { type: 'page', label: '全球海运追踪', tab: 'logistics', icon: Ship, desc: '在途船舶 AIS 可视化平台' },
  { type: 'page', label: '供应链金融', tab: 'finance', icon: DollarSign, desc: '信用证融资、应收账款、库存质押' },
  { type: 'page', label: '知识库', tab: 'knowledge', icon: BookOpen, desc: '贸易实务 / 矿产专题 / 供应链金融' },
  { type: 'page', label: '企业简介', tab: 'corporate', icon: Building2, desc: '公司介绍、核心优势' },
  { type: 'page', label: '组织架构', tab: 'orgchart', icon: Building2, desc: '公司治理结构图' },
  { type: 'page', label: '单证管理中心', tab: 'documents', icon: FileText, desc: '提单、化验报告、原产地证流转' },
  { type: 'page', label: '资金风控中心', tab: 'riskcontrol', icon: Shield, desc: '授信额度 · 付款节点预警' },
  { type: 'page', label: '供应源动态', tab: 'supplywatch', icon: MapPin, desc: '莫桑比克、澳洲、越南产区周报' },
  // KB articles
  { type: 'kb', label: 'Incoterms® 2020 条款详解', tab: 'knowledge', icon: BookOpen, desc: '贸易术语 · 风险划分图' },
  { type: 'kb', label: '散货海运全流程', tab: 'knowledge', icon: BookOpen, desc: '整柜/散货 · 提单 · AMS/ENS' },
  { type: 'kb', label: '信用证审单要点速查', tab: 'knowledge', icon: BookOpen, desc: '单证相符原则 · 银行拒付TOP10' },
  { type: 'kb', label: '锆英砂规格与品位标准', tab: 'knowledge', icon: BookOpen, desc: 'ZrO₂+HfO₂含量 · 杂质限制' },
  { type: 'kb', label: '钛精矿技术规格详解', tab: 'knowledge', icon: BookOpen, desc: 'TiO₂含量 · 放射性限值' },
  { type: 'kb', label: '品位结算机制：湿吨→干吨', tab: 'knowledge', icon: BookOpen, desc: '水分折算 · 品位扣减 · 对账单' },
  { type: 'kb', label: 'T/T预付款风控设计', tab: 'knowledge', icon: BookOpen, desc: '提单控货权 · 化验报告条件' },
  // Products
  { type: 'product', label: '锆英砂 Zircon Sand', tab: 'market', icon: BarChart3, desc: '当前报价 ¥17,200/MT · ZrO₂≥65%' },
  { type: 'product', label: '钛精矿 Ilmenite', tab: 'market', icon: BarChart3, desc: '当前报价 ¥2,850/MT · TiO₂≥50%' },
  { type: 'product', label: '金红石 Rutile', tab: 'market', icon: BarChart3, desc: '当前报价 $1,680/MT · TiO₂≥96%' },
];

const TYPE_LABELS = { page: '页面', kb: '知识库', product: '产品行情' };
const TYPE_COLORS = {
  page: 'bg-blue-100 text-blue-700',
  kb: 'bg-amber-100 text-amber-700',
  product: 'bg-emerald-100 text-emerald-700',
};

const SearchModal = ({ onClose }) => {
  const [query, setQuery] = useState('');
  const { setActiveTab } = useStore();

  const results = useMemo(() => {
    if (query.trim().length < 1) return [];
    const q = query.toLowerCase();
    return SEARCH_INDEX.filter(
      item => item.label.toLowerCase().includes(q) || item.desc.toLowerCase().includes(q)
    ).slice(0, 8);
  }, [query]);

  useEffect(() => {
    const handleKey = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const navigate = (tab) => { setActiveTab(tab); onClose(); };

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-20 px-4" onClick={onClose}>
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Input */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
          <Search size={18} className="text-slate-400 shrink-0" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="搜索页面、知识库文章、矿产产品…"
            className="flex-1 text-slate-800 text-sm font-medium outline-none placeholder-slate-400"
          />
          {query && <button onClick={() => setQuery('')} className="text-slate-300 hover:text-slate-500 transition"><X size={16} /></button>}
          <button onClick={onClose} className="text-xs text-slate-400 border border-slate-200 px-2 py-0.5 rounded font-mono hover:bg-slate-50">ESC</button>
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto">
          {query.trim().length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-slate-400">
              <Search size={32} className="mx-auto mb-2 opacity-20" />
              输入关键词搜索页面、知识库或产品
            </div>
          ) : results.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-slate-400">未找到相关内容，请换个关键词</div>
          ) : (
            <div className="py-2">
              {results.map((item, i) => (
                <button
                  key={i}
                  onClick={() => navigate(item.tab)}
                  className="w-full text-left flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 transition-colors"
                >
                  <div className="p-2 bg-slate-100 rounded-lg shrink-0 text-slate-500"><item.icon size={16} /></div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-slate-800 truncate">{item.label}</div>
                    <div className="text-xs text-slate-400 truncate mt-0.5">{item.desc}</div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${TYPE_COLORS[item.type]}`}>
                    {TYPE_LABELS[item.type]}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex gap-4 text-[11px] text-slate-400">
          <span>↑↓ 导航</span><span>↵ 跳转</span><span>ESC 关闭</span>
        </div>
      </div>
    </div>
  );
};

export default SearchModal;
