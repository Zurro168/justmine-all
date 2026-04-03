import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, UserCircle2, Send, Activity, Settings2, ShieldAlert, Sparkles, RefreshCw } from 'lucide-react';

const SandboxPage = () => {
  const [messages, setMessages] = useState([]);
  const [nickname, setNickname] = useState('');
  const [isEditingNickname, setIsEditingNickname] = useState(true);
  const [tempNickname, setTempNickname] = useState('');
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef(null);

  const hostname = window.location.hostname;
  const isLocal = hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.');
  const API_BASE = isLocal 
      ? `http://${hostname}:3000` 
      : `${window.location.protocol}//${hostname}/ai-manager`;

  // Start polling
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/sandbox/messages`);
        if (response.ok) {
          const data = await response.json();
          // We only update if length changed or we can just deep equal, for simplicity just update
          setMessages(prev => {
              if (prev.length !== data.messages.length) {
                  return data.messages;
              }
              return prev;
          });
          setIsConnected(true);
        } else {
          setIsConnected(false);
        }
      } catch (err) {
        setIsConnected(false);
      }
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [API_BASE]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Check localstorage for nickname on mount
  useEffect(() => {
      const saved = localStorage.getItem('justmine-sandbox-nickname');
      if (saved) {
          setNickname(saved);
          setIsEditingNickname(false);
      }
  }, []);

  const handleSaveNickname = (e) => {
    e.preventDefault();
    if (!tempNickname.trim()) return;
    setNickname(tempNickname.trim());
    localStorage.setItem('justmine-sandbox-nickname', tempNickname.trim());
    setIsEditingNickname(false);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !nickname || isLoading) return;

    const currentText = inputText.trim();
    setInputText('');
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE}/api/sandbox/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: currentText, nickname: nickname })
      });
      if (!response.ok) {
          console.error("Failed to send");
      }
    } catch(err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isEditingNickname) {
      return (
          <div className="flex items-center justify-center min-h-[70vh]">
              <div className="glass rounded-[32px] p-10 max-w-md w-full border border-white/20 shadow-2xl relative overflow-hidden bg-white/50 backdrop-blur-xl">
                  <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
                  <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
                  
                  <div className="relative z-10 text-center space-y-6">
                      <div className="mx-auto w-20 h-20 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/30 transform rotate-3">
                          <UserCircle2 size={40} />
                      </div>
                      
                      <div>
                          <h2 className="text-2xl font-black text-slate-800 tracking-tight">配置调试身份</h2>
                          <p className="text-slate-500 text-sm mt-2 font-medium">请输入您的花名，以便在公共测试群中辨识</p>
                      </div>

                      <form onSubmit={handleSaveNickname} className="space-y-4">
                          <div className="relative group">
                              <input 
                                  autoFocus
                                  type="text" 
                                  value={tempNickname}
                                  onChange={e => setTempNickname(e.target.value)}
                                  placeholder="例如：采购部-王工"
                                  className="w-full bg-white/80 border-2 border-slate-100 rounded-xl py-3 px-4 text-slate-700 font-bold focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-sans"
                                  maxLength={15}
                              />
                          </div>
                          <button 
                              type="submit"
                              disabled={!tempNickname.trim()}
                              className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl py-3.5 font-bold transition-all shadow-xl shadow-slate-900/20 flex items-center justify-center gap-2 group"
                          >
                              进入沙盒频道 <Sparkles size={16} className="group-hover:animate-spin" />
                          </button>
                      </form>
                  </div>
              </div>
          </div>
      );
  }

  return (
    <div className="flex gap-6 h-[80vh] min-h-[600px]">
        {/* Left Sidebar - Meta & Tools */}
        <div className="w-1/4 hidden lg:flex flex-col gap-6">
            <div className="glass rounded-3xl p-6 border border-white/20 shadow-xl bg-gradient-to-b from-slate-900 to-slate-800 text-white relative overflow-hidden shrink-0">
                <div className="absolute top-0 right-0 p-8 opacity-10"><MessageSquare size={100}/></div>
                <div className="relative z-10 space-y-4">
                    <div className="flex items-center gap-2 pointer-events-none">
                        <span className="bg-blue-500/20 text-blue-300 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border border-blue-400/30">Beta Network</span>
                    </div>
                    <div>
                        <h2 className="text-2xl font-black tracking-tight flex items-center gap-2">
                            沙盒控制台 <Settings2 size={20} className="text-blue-400" />
                        </h2>
                        <p className="text-slate-400 text-xs mt-1 leading-relaxed">内网专供测试群组。所有在线员工可同步调试 AI 逻辑框架。</p>
                    </div>
                </div>
            </div>

            <div className="glass rounded-3xl p-6 border border-slate-200 shadow-xl bg-white flex-1 overflow-y-auto space-y-6 flex flex-col justify-between">
               <div className="space-y-4">
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                        <Activity size={16} className="text-emerald-500" /> 运行状态
                    </h3>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                            <span className="text-xs text-slate-500 font-bold">连接状态</span>
                            {isConnected ? 
                                <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-black"><div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div> ONLINE</span> :
                                <span className="flex items-center gap-1.5 text-xs text-red-600 font-black"><div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div> OFFLINE</span>
                            }
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                            <span className="text-xs text-slate-500 font-bold">当前身份</span>
                            <span className="text-xs text-blue-600 font-black flex items-center gap-1 cursor-pointer hover:underline" onClick={() => { setTempNickname(nickname); setIsEditingNickname(true); }}>
                                {nickname} <RefreshCw size={10} />
                            </span>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                            <span className="text-xs text-slate-500 font-bold">同步引擎</span>
                            <span className="text-xs text-slate-700 font-black">Long-Polling 3s</span>
                        </div>
                    </div>
               </div>

                <div className="p-4 rounded-xl bg-amber-50 border border-amber-100 text-amber-800 text-xs space-y-2 leading-relaxed font-medium">
                    <strong className="flex items-center gap-1"><ShieldAlert size={14}/> 注意事项</strong>
                    此环境下生成的所有 Trace ID 已自动同步至主日志。请勿输入真实的客户名或机密条款。
                </div>
            </div>
        </div>

        {/* Right Chat Area */}
        <div className="flex-1 glass rounded-3xl border border-slate-200 shadow-2xl bg-white overflow-hidden flex flex-col relative">
            {/* Chat Header */}
            <div className="px-6 py-4 border-b border-slate-100 bg-white/80 backdrop-blur-md flex justify-between items-center z-10 sticky top-0">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-inner">
                        <MessageSquare size={20} />
                    </div>
                    <div>
                        <h2 className="text-sm font-black text-slate-800">全员公共研发测试群 (Beta)</h2>
                        <div className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> 实时同步中
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
                {messages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-4 opacity-50">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                            <MessageSquare size={24} />
                        </div>
                        <p className="text-sm font-bold">暂无对话记录，发个句「行情」试试吧</p>
                    </div>
                )}
                
                {messages.map((msg) => {
                    const isMe = msg.sender === nickname && msg.type === 'user';
                    return (
                        <div key={msg.id} className={`flex flex-col gap-1 ${isMe ? 'items-end' : 'items-start'}`}>
                            {/* Meta Info */}
                            <div className={`flex items-center gap-2 text-[10px] font-bold ${isMe ? 'text-blue-500 flex-row-reverse' : 'text-slate-500'}`}>
                                <span>{msg.sender}</span>
                                <span className="opacity-40">&bull;</span>
                                <span className="opacity-60">{msg.timestamp}</span>
                                {msg.trace_id && (
                                    <>
                                        <span className="opacity-40">&bull;</span>
                                        <span className="font-mono bg-slate-200/50 px-1.5 py-0.5 rounded text-[9px] border border-slate-200">
                                            {msg.trace_id}
                                        </span>
                                    </>
                                )}
                            </div>
                            
                            {/* Message Bubble */}
                            <div className={`max-w-[80%] p-4 text-sm leading-relaxed relative ${
                                msg.type === 'ai' 
                                    ? 'bg-slate-900 text-slate-100 rounded-2xl rounded-tl-sm shadow-xl shadow-slate-900/10 border border-slate-800' 
                                    : isMe 
                                        ? 'bg-blue-600 text-white rounded-2xl rounded-tr-sm shadow-lg shadow-blue-500/20' 
                                        : 'bg-white text-slate-700 rounded-2xl rounded-tl-sm shadow-md border border-slate-100'
                            }`}>
                                {msg.text}
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white/80 backdrop-blur-md border-t border-slate-100">
                <form onSubmit={handleSendMessage} className="relative flex items-center shadow-sm">
                    <input 
                        type="text" 
                        value={inputText}
                        onChange={e => setInputText(e.target.value)}
                        placeholder="输入测试指令..."
                        disabled={isLoading || !isConnected}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-5 pr-14 text-sm focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium disabled:opacity-50"
                    />
                    <button 
                        type="submit" 
                        disabled={!inputText.trim() || isLoading || !isConnected}
                        className="absolute right-2 w-10 h-10 flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white rounded-xl disabled:bg-slate-300 disabled:text-slate-400 transition-all shadow-md group"
                    >
                        {isLoading ? <RefreshCw size={18} className="animate-spin" /> : <Send size={18} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />}
                    </button>
                </form>
            </div>
        </div>
    </div>
  );
};

export default SandboxPage;
