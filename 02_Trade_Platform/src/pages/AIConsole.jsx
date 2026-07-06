import React, { useState, useEffect } from 'react';
import { Shield, ExternalLink, Activity, Terminal, AlertCircle, CheckCircle2 } from 'lucide-react';

const STATUS_COPY = {
  checking: '正在同步系统状态...',
  online: 'AI 智能大屏 · 真实链路在线',
  mock: '模拟模式 · 等待生产密钥注入',
  degraded: '降级运行 · 外部依赖未完整配置',
  offline: '连接失败 · 后端未启动',
};

const getStatusDot = (status) => {
  if (status === 'online') return 'bg-emerald-500';
  if (status === 'offline') return 'bg-red-500';
  return 'bg-amber-500';
};

const AIConsole = () => {
  const [status, setStatus] = useState('checking');
  const [health, setHealth] = useState(null);

  const hostname = window.location.hostname;
  const isLocal = hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.');
  const DASHBOARD_URL = isLocal
    ? `http://${hostname}:3000`
    : `${window.location.protocol}//${hostname}/ai-manager/`;

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const response = await fetch(`${DASHBOARD_URL.replace(/\/$/, '')}/health`, {
          mode: 'cors',
          cache: 'no-cache'
        });
        if (response.ok) {
          const data = await response.json();
          setHealth(data);
          setStatus(data.status || 'online');
        } else {
          setHealth(null);
          setStatus('offline');
        }
      } catch {
        setHealth(null);
        setStatus('offline');
      }
    };
    checkConnection();
    const interval = setInterval(checkConnection, 5000);
    return () => clearInterval(interval);
  }, [DASHBOARD_URL]);

  const isReachable = status !== 'checking' && status !== 'offline';
  const dependencyCopy = health?.dependencies
    ? `DeepSeek: ${health.dependencies.deepseek} · DashScope: ${health.dependencies.dashscope} · WeCom: ${health.dependencies.wecom_webhook}`
    : '等待后端返回依赖状态';

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 rounded-3xl p-8 border border-white/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-10">
          <Terminal size={120} className="text-blue-400" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-blue-400 font-bold text-sm mb-3">
              <div className={`w-2 h-2 rounded-full animate-pulse ${getStatusDot(status)}`} />
              {STATUS_COPY[status] || STATUS_COPY.checking}
            </div>
            <h1 className="text-3xl font-black text-white mb-2">正矿智控 · 多智能体运维中心</h1>
            <p className="text-slate-400 max-w-xl text-sm leading-relaxed">
              {status === 'offline'
                ? '请在本地或服务器启动 app_dashboard.py，控制台才能显示 AI 中枢内容。'
                : `OpenClaw 核心已响应。${dependencyCopy}`}
            </p>
          </div>

          <a
            href={DASHBOARD_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={`bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-2xl flex items-center gap-3 transition-all backdrop-blur-md border border-white/10 group h-fit ${!isReachable ? 'opacity-50 pointer-events-none' : ''}`}
          >
            <ExternalLink size={18} className="group-hover:rotate-12 transition-transform" />
            新窗口全屏打开
          </a>
        </div>
      </div>

      <div className="glass rounded-[32px] overflow-hidden border border-slate-200 shadow-2xl bg-white min-h-[750px] relative">
        <div className="bg-slate-100/50 px-4 py-2 border-b border-slate-200 flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 bg-red-400 rounded-full" />
            <div className="w-2.5 h-2.5 bg-amber-400 rounded-full" />
            <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full" />
          </div>
          <div className="mx-auto text-[10px] font-mono text-slate-400 flex items-center gap-2">
            {status === 'online' ? <CheckCircle2 size={10} className="text-emerald-500" /> : <AlertCircle size={10} className="text-amber-500" />}
            TUNNEL_STATUS: {status.toUpperCase()} · {DASHBOARD_URL}
          </div>
        </div>

        {isReachable ? (
          <iframe
            src={DASHBOARD_URL}
            className="w-full h-[700px] border-none"
            title="正矿 AI 运维中心"
          />
        ) : (
          <div className="h-[700px] flex flex-col items-center justify-center text-slate-400 gap-4 bg-slate-50/50">
            <div className="p-4 bg-white rounded-full shadow-sm border border-slate-100 animate-bounce">
              <Activity size={32} className="text-blue-500" />
            </div>
            <div className="text-center">
              <p className="font-bold text-slate-800">等待后端连接...</p>
              <p className="text-xs max-w-xs mt-2">本地调试请启动 01_Intelligence_Engine/openclaw-deployment/app_dashboard.py。</p>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center"><Activity size={20} /></div>
          <div>
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">系统模式</div>
            <div className="text-lg font-black text-slate-800">{health?.mock_mode ? 'MOCK' : status.toUpperCase()}</div>
          </div>
        </div>
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center"><Shield size={20} /></div>
          <div>
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">防火墙状态</div>
            <div className="text-lg font-black text-slate-800">ACTIVE</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIConsole;
