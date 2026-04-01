import React, { useState, useMemo } from 'react';
import { SectionTitle, Card } from '../components/ui';
import { 
  FileText, CheckCircle2, Clock, AlertCircle, Upload, Download, 
  ChevronRight, Ship, Anchor, Search, Filter, ArrowLeftRight, 
  FileCheck, AlertTriangle, Info, MoreHorizontal, Eye, Globe, ShieldCheck
} from 'lucide-react';
import { useStore } from '../store/useStore';

const MOCK_DOCS = [
  {
    id: 'DOC-001', orderId: 'ORD-2024001', type: 'B/L', name: 'OCEAN STAR V - 提单',
    uploadedBy: '澳洲供应商', date: '2024-07-01', status: 'approved', step: 4,
    icon: Ship, color: 'blue',
    extractedData: {
      bl_number: 'MAEU982348123',
      vessel: 'OCEAN STAR V',
      port_of_loading: 'PORT HEDLAND',
      port_of_discharge: 'ZHANJIANG',
      weight: '55,000 MT',
      container_count: 'N/A (Bulk)',
    }
  },
  {
    id: 'DOC-002', orderId: 'ORD-2024001', type: '化验报告', name: 'SGS Assay Report #SZ24-0701',
    uploadedBy: '澳洲供应商', date: '2024-07-02', status: 'reviewing', step: 2,
    icon: FileCheck, color: 'purple',
    extractedData: {
      report_no: 'SZ24-0701',
      zro2_hf_content: '66.2%',
      fe2o3_content: '0.04%',
      tio2_content: '0.12%',
      moisture: '0.2%',
    }
  },
  {
    id: 'DOC-003', orderId: 'ORD-2024002', type: '原产地证', name: 'COO Mozambique - SILK ROAD II',
    uploadedBy: '莫桑比克供应商', date: '2024-06-28', status: 'pending', step: 1,
    icon: Globe, color: 'amber',
  },
  {
    id: 'DOC-004', orderId: 'ORD-2024002', type: 'B/L', name: 'SILK ROAD II - 提单',
    uploadedBy: '莫桑比克供应商', date: '2024-06-29', status: 'approved', step: 4,
    icon: Ship, color: 'blue',
    extractedData: {
      bl_number: 'MSCU4455221',
      vessel: 'SILK ROAD II',
      port_of_loading: 'BEIRA',
      port_of_discharge: 'TIANJIN',
      weight: '42,300 MT',
    }
  },
  {
    id: 'DOC-005', orderId: 'ORD-2024003', type: '报关单', name: '湛江口岸进口报关单 #HK24-003',
    uploadedBy: '正矿报关行', date: '2024-07-05', status: 'submitted', step: 3,
    icon: Anchor, color: 'emerald',
  },
];

const FLOW_STEPS = [
  { id: 1, label: '供应商上传', desc: '供应商在线提交单证文件' },
  { id: 2, label: '系统解析与核对', desc: 'AI 自动提取关键字段并标记差异' },
  { id: 3, label: '内部审核', desc: '正矿单证团队人工确认' },
  { id: 4, label: '单证放行', desc: '单证确认，货权转移' },
];

const STATUS_MAP = {
  pending:   { label: '待处理', color: 'bg-slate-100 text-slate-500 border-slate-200', dot: 'bg-slate-400' },
  reviewing: { label: '解析中', color: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
  submitted: { label: '待初审', color: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  approved:  { label: '已通过', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
};

// Data Field Mapping for Human readable labels
const FIELD_LABELS = {
  bl_number: '提单号码',
  vessel: '载货船名',
  port_of_loading: '装货港口',
  port_of_discharge: '卸货港口',
  weight: '货物重量',
  container_count: '集装箱数',
  report_no: '报告编号',
  zro2_hf_content: 'ZrO2+HfO2 含量',
  fe2o3_content: 'Fe2O3 含量',
  tio2_content: 'TiO2 含量',
  moisture: '水分含量',
};

const DocumentsPage = () => {
  const { user } = useStore();
  const [selected, setSelected] = useState(MOCK_DOCS[0]);
  const [filter, setFilter] = useState('all');
  const [verificationMode, setVerificationMode] = useState(false);

  const filtered = useMemo(() => {
    let list = MOCK_DOCS;
    // Role based filtering
    if (user?.category === 'SERVICE') {
      list = list.filter(d => d.uploadedBy.includes('报关') || d.type === '报关单');
    }
    if (filter !== 'all') {
      list = list.filter(d => d.status === filter);
    }
    return list;
  }, [filter, user]);

  const isEmployee = user?.category === 'EMPLOYEE';

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {!verificationMode ? (
        <>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <SectionTitle 
              title="单证管理中心" 
              subtitle="数字化审单 · AI 自动核对 · 货权流转生命周期" 
            />
            <div className="flex gap-2">
              <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 bg-white rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 shadow-sm transition-all border-b-4 active:translate-y-0.5 active:border-b-0">
                <Upload size={15} /> 上传新单证
              </button>
              {isEmployee && (
                <button className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 shadow-lg shadow-slate-200 transition-all border-b-4 border-slate-700 active:translate-y-0.5 active:border-b-0">
                  <Download size={15} /> 导出报表
                </button>
              )}
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">待审单据</div>
                <div className="text-2xl font-black text-slate-900">12 <span className="text-xs font-medium text-amber-500 ml-1">个</span></div>
             </div>
             <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">AI 解析成功率</div>
                <div className="text-2xl font-black text-slate-900">98.5% <span className="text-xs font-medium text-emerald-500 ml-1">↑ 2%</span></div>
             </div>
             <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">平均审核耗时</div>
                <div className="text-2xl font-black text-slate-900">1.2 <span className="text-xs font-medium text-blue-500 ml-1">h</span></div>
             </div>
             <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">今日自动放行</div>
                <div className="text-2xl font-black text-slate-900">5 <span className="text-xs font-medium text-slate-500 ml-1">笔</span></div>
             </div>
          </div>

          {/* Actions & Filters */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex gap-2 overflow-x-auto pb-1 w-full sm:w-auto">
              {[
                { id: 'all', label: '全部' },
                { id: 'pending', label: '待处理' },
                { id: 'reviewing', label: '解析中' },
                { id: 'submitted', label: '待初审' },
                { id: 'approved', label: '已通过' },
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border transition-all ${filter === f.id ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-100' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'}`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <div className="relative w-full sm:w-64 group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600" size={14} />
              <input 
                type="text" 
                placeholder="搜索提单号/合同号..." 
                className="w-full pl-9 pr-4 py-2 bg-slate-100/50 border-none rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* List */}
            <div className="lg:col-span-2 space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {filtered.map(doc => {
                 const s = STATUS_MAP[doc.status];
                 const isSelected = selected?.id === doc.id;
                 return (
                  <div
                    key={doc.id}
                    onClick={() => setSelected(doc)}
                    className={`group p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                      isSelected ? 'border-blue-500 bg-blue-50/50 shadow-lg' : 'border-white bg-white hover:border-slate-100 hover:shadow-md'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl ${isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'} transition-colors`}>
                          <doc.icon size={18} />
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{doc.name}</div>
                          <div className="text-[11px] text-slate-400 font-mono mt-0.5">{doc.id} · {doc.type}</div>
                        </div>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-tighter ${s.color}`}>
                        {s.label}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-2 text-slate-500">
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                        上传方: <span className="font-bold text-slate-700">{doc.uploadedBy}</span>
                      </div>
                      <div className="text-slate-400">{doc.date}</div>
                    </div>
                  </div>
                 );
              })}
            </div>

            {/* Detail */}
            <div className="lg:col-span-3">
              {selected ? (
                <Card className="shadow-xl shadow-slate-200/50 h-full flex flex-col border-none bg-slate-50/30">
                  <div className="p-8 pb-0">
                    <div className="flex items-start justify-between mb-8">
                       <div className="flex gap-4">
                          <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-blue-600 border border-slate-100">
                            <selected.icon size={24} />
                          </div>
                          <div>
                            <div className="text-xs font-black text-blue-600 uppercase tracking-widest mb-1">{selected.id} · {selected.orderId}</div>
                            <h3 className="text-2xl font-black text-slate-900">{selected.name}</h3>
                          </div>
                       </div>
                       <div className="flex gap-2">
                         <button className="p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"><Download size={20} /></button>
                         <button className="p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"><MoreHorizontal size={20} /></button>
                       </div>
                    </div>

                    {/* Timeline */}
                    <div className="grid grid-cols-4 gap-2 mb-10 relative">
                      <div className="absolute left-0 right-0 top-3 h-0.5 bg-slate-200 -z-0" />
                      {FLOW_STEPS.map(step => {
                        const isDone = selected.step >= step.id;
                        const isCurrent = selected.step === step.id;
                        return (
                          <div key={step.id} className="relative z-10 flex flex-col items-center text-center">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all ${
                              isCurrent ? 'bg-blue-600 border-blue-200 scale-125 ring-4 ring-blue-50' : 
                              isDone ? 'bg-emerald-500 border-emerald-100' : 'bg-white border-slate-200'
                            }`}>
                              {isDone && !isCurrent ? <CheckCircle2 size={12} className="text-white" /> : 
                               isCurrent ? <Clock size={12} className="text-white animate-pulse" /> : 
                               <span className="text-[10px] text-slate-400 font-bold">{step.id}</span>
                              }
                            </div>
                            <span className={`text-[10px] font-black mt-3 uppercase tracking-tighter ${isCurrent ? 'text-blue-600' : 'text-slate-400'}`}>{step.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex-1 px-8 pb-8 space-y-6">
                    {/* Action Panel */}
                    <div className={`p-6 rounded-2xl border shadow-sm ${
                      selected.status === 'reviewing' ? 'bg-blue-600 text-white border-blue-500' : 
                      selected.status === 'approved' ? 'bg-emerald-50 text-emerald-900 border-emerald-100' : 
                      'bg-white text-slate-900 border-slate-100'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`p-3 rounded-xl ${selected.status === 'reviewing' ? 'bg-white/20' : 'bg-emerald-100'}`}>
                            {selected.status === 'reviewing' ? <ArrowLeftRight className="animate-spin-slow" /> : <FileCheck className="text-emerald-600" />}
                          </div>
                          <div>
                            <div className={`text-base font-black ${selected.status === 'reviewing' ? 'text-white' : 'text-slate-900'}`}>
                              {selected.status === 'reviewing' ? '数字化审单就绪' : '内部审核已完成'}
                            </div>
                            <div className={`text-xs ${selected.status === 'reviewing' ? 'text-blue-100' : 'text-slate-500'} mt-1`}>
                              {selected.status === 'reviewing' ? 'AI 提取了 8 个关键字段，等待与合同进行最终比对' : '文档已归档，关联合同 ORD-2024001 货权已确认'}
                            </div>
                          </div>
                        </div>
                        {selected.status === 'reviewing' && isEmployee && (
                          <button 
                            onClick={() => setVerificationMode(true)}
                            className="px-6 py-2.5 bg-white text-blue-600 rounded-xl font-black text-sm hover:shadow-xl hover:-translate-y-0.5 transition-all"
                          >
                            立即核对
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Extracted Preview Table */}
                    {selected.extractedData && (
                      <div className="bg-white rounded-2xl border border-slate-100 p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="text-xs font-black text-slate-400 uppercase tracking-widest">关键字段解析概况</div>
                          <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-500 bg-emerald-50 px-2 py-1 rounded-full">
                            <CheckCircle2 size={10} /> 来源: AWS Textract
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                           {Object.entries(selected.extractedData).map(([key, val]) => (
                             <div key={key} className="flex justify-between items-center border-b border-slate-50 pb-2">
                               <span className="text-xs text-slate-500 font-medium">{FIELD_LABELS[key] || key}</span>
                               <span className="text-xs font-bold text-slate-800">{val}</span>
                             </div>
                           ))}
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-200">
                  <FileText size={48} className="mb-4 opacity-20" />
                  <p className="font-bold">选择左侧单证进行详细审阅</p>
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        /* DIGITAL VERIFICATION MODE (Simulated Split Screen) */
        <div className="fixed inset-0 z-[100] bg-slate-900 flex flex-col p-4 animate-in slide-in-from-bottom-5">
           {/* Top Bar */}
           <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setVerificationMode(false)}
                  className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                >
                  <ChevronRight className="rotate-180" />
                </button>
                <div>
                  <div className="text-xs font-black text-blue-400 uppercase tracking-widest">数字化审单模式</div>
                  <h2 className="text-xl font-black text-white">{selected.name} <span className="text-white/30 text-xs ml-2 font-mono">#{selected.id}</span></h2>
                </div>
              </div>
              <div className="flex gap-3">
                <button className="px-6 py-2.5 bg-red-500/10 text-red-400 border border-red-500/30 rounded-xl font-black text-sm hover:bg-red-500/20 transition-all">驳回修改</button>
                <button className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-black text-sm hover:bg-blue-700 shadow-lg shadow-blue-500/25 transition-all">确认无误</button>
              </div>
           </div>

           <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 overflow-hidden">
              {/* Left: Structured Data Form */}
              <div className="bg-white rounded-2xl p-8 overflow-y-auto box-border shadow-2xl">
                 <div className="flex items-center justify-between mb-8">
                    <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                       数据核对中心 <span className="px-2 py-0.5 bg-blue-100 text-blue-600 rounded text-[10px] uppercase">合同: ORD-2024001</span>
                    </h3>
                    <div className="flex items-center gap-2">
                       <span className="w-2 h-2 rounded-full bg-emerald-500" />
                       <span className="text-xs font-bold text-slate-500">匹配完成度 85%</span>
                    </div>
                 </div>

                 <div className="space-y-6">
                    {/* Simulation showing field comparison */}
                    <div className="group">
                       <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">提单号 (B/L Number)</label>
                       <div className="flex items-center gap-4">
                          <div className="flex-1 bg-slate-50 p-4 rounded-xl border-2 border-transparent focus-within:border-blue-500 transition-all">
                             <input type="text" defaultValue={selected.extractedData?.bl_number} className="w-full bg-transparent font-mono font-bold text-slate-900 outline-none" />
                             <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1"><Info size={10} /> OCR 提取结果</div>
                          </div>
                          <div className="w-px h-10 bg-slate-100" />
                          <div className="flex-1 bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                             <div className="font-mono font-bold text-emerald-700">MAEU982348123</div>
                             <div className="text-[10px] text-emerald-600 mt-1">系统合同记录</div>
                          </div>
                          <CheckCircle2 className="text-emerald-500" />
                       </div>
                    </div>

                    <div className="group">
                       <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">载货船名 (Vessel Name)</label>
                       <div className="flex items-center gap-4">
                          <div className="flex-1 bg-red-50 p-4 rounded-xl border-2 border-red-200">
                             <input type="text" defaultValue="OCEAN STAR V (TYPO)" className="w-full bg-transparent font-mono font-bold text-red-700 outline-none" />
                             <div className="text-[10px] text-red-600 mt-1">需修正: 后缀错误</div>
                          </div>
                          <div className="w-px h-10 bg-slate-100" />
                          <div className="flex-1 bg-slate-50 p-4 rounded-xl border border-slate-100">
                             <div className="font-mono font-bold text-slate-800">OCEAN STAR V</div>
                             <div className="text-[10px] text-slate-400 mt-1">系统合同记录</div>
                          </div>
                          <AlertTriangle className="text-red-500 animate-pulse" />
                       </div>
                    </div>

                    {/* More fields ... */}
                    <div className="grid grid-cols-2 gap-4 pt-4">
                       <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                          <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">装货港</label>
                          <div className="font-bold text-slate-900 whitespace-nowrap overflow-hidden text-ellipsis">PORT HEDLAND</div>
                       </div>
                       <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                          <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">卸货港</label>
                          <div className="font-bold text-slate-900">ZHANJIANG</div>
                       </div>
                    </div>

                    <div className="p-5 bg-blue-50 rounded-2xl border border-blue-100">
                       <div className="flex items-center gap-2 mb-2">
                          <ShieldCheck className="text-blue-600" size={18} />
                          <span className="font-black text-blue-900 text-sm">风险核实建议</span>
                       </div>
                       <p className="text-xs text-blue-700 leading-relaxed">
                          该船只当前位于马六甲海峡周边，预计到达时间 (ETA) 与合同约定的最后交货期 (LSD) 仅差 2 天。建议财务部关注 L/C 是否需要展期。
                       </p>
                    </div>
                 </div>
              </div>

              {/* Right: Original Document View (Mocked with Interactive Overlays) */}
              <div className="bg-slate-800 rounded-2xl relative overflow-hidden flex flex-col items-center justify-center group">
                 <div className="absolute top-4 left-4 z-10 flex gap-2">
                    <button className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all"><Search size={16} /></button>
                    <button className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all"><Filter size={16} /></button>
                 </div>
                 
                 {/* Image Simulation */}
                 <div className="w-[85%] h-[90%] bg-white rounded shadow-2xl relative flex flex-col p-10 box-border text-[8px] text-slate-300 font-serif leading-loose">
                    {/* B/L Content Simulation */}
                    <div className="border-b-2 border-slate-900 pb-4 mb-4 flex justify-between items-end">
                       <div className="text-xl font-bold text-slate-900 font-sans tracking-tight">BILL OF LADING</div>
                       <div className="text-right">
                          <div className="text-slate-900 font-bold font-sans">ORIGINAL</div>
                          <div>FOR COMBINED TRANSPORT SHIPMENT OR PORT TO PORT SHIPMENT</div>
                       </div>
                    </div>
                    <div className="grid grid-cols-2 gap-10">
                       <div className="space-y-4">
                          <div className="border border-slate-100 p-2">
                             <div className="font-black uppercase text-slate-400 text-[6px]">Shipper</div>
                             <div className="text-slate-500 font-bold leading-normal">ILUKA RESOURCES LIMITED<br/>LEVEL 17, 240 ST GEORGES TERRACE<br/>PERTH WA 6000, AUSTRALIA</div>
                          </div>
                          <div className="border border-slate-100 p-2 relative">
                             <div className="font-black uppercase text-slate-400 text-[6px]">Consignee</div>
                             <div className="text-slate-500 font-bold leading-normal">ZHENGKUANG SUPPLY CHAIN CO., LTD<br/>NO.888 JINGANG ROAD, ZHANJIANG<br/>GUANGDONG, CHINA</div>
                             {/* AI Detection Overlay */}
                             <div className="absolute inset-0 bg-blue-500/10 border-2 border-blue-500 rounded-sm animate-pulse" />
                          </div>
                       </div>
                       <div className="space-y-4">
                          <div className="border border-slate-100 p-2">
                             <div className="font-black uppercase text-slate-400 text-[6px]">B/L Number</div>
                             <div className="text-slate-900 font-black text-sm">MAEU982348123</div>
                             {/* AI Detection Overlay */}
                             <div className="absolute inset-0 bg-emerald-500/10 border-2 border-emerald-500 rounded-sm" />
                          </div>
                          <div className="border border-slate-100 p-2 relative">
                             <div className="font-black uppercase text-slate-400 text-[6px]">Vessel Name</div>
                             <div className="text-red-600 font-black text-xs">OCEAN STAR V (TYPO)</div>
                             {/* Warning Overlay */}
                             <div className="absolute inset-0 bg-red-500/10 border-2 border-red-500 rounded-sm" />
                          </div>
                       </div>
                    </div>
                    <div className="flex-1 mt-10 border-t border-slate-100 pt-4 flex items-center justify-center opacity-30 italic">
                      [ Bill of Lading Technical Terms and Shipping Conditions Continue ... ]
                    </div>
                 </div>

                 <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-slate-900 to-transparent text-center">
                    <p className="text-slate-400 text-xs font-medium">使用滚轮缩放，左键按住拖动查看单证细节</p>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default DocumentsPage;
