import React, { useState, useEffect } from 'react';
import { SectionTitle } from '../components/ui';

/*
 清晰层级（严格水平对齐）：
 L1: 股东会
 L2: 董事长
 L3: 总经理
 L4: 副总经理
 L5: 风险管理部 | 市场管理部 | 财务管理部 | 综合管理部
 L6: 风控主管   | 市场经理   | 财务经理   | 行政人事经理
 L7: —         | 单证组/采购组| 会计/出纳  | 行政人事专员/外勤专员
 L8: —         | 单证主管    | —          | —
 L9: —         | 单证专员/国贸专员 | — | —

 关系说明:
  总经理 → 副总经理（实线纵向）
  副总经理 → 四部门（实线，财务部为虚线协管）
*/

const THEME = {
  purple: 'bg-violet-100 border-violet-400 text-violet-900',
  blue:   'bg-blue-100   border-blue-400   text-blue-900',
  teal:   'bg-teal-100   border-teal-400   text-teal-900',
  red:    'bg-rose-100   border-rose-400   text-rose-900',
  amber:  'bg-amber-100  border-amber-400  text-amber-900',
};

const Node = ({ label, theme = 'blue', dashed = false, visible, delay = 0, small = false }) => (
  <div
    className={`
      inline-flex items-center justify-center px-4 py-1.5 rounded-lg border-2 font-bold text-center
      shadow-sm transition-all duration-500
      ${small ? 'text-[11px] px-3 py-1' : 'text-[13px]'}
      ${THEME[theme]}
      ${dashed ? 'border-dashed opacity-80' : ''}
    `}
    style={{
      opacity: visible ? (dashed ? 0.85 : 1) : 0,
      transform: visible ? 'translateY(0)' : 'translateY(-10px)',
      transitionDelay: `${delay}ms`,
    }}
  >
    {label}
  </div>
);

// Connector line (vertical bar between rows)
const VLine = ({ visible, delay = 0 }) => (
  <div className="flex justify-center">
    <div
      className="w-0.5 bg-slate-300 transition-all duration-500"
      style={{ height: visible ? 24 : 0, opacity: visible ? 1 : 0, transitionDelay: `${delay}ms` }}
    />
  </div>
);

// Horizontal span with drops to multiple children
const HBranch = ({ count, visible, delay = 0, dashed = false }) => {
  if (count === 1) return <VLine visible={visible} delay={delay} />;
  return (
    <div
      className="relative flex justify-around"
      style={{ opacity: visible ? 1 : 0, transition: `opacity 0.5s ease ${delay}ms` }}
    >
      {/* vertical stem from parent */}
      <div className="absolute left-1/2 -translate-x-1/2 top-0 w-0.5 bg-slate-300" style={{ height: 12 }} />
      {/* horizontal bar */}
      <div className={`absolute left-[12.5%] right-[12.5%] ${dashed ? 'border-t-2 border-dashed border-violet-400' : 'border-t-2 border-slate-300'}`} style={{ top: 12 }} />
      {/* drops to each child */}
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex-1 flex justify-center">
          <div className={`w-0.5 ${dashed ? 'bg-violet-400' : 'bg-slate-300'} mt-[12px]`} style={{ height: 12 }} />
        </div>
      ))}
    </div>
  );
};

const OrgChartPage = () => {
  const [v, setV] = useState(false);
  const replay = () => { setV(false); setTimeout(() => setV(true), 80); };
  useEffect(() => { setTimeout(() => setV(true), 120); }, []);

  const d = (ms) => ms; // delay helper

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <SectionTitle title="组织架构" subtitle="正矿供应链（广东）有限公司 · 治理结构与职能分工" />
        <button onClick={replay} className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-sm rounded-xl border border-blue-200 transition-all">↺ 重放</button>
      </div>

      <div className="bg-gradient-to-r from-blue-700 to-indigo-700 rounded-2xl p-5 text-white text-center">
        <h2 className="text-xl font-black">正矿供应链（广东）有限公司</h2>
        <p className="text-blue-200 text-sm">Organizational Structure</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-8 overflow-x-auto">
        <div className="min-w-[700px] space-y-0">

          {/* L1: 股东会 */}
          <div className="flex justify-center"><Node label="股东会" theme="purple" visible={v} delay={d(0)} /></div>
          <VLine visible={v} delay={d(100)} />

          {/* L2: 董事长 */}
          <div className="flex justify-center"><Node label="董事长" theme="purple" visible={v} delay={d(150)} /></div>
          <VLine visible={v} delay={d(250)} />

          {/* L3: 总经理 */}
          <div className="flex justify-center"><Node label="总经理" theme="blue" visible={v} delay={d(300)} /></div>
          <VLine visible={v} delay={d(400)} />

          {/* L4: 副总经理 */}
          <div className="flex justify-center"><Node label="副总经理" theme="blue" visible={v} delay={d(450)} /></div>

          {/* Branch: 副总经理 → 4 departments (财务为虚线协管) */}
          <div className="relative mt-0">
            <div
              className="flex"
              style={{ opacity: v ? 1 : 0, transition: `opacity 0.5s ease ${d(550)}ms` }}
            >
              {/* Left 2 solid, right 2 also solid (总经理直管) */}
              {[0,1,2,3].map(i => (
                <div key={i} className="flex-1 flex flex-col items-center">
                  {/* Vertical stem */}
                  <div className={`w-0.5 h-5 ${i === 2 ? 'bg-violet-400' : 'bg-slate-300'} ${i === 2 ? 'border-dashed' : ''}`}
                    style={i === 2 ? { background: 'repeating-linear-gradient(to bottom, #a78bfa 0, #a78bfa 4px, transparent 4px, transparent 8px)', width: 2 } : {}} />
                </div>
              ))}
            </div>
            {/* Horizontal bar connecting all 4 stems */}
            <div style={{ opacity: v ? 1 : 0, transition: `opacity 0.5s ease ${d(550)}ms` }}
              className="absolute top-5 left-[12.5%] right-[12.5%] border-t-2 border-slate-300" />
          </div>

          {/* L5: 四个部门（严格同行） */}
          <div
            className="grid grid-cols-4 gap-3"
            style={{ opacity: v ? 1 : 0, transform: v ? 'translateY(0)' : 'translateY(-8px)', transition: `all 0.5s ease ${d(600)}ms` }}
          >
            {[
              { label: '风险管理部', theme: 'teal' },
              { label: '市场管理部', theme: 'teal' },
              { label: '财务管理部', theme: 'teal', note: '总经理直管' },
              { label: '综合管理部', theme: 'teal', note: '总经理直管' },
            ].map(n => (
              <div key={n.label} className="flex flex-col items-center gap-0.5">
                <Node label={n.label} theme={n.theme} visible={v} delay={d(600)} />
                {n.note && <span className="text-[9px] text-violet-500 font-semibold">{n.note}·副总协管</span>}
              </div>
            ))}
          </div>

          {/* Branch: 各部门→经理 */}
          <div
            className="grid grid-cols-4"
            style={{ opacity: v ? 1 : 0, transition: `opacity 0.4s ease ${d(700)}ms` }}
          >
            {[1,1,1,1].map((_, i) => (
              <div key={i} className="flex justify-center">
                <div className="w-0.5 h-6 bg-slate-300" />
              </div>
            ))}
          </div>

          {/* L6: 经理层（严格同行） */}
          <div
            className="grid grid-cols-4 gap-3"
            style={{ opacity: v ? 1 : 0, transform: v ? 'translateY(0)' : 'translateY(-8px)', transition: `all 0.5s ease ${d(750)}ms` }}
          >
            {[
              { label: '风控主管',    theme: 'red' },
              { label: '市场经理',    theme: 'red' },
              { label: '财务经理',    theme: 'red' },
              { label: '行政人事经理',theme: 'red' },
            ].map(n => (
              <div key={n.label} className="flex justify-center">
                <Node label={n.label} theme={n.theme} visible={v} delay={d(750)} />
              </div>
            ))}
          </div>

          {/* Branch: 经理→员工 */}
          <div
            className="grid grid-cols-4"
            style={{ opacity: v ? 1 : 0, transition: `opacity 0.4s ease ${d(850)}ms` }}
          >
            {/* 风控: 无子节点（风控主管就是最底层）, 其他: 有子节点 */}
            {[false, true, true, true].map((has, i) => (
              <div key={i} className="flex justify-center">
                {has ? <div className="w-0.5 h-6 bg-slate-300" /> : <div className="h-6" />}
              </div>
            ))}
          </div>

          {/* L7: 执行层（严格同行，风控留空） */}
          <div
            className="grid grid-cols-4 gap-3"
            style={{ opacity: v ? 1 : 0, transform: v ? 'translateY(0)' : 'translateY(-8px)', transition: `all 0.5s ease ${d(900)}ms` }}
          >
            {/* 风控: 空 */}
            <div />
            {/* 市场: 单证组 + 采购组 */}
            <div className="flex flex-col items-center gap-1">
              <div className="flex gap-2">
                <Node label="单证组" theme="amber" small visible={v} delay={d(900)} />
                <Node label="采购组" theme="amber" small visible={v} delay={d(950)} />
              </div>
            </div>
            {/* 财务: 会计 + 出纳 */}
            <div className="flex justify-center gap-2">
              <Node label="会计" theme="amber" small visible={v} delay={d(900)} />
              <Node label="出纳" theme="amber" small visible={v} delay={d(950)} />
            </div>
            {/* 综合: 行政人事专员 + 外勤专员 */}
            <div className="flex flex-col items-center gap-1">
              <div className="flex gap-1 flex-wrap justify-center">
                <Node label="行政人事专员" theme="amber" small visible={v} delay={d(900)} />
                <Node label="外勤专员" theme="amber" small visible={v} delay={d(950)} />
              </div>
            </div>
          </div>

          {/* Branch: 单证组→单证主管 */}
          <div
            className="grid grid-cols-4"
            style={{ opacity: v ? 1 : 0, transition: `opacity 0.4s ease ${d(1000)}ms` }}
          >
            <div />
            <div className="flex justify-center"><div className="w-0.5 h-6 bg-slate-300" /></div>
            <div /><div />
          </div>

          {/* L8: 单证主管 */}
          <div
            className="grid grid-cols-4"
            style={{ opacity: v ? 1 : 0, transform: v ? 'translateY(0)' : 'translateY(-8px)', transition: `all 0.5s ease ${d(1050)}ms` }}
          >
            <div />
            <div className="flex justify-center">
              <Node label="单证主管" theme="amber" small visible={v} delay={d(1050)} />
            </div>
            <div /><div />
          </div>

          {/* Branch: 单证主管→专员 */}
          <div
            className="grid grid-cols-4"
            style={{ opacity: v ? 1 : 0, transition: `opacity 0.4s ease ${d(1100)}ms` }}
          >
            <div />
            <div className="flex justify-center"><div className="w-0.5 h-6 bg-slate-300" /></div>
            <div /><div />
          </div>

          {/* L9: 单证专员 + 国际贸易专员 */}
          <div
            className="grid grid-cols-4"
            style={{ opacity: v ? 1 : 0, transform: v ? 'translateY(0)' : 'translateY(-8px)', transition: `all 0.5s ease ${d(1100)}ms` }}
          >
            <div />
            <div className="flex justify-center gap-2 flex-wrap">
              <Node label="单证专员" theme="amber" small visible={v} delay={d(1100)} />
              <Node label="国际贸易专员" theme="amber" small visible={v} delay={d(1150)} />
            </div>
            <div /><div />
          </div>

        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs items-center">
        <span className="font-bold text-slate-500">图例：</span>
        {[
          { label: '决策层', cls: 'bg-violet-100 border-violet-400 text-violet-900' },
          { label: '经营层', cls: 'bg-blue-100 border-blue-400 text-blue-900' },
          { label: '职能部门', cls: 'bg-teal-100 border-teal-400 text-teal-900' },
          { label: '管理岗', cls: 'bg-rose-100 border-rose-400 text-rose-900' },
          { label: '执行岗', cls: 'bg-amber-100 border-amber-400 text-amber-900' },
        ].map(l => (
          <span key={l.label} className={`px-3 py-1 rounded-full border-2 font-semibold ${l.cls}`}>{l.label}</span>
        ))}
        <span className="flex items-center gap-1.5 text-violet-600 font-semibold">
          <svg width="24" height="10"><line x1="0" y1="5" x2="24" y2="5" stroke="#8b5cf6" strokeWidth="2" strokeDasharray="5 3"/></svg>
          副总协管财务/综合
        </span>
      </div>
    </div>
  );
};

export default OrgChartPage;
