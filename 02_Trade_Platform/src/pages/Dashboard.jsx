import React, { useState } from 'react';
import { Card, SectionTitle } from '../components/ui';
import { FileStack, Clock, PieChart, AlertCircle, ChevronRight, CheckCircle2, LogIn, Lock, Ship, Globe, Package, TrendingUp, MapPin } from 'lucide-react';
import { MOCK_ORDERS, MOCK_ALERTS } from '../services/mockData';
import SmartSettlementModal from '../components/business/settlement/SmartSettlementModal';
import { useStore } from '../store/useStore';
import roster from '../data/employee-roster.json';
import activatedUsers from '../data/users.json';
import publicData from '../data/dashboard-public.json';
import ordersData from '../data/orders.json';

const ICON_MAP = { Package, TrendingUp, Ship, Globe };

// ========== Public Overview (visible without login) ==========
const PublicOverview = () => {
  const { toggleLogin } = useStore();

  const KPIs = publicData.kpis;
  const ORIGINS = publicData.origins;
  const PORTS = publicData.ports;

  const colorMap = {
    blue:    { bg: 'bg-blue-50',    text: 'text-blue-600',   icon: 'bg-blue-100' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600',icon: 'bg-emerald-100' },
    purple:  { bg: 'bg-purple-50',  text: 'text-purple-600', icon: 'bg-purple-100' },
    amber:   { bg: 'bg-amber-50',   text: 'text-amber-600',  icon: 'bg-amber-100' },
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <SectionTitle title="正矿供应链 · 业务看板" subtitle="全球采购总览 · 公开数据实时更新" />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {KPIs.map(kpi => {
          const c = colorMap[kpi.color];
          const Icon = ICON_MAP[kpi.icon];
          return (
            <Card key={kpi.label} className={`${c.bg} border-0 hover:shadow-md transition-shadow`}>
              <div className={`w-10 h-10 ${c.icon} rounded-xl flex items-center justify-center mb-3`}>
                <Icon size={20} className={c.text} />
              </div>
              <div className={`text-2xl font-black ${c.text} mb-0.5`}>{kpi.value}</div>
              <div className="text-sm font-semibold text-slate-700 mb-0.5">{kpi.label}</div>
              <div className="text-xs text-slate-400">{kpi.sub}</div>
            </Card>
          );
        })}
      </div>

      {/* In-transit origins + lock screen */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Origins */}
        <Card className="shadow-sm">
          <h3 className="font-bold text-lg text-slate-800 mb-5 flex items-center gap-2">
            <MapPin size={18} className="text-blue-600" /> 当前货源地分布
          </h3>
          <div className="space-y-4">
            {ORIGINS.map(o => (
              <div key={o.country}>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-sm font-semibold text-slate-700">{o.flag} {o.country} <span className="text-slate-400 font-normal">· {o.product}</span></span>
                  <span className="text-sm font-bold text-slate-600">{o.pct}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${o.color}`} style={{ width: `${o.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-3 gap-3 text-center">
            {PORTS.map(p => (
              <div key={p.label} className="bg-slate-50 rounded-xl p-3">
                <div className="font-bold text-sm text-slate-700">{p.label}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">{p.sub}</div>
              </div>
            ))}
          </div>
          <div className="mt-4 text-[9px] text-slate-300 uppercase font-bold tracking-widest text-right">Data Source: dashboard-public.json</div>
        </Card>

        {/* Locked detail call-to-action */}
        <div className="relative rounded-2xl border-2 border-dashed border-blue-200 overflow-hidden bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col items-center justify-center p-10 text-center gap-4 min-h-[280px]">
          <div className="absolute inset-0 backdrop-blur-[2px]" />
          <div className="relative z-10 space-y-4">
            <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
              <Lock size={28} className="text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-800 mb-1">订单详情 · 单证状态 · 结算报表</h3>
              <p className="text-sm text-slate-500 leading-relaxed">以上内容仅限正矿供应链平台注册用户查看，<br/>登录后可访问全部订单实时数据与协同工具。</p>
            </div>
            <button
              onClick={toggleLogin}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-3 rounded-xl shadow-lg shadow-blue-500/25 flex items-center gap-2 mx-auto transition-all hover:scale-105"
            >
              <LogIn size={16} /> 登录查看全部数据
            </button>
            <p className="text-xs text-slate-400">还没有账号？<span className="text-blue-600 cursor-pointer hover:underline">联系正矿团队开通权限</span></p>
          </div>
        </div>
      </div>
    </div>
  );
};

// ========== Admin User Management (Visible for ADMIN) ==========
const UserManagement = () => {
  return (
    <div className="space-y-6">
      <SectionTitle title="后台用户管理" subtitle="基于花名册的账户预审与激活监控" />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <h4 className="font-bold text-slate-800">自动预审花名册 (Employee Roster)</h4>
            <button className="text-xs px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 font-bold border border-blue-200 uppercase">
              上传/导入人员名单 (.xlsx)
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-slate-400 bg-slate-50 text-[10px] uppercase font-bold tracking-wider">
                <tr>
                  <th className="px-4 py-3 text-left">姓名 / English Name</th>
                  <th className="px-4 py-3 text-left">所属部门</th>
                  <th className="px-4 py-3 text-center">系统权限</th>
                  <th className="px-4 py-3 text-right">状态</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {roster.map(emp => {
                  const isUser = activatedUsers.some(u => u.name === emp.name);
                  return (
                    <tr key={emp.name} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-4">
                        <div className="font-bold text-slate-700">{emp.name}</div>
                        <div className="text-[10px] text-slate-400 uppercase tracking-tighter">{emp.englishName}</div>
                      </td>
                      <td className="px-4 py-4 text-slate-500">{emp.department}</td>
                      <td className="px-4 py-4 text-center">
                        <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-bold text-slate-500">{emp.role}</span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        {isUser ? (
                          <span className="text-emerald-600 flex items-center justify-end gap-1 font-bold text-xs">
                            <CheckCircle2 size={12} /> 已激活
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs italic">待激活</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="bg-slate-900 text-white">
          <h4 className="font-bold mb-4 flex items-center gap-2"><Lock size={18} className="text-blue-400"/> 管理说明</h4>
          <div className="space-y-4 text-xs leading-relaxed text-slate-400">
            <p className="bg-white/5 p-3 rounded-xl border border-white/10">
              <span className="text-blue-400 font-bold block mb-1">如何预授予账户？</span>
              在左侧“上传”功能中导入公司花名册。系统将自动锁定姓名和英文名。
            </p>
            <p className="bg-white/5 p-3 rounded-xl border border-white/10">
              <span className="text-blue-400 font-bold block mb-1">注册/激活逻辑</span>
              新入职员工只需在首页点击“内部员工激活”，输入花名册中的名称即可设置密码。
            </p>
            <div className="pt-2 border-t border-white/10 mt-4 italic">
              * 外部供应商或客户账户需由管理员在“集成后台”手动创建并分配密钥。
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

// ========== Logged-in Order Dashboard ==========
const OrderDashboard = () => {
  const [selectedOrder, setSelectedOrder] = useState(null);
  const { toggleLogin, user } = useStore();
  const [tab, setTab] = useState('orders'); // 'orders' or 'management'

  const handleSettlementClick = (e, order) => {
    e.stopPropagation();
    setSelectedOrder(order);
  };

  const isAdmin = user?.role === 'ADMIN';

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-6">
          <div 
            onClick={() => setTab('orders')}
            className={`cursor-pointer transition-all ${tab === 'orders' ? 'opacity-100' : 'opacity-40 hover:opacity-60'}`}
          >
            <SectionTitle title="客户协同工作台" subtitle="实时追踪合同执行及单证进度" />
          </div>
          {isAdmin && (
            <div 
              onClick={() => setTab('management')}
              className={`pt-2 cursor-pointer transition-all ${tab === 'management' ? 'opacity-100' : 'opacity-40 hover:opacity-60'}`}
            >
              <SectionTitle title="后台用户管理" subtitle="基于花名册的账户权限中心" />
            </div>
          )}
        </div>
        <div className="flex gap-3">
          {tab === 'orders' && (
            <>
              <button className="flex items-center gap-2 px-4 py-2 hover:bg-slate-100 border border-slate-200 rounded-lg text-sm bg-white shadow-sm transition-colors font-medium text-slate-700">
                <FileStack size={16}/> 单证管理中心
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm shadow-md shadow-blue-500/20 transition-all font-medium">
                新建采购申请
              </button>
            </>
          )}
          <button onClick={toggleLogin} className="text-xs text-slate-400 hover:text-red-500 transition px-2">退出登录</button>
        </div>
      </div>

      {tab === 'management' && isAdmin ? (
        <UserManagement />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
          <h4 className="font-bold text-slate-800 flex items-center gap-2 text-lg">
            <Clock size={20} className="text-orange-500" /> 进行中的合同 ({ordersData.orders.length})
          </h4>
          {ordersData.orders.map((order) => (
              <Card key={order.id} className="hover:shadow-md transition-shadow cursor-pointer group">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-5 gap-3">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <div className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-xs font-mono">{order.id}</div>
                      <h5 className="font-bold text-lg text-slate-800">{order.product}</h5>
                    </div>
                  </div>
                  <div className={`px-4 py-1.5 rounded-full text-xs font-bold shadow-sm ${
                    order.status === '运输中' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                    order.status === '报关中' ? 'bg-orange-50 text-orange-700 border border-orange-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  }`}>{order.status}</div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div><div className="text-slate-400 text-xs mb-1">货量 (湿吨)</div><div className="font-bold text-slate-700">{order.volume}</div></div>
                  <div><div className="text-slate-400 text-xs mb-1">承运船名</div><div className="font-bold text-slate-700 font-mono text-sm">{order.vessel}</div></div>
                  <div><div className="text-slate-400 text-xs mb-1">预计到港 (ETA)</div><div className="font-bold text-blue-600">{order.eta}</div></div>
                  <div>
                    <div className="text-slate-400 text-xs mb-1">结算状态</div>
                    {order.status === '已到港' ? (
                      <button onClick={(e) => handleSettlementClick(e, order)} className="text-white bg-blue-600 hover:bg-blue-700 text-xs font-bold py-1 px-3 rounded shadow transition-colors flex items-center gap-1">
                        <CheckCircle2 size={12}/> 去结算
                      </button>
                    ) : (
                      <div className="font-bold text-slate-500 text-sm">待CIQ商检</div>
                    )}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-medium text-slate-600">
                    <span>履约进度</span><span className="text-blue-600">{order.progress}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden shadow-inner">
                    <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full transition-all duration-1000" style={{ width: `${order.progress}%` }} />
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="space-y-6">
            <Card className="bg-gradient-to-br from-indigo-800 via-blue-700 to-blue-600 text-white shadow-xl border-0">
              <h4 className="font-bold mb-5 flex items-center gap-2 text-lg"><PieChart size={20}/> 资金结存风控</h4>
              <div className="space-y-5">
                <div className="bg-white/10 p-4 rounded-xl border border-white/10">
                  <div className="text-blue-100 text-xs mb-1">授信额度结余</div>
                  <div className="text-3xl font-black font-mono">¥1,245<span className="text-lg font-medium text-blue-200">万</span></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/10 p-3 rounded-xl"><div className="text-blue-200 text-xs mb-1">本月待收票据</div><div className="text-lg font-bold">¥3.20M</div></div>
                  <div className="bg-white/10 p-3 rounded-xl"><div className="text-blue-200 text-xs mb-1">临近付款节点</div><div className="text-lg font-bold text-orange-300">2笔</div></div>
                </div>
                <button className="w-full py-3 bg-white text-blue-800 hover:bg-blue-50 rounded-xl text-sm font-bold flex justify-center items-center gap-2">
                  生成对账单 <ChevronRight size={16}/>
                </button>
              </div>
              <div className="mt-4 text-[9px] text-slate-600 uppercase font-bold tracking-widest text-right">Data Source: orders.json</div>
            </Card>
            <Card>
              <h4 className="font-bold mb-4 flex items-center gap-2 text-slate-800"><AlertCircle size={18} className="text-red-500"/> 物流预警</h4>
              <div className="space-y-3">
                {ordersData.alerts.map(alert => (
                  <div key={alert.id} className={`text-sm p-3 rounded-xl border leading-relaxed ${alert.type === 'warning' ? 'bg-red-50 text-red-800 border-red-100' : 'bg-blue-50 text-blue-800 border-blue-100'}`}>
                    {alert.message}
                  </div>
                ))}
              </div>
              <div className="mt-4 text-[9px] text-slate-300 uppercase font-bold tracking-widest text-right">Data Source: orders.json</div>
            </Card>
          </div>
        </div>
      )}

      {selectedOrder && <SmartSettlementModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />}
    </div>
  );
};

const DashboardPage = () => {
  const { isLoggedIn } = useStore();
  return isLoggedIn ? <OrderDashboard /> : <PublicOverview />;
};

export default DashboardPage;
