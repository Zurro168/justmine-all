import React from 'react';
import { SectionTitle, Card } from '../components/ui';
import { ChevronRight, TrendingUp, Ship, ShieldCheck } from 'lucide-react';
import { useStore } from '../store/useStore';
import mineralPrices from '../data/mineral-prices.json';
import logisticsData from '../data/logistics-data.json';

const HomePage = () => {
  const { setActiveTab } = useStore();
  
  // Get latest data
  const latestPrice = mineralPrices[mineralPrices.length - 1];
  const secondLatest = mineralPrices[mineralPrices.length - 2];
  
  const getChange = (curr, prev) => {
    const diff = ((curr - prev) / prev * 100).toFixed(1);
    return diff > 0 ? `+${diff}%` : `${diff}%`;
  };

  const zirconChange = getChange(latestPrice.zircon, secondLatest.zircon);
  const titaniumChange = getChange(latestPrice.titanium, secondLatest.titanium);
  
  const logisticsIndices = logisticsData.indices || { 
    bdi: { value: 1842, change: "+12" }, 
    congestion: { qinzhou: { value: 0.82, label: "流畅" } } 
  };

  return (
    <div className="space-y-12">
      <section className="relative h-[500px] rounded-3xl overflow-hidden bg-slate-900 text-white shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/90 to-transparent z-10" />
        <img 
          src="https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&q=80&w=2070" 
          className="absolute inset-0 w-full h-full object-cover opacity-60"
          alt="Port"
        />
        <div className="relative z-20 p-12 flex flex-col justify-center h-full max-w-2xl">
          <h1 className="text-5xl font-extrabold mb-6 leading-tight drop-shadow-md">正矿供应链<br/>产业 · 科技 · 金融</h1>
          <p className="text-lg text-blue-100 mb-8 font-light">
            专注于高端矿产资源供应链服务，致力于成为进口供应链数字化领先企业，打造进口矿产产业互联网平台。
          </p>
          <div className="flex gap-4">
            <button 
              onClick={() => setActiveTab('dashboard')}
              className="bg-blue-600 hover:bg-blue-500 px-8 py-4 rounded-lg font-bold flex items-center gap-2 transition"
            >
              进入工作台 <ChevronRight size={20} />
            </button>
            <button className="bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/30 px-8 py-4 rounded-lg font-bold transition">
              获取实时研报
            </button>
          </div>
        </div>
        
        <div className="absolute bottom-0 w-full bg-slate-900/80 backdrop-blur-md py-3 px-12 z-20 flex justify-between items-center text-sm border-t border-white/10">
          <div className="flex gap-8 overflow-hidden items-center">
            <span className="flex items-center gap-1">锆英砂(AU): <span className={`font-black ${latestPrice.zircon >= secondLatest.zircon ? 'text-emerald-400' : 'text-red-400'}`}>¥{latestPrice.zircon.toLocaleString()} ({zirconChange})</span></span>
            <span className="w-px h-3 bg-white/20" />
            <span className="flex items-center gap-1">钛精矿(MZ): <span className={`font-black ${latestPrice.titanium >= secondLatest.titanium ? 'text-emerald-400' : 'text-red-400'}`}>¥{latestPrice.titanium.toLocaleString()} ({titaniumChange})</span></span>
            <span className="w-px h-3 bg-white/20" />
            <span className="flex items-center gap-1">BDI指数: <span className="font-black text-emerald-400">{logisticsIndices.bdi.value} ({logisticsIndices.bdi.change})</span></span>
            <span className="w-px h-3 bg-white/20" />
            <span className="flex items-center gap-1">钦州港拥堵: <span className="font-black text-blue-300">{logisticsIndices.congestion.qinzhou.value} ({logisticsIndices.congestion.qinzhou.label})</span></span>
          </div>
          <div className="hidden md:block text-slate-500 font-mono text-[9px] uppercase tracking-wider text-right">
            LATEST UPDATE: {latestPrice.month}-14 00:00<br/>
            SOURCE: mineral-price-history.md & logistics-data.json
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card onClick={() => setActiveTab('market')} className="group hover:-translate-y-1 transition-transform">
          <div className="bg-blue-50 w-16 h-16 flex items-center justify-center rounded-2xl mb-6 group-hover:bg-blue-100 transition-colors">
            <TrendingUp className="text-blue-600" size={32} />
          </div>
          <h3 className="text-xl font-bold mb-3 text-slate-800">行业行情引擎</h3>
          <p className="text-slate-500 leading-relaxed">实时追踪全球锆钛价格走势，多维度对比分析及行业景气度预测。</p>
        </Card>
        
        <Card onClick={() => setActiveTab('logistics')} className="group hover:-translate-y-1 transition-transform">
          <div className="bg-indigo-50 w-16 h-16 flex items-center justify-center rounded-2xl mb-6 group-hover:bg-indigo-100 transition-colors">
            <Ship className="text-indigo-600" size={32} />
          </div>
          <h3 className="text-xl font-bold mb-3 text-slate-800">全球物流追踪</h3>
          <p className="text-slate-500 leading-relaxed">基于AIS数据的船位监控，实时预测到港时间(ETA)及港口排队情况。</p>
        </Card>
        
        <Card onClick={() => setActiveTab('dashboard')} className="group hover:-translate-y-1 transition-transform border-blue-200">
          <div className="bg-emerald-50 w-16 h-16 flex items-center justify-center rounded-2xl mb-6 group-hover:bg-emerald-100 transition-colors">
            <ShieldCheck className="text-emerald-600" size={32} />
          </div>
          <h3 className="text-xl font-bold mb-3 text-slate-800">业务协同工作台</h3>
          <p className="text-slate-500 leading-relaxed">上下游订单、合同、单证及结算全流程闭环管理，确保履约确定性。</p>
        </Card>
      </div>
    </div>
  );
};

export default HomePage;
