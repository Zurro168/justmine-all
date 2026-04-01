import React, { useState, useMemo, useEffect } from 'react';
import { Search, BookOpen, Anchor, TrendingUp, DollarSign, FileText, ChevronRight, Download, Tag, ArrowLeft, Clock, Calendar, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useStore } from '../store/useStore';
import { siteConfig } from '../config/siteConfig';
import { ConsultModal } from '../components/ui';

// Statically imported — updated by `npm run sync-kb` from Obsidian vault
import obsidianRaw from '../data/kb-articles.json';

const BUILTIN_ARTICLES = [
  // === International Trade ===
  {
    id: 901, category: 'trade', tag: 'Incoterms 2020',
    title: 'Incoterms® 2020 条款详解与适用场景',
    excerpt: '从 EXW 到 DDP，全面梳理 11 种贸易术语的风险分界点、费用承担及适用场景，附高清对比图表。',
    readTime: '12 min', hasDownload: true,
    body: `
## 核心风险分界点测试

| 术语 | 卖方风险终止于 | 费用承担 |
|---|---|---|
| **EXW** | 卖方仓库/工厂门口 | 买方承担几乎全部 |
| **FOB** | 装运港货物越过船舷 | 买方负责运费+保险 |

## 概述
Incoterms® 2020 是国际商会（ICC）发布的国际贸易术语解释通则。详细内容正在补充中...`,
  }
];

// Merge: Obsidian articles first (they override by title), then built-ins not already covered
const obsidianTitles = new Set((obsidianRaw || []).map(a => a.title));
const KB_DATA = [
  ...(obsidianRaw || []),
  ...BUILTIN_ARTICLES.filter(a => !obsidianTitles.has(a.title)),
].map((item, idx) => ({ ...item, id: item.id || `kb-${idx}` }));

const CATEGORIES = [
  { id: 'all', label: '全部内容', icon: BookOpen, count: KB_DATA.length },
  { id: 'trade', label: '国际贸易实务', icon: Anchor, count: KB_DATA.filter(a => a.category === 'trade').length },
  { id: 'mineral', label: '锆钛矿专题', icon: TrendingUp, count: KB_DATA.filter(a => a.category === 'mineral').length },
  { id: 'finance', label: '供应链金融', icon: DollarSign, count: KB_DATA.filter(a => a.category === 'finance').length },
];

const categoryColors = {
  trade: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-500' },
  mineral: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' },
  finance: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
};

const KnowledgeBase = () => {
  const { selectedKBArticle, setSelectedKBArticle } = useStore();
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showConsult, setShowConsult] = useState(false);

  // Scroll to top when article is selected
  useEffect(() => {
    if (selectedKBArticle) window.scrollTo(0, 0);
  }, [selectedKBArticle]);

  const filtered = useMemo(() => {
    return KB_DATA.filter(item => {
      const matchCat = activeCategory === 'all' || item.category === activeCategory;
      const q = searchQuery.toLowerCase();
      const matchSearch = !q || 
        item.title.toLowerCase().includes(q) || 
        (item.excerpt && item.excerpt.toLowerCase().includes(q)) || 
        (item.tag && item.tag.toLowerCase().includes(q));
      return matchCat && matchSearch;
    });
  }, [activeCategory, searchQuery]);

  // Article Reader Component
  if (selectedKBArticle) {
    const colors = categoryColors[selectedKBArticle.category] || categoryColors.trade;
    return (
      <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
        {/* Reader Header */}
        <div className="mb-8 flex items-center justify-between">
          <button 
            onClick={() => setSelectedKBArticle(null)}
            className="group flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors font-semibold"
          >
            <div className="p-2 rounded-full bg-white border border-slate-200 group-hover:border-blue-200 group-hover:bg-blue-50 transition-all">
              <ArrowLeft size={18} />
            </div>
            返回中心
          </button>

          <div className="flex gap-2">
            {selectedKBArticle.hasDownload && (
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-sm font-bold border border-blue-100 hover:bg-blue-100 transition">
                <Download size={16} /> 下载 PDF
              </button>
            )}
          </div>
        </div>

        {/* Article Cover Area */}
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm mb-10">
          <div className={`h-2 ${colors.dot}`} />
          <div className="p-8 md:p-12">
            <div className="flex items-center gap-3 mb-6">
              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${colors.bg} ${colors.text} ${colors.border}`}>
                {selectedKBArticle.tag}
              </span>
              <div className="flex items-center gap-4 text-xs text-slate-400 font-bold uppercase tracking-wider">
                <span className="flex items-center gap-1"><Clock size={14} /> {selectedKBArticle.readTime}</span>
                <span className="flex items-center gap-1"><Calendar size={14} /> {selectedKBArticle.updatedAt || '2024-03-12'}</span>
              </div>
            </div>
            
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-6 leading-tight">
              {selectedKBArticle.title}
            </h1>
            
            <p className="text-lg text-slate-500 leading-relaxed italic border-l-4 border-slate-100 pl-6 mb-12">
              {selectedKBArticle.excerpt}
            </p>

            <div className="prose prose-slate prose-blue max-w-none 
              prose-headings:font-black prose-headings:text-slate-900 prose-headings:mb-6
              prose-p:text-slate-600 prose-p:leading-8 prose-p:mb-6 prose-p:text-[1.05rem]
              prose-li:text-slate-600 prose-li:mb-2 prose-li:text-[1.05rem]
              prose-strong:text-slate-900 prose-strong:font-bold
              prose-table:w-full prose-table:my-10 prose-table:border-collapse prose-table:rounded-2xl prose-table:overflow-hidden prose-table:border-2 prose-table:border-slate-50
              prose-thead:bg-slate-900
              prose-th:px-6 prose-th:py-5 prose-th:text-xs prose-th:font-black prose-th:uppercase prose-th:tracking-widest prose-th:text-left prose-th:text-white
              prose-td:px-6 prose-td:py-5 prose-td:border-b prose-td:border-slate-50 prose-td:text-sm prose-td:text-slate-600 prose-td:font-medium
              prose-tr:transition-colors hover:prose-tr:bg-blue-50/30
              prose-blockquote:border-l-4 prose-blockquote:border-blue-500 prose-blockquote:bg-blue-50/50 prose-blockquote:p-8 prose-blockquote:rounded-r-2xl prose-blockquote:italic prose-blockquote:my-10
              prose-img:rounded-3xl prose-img:shadow-lg
              prose-pre:bg-slate-900 prose-pre:rounded-2xl prose-pre:p-6
            ">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {selectedKBArticle.body || selectedKBArticle.content || '内容正在加载中...'}
              </ReactMarkdown>
            </div>
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="flex flex-col md:flex-row items-center justify-between p-8 bg-slate-50 rounded-2xl border border-slate-100 mb-10 gap-4">
          <div className="text-sm text-slate-500">
            <span className="font-bold text-slate-900 uppercase tracking-tighter mr-2">DISCLAIMER</span> 
            知识库内容由{siteConfig.brand.name}分析团队提供，仅供业务参考。
          </div>
          <button 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-2 text-blue-600 font-bold text-sm hover:text-blue-700 transition"
          >
            回到顶部 <Sparkles size={16} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      {/* Header */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 p-10 text-white shadow-2xl shadow-blue-900/10">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, #3b82f6 0%, transparent 50%), radial-gradient(circle at 80% 80%, #6366f1 0%, transparent 50%)' }} />
        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-600 rounded-xl"><BookOpen size={20} /></div>
            <span className="text-blue-300 text-sm font-semibold uppercase tracking-widest">Knowledge Base · 知识库</span>
          </div>
          <h1 className="text-3xl font-black mb-3 leading-tight">{siteConfig.brand.name}贸易实务<br/>知识中心</h1>
          <p className="text-slate-300 text-sm leading-relaxed mb-8">
            覆盖国际贸易实务、锆钛矿专题与供应链金融三大领域，为您的每一笔交易提供专业知识支撑。
          </p>
          {/* Search bar */}
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="搜索贸易术语、品位规格、融资工具..."
              className="w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-xl pl-11 pr-4 py-3.5 text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white/15 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex gap-3 flex-wrap">
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all ${activeCategory === cat.id ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'}`}
          >
            <cat.icon size={15} />
            {cat.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${activeCategory === cat.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>{cat.count}</span>
          </button>
        ))}
        {searchQuery && (
          <div className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 text-blue-700 rounded-xl text-sm border border-blue-200">
            <Search size={14} /> 搜索 "{searchQuery}"：找到 {filtered.length} 篇
          </div>
        )}
      </div>

      {/* Article Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map(article => {
            const colors = categoryColors[article.category] || categoryColors.trade;
            return (
              <div 
                key={article.id} 
                onClick={() => setSelectedKBArticle(article)}
                className="group bg-white rounded-2xl border border-slate-200 hover:border-slate-300 hover:shadow-xl transition-all overflow-hidden cursor-pointer flex flex-col"
              >
                <div className={`${colors.bg} px-5 pt-5 pb-4 border-b ${colors.border}`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${colors.bg} ${colors.text} border ${colors.border}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
                      <Tag size={10} /> {article.tag}
                    </span>
                    {article.hasDownload && (
                      <span className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-blue-600 transition">
                        <Download size={11} /> PDF
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-slate-800 text-base leading-snug group-hover:text-blue-700 transition-colors uppercase-first">{article.title}</h3>
                </div>
                <div className="px-5 py-4 flex-1 flex flex-col">
                  <p className="text-sm text-slate-500 leading-relaxed flex-1 line-clamp-3 mb-4">{article.excerpt}</p>
                  <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-100">
                    <span className="text-xs text-slate-400 flex items-center gap-1 font-bold">
                      <Clock size={11} /> READ: {article.readTime}
                    </span>
                    <button className="flex items-center gap-1 text-xs text-blue-600 font-bold hover:gap-2 transition-all">
                      阅读全文 <ChevronRight size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 text-slate-400">
          <Search size={40} className="mx-auto mb-4 opacity-30" />
          <p className="font-medium">未找到相关内容</p>
          <p className="text-sm mt-1">试试更换搜索关键词</p>
        </div>
      )}

      {/* FAQ / Submit question */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-10 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl shadow-blue-500/20">
        <div>
          <h3 className="text-2xl font-black mb-2 flex items-center gap-3">
            没有找到您的问题？ <Sparkles size={24} />
          </h3>
          <p className="text-blue-100 text-sm max-w-md">提交您的贸易问题，我们的专业团队将在 24 小时内给您专属解答，助力业务精准决策。</p>
        </div>
        <button 
          onClick={() => setShowConsult(true)}
          className="shrink-0 bg-white text-blue-700 font-black px-8 py-4 rounded-xl hover:bg-blue-50 transition shadow-lg flex items-center gap-2 group"
        >
          <FileText size={18} className="group-hover:scale-110 transition-transform" /> 提交专业咨询
        </button>
      </div>
      <ConsultModal isOpen={showConsult} onClose={() => setShowConsult(false)} type="public" />
      <div className="mt-8 text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center">
        Data Source: kb-articles.json (Synced from Zhengkuang Intelligence Vault)
      </div>
    </div>
  );
};

export default KnowledgeBase;
