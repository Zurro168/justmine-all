import React from 'react';
import { Card, SectionTitle } from '../components/ui';
import { Award, Briefcase, ChevronRight } from 'lucide-react';

const CorporatePage = () => {
  return (
    <div className="space-y-12 animate-in slide-in-from-bottom-4 duration-500">
      <SectionTitle title="走进企业" subtitle="企业实力展示、党建引领及人才招聘" />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div>
          <h3 className="text-2xl font-bold mb-4 text-slate-800">关于我们 (About Us)</h3>
          <p className="text-slate-600 leading-relaxed mb-6 text-justify">
            正矿供应链（广东）有限公司在数字化转型、产业升级的背景下，在行业协会、合作伙伴及金融机构的支持下应运而生。公司总部位于国际贸易与物流枢纽城市湛江，专注于高端矿产资源供应链服务，致力于成为进口供应链数字化领先企业，打造进口矿产产业互联网平台。公司主要从事锆钛原矿进口，将其转化为高附加值的锆英砂、金红石、钛精矿、独居石及蓝晶石等系列产品。
          </p>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-6 bg-blue-50 hover:bg-blue-100 transition-colors rounded-2xl border border-blue-100">
              <div className="text-2xl lg:text-3xl font-black text-blue-600 mb-1">100万+</div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">年进口量(吨)</div>
            </div>
            <div className="text-center p-6 bg-blue-50 hover:bg-blue-100 transition-colors rounded-2xl border border-blue-100">
              <div className="text-2xl lg:text-3xl font-black text-blue-600 mb-1">50+</div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">全球供应商</div>
            </div>
            <div className="text-center p-6 bg-blue-50 hover:bg-blue-100 transition-colors rounded-2xl border border-blue-100">
              <div className="text-2xl lg:text-3xl font-black text-blue-600 mb-1">Top 3</div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">行业排名</div>
            </div>
          </div>
        </div>
        <img 
          src="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=2069" 
          className="rounded-3xl shadow-xl h-[400px] object-cover w-full object-center border border-slate-200"
          alt="Office"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
        <Card className="bg-white border-blue-100 hover:shadow-lg transition-shadow group">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-blue-100 rounded-xl text-blue-600 shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Award />
            </div>
            <h3 className="text-xl font-bold text-slate-800">全球采购与先进加工</h3>
          </div>
          <p className="text-slate-600 mb-6 text-sm leading-relaxed">
            <span className="font-bold">全球采购网络：</span>我们与全球多个知名矿山建立长期稳定的合作关系，确保原材料的稳定供应与卓越品质。<br/>
            <span className="font-bold">先进加工技术：</span>公司与拥有先进的加工技术和完善的质检体系的多家大型加工企业有战略合作关系。
          </p>
        </Card>
        
        <Card className="bg-slate-900 text-white border-slate-800 hover:shadow-xl transition-shadow group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl -mr-10 -mt-10" />
          <div className="flex items-center gap-4 mb-4 relative z-10">
            <div className="p-3 bg-blue-600 rounded-xl shadow-md group-hover:bg-blue-500 transition-colors"><Briefcase /></div>
            <h3 className="text-xl font-bold">一站式服务与可持续发展</h3>
          </div>
          <p className="text-slate-300 mb-6 text-sm leading-relaxed relative z-10">
            <span className="font-bold text-white">一站式服务：</span>拥有国有码头等战略合作伙伴的深度支持，提供从产品咨询、样品提供、合同签订、金融端融资服务到物流配送的一站式服务。<br/>
            <span className="font-bold text-white">可持续发展：</span>秉承绿色发展理念，致力于矿产资源的可持续开发与利用，为社会贡献绿色力量。
          </p>
        </Card>
      </div>
      <div className="bg-slate-50 rounded-[2.5rem] p-10 md:p-16 border border-slate-100 mt-12 text-center">
         <div className="max-w-2xl mx-auto">
            <h3 className="text-2xl font-black text-slate-800 mb-4">保持连接 · 获取最新洞察</h3>
            <p className="text-slate-500 mb-10 text-sm font-medium leading-relaxed">
               关注“正矿供应链”官方公众号，获取全球矿产行情周报、国际贸易政策深度分析及公司最新动态。
            </p>
            <div className="inline-block bg-white p-6 rounded-[2rem] shadow-xl border border-slate-100 group hover:scale-105 transition-transform duration-500">
               <img src="/assets/wechat-public-qr.png" alt="公众号二维码" className="w-32 h-32 rounded-xl mb-4" />
               <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">扫描二维码关注</div>
            </div>
         </div>
      </div>
    </div>
  );
};

export default CorporatePage;
