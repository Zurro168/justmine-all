import React from 'react';
import { SectionTitle, Card } from '../components/ui';
import { Users, BookOpen, Heart } from 'lucide-react';

const PartyBuildingPage = () => {
  return (
    <div className="space-y-12 animate-in slide-in-from-bottom-4 duration-500">
      <SectionTitle title="党建园地" subtitle="党建引领 · 凝心聚力 · 共促发展" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="p-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-red-100 rounded-xl text-red-600"><Users size={24} /></div>
            <h3 className="text-xl font-bold text-slate-800">组织建设</h3>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            公司党支部成立于2024年，现有党员12名。坚持"三会一课"制度，
            定期开展主题党日活动，将党建工作与业务发展深度融合。
          </p>
        </Card>

        <Card className="p-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-red-100 rounded-xl text-red-600"><BookOpen size={24} /></div>
            <h3 className="text-xl font-bold text-slate-800">学习活动</h3>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            每月组织党员学习党的理论知识和行业政策，结合公司实际业务，
            开展"党建+业务"专题研讨会，提升团队政治素养和业务能力。
          </p>
        </Card>
      </div>

      <Card className="p-8 bg-gradient-to-br from-red-50 to-orange-50 border-red-100">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 bg-red-100 rounded-xl text-red-600"><Heart size={24} /></div>
          <h3 className="text-xl font-bold text-slate-800">社会责任</h3>
        </div>
        <p className="text-sm text-slate-600 leading-relaxed">
          积极参与公益事业，定点帮扶湛江当地困难家庭。推动绿色矿山建设，
          坚持可持续发展理念，为地方经济发展和社会和谐贡献力量。
        </p>
      </Card>
    </div>
  );
};

export default PartyBuildingPage;
