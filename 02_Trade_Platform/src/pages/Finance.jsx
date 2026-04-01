import React, { useState, useMemo } from 'react';
import { 
  DollarSign, Calculator, ChevronRight, CheckCircle2, Clock, 
  Shield, TrendingUp, FileText, Info, MessageCircle, BarChart3,
  Percent, Wallet, Landmark, X
} from 'lucide-react';
import { SectionTitle, Card, ConsultModal } from '../components/ui';
import financeData from '../data/finance-data.json';

const ICON_MAP = { FileText, TrendingUp, Shield };

const FINANCE_PRODUCTS = financeData.products;

const colorMap = {
  blue: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', icon: 'bg-blue-100 text-blue-600', tag: 'bg-blue-600 text-white', btn: 'bg-blue-600 hover:bg-blue-700' },
  purple: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', icon: 'bg-purple-100 text-purple-600', tag: 'bg-purple-600 text-white', btn: 'bg-purple-600 hover:bg-purple-700' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: 'bg-emerald-100 text-emerald-600', tag: 'bg-emerald-600 text-white', btn: 'bg-emerald-600 hover:bg-emerald-700' },
};

const FinancePage = () => {
  const [productType, setProductType] = useState('lc');
  const [amount, setAmount] = useState(1000);
  const [days, setDays] = useState(90);
  
  const factors = financeData.calculator;
  const currentFactor = factors[productType];
  
  const results = useMemo(() => {
    const monthlyRate = currentFactor.baseRate / 100;
    const months = days / 30;
    const interest = amount * 10000 * monthlyRate * months;
    const handlingFee = amount * 10000 * currentFactor.handlingFee;
    const guaranteeFee = amount * 10000 * currentFactor.guaranteeFee;
    const totalCost = interest + handlingFee + guaranteeFee;
    const apr = ((totalCost / (amount * 10000)) / (days / 365) * 100).toFixed(2);
    
    return {
      interest: interest.toFixed(0),
      fees: (handlingFee + guaranteeFee).toFixed(0),
      totalCost: totalCost.toFixed(0),
      apr
    };
  }, [productType, amount, days, currentFactor]);

  const [showConsult, setShowConsult] = useState(false);

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <SectionTitle title="供应链金融服务" subtitle="全流程资金解决方案 · 贸易信用背书 · 10亿+ 累计授信规模" />
        <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex items-center gap-4">
           <div className="p-2 bg-white rounded-xl shadow-sm text-blue-600">
              <Landmark size={20} />
           </div>
           <div>
              <div className="text-[10px] font-black text-slate-400 uppercase">合资性银行授信</div>
              <div className="text-sm font-black text-slate-800">中国银行 / 光大银行 / 浙商银行</div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {FINANCE_PRODUCTS.map(product => {
          const c = colorMap[product.color];
          const Icon = ICON_MAP[product.icon];
          return (
            <div key={product.id} className={`rounded-[2rem] border-2 ${c.border} bg-white overflow-hidden hover:shadow-2xl transition-all group flex flex-col`}>
              <div className={`${c.bg} px-8 pt-8 pb-6`}>
                <div className="flex items-start justify-between mb-6">
                  <div className={`p-4 rounded-2xl shadow-lg border border-white/50 ${c.icon}`}>
                    <Icon size={28} />
                  </div>
                  <span className={`text-[10px] font-black tracking-widest px-3 py-1 rounded-full uppercase ${c.tag}`}>{product.tag}</span>
                </div>
                <h3 className="font-black text-slate-900 text-lg leading-tight mb-4">{product.title}</h3>
                <div className="space-y-4 mb-2">
                   <div className="flex gap-2">
                      <div className={`w-1 h-auto ${c.icon.split(' ')[0]} rounded-full opacity-30`} />
                      <div className="text-[11px] font-bold text-slate-700 italic leading-relaxed">
                         “{product.logic}”
                      </div>
                   </div>
                   <p className="text-sm text-slate-600 font-medium leading-relaxed">{product.desc}</p>
                </div>
              </div>

              <div className="px-8 py-6 flex-1 flex flex-col">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">标准化作业流程</div>
                <div className="space-y-3 mb-8">
                  {product.steps.map((step, i) => (
                    <div key={i} className="flex items-center gap-3.5 text-xs font-bold text-slate-600">
                      <div className={`w-6 h-6 rounded-lg ${c.icon} flex items-center justify-center text-[11px] font-black shrink-0 shadow-inner`}>{i + 1}</div>
                      {step}
                    </div>
                  ))}
                </div>
                <div className="mt-auto space-y-4">
                  <div className={`text-[11px] font-bold ${c.text} ${c.bg} rounded-xl p-4 border-2 border-dashed ${c.border.replace('border-', 'border-').replace('200', '300')} leading-relaxed`}>
                    <div className="flex items-center gap-2 mb-1 uppercase tracking-wider text-[9px] opacity-70">
                       <Info size={10} /> 方案优势
                    </div>
                    {product.suitable}
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex flex-col">
                       <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">融资月成本</span>
                       <span className={`font-black text-xl ${c.text}`}>{product.rate}</span>
                    </div>
                    <button 
                      onClick={() => setShowConsult(true)}
                      className={`${c.btn} text-white text-xs font-black px-6 py-3 rounded-xl flex items-center gap-2 transition shadow-lg ${c.btn.split(' ')[0].replace('bg-', 'shadow-')}/20`}
                    >
                      <MessageCircle size={14} /> 详情咨询
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        <div className="lg:col-span-5 space-y-6">
          <Card className="shadow-2xl shadow-slate-200/50 border-none p-8">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg ring-4 ring-indigo-50"><Calculator size={24} /></div>
              <div>
                <h3 className="font-black text-xl text-slate-900">融资综效精算器</h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-tight mt-1">Refined Cost Estimation Tool v3.0</p>
              </div>
            </div>
            <div className="space-y-8">
              <div>
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4 block">1. 选择融资品类</label>
                <div className="grid grid-cols-3 gap-3">
                   {FINANCE_PRODUCTS.map(p => (
                     <button 
                       key={p.id}
                       onClick={() => setProductType(p.id)}
                       className={`py-3 rounded-xl text-[11px] font-black transition-all border-2 ${productType === p.id ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg' : 'bg-slate-50 text-slate-500 border-slate-100 hover:border-indigo-200'}`}
                     >
                       {p.title.split(' ')[0]}
                     </button>
                   ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4 block flex justify-between">
                   2. 融资额度 <span>{amount} 万</span>
                </label>
                <input 
                  type="range" min="100" max="10000" step="100" 
                  value={amount} onChange={e => setAmount(+e.target.value)} 
                  className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600" 
                />
              </div>
              <div>
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4 block flex justify-between">
                   3. 使用周期 <span>{days} 天</span>
                </label>
                <div className="flex gap-2">
                   {[30, 60, 90, 180, 270, 360].map(d => (
                     <button 
                       key={d}
                       onClick={() => setDays(d)}
                       className={`flex-1 py-2 rounded-lg text-xs font-black transition-all ${days === d ? 'bg-slate-900 text-white' : 'bg-white text-slate-400 border border-slate-100 hover:bg-slate-50'}`}
                     >
                        {d}D
                     </button>
                   ))}
                </div>
              </div>
            </div>
            <div className="mt-8 text-[9px] text-slate-300 uppercase font-black tracking-widest text-right">Data Source: finance-data.json</div>
          </Card>
        </div>

        <div className="lg:col-span-7 space-y-8">
           <Card className="bg-slate-900 text-white border-none shadow-3xl p-10 overflow-hidden relative">
              <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                 <Percent size={200} />
              </div>
              <div className="relative z-10">
                 <div className="flex items-center justify-between mb-8">
                    <span className="px-3 py-1 bg-white/10 rounded text-[9px] font-black uppercase tracking-[0.2em] text-indigo-400 border border-white/5">精算综合成本看板</span>
                    <BarChart3 size={20} className="text-indigo-400" />
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
                    <div>
                       <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">预计利息支出</div>
                       <div className="text-4xl font-black font-mono">¥{Number(results.interest).toLocaleString()}</div>
                       <div className="text-[10px] text-slate-500 mt-2">基于 {factors[productType].baseRate}% 月基准利率</div>
                    </div>
                    <div>
                       <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">综合手续及杂费</div>
                       <div className="text-4xl font-black font-mono">¥{Number(results.fees).toLocaleString()}</div>
                    </div>
                 </div>
                 <div className="bg-white/5 rounded-3xl p-8 border border-white/10 flex flex-col md:flex-row justify-between items-center gap-8 mb-8">
                    <div className="text-center md:text-left">
                       <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">项目综合年化成本 (APR)</div>
                       <div className="text-5xl font-black text-white">{results.apr}<span className="text-2xl ml-1 opacity-50">%</span></div>
                    </div>
                 </div>
                 <button 
                   onClick={() => setShowConsult(true)}
                   className="w-full py-5 bg-white text-slate-900 font-black rounded-2xl hover:bg-indigo-50 transition-all flex justify-center items-center gap-3 shadow-xl shadow-white/5"
                 >
                    <Wallet size={18} /> 获取正式《综合金融方案建议书》
                 </button>
              </div>
           </Card>
        </div>
      </div>
      <ConsultModal isOpen={showConsult} onClose={() => setShowConsult(false)} />
      <div className="mt-8 text-[10px] text-slate-400 font-bold uppercase tracking-widest text-right">
        Data Source: finance-data.json
      </div>
    </div>
  );
};

export default FinancePage;
