import React, { useState } from 'react';
import { SectionTitle, Card } from '../components/ui';
import { 
  Shield, AlertTriangle, CheckCircle2, DollarSign, Calendar, 
  TrendingUp, TrendingDown, Clock, ShieldCheck, Activity,
  ArrowUpRight, ArrowDownRight, Zap, Info, Lock, Unlock
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie
} from 'recharts';

const CREDIT_USAGE = [
  { month: '1月', used: 820 },
  { month: '2月', used: 1200 },
  { month: '3月', used: 950 },
  { month: '4月', used: 1550 },
  { month: '5月', used: 1800 },
  { month: '6月', used: 1245 },
];

const RADIUS_DATA = [
  { name: 'Used', value: 1245, color: '#6366f1' },
  { name: 'Available', value: 755, color: '#f1f5f9' },
];

const SETTLEMENT_PLAN = [
  { 
    id: 1, 
    order: 'ORD-2024001', 
    type: 'TT / 尾款', 
    amount: '850,000', 
    due: '2024-07-15', 
    daysLeft: 14, 
    status: 'upcoming', 
    vessel: 'OCEAN STAR V',
    risk: 'Low',
    nodes: [
      { label: '预付', done: true },
      { label: '发运', done: true },
      { label: '到港', done: false },
      { label: '尾款', done: false },
    ]
  },
  { 
    id: 2, 
    order: 'ORD-2024002', 
    type: 'L/C / 承兑', 
    amount: '3,200,800', 
    due: '2024-07-20', 
    daysLeft: 19, 
    status: 'upcoming', 
    vessel: 'SILK ROAD II',
    risk: 'Low',
    nodes: [
      { label: '开证', done: true },
      { label: '交单', done: true },
      { label: '承兑', done: false },
      { label: '付汇', done: false },
    ]
  },
  { 
    id: 3, 
    order: 'ORD-2024000', 
    type: 'TT / 尾款', 
    amount: '1,420,000', 
    due: '2024-07-05', 
    daysLeft: -6, 
    status: 'overdue', 
    vessel: 'PACIFIC ZIRCON',
    risk: 'High',
    nodes: [
      { label: '预付', done: true },
      { label: '发运', done: true },
      { label: '到港', done: true },
      { label: '尾款', done: false },
    ]
  },
  { 
    id: 4, 
    order: 'ORD-2024004', 
    type: 'TT / 预付款', 
    amount: '2,000,000', 
    due: '2024-08-01', 
    daysLeft: 31, 
    status: 'future', 
    vessel: 'GOLDEN MINE',
    risk: 'Medium',
    nodes: [
      { label: '签约', done: true },
      { label: '预付', done: false },
      { label: '排产', done: false },
      { label: '发运', done: false },
    ]
  },
];

const RiskControlPage = () => {
  const totalLimit = 2000;
  const used = 1245;
  const utilization = ((used / totalLimit) * 100).toFixed(1);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <SectionTitle title="资金风控中心" subtitle="授信动态监控 · 资金流向预警 · 全球贸易结算安全生命周期" />

      {/* Hero Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
         <Card className="lg:col-span-2 bg-slate-900 border-none relative overflow-hidden p-8 flex items-center justify-between group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20 group-hover:bg-indigo-500/20 transition-all duration-1000" />
            <div className="relative z-10 w-full flex flex-col md:flex-row items-center gap-8">
               <div className="relative h-40 w-40 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={RADIUS_DATA}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={70}
                        startAngle={225}
                        endAngle={-45}
                        paddingAngle={0}
                        dataKey="value"
                      >
                        {RADIUS_DATA.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index === 0 ? '#818cf8' : 'rgba(255,255,255,0.05)'} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                     <span className="text-3xl font-black text-white">{utilization}%</span>
                     <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">Utilization</span>
                  </div>
               </div>
               <div className="flex-1 space-y-6">
                  <div>
                    <h3 className="text-slate-400 text-xs font-black uppercase tracking-widest mb-2 flex items-center gap-2">
                       <ShieldCheck size={14} className="text-indigo-400" /> 总授信池实时概览
                    </h3>
                    <div className="text-4xl font-black text-white">¥20,000,000</div>
                  </div>
                  <div className="grid grid-cols-2 gap-8 border-t border-white/5 pt-6">
                     <div>
                        <div className="text-[10px] text-slate-500 font-black uppercase mb-1">已占用金额</div>
                        <div className="text-xl font-black text-indigo-400">¥12,450,000</div>
                     </div>
                     <div>
                        <div className="text-[10px] text-slate-500 font-black uppercase mb-1">剩余可用</div>
                        <div className="text-xl font-black text-emerald-400">¥7,550,000</div>
                     </div>
                  </div>
               </div>
            </div>
         </Card>

         <Card className="flex flex-col justify-between p-8 border-slate-100 shadow-xl shadow-slate-200/50">
            <div className="flex justify-between items-start">
               <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center shadow-sm">
                  <AlertTriangle size={24} />
               </div>
               <div className="flex items-center gap-1 text-red-500 text-xs font-black">
                  <ArrowUpRight size={14} /> 12%
               </div>
            </div>
            <div className="mt-6">
               <div className="text-3xl font-black text-slate-900">32 <span className="text-xs font-medium text-slate-400 ml-1">笔</span></div>
               <div className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-tighter">待支付/结算任务</div>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between group cursor-pointer">
               <span className="text-[10px] font-black uppercase text-slate-400">查看付款排程</span>
               <ChevronRight size={14} className="text-slate-300 group-hover:text-amber-500 transition-all" />
            </div>
         </Card>

         <Card className="flex flex-col justify-between p-8 border-slate-100 shadow-xl shadow-slate-200/50">
            <div className="flex justify-between items-start">
               <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shadow-sm">
                  <Activity size={24} />
               </div>
               <div className="flex items-center gap-1 text-emerald-500 text-xs font-black">
                  <ArrowDownRight size={14} /> 5.4%
               </div>
            </div>
            <div className="mt-6">
               <div className="text-3xl font-black text-slate-900">¥35.8M</div>
               <div className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-tighter">本月现金流总额</div>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between group cursor-pointer">
               <span className="text-[10px] font-black uppercase text-slate-400">资金预测分析</span>
               <ChevronRight size={14} className="text-slate-300 group-hover:text-emerald-500 transition-all" />
            </div>
         </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* Main Chart Section */}
         <div className="lg:col-span-2 space-y-8">
            <Card className="p-8 border-none shadow-2xl shadow-slate-200/40">
               <div className="flex justify-between items-center mb-8">
                  <div>
                    <h3 className="text-xl font-black text-slate-900">额度占用波动曲线</h3>
                    <p className="text-xs text-slate-400 mt-1 uppercase font-black tracking-tight">Period: 2024Q1 - 2024Q2 · Unit: CNY Million</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="px-4 py-1.5 rounded-xl bg-slate-100 text-slate-600 text-[10px] font-black hover:bg-slate-200 transition-all">半年视图</button>
                    <button className="px-4 py-1.5 rounded-xl bg-indigo-600 text-white text-[10px] font-black shadow-lg shadow-indigo-100">全年预测</button>
                  </div>
               </div>
               <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={CREDIT_USAGE}>
                      <defs>
                        <linearGradient id="colorUsed" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }} dx={-10} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', fontWeight: 'bold' }}
                        formatter={(v) => [`¥${v}万`, '已选金额']}
                      />
                      <Area type="monotone" dataKey="used" stroke="#6366f1" strokeWidth={4} fill="url(#colorUsed)" dot={{ r: 4, fill: 'white', strokeWidth: 2 }} />
                    </AreaChart>
                  </ResponsiveContainer>
               </div>
            </Card>

            <Card className="p-8 border-none shadow-lg bg-slate-50/50">
               <h3 className="text-lg font-black text-slate-900 mb-8 flex items-center gap-3">
                  <Calendar size={22} className="text-indigo-600" />
                  智能付款排程甘特图
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest ml-auto">Cycle: Monthly</span>
               </h3>
               
               <div className="space-y-6">
                  {SETTLEMENT_PLAN.map(item => {
                     const isOverdue = item.status === 'overdue';
                     return (
                        <div key={item.id} className="group p-5 bg-white rounded-2xl border border-slate-100 hover:border-indigo-100 hover:shadow-xl transition-all duration-300">
                           <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                              <div className="flex items-center gap-4">
                                 <div className={`p-3 rounded-xl ${isOverdue ? 'bg-red-50 text-red-600' : 'bg-indigo-50 text-indigo-600'}`}>
                                    {isOverdue ? <Zap size={20} className="animate-pulse" /> : <Clock size={20} />}
                                 </div>
                                 <div>
                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{item.order} · {item.type}</div>
                                    <h4 className="font-black text-slate-900 text-base">{item.vessel}</h4>
                                 </div>
                              </div>
                              <div className="flex items-center gap-8">
                                 <div className="text-right">
                                    <div className="text-[9px] font-black text-slate-400 uppercase mb-1">结算金额</div>
                                    <div className="text-base font-black text-slate-900">¥{item.amount}</div>
                                 </div>
                                 <div className="text-right min-w-[80px]">
                                    <div className="text-[9px] font-black text-slate-400 uppercase mb-1">最后期限</div>
                                    <div className={`text-sm font-black ${isOverdue ? 'text-red-500' : 'text-slate-600'}`}>{item.due}</div>
                                 </div>
                                 <div className={`px-4 py-1 rounded-xl text-[10px] font-black uppercase text-center ${isOverdue ? 'bg-red-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                    {isOverdue ? `逾期 ${Math.abs(item.daysLeft)} 天` : `${item.daysLeft} 天后`}
                                 </div>
                              </div>
                           </div>
                           
                           {/* Gantt Nodes */}
                           <div className="relative pt-4 overflow-x-auto pb-2 scrollbar-none">
                              <div className="absolute top-7 left-4 right-4 h-1 bg-slate-100 rounded-full" />
                              <div className="flex justify-between items-center relative z-10 px-2 min-w-[400px]">
                                 {item.nodes.map((node, i) => (
                                    <div key={i} className="flex flex-col items-center">
                                       <div className={`w-8 h-8 rounded-full flex items-center justify-center border-4 transition-all duration-500 ${
                                          node.done ? 'bg-emerald-500 border-white shadow-lg' : 'bg-white border-slate-100'
                                       }`}>
                                          {node.done ? <CheckCircle2 size={12} className="text-white" /> : <Unlock size={12} className="text-slate-200" />}
                                       </div>
                                       <span className={`text-[10px] font-black mt-3 uppercase tracking-tighter ${node.done ? 'text-slate-800' : 'text-slate-300'}`}>{node.label}</span>
                                    </div>
                                 ))}
                              </div>
                           </div>
                        </div>
                     );
                  })}
               </div>
            </Card>
         </div>

         {/* Sidebar: Alerts & AI Insight */}
         <div className="space-y-8">
            <Card className="p-8 border-none shadow-lg bg-indigo-600 text-white relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Shield size={120} />
               </div>
               <h3 className="text-lg font-black mb-6 flex items-center gap-2">
                  <Zap size={20} className="text-amber-400" />
                  风控智核 Insight
               </h3>
               <div className="space-y-6">
                  <div className="p-4 bg-white/10 rounded-2xl border border-white/10">
                     <div className="text-[10px] font-black uppercase text-indigo-200 mb-2">信用证到期风险</div>
                     <p className="text-xs leading-relaxed opacity-90 font-medium">
                        检测到 ORD-2024002 对应的 L/C 承兑期临近，且其对应的 OCEAN STAR 船只出现 2 天延迟，建议预留 5% 汇率波动资金对冲。
                     </p>
                  </div>
                  <div className="p-4 bg-white/10 rounded-2xl border border-white/10">
                     <div className="text-[10px] font-black uppercase text-indigo-200 mb-2">额度充足性预警</div>
                     <p className="text-xs leading-relaxed opacity-90 font-medium">
                        本月拟签约订单总额 ¥4.5M，当前授信剩余 ¥7.5M，覆盖率充足。
                     </p>
                  </div>
               </div>
               <button className="w-full mt-6 py-3 bg-white text-indigo-600 rounded-xl font-black text-xs hover:shadow-2xl hover:-translate-y-1 transition-all">
                  一键生成风控周报
               </button>
            </Card>

            <Card className="p-8 border-slate-100">
               <div className="flex items-center justify-between mb-6">
                  <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">红线预警记录</h3>
                  <div className="px-2 py-0.5 bg-red-100 text-red-600 rounded text-[9px] font-black uppercase">Recent</div>
               </div>
               <div className="space-y-4">
                  {[
                    { id: 'AL-92', type: 'Overdue', msg: '尾款支付异常: PACIFIC ZIRCON', date: '2h ago' },
                    { id: 'AL-88', type: 'Security', msg: '二级账户异常登录: 财务部张某', date: '5h ago' },
                    { id: 'AL-85', type: 'Limit', msg: '授信占用突破 80% 安全红线', date: '1d ago' },
                  ].map(al => (
                    <div key={al.id} className="flex gap-4 items-start">
                       <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                       <div>
                          <div className="text-xs font-black text-slate-800 leading-tight">{al.msg}</div>
                          <div className="text-[10px] text-slate-400 mt-1 uppercase font-bold">{al.date} · {al.id}</div>
                       </div>
                    </div>
                  ))}
               </div>
            </Card>

            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100 flex items-center justify-between">
               <div className="flex gap-3 items-center">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 border border-slate-100">
                     <Lock size={18} />
                  </div>
                  <div>
                    <div className="text-xs font-black text-slate-900">权限受控</div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Auth by Finance Dept.</div>
                  </div>
               </div>
               <div className="w-1 h-8 bg-slate-200" />
               <button className="text-[10px] font-black text-indigo-600 uppercase hover:underline">申请授权</button>
            </div>
         </div>
      </div>
    </div>
  );
};

export default RiskControlPage;
