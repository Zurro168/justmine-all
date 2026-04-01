import React, { useState, useMemo } from 'react';
import { SectionTitle, Card } from '../components/ui';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, ReferenceLine, Label
} from 'recharts';
import { 
  TrendingUp, TrendingDown, ArrowRight, Activity, 
  Globe, AlertCircle, Zap, BookOpen, ChevronRight, 
  ExternalLink, MousePointer2
} from 'lucide-react';
import obsidianData from '../data/kb-articles.json';
import mineralPrices from '../data/mineral-prices.json';
import { useStore } from '../store/useStore';

const PRICE_DATA = mineralPrices;

const PRODUCTS = [
  { 
    id: 'zircon', 
    label: '锆英砂 (Zircon)', 
    color: '#3b82f6', 
    unit: 'CNY/MT', 
    spec: 'ZrO₂+HfO₂ ≥ 65%', 
    desc: '澳洲/莫桑比克产优质锆砂，供陶瓷及耐材行业',
    indicators: [
      { label: '库存周转', val: '12', unit: 'Days', trend: 'down' },
      { label: '月均涨幅', val: '+2.4', unit: '%', trend: 'up' },
    ]
  },
  { 
    id: 'titanium', 
    label: '钛精矿 (Ilmenite)', 
    color: '#8b5cf6', 
    unit: 'CNY/MT', 
    spec: 'TiO₂ ≥ 50%', 
    desc: '全球主流产区钛颗粒，供海绵钛及钛白粉行业',
    indicators: [
      { label: '港口库存', val: '1.2', unit: 'M MT', trend: 'up' },
      { label: '开工率', val: '92', unit: '%', trend: 'up' },
    ]
  },
  { 
    id: 'rutile', 
    label: '金红石 (Rutile)', 
    color: '#f59e0b', 
    unit: 'CNY/MT', 
    spec: 'TiO₂ ≥ 92%-95%', 
    desc: '高品位天然金红石，供高端焊接材料及钛包粉',
    indicators: [
      { label: '现货紧缺度', val: 'High', unit: '', trend: 'up' },
      { label: '下游需求', val: 'Strong', unit: '', trend: 'up' },
    ]
  },
  { 
    id: 'monazite', 
    label: '独居石 (Monazite)', 
    color: '#10b981', 
    unit: 'CNY/MT', 
    spec: 'REO ≥ 55%', 
    desc: '澳洲及非洲产稀土共生矿，重要的稀土提取原料',
    indicators: [
      { label: '稀土含量', val: '58', unit: '%', trend: 'stable' },
      { label: '监管强度', val: 'Strict', unit: '', trend: 'up' },
    ]
  },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-white/10 backdrop-blur-md">
        <div className="text-[10px] font-black uppercase text-slate-400 mb-1">{label}</div>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full" style={{ background: payload[0].color }} />
          <span className="text-lg font-black">{payload[0].value.toLocaleString()}</span>
          <span className="text-[10px] text-slate-400">CNY/MT</span>
        </div>
        {data.event && (
          <div className="mt-2 pt-2 border-t border-white/10 flex items-start gap-2">
            <Zap size={12} className="text-amber-400 shrink-0 mt-0.5" />
            <div className="text-[11px] text-amber-100 font-bold">{data.event}</div>
          </div>
        )}
      </div>
    );
  }
  return null;
};

const MarketPage = ({ mode = 'prices' }) => {
  const { setActiveTab, setSelectedKBArticle } = useStore();
  const [activeProduct, setActiveProduct] = useState('zircon');
  const [selectedPoint, setSelectedPoint] = useState(null);

  const product = PRODUCTS.find(p => p.id === activeProduct);

  const isSupplyMode = mode === 'supply';

  // Filter Obsidian articles related to supply/market
  const relatedArticles = useMemo(() => {
    return obsidianData.filter(a => 
      a.category === 'mineral' || 
      a.title.includes('供应') || 
      a.title.includes('动态') ||
      a.title.includes('锆') ||
      a.title.includes('钛')
    ).slice(0, 3);
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <SectionTitle 
        title={isSupplyMode ? "供应源实时动态" : "行业行情中心"} 
        subtitle={isSupplyMode ? "全球矿区产能追踪 · 关键节点风险预警 · 供应链确定性分析" : "海量多维数据追踪 · 产区动态实时联动 · 价格趋势辅助决策"} 
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Product Selector & Summary */}
        <div className="lg:col-span-3 space-y-4">
          {PRODUCTS.map(p => {
            const isActive = activeProduct === p.id;
            return (
              <div 
                key={p.id}
                onClick={() => setActiveProduct(p.id)}
                className={`p-6 rounded-3xl border-2 cursor-pointer transition-all ${
                  isActive ? 'border-blue-600 bg-white shadow-xl -translate-y-1' : 'border-slate-100 bg-slate-50/50 hover:bg-white hover:border-slate-200'
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className={`p-3 rounded-2xl ${isActive ? 'bg-blue-600 text-white' : 'bg-white text-slate-400'}`}>
                    <Activity size={20} />
                  </div>
                  <div className={`text-xs font-black uppercase flex items-center gap-1 ${isActive ? 'text-blue-600' : 'text-slate-400'}`}>
                    {isActive && <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-ping" />}
                    Active
                  </div>
                </div>
                <h4 className="font-black text-slate-900 text-lg mb-1">{p.label}</h4>
                <p className="text-[11px] text-slate-500 leading-relaxed mb-4">{p.desc}</p>
                
                <div className="grid grid-cols-2 gap-2">
                   {p.indicators.map(ind => (
                     <div key={ind.label} className="bg-slate-100/50 rounded-xl p-2.5">
                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">{ind.label}</div>
                        <div className="text-sm font-black text-slate-800">{ind.val}<span className="text-[9px] font-medium ml-0.5">{ind.unit}</span></div>
                     </div>
                   ))}
                </div>
              </div>
            );
          })}

          <Card className="bg-slate-900 border-none p-6 text-white overflow-hidden relative">
             <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl -mr-16 -mt-16" />
             <div className="relative z-10">
                <div className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-4">矿产指数监控 (ZTI)</div>
                <div className="text-4xl font-black mb-1">1,284.5</div>
                <div className="flex items-center gap-2 text-emerald-400 text-sm font-bold">
                   <TrendingUp size={16} /> +4.2% <span className="text-slate-500 font-medium text-xs">Since last month</span>
                </div>
                <div className="mt-6 pt-6 border-t border-white/10 flex items-center justify-between group cursor-pointer" onClick={() => {
                   setActiveTab('knowledge');
                   setSelectedKBArticle(null); // Just go to KB home
                }}>
                   <span className="text-[10px] font-black uppercase text-slate-400">调阅深度分析报告</span>
                   <ChevronRight size={14} className="text-slate-600 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                </div>
             </div>
          </Card>
        </div>

        {/* Middle: Professional Chart */}
        <div className="lg:col-span-9 space-y-8">
          <Card className="shadow-2xl shadow-slate-200/50 border-none p-8 overflow-visible">
             <div className="flex justify-between items-center mb-10">
                <div>
                   <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
                      {product.label} 趋势分析中心
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-600 rounded text-[10px] font-black uppercase tracking-widest">REAL-TIME DATA</span>
                   </h3>
                   <p className="text-xs text-slate-400 mt-1 uppercase font-bold tracking-tight">指标: {product.spec} · 单位: {product.unit}</p>
                </div>
                <div className="flex gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                   {['Week', 'Month', 'Quarter', 'Year'].map(t => (
                     <button key={t} className={`px-4 py-1.5 rounded-xl text-[11px] font-black transition-all ${t === 'Quarter' ? 'bg-white text-blue-600 shadow-sm ring-1 ring-slate-100' : 'text-slate-400 hover:text-slate-600'}`}>{t}</button>
                   ))}
                </div>
             </div>

             <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart 
                    data={PRICE_DATA}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    onMouseMove={(state) => {
                      if (state.activePayload) {
                        setSelectedPoint(state.activePayload[0].payload);
                      }
                    }}
                  >
                    <defs>
                      <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={product.color} stopOpacity={0.15}/>
                        <stop offset="95%" stopColor={product.color} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="month" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }}
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }}
                      domain={['auto', 'auto']}
                      dx={-10}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    
                    {/* Event lines */}
                    {PRICE_DATA.filter(d => d.event).map(d => (
                      <ReferenceLine 
                        key={d.month} 
                        x={d.month} 
                        stroke="#e2e8f0" 
                        strokeDasharray="3 3"
                      />
                    ))}

                    <Area 
                      type="monotone" 
                      dataKey={activeProduct} 
                      stroke={product.color} 
                      strokeWidth={4} 
                      fillOpacity={1} 
                      fill="url(#colorPrice)"
                      dot={{ r: 4, strokeWidth: 2, fill: 'white' }}
                      activeDot={{ r: 7, strokeWidth: 3, fill: 'white', stroke: product.color }}
                      animationDuration={1500}
                    />
                  </AreaChart>
                </ResponsiveContainer>
             </div>

              <div className="mt-8 pt-8 border-t border-slate-50 flex items-center justify-between">
                <div className="flex gap-8">
                   <div className="flex flex-col">
                      <span className="text-[10px] font-black text-slate-400 uppercase mb-1">当前行情预估</span>
                      <span className="text-2xl font-black text-slate-900">
                        {PRICE_DATA[PRICE_DATA.length - 1][activeProduct].toLocaleString()}
                        <span className="text-xs font-medium text-slate-400 ml-1">CNY/MT</span>
                      </span>
                   </div>
                   <div className="flex flex-col">
                      <span className="text-[10px] font-black text-slate-400 uppercase mb-1">价格分位数 (3Y)</span>
                      <span className="text-2xl font-black text-blue-600">
                         High
                         <Activity size={16} className="inline ml-1" />
                      </span>
                   </div>
                </div>
                <div className="flex gap-4 items-center">
                  <div className="text-right hidden sm:block">
                     <div className="text-[10px] font-black text-slate-400 uppercase">数据来源</div>
                     <div className="text-[11px] font-bold text-slate-800 uppercase italic">Origin: /assets/data/mineral-price-history.md</div>
                  </div>
                    <MousePointer2 className="text-slate-200" size={32} />
                </div>
             </div>
          </Card>

          {/*联动 Obsidian 知识库*/}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <Card className="border-none shadow-xl shadow-slate-200/40 p-8">
                <div className="flex items-center justify-between mb-6">
                   <h4 className="text-lg font-black text-slate-900 flex items-center gap-2">
                      <BookOpen className="text-blue-600" size={20} />
                      深度研判与产区周报
                   </h4>
                   <button 
                    onClick={() => setActiveTab('knowledge')}
                    className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline"
                   >
                    View All
                   </button>
                </div>
                <div className="space-y-4">
                   {relatedArticles.length > 0 ? (
                     relatedArticles.map((art, idx) => (
                       <div 
                         key={idx}
                         onClick={() => {
                           setActiveTab('knowledge');
                           setSelectedKBArticle(art);
                         }}
                         className="group p-4 bg-slate-50 rounded-2xl border border-transparent hover:border-blue-100 hover:bg-white transition-all cursor-pointer"
                       >
                          <div className="flex justify-between items-start">
                             <div className="flex-1">
                                <div className="text-[9px] font-black text-blue-500 uppercase tracking-tighter mb-1">知识库 · {art.category === 'mineral' ? '矿产专题' : '行业快讯'}</div>
                                <h5 className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition-colors line-clamp-1">{art.title}</h5>
                             </div>
                             <ExternalLink size={12} className="text-slate-300 group-hover:text-blue-400" />
                          </div>
                       </div>
                     ))
                   ) : (
                     <div className="text-center py-6 text-slate-400 italic text-sm">暂无相关深度报告</div>
                   )}
                </div>
             </Card>

             <Card className="bg-gradient-to-br from-blue-600 to-indigo-700 border-none p-8 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                   <Globe size={160} />
                </div>
                <div className="relative z-10">
                   <h4 className="text-lg font-black mb-4">全球产区实时雷达</h4>
                   <div className="space-y-5">
                      {[
                        { region: '莫桑比克', status: '供应持续', risk: 'Low', color: 'bg-emerald-400', p: '85%' },
                        { region: '南非', status: '开采受限', risk: 'Medium', color: 'bg-amber-400', p: '55%' },
                        { region: '塞拉利昂', status: '出口激增', risk: 'Low', color: 'bg-emerald-400', p: '92%' },
                        { region: '尼日利亚', status: '港口待箱', risk: 'High', color: 'bg-red-400', p: '25%' },
                      ].map(r => (
                        <div key={r.region} className="flex flex-col gap-1.5">
                           <div className="flex justify-between items-center text-xs font-black">
                              <span>{r.region}</span>
                              <span className="text-[10px] uppercase opacity-70">Risk: {r.risk}</span>
                           </div>
                           <div className="flex items-center gap-3">
                              <div className="flex-1 bg-white/10 h-1.5 rounded-full overflow-hidden">
                                 <div className={`h-full ${r.color}`} style={{ width: r.p }} />
                              </div>
                              <span className="text-[10px] font-mono leading-none">{r.status}</span>
                           </div>
                        </div>
                      ))}
                   </div>
                </div>
             </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketPage;
