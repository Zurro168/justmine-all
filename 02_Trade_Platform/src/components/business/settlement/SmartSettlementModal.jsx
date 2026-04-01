import React, { useState, useEffect } from 'react';
import { FileCheck, Calculator, AlertTriangle, X, CheckCircle2, ChevronDown, Download } from 'lucide-react';
import ordersData from '../../../data/orders.json';

const SmartSettlementModal = ({ order, rules = ordersData.rules.zircon, onClose }) => {
  if (!order) return null;

  // Mock CIQ input values based on order
  const basePrice = 17200; // 基准价格
  const wetWeight = parseInt(order.volume); // 湿吨
  
  const [ciqData, setCiqData] = useState({
    moisture: 4.5,
    mainGrade: 64.8, // 实际品位
    impurities: { fe: 0.12, ti: 0.15 } // 杂质
  });

  const [calcResult, setCalcResult] = useState(null);

  // Core Engine Calculation Logic
  useEffect(() => {
    // 1. Dry Weight Calculation
    const dryWeight = wetWeight * (1 - ciqData.moisture / 100);
    
    // 2. Main Grade Adjustment
    let gradeAdjustment = 0;
    if (ciqData.mainGrade >= rules.baseGrade) {
      gradeAdjustment = ((ciqData.mainGrade - rules.baseGrade) / 0.1) * rules.gradePremium;
    } else {
      gradeAdjustment = -(((rules.baseGrade - ciqData.mainGrade) / 0.1) * rules.gradePenalty);
    }

    // 3. Impurity Penalty (Mock Rule: Fe > 0.1% penalty, Ti > 0.1% penalty)
    const fePenalty = Math.max(0, (ciqData.impurities.fe - 0.1) / 0.01) * 50;
    const tiPenalty = Math.max(0, (ciqData.impurities.ti - 0.1) / 0.01) * 30;
    const totalImpurityPenalty = fePenalty + tiPenalty;

    // 4. Final Price & Total
    const finalPrice = basePrice + gradeAdjustment - totalImpurityPenalty;
    const finalTotalValue = finalPrice * dryWeight;

    setCalcResult({
      dryWeight,
      gradeAdjustment,
      totalImpurityPenalty,
      finalPrice,
      finalTotalValue,
      penalties: { fe: fePenalty, ti: tiPenalty }
    });
  }, [ciqData, wetWeight, basePrice, rules]);

  if (!calcResult) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><Calculator size={20} /></div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">智能品位结算账单 (CIQ Final Settlement)</h2>
              <p className="text-xs text-slate-500 font-mono mt-0.5">Ref: {order.id} | Vessel: {order.vessel}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 bg-white">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Left: Input Parameters (CIQ MOCK) */}
            <div className="space-y-6 relative">
              <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wider mb-4 border-b pb-2">目的港 CIQ 检测指标录入</h3>
              
              <div className="space-y-4 bg-slate-50 p-5 rounded-xl border border-slate-100">
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">实测含水量 (Moisture %)</label>
                  <div className="relative">
                    <input type="number" step="0.1" value={ciqData.moisture} onChange={e => setCiqData({...ciqData, moisture: parseFloat(e.target.value) || 0})} className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2 font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition-shadow" />
                    {ciqData.moisture > rules.baseMoisture && <AlertTriangle size={16} className="absolute right-3 top-2.5 text-orange-500" />}
                  </div>
                  {ciqData.moisture > rules.baseMoisture && <p className="text-xs text-orange-600 mt-1">超水阀值限制，重量折算受影响</p>}
                </div>
                
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">主品位实测 (Main Grade %)</label>
                  <input type="number" step="0.1" value={ciqData.mainGrade} onChange={e => setCiqData({...ciqData, mainGrade: parseFloat(e.target.value) || 0})} className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2 font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition-shadow" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">Fe 杂质测定</label>
                    <input type="number" step="0.01" value={ciqData.impurities.fe} onChange={e => setCiqData({...ciqData, impurities: {...ciqData.impurities, fe: parseFloat(e.target.value) || 0}})} className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2 font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">Ti 杂质测定</label>
                    <input type="number" step="0.01" value={ciqData.impurities.ti} onChange={e => setCiqData({...ciqData, impurities: {...ciqData.impurities, ti: parseFloat(e.target.value) || 0}})} className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2 font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 text-blue-800 p-4 rounded-xl border border-blue-100 flex gap-3 text-sm leading-relaxed">
                <FileCheck className="shrink-0 mt-0.5" size={18} />
                <p>化验数据已结构化提取。系统引擎基于合同条款《Zr/Ti-TTC-2024》第 4.2 条执行自动扣减逻辑计算。</p>
              </div>
            </div>

            {/* Right: Calculation Results View */}
            <div>
              <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wider mb-4 border-b pb-2">系统智能对账单 (Smart Reconciliation)</h3>
              
              <div className="bg-slate-900 rounded-xl p-6 text-white shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl" />
                
                <div className="space-y-4 relative z-10 text-sm">
                  {/* Weight Conversion */}
                  <div className="flex justify-between items-center border-b border-white/10 pb-3">
                    <span className="text-slate-400">计价总重 (Dry Metric Ton)</span>
                    <span className="font-mono text-lg font-bold">{calcResult.dryWeight.toFixed(2)} DMT</span>
                  </div>
                  
                  {/* Base Price */}
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">基准单价 (Base Price)</span>
                    <span className="font-mono">¥{basePrice.toLocaleString()} / DMT</span>
                  </div>

                  {/* Adjustments */}
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-xs">主品位调整 (Grade Adj.) {ciqData.mainGrade < rules.baseGrade ? '↓' : '↑'}</span>
                    <span className={`font-mono text-xs ${calcResult.gradeAdjustment < 0 ? 'text-red-400' : 'text-green-400'}`}>
                      {calcResult.gradeAdjustment > 0 ? '+' : ''}{calcResult.gradeAdjustment.toFixed(2)}
                    </span>
                  </div>

                  {calcResult.totalImpurityPenalty > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 text-xs">杂质惩罚总计 (Impurity Pe.)</span>
                      <span className="font-mono text-xs text-red-400">-{calcResult.totalImpurityPenalty.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="h-px bg-white/20 my-2" />

                  {/* Final Calculation */}
                  <div className="flex justify-between items-center text-blue-200">
                    <span>最终结算单价 (Final Price)</span>
                    <span className="font-mono text-base font-bold">¥{calcResult.finalPrice.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                  </div>
                </div>

                <div className="mt-8 bg-white/10 p-4 rounded-lg border border-white/20 backdrop-blur-sm relative z-10">
                  <div className="text-center">
                    <p className="text-slate-300 text-xs uppercase tracking-widest mb-1">应付总额 / Total Value</p>
                    <p className="text-3xl font-black font-mono tracking-tight text-white drop-shadow-lg">
                      ¥{(calcResult.finalTotalValue / 10000).toLocaleString(undefined, {minimumFractionDigits: 4, maximumFractionDigits: 4})} <span className="text-lg text-slate-400">万</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-end gap-3 shrink-0">
          <button onClick={onClose} className="px-5 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-slate-100 transition-colors shadow-sm">取消调整</button>
          <button className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-md shadow-blue-500/20 transition-all flex items-center gap-2">
            <CheckCircle2 size={18} /> 一键确核并生成 Invoice
          </button>
          <button className="px-3 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition-all" title="下载明细">
            <Download size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default SmartSettlementModal;
