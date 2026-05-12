import React from 'react';
import { SectionTitle, Card } from '../components/ui';
import { Briefcase, MapPin, GraduationCap, Send } from 'lucide-react';

const CareersPage = () => {
  const positions = [
    { title: '国际贸易业务员', dept: '业务部', location: '湛江', type: '全职' },
    { title: '报关员', dept: '关务部', location: '湛江', type: '全职' },
    { title: '矿产质检工程师', dept: '质检部', location: '湛江/港口', type: '全职' },
    { title: '供应链数据分析师', dept: '运营部', location: '湛江', type: '全职' },
  ];

  return (
    <div className="space-y-12 animate-in slide-in-from-bottom-4 duration-500">
      <SectionTitle title="加入我们" subtitle="与正矿一起，打造矿产资源供应链新生态" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="text-center p-8">
          <Briefcase className="mx-auto mb-4 text-blue-600" size={32} />
          <h4 className="font-bold text-lg mb-2">广阔平台</h4>
          <p className="text-sm text-slate-500">参与全球矿产贸易，接触国际一流矿山和客户</p>
        </Card>
        <Card className="text-center p-8">
          <MapPin className="mx-auto mb-4 text-emerald-600" size={32} />
          <h4 className="font-bold text-lg mb-2">优越环境</h4>
          <p className="text-sm text-slate-500">湛江总部现代化办公环境，完善的福利待遇</p>
        </Card>
        <Card className="text-center p-8">
          <GraduationCap className="mx-auto mb-4 text-purple-600" size={32} />
          <h4 className="font-bold text-lg mb-2">成长空间</h4>
          <p className="text-sm text-slate-500">完善的培训体系，清晰的职业发展通道</p>
        </Card>
      </div>

      <div>
        <h3 className="text-xl font-bold text-slate-800 mb-6">在招职位 ({positions.length})</h3>
        <div className="space-y-4">
          {positions.map((pos, idx) => (
            <Card key={idx} className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:shadow-md transition-shadow">
              <div>
                <h4 className="font-bold text-lg text-slate-800">{pos.title}</h4>
                <div className="flex gap-3 mt-2 text-sm text-slate-500">
                  <span className="flex items-center gap-1"><MapPin size={14}/>{pos.location}</span>
                  <span>{pos.dept}</span>
                  <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-xs font-bold">{pos.type}</span>
                </div>
              </div>
              <button className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700 transition-colors">
                <Send size={16}/> 投递简历
              </button>
            </Card>
          ))}
        </div>
      </div>

      <div className="bg-slate-50 rounded-[2.5rem] p-10 text-center border border-slate-100">
        <h3 className="text-xl font-black text-slate-800 mb-3">简历投递</h3>
        <p className="text-sm text-slate-500 mb-4">请将简历发送至：</p>
        <p className="text-lg font-bold text-blue-600">hr@justmine.cn</p>
        <p className="text-xs text-slate-400 mt-2">邮件标题格式：应聘职位 - 姓名</p>
      </div>
    </div>
  );
};

export default CareersPage;
