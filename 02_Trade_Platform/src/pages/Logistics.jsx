import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, ZoomControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { 
  Ship, Anchor, Clock, AlertCircle, Wind, Gauge, Navigation, 
  Target, Info, Map as MapIcon, Layers, ChevronRight, Activity,
  ExternalLink, Maximize2, CheckCircle2
} from 'lucide-react';
import { SectionTitle, Card } from '../components/ui';
import logisticsData from '../data/logistics-data.json';

const { routes: ROUTES, ports: PORTS } = logisticsData;

// Fix default Leaflet marker icon missing in Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Professional Ship Glow Icon
const createShipIcon = (color, isActive) => L.divIcon({
  className: '',
  html: `<div class="relative flex items-center justify-center">
    ${isActive ? `<div class="absolute inset-0 bg-${color}-500/30 rounded-full animate-ping scale-150"></div>` : ''}
    <div style="width:36px;height:36px;background:${color};border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 10px 20px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;z-index:20;">
      <div style="transform:rotate(45deg);color:white;font-size:14px;">⛵</div>
    </div>
  </div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 36],
});

const createPortIcon = (color) => L.divIcon({
  className: '',
  html: `<div style="width:16px;height:16px;background:${color};border-radius:50%;border:4px solid rgba(255,255,255,0.8);box-shadow:0 4px 12px rgba(0,0,0,0.4);"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

// Data moved to src/data/logistics-data.json for easier maintenance

const LogisticsPage = () => {
  const [selected, setSelected] = useState(ROUTES[0]);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setTick(v => v + 1), 2000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        <SectionTitle title="全球海运智控中心" subtitle="AIS 卫星实时位追踪 · 数字化航线监控 · 港口拥堵深度分析" />
        <div className="flex items-center gap-4">
           <div className="flex -space-x-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 overflow-hidden shadow-sm">
                   <img src={`https://i.pravatar.cc/100?img=${i+10}`} alt="user" />
                </div>
              ))}
           </div>
           <div className="h-10 w-px bg-slate-200" />
           <div className="flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-2xl border border-emerald-100">
              <span className={`w-2 h-2 rounded-full bg-emerald-500 ${tick % 2 === 0 ? 'animate-pulse' : ''}`} />
              <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest leading-none">AIS Live Stream Active</span>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" style={{ height: '650px' }}>
        {/* Sidebar: Tactical List */}
        <div className="lg:col-span-3 flex flex-col gap-6 overflow-hidden">
            <Card className="bg-white border-2 border-blue-100 p-6 shadow-xl shrink-0">
               <div className="flex items-center justify-between mb-6">
                  <div className="text-[10px] font-black text-blue-600 uppercase tracking-widest">全球海运指标概览</div>
                  <Maximize2 size={14} className="text-slate-300" />
               </div>
               <div className="grid grid-cols-2 gap-y-6">
                  <div>
                     <div className="text-2xl font-black text-slate-900">{logisticsData.indices.bdi.value} <span className="text-[10px] text-emerald-600 ml-1">{logisticsData.indices.bdi.change}</span></div>
                     <div className="text-[9px] font-black text-slate-500 uppercase mt-1">BDI 波罗的海指数</div>
                  </div>
                  <div>
                     <div className="text-2xl font-black text-slate-900">{logisticsData.indices.ccfi.value} <span className="text-[10px] text-emerald-400 ml-1">{logisticsData.indices.ccfi.change}</span></div>
                     <div className="text-[9px] font-black text-slate-500 uppercase mt-1">CCFI 中国运价指数</div>
                  </div>
                  <div>
                     <div className="text-2xl font-black text-slate-900">{logisticsData.indices.scfi.value} <span className="text-[10px] text-red-400 ml-1">{logisticsData.indices.scfi.change}</span></div>
                     <div className="text-[9px] font-black text-slate-500 uppercase mt-1">SCFI 上海出口指数</div>
                  </div>
                  <div>
                     <div className="text-2xl font-black text-emerald-600">0%</div>
                     <div className="text-[9px] font-black text-slate-500 uppercase mt-1">综合风险警报</div>
                  </div>
               </div>
               <div className="mt-4 text-[9px] text-slate-300 uppercase font-bold tracking-widest text-right">Data Source: logistics-data.json</div>
            </Card>

           <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar">
              {ROUTES.map(r => {
                const isActive = selected?.id === r.id;
                return (
                  <div 
                    key={r.id}
                    onClick={() => setSelected(r)}
                    className={`group p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                      isActive ? 'border-blue-600 bg-white shadow-xl' : 'border-slate-50 bg-slate-50/50 hover:bg-white hover:border-slate-200'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-3">
                       <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isActive ? 'bg-blue-600 text-white' : 'bg-white text-slate-400 border border-slate-100 shadow-sm'}`}>
                          <Ship size={20} />
                       </div>
                       <div className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-tighter ${isActive ? 'bg-blue-100 text-blue-600' : 'bg-slate-200 text-slate-500'}`}>
                          {r.vesselType}
                       </div>
                    </div>
                    <h4 className={`font-black text-sm mb-1 transition-colors ${isActive ? 'text-slate-900' : 'text-slate-600 group-hover:text-slate-900'}`}>{r.vessel}</h4>
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tight mb-4">{r.name}</div>
                    
                    <div className="flex items-center justify-between text-[11px] font-black mb-3">
                       <div className="flex items-center gap-1 text-slate-800"><Navigation size={10} className="text-blue-500" /> {r.speed}</div>
                       <div className="text-blue-600">ETA {r.eta}</div>
                    </div>

                    <div className="space-y-1.5">
                       <div className="flex justify-between text-[10px] font-black uppercase text-slate-400">
                          <span>Progress</span>
                          <span className={isActive ? 'text-blue-600' : ''}>{r.progress}%</span>
                       </div>
                       <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${r.progress}%`, background: r.color }} />
                       </div>
                    </div>
                  </div>
                );
              })}
           </div>

           <Card className="p-5 border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2 text-xs font-black text-slate-900 mb-4 uppercase tracking-widest">
                 <Anchor size={14} className="text-blue-600" /> 港口拥堵 Alpha 系数
              </div>
              <div className="space-y-3">
                 {PORTS.filter(p => p.type === 'dest').map(p => (
                   <div key={p.name} className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-600">{p.name}</span>
                      <div className="flex items-center gap-3">
                         <span className="text-[11px] font-black text-slate-900 font-mono">α={p.alpha}</span>
                         <div className={`w-2 h-2 rounded-full ${p.status === 'Green' ? 'bg-emerald-500' : 'bg-amber-500 shadow-lg shadow-amber-500/50'}`} />
                      </div>
                   </div>
                 ))}
              </div>
           </Card>
        </div>

        {/* Main: Advanced Map View */}
        <div className="lg:col-span-9 rounded-3xl overflow-hidden border border-slate-200 shadow-2xl relative">
           {/* Floating Info Overlay */}
           {selected && (
            <div className="absolute top-6 left-6 z-[1000] w-72 pointer-events-none">
               <div className="bg-slate-900/95 backdrop-blur-xl p-6 rounded-3xl border border-white/10 shadow-3xl pointer-events-auto transition-all animate-in slide-in-from-left-4">
                  <div className="flex items-center justify-between mb-6">
                     <span className="px-2 py-0.5 bg-blue-600 text-white rounded text-[9px] font-black uppercase tracking-widest">Target Acquired</span>
                     <Activity size={16} className="text-emerald-400" />
                  </div>
                  <h3 className="text-xl font-black text-white mb-1">{selected.vessel}</h3>
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">MMSI: 231920XXX · {selected.id}</div>
                  
                  <div className="grid grid-cols-2 gap-4">
                     {Object.entries(selected.stats).map(([k, v]) => (
                       <div key={k}>
                          <div className="text-[9px] font-black text-slate-500 uppercase mb-1">{k}</div>
                          <div className="text-xs font-black text-slate-100 uppercase">{v}</div>
                       </div>
                     ))}
                  </div>

                  <div className="mt-8 pt-6 border-t border-white/5 space-y-3">
                     <div className="flex justify-between items-center text-[10px] font-black uppercase">
                        <span className="text-slate-500">Carrier Cargo</span>
                        <span className="text-blue-400">{selected.product}</span>
                     </div>
                     <div className="flex justify-between items-center text-xs font-black text-white">
                        <span>{selected.volume}</span>
                        <div className="flex items-center gap-1 text-[10px] text-emerald-400">
                           <CheckCircle2 size={12} /> SECURE
                        </div>
                     </div>
                  </div>
                  
                  <button className="w-full mt-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-black text-[10px] uppercase tracking-widest border border-white/10 transition-all">
                     View AIS Raw Report
                  </button>
               </div>
            </div>
           )}

           {/* Map Legend Floating */}
           <div className="absolute bottom-6 left-6 z-[1000] bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-slate-200 shadow-xl flex gap-6 items-center">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-600">
                 <div className="w-8 h-1 bg-blue-500 rounded-full" /> Selection
              </div>
              <div className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-600">
                 <div className="w-3 h-3 rounded-full bg-amber-500 border-2 border-white shadow-sm" /> Dest Port
              </div>
              <div className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-600">
                 <Ship size={14} className="text-slate-400" /> AIS Position
              </div>
           </div>

           <MapContainer
             center={[10, 85]}
             zoom={3}
             style={{ height: '100%', width: '100%', background: '#0f172a' }}
             zoomControl={false}
           >
             <ZoomControl position="bottomright" />
             <TileLayer
               attribution='&copy; Mapbox'
               url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
             />

             {/* Dynamic Routes */}
             {ROUTES.map(r => (
               <Polyline
                 key={r.id}
                 positions={r.points}
                 color={r.color}
                 weight={selected?.id === r.id ? 4 : 1.5}
                 opacity={selected?.id === r.id ? 0.8 : 0.3}
                 dashArray={selected?.id === r.id ? null : '8 8'}
                 eventHandlers={{ click: () => setSelected(r) }}
               />
             ))}

             {/* Ship Markers */}
             {ROUTES.map(r => (
               <Marker
                 key={`ship-${r.id}`}
                 position={r.currentPos}
                 icon={createShipIcon(r.color, selected?.id === r.id)}
                 eventHandlers={{ click: () => setSelected(r) }}
               >
                 <Popup offset={[0, -20]} className="custom-popup">
                   <div className="p-2">
                      <div className="text-xs font-black text-slate-900 mb-1">{r.vessel}</div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase">{r.product} · {r.volume}</div>
                   </div>
                 </Popup>
               </Marker>
             ))}

             {/* Port Markers */}
             {PORTS.map(p => (
               <Marker
                 key={p.name}
                 position={p.pos}
                 icon={createPortIcon(p.type === 'dest' ? '#f59e0b' : '#94a3b8')}
               >
                 <Popup offset={[0, -5]}>
                    <div className="p-1">
                       <div className="text-xs font-black text-slate-900">{p.name}</div>
                       <div className="text-[9px] text-slate-400 font-bold uppercase">{p.type === 'dest' ? 'Destination Port' : 'Origin Port'}</div>
                    </div>
                 </Popup>
               </Marker>
             ))}
           </MapContainer>
        </div>
      </div>
    </div>
  );
};

export default LogisticsPage;
