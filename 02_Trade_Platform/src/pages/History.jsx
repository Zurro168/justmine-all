import React from 'react';
import { SectionTitle, Card } from '../components/ui';
import { Award, TrendingUp, Globe } from 'lucide-react';

const HistoryPage = () => {
  const milestones = [
    { year: '2023', title: '公司成立', desc: '正矿供应链（广东）有限公司在湛江注册成立' },
    { year: '2024', title: '首批货物到港', desc: '完成首单澳洲锆英砂进口，打通全流程供应链' },
    { year: '2024', title: '年进口突破100万吨', desc: '与全球50+供应商建立合作关系' },
    { year: '2025', title: '数字化平台上线', desc: 'JustMine 官网上线，集成AI智能体引擎' },
  ];

  return (
    <div className="space-y-12 animate-in slide-in-from-bottom-4 duration-500">
      <SectionTitle title="发展历程" subtitle="正矿供应链的成长轨迹与里程碑" />

      <div className="max-w-3xl mx-auto">
        <div className="relative">
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-blue-200" />
          {milestones.map((m, idx) => (
            <div key={idx} className="relative flex items-start gap-6 mb-8">
              <div className="relative z-10 w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-black text-sm shrink-0">
                {m.year.slice(-2)}
              </div>
              <Card className="flex-1 p-6">
                <div className="text-xs font-black text-blue-600 uppercase tracking-widest mb-1">{m.year}</div>
                <h4 className="font-bold text-lg text-slate-800 mb-2">{m.title}</h4>
                <p className="text-sm text-slate-500">{m.desc}</p>
              </Card>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="text-center p-8">
          <Award className="mx-auto mb-4 text-blue-600" size={32} />
          <h4 className="font-bold text-lg mb-2">行业认证</h4>
          <p className="text-sm text-slate-500">通过ISO 9001质量管理体系认证</p>
        </Card>
        <Card className="text-center p-8">
          <TrendingUp className="mx-auto mb-4 text-emerald-600" size={32} />
          <h4 className="font-bold text-lg mb-2">业务增长</h4>
          <p className="text-sm text-slate-500">年进口量连续3年增长超50%</p>
        </Card>
        <Card className="text-center p-8">
          <Globe className="mx-auto mb-4 text-purple-600" size={32} />
          <h4 className="font-bold text-lg mb-2">全球布局</h4>
          <p className="text-sm text-slate-500">覆盖澳洲、非洲、东南亚等矿区</p>
        </Card>
      </div>
    </div>
  );
};

export default HistoryPage;
