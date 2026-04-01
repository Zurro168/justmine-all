import React, { useState } from 'react';
import { X, User, Lock, Eye, EyeOff, Loader2, CheckCircle2, ShieldCheck, Globe, Truck, Building2 } from 'lucide-react';
import { useStore } from '../../store/useStore';
import authService from '../../services/authService';

const LoginModal = ({ isOpen, onClose }) => {
  const login = useStore(state => state.login);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [nameForReg, setNameForReg] = useState('');
  const [view, setView] = useState('login'); // 'login' or 'register'
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let userData;
      if (view === 'login') {
        userData = await authService.login(username, password);
      } else {
        userData = await authService.registerByRoster(nameForReg, password);
      }
      
      login(userData);
      setSuccess(true);
      setTimeout(() => {
        onClose();
        resetForm();
      }, 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSuccess(false);
    setUsername('');
    setPassword('');
    setNameForReg('');
    setError('');
    setView('login');
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'EMPLOYEE': return <ShieldCheck className="text-blue-500" size={16} />;
      case 'UPSTREAM': return <Globe className="text-emerald-500" size={16} />;
      case 'DOWNSTREAM': return <Building2 className="text-amber-500" size={16} />;
      case 'SERVICE': return <Truck className="text-indigo-500" size={16} />;
      default: return null;
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="bg-gradient-to-br from-slate-900 to-blue-950 p-8 text-white relative">
          <button 
            onClick={onClose}
            className="absolute right-4 top-4 p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
          
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-600 rounded-xl">
              <User size={20} />
            </div>
            <span className="text-blue-300 text-xs font-bold uppercase tracking-widest">Client Portal · 登录中心</span>
          </div>
          <h2 className="text-2xl font-black">正矿供应链系统</h2>
          <p className="text-slate-400 text-sm mt-1">请使用您的身份凭证访问工作台</p>
        </div>

        {/* Content */}
        <div className="p-8">
          {/* View Toggle */}
          <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
            <button 
              onClick={() => { setView('login'); setError(''); }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${view === 'login' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}
            >
              账号登录
            </button>
            <button 
              onClick={() => { setView('register'); setError(''); }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${view === 'register' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}
            >
              内部员工激活
            </button>
          </div>

          {success ? (
            <div className="py-10 text-center animate-in zoom-in-95 duration-500">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full mb-4">
                <CheckCircle2 size={40} className="animate-bounce" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">登录成功</h3>
              <p className="text-slate-500">正在为您跳转至协同工作台...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl flex items-center gap-2 animate-in slide-in-from-top-2">
                  <span className="shrink-0 w-1.5 h-1.5 bg-red-500 rounded-full" />
                  {error}
                </div>
              )}

              {view === 'login' ? (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 ml-1 uppercase tracking-wider">用户名 / 账号</label>
                  <div className="relative group">
                    <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                    <input
                      required
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="输入用户名"
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-3.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 ml-1 uppercase tracking-wider">
                    员工姓名 (中/英)
                    <span className="ml-2 text-[10px] text-blue-500 normal-case font-medium">需匹配花名册</span>
                  </label>
                  <div className="relative group">
                    <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                    <input
                      required
                      type="text"
                      value={nameForReg}
                      onChange={(e) => setNameForReg(e.target.value)}
                      placeholder="例如：张三 或 San Zhang"
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-3.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 ml-1 uppercase tracking-wider">
                  {view === 'login' ? '安全密码' : '设置新密码'}
                </label>
                <div className="relative group">
                  <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                  <input
                    required
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={view === 'login' ? "输入密码" : "至少6位混合字符"}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-12 py-3.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {view === 'login' && (
                <div className="flex items-center justify-between px-1">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                    <span className="text-xs text-slate-500 group-hover:text-slate-700">记住登录状态</span>
                  </label>
                  <button type="button" className="text-xs font-bold text-blue-600 hover:text-blue-700">
                    忘记密码？
                  </button>
                </div>
              )}

              <button
                disabled={loading}
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  view === 'login' ? '立即安全登录' : '激活员工账号'
                )}
              </button>

              <div className="pt-4 mt-4 border-t border-slate-100">
                <p className="text-center text-[10px] text-slate-400 uppercase tracking-widest font-bold">演示账号分类</p>
                <div className="grid grid-cols-2 gap-2 mt-3">
                  <div className="p-2 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-2">
                    {getCategoryIcon('EMPLOYEE')}
                    <div className="text-[10px] leading-tight flex flex-col">
                      <span className="font-bold text-slate-700">admin / js</span>
                      <span className="text-slate-400">内部员工</span>
                    </div>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-2">
                    {getCategoryIcon('UPSTREAM')}
                    <div className="text-[10px] leading-tight flex flex-col">
                      <span className="font-bold text-slate-700">iluka_sales</span>
                      <span className="text-slate-400">上游供应商</span>
                    </div>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-2">
                    {getCategoryIcon('DOWNSTREAM')}
                    <div className="text-[10px] leading-tight flex flex-col">
                      <span className="font-bold text-slate-700">ceramics_buyer</span>
                      <span className="text-slate-400">下游客户</span>
                    </div>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-2">
                    {getCategoryIcon('SERVICE')}
                    <div className="text-[10px] leading-tight flex flex-col">
                      <span className="font-bold text-slate-700">logistics_agent</span>
                      <span className="text-slate-400">第三方服务</span>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginModal;
