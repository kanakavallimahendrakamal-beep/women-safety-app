import React, { useState, useEffect } from "react";
import { 
  ShieldAlert, Phone, MapPin, Users, Video, Clock, 
  Activity, CheckCircle2, ChevronRight, MessageSquare, 
  Send, AlertCircle, RefreshCw, Navigation, Navigation2, FileText,
  Play, Pause, Volume2, ZoomIn, ZoomOut, Compass, Map,
  ArrowUp, ArrowDown, ArrowLeft, ArrowRight
} from "lucide-react";
import { Incident, PatrolUnit } from "../types";

interface AdminViewProps {
  incidents: Incident[];
  onUpdateIncident: (id: string, updates: Partial<Incident>) => void;
  onRefresh: () => void;
}

export default function AdminView({ incidents, onUpdateIncident, onRefresh }: AdminViewProps) {
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [dispatchUnitName, setDispatchUnitName] = useState("Vijayawada City Patrol Alpha-1");
  const [staffComment, setStaffComment] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Admin Live Tracking Map States
  const [adminMapZoom, setAdminMapZoom] = useState(1);
  const [adminMapMode, setAdminMapMode] = useState<"vector" | "satellite" | "heatmap">("vector");
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [selectedPatrolUnitId, setSelectedPatrolUnitId] = useState<string | null>(null);

  // States for simulated video and audio playback
  const [isPlayingSimulated, setIsPlayingSimulated] = useState(false);
  const [simulatedTime, setSimulatedTime] = useState(0);

  // Reset simulation states when selected incident changes
  useEffect(() => {
    setIsPlayingSimulated(false);
    setSimulatedTime(0);
  }, [selectedIncidentId]);

  // Handle simulated playback countdown
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlayingSimulated) {
      interval = setInterval(() => {
        setSimulatedTime(prev => (prev < 10 ? prev + 1 : 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlayingSimulated]);

  // Synthesize police distress/alert audio
  const playSimulatedAudio = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(450, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(900, audioCtx.currentTime + 0.5);
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.6);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.6);
    } catch (e) {
      console.warn("Audio Context blocked or unsupported:", e);
    }
  };

  // Pulse sound on each second of simulation
  useEffect(() => {
    if (isPlayingSimulated && simulatedTime >= 0) {
      playSimulatedAudio();
    }
  }, [isPlayingSimulated, simulatedTime]);

  // Simulated patrol units
  const patrolUnits: PatrolUnit[] = [
    { id: "P-101", name: "Vijayawada City Patrol Alpha-1", phone: "+91 94407 11101", status: "IDLE", currentLocationName: "Benz Circle", lat: 16.5050, lng: 80.6450 },
    { id: "P-102", name: "Guntur Urban Cruiser Beta-2", phone: "+91 94407 11102", status: "IDLE", currentLocationName: "NTR Stadium", lat: 16.3060, lng: 80.4430 },
    { id: "P-103", name: "Vizag Beach Squad Patrol-5", phone: "+91 94407 11103", status: "IDLE", currentLocationName: "R.K. Beach Road", lat: 17.7120, lng: 83.3210 },
    { id: "P-104", name: "Tirupati Temple Security Unit-4", phone: "+91 94407 11104", status: "IDLE", currentLocationName: "Alipiri Security Wing", lat: 13.6270, lng: 79.4150 }
  ];

  // Selected incident details
  const selectedIncident = incidents.find(inc => inc.id === selectedIncidentId) || incidents[0];

  useEffect(() => {
    if (selectedIncident && !selectedIncidentId) {
      setSelectedIncidentId(selectedIncident.id);
    }
  }, [selectedIncident, selectedIncidentId]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await onRefresh();
    setTimeout(() => setIsRefreshing(false), 800);
  };

  // Submit dispatcher action
  const handleDispatch = async () => {
    if (!selectedIncident) return;
    onUpdateIncident(selectedIncident.id, {
      status: "DISPATCHED",
      dispatchUnit: dispatchUnitName,
      dishaStaffComment: staffComment || `Cruiser ${dispatchUnitName} has been immediately deployed to coordinates.`
    });
    setStaffComment("");
  };

  // Resolve incident
  const handleResolve = () => {
    if (!selectedIncident) return;
    onUpdateIncident(selectedIncident.id, {
      status: "RESOLVED",
      dishaStaffComment: staffComment ? `${selectedIncident.dishaStaffComment || ""}\nUpdate: ${staffComment}` : selectedIncident.dishaStaffComment || "Incident resolved successfully. Citizen checked and confirmed safe."
    });
    setStaffComment("");
  };

  // Cruiser simulated movement coordinates towards the citizen
  const [cruiserOffset, setCruiserOffset] = useState({ lat: 0.003, lng: -0.003 });
  useEffect(() => {
    if (selectedIncident && selectedIncident.status === "DISPATCHED") {
      const interval = setInterval(() => {
        setCruiserOffset(prev => {
          const latDiff = prev.lat * 0.85;
          const lngDiff = prev.lng * 0.85;
          return { lat: latDiff, lng: lngDiff };
        });
      }, 3000);
      return () => clearInterval(interval);
    } else {
      // Reset position when not active or dispatched
      setCruiserOffset({ lat: 0.003, lng: -0.003 });
    }
  }, [selectedIncidentId, selectedIncident?.status]);

  return (
    <div className="w-full bg-zinc-950 text-zinc-300 rounded-xl overflow-hidden shadow-2xl border border-zinc-800 grid grid-cols-1 lg:grid-cols-12 min-h-[640px] font-sans">
      
      {/* LEFT COLUMN: Incidents Feed Queue (4 Cols) */}
      <div className="lg:col-span-4 border-r border-zinc-800 flex flex-col max-h-[720px]">
        <div className="p-4 bg-zinc-900 border-b border-zinc-800 flex justify-between items-center">
          <div>
            <h2 className="font-display font-bold text-sm tracking-wide uppercase text-red-500">AP DISHA SERVICES</h2>
            <p className="text-[10px] text-zinc-500 font-mono">LIVE INCIDENTS DISPATCH FEED</p>
          </div>
          <button 
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-1.5 hover:bg-zinc-800 rounded text-zinc-400 hover:text-red-500 transition-colors disabled:opacity-50 cursor-pointer"
            title="Refresh Feed"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-red-500" : ""}`} />
          </button>
        </div>

        {/* Incidents Scrollable Queue List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-2 bg-zinc-950">
          {incidents.map((inc) => {
            const isActive = selectedIncidentId === inc.id;
            const isCritical = inc.status === "ACTIVE";
            const isDispatched = inc.status === "DISPATCHED";

            return (
              <div 
                key={inc.id}
                onClick={() => setSelectedIncidentId(inc.id)}
                className={`p-3.5 rounded border transition-all cursor-pointer relative overflow-hidden ${
                  isActive 
                    ? "bg-zinc-900 border-zinc-750 shadow-md" 
                    : "bg-zinc-900/40 border-zinc-900 hover:bg-zinc-900"
                }`}
              >
                {/* Left Colored Alert Tag indicator */}
                <div className={`absolute top-0 bottom-0 left-0 w-1 ${
                  isCritical 
                    ? "bg-red-500" 
                    : isDispatched 
                      ? "bg-amber-500" 
                      : "bg-green-500"
                }`} />

                <div className="pl-2 flex justify-between items-start gap-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[11px] font-bold text-zinc-400">{inc.id}</span>
                      <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold uppercase tracking-wider ${
                        isCritical 
                          ? "bg-red-950/40 text-red-400 border border-red-900/30 animate-pulse" 
                          : isDispatched 
                            ? "bg-amber-950 text-amber-400 border border-amber-900" 
                            : "bg-green-950 text-green-400 border border-green-900"
                      }`}>
                        {inc.status}
                      </span>
                    </div>

                    <h4 className="text-xs font-semibold text-zinc-200 mt-1">{inc.citizenName}</h4>
                    <p className="text-[10px] text-zinc-500 font-mono mt-0.5">{inc.citizenPhone}</p>
                  </div>

                  <div className="text-right flex flex-col items-end">
                    <span className="text-[9px] text-zinc-500 font-mono flex items-center gap-1">
                      <Clock className="w-3 h-3 shrink-0" />
                      {new Date(inc.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="text-[9px] text-red-500 font-mono mt-2 font-semibold">
                      AP-GPS Link
                    </span>
                  </div>
                </div>

                {/* Micro AI assessment preview if available */}
                {inc.aiAssessment && (
                  <div className="mt-2.5 pl-2 border-t border-zinc-800/60 pt-2 flex items-center gap-1 text-[10px] text-zinc-500">
                    <Activity className={`w-3.5 h-3.5 shrink-0 ${inc.aiAssessment.severity === 'HIGH' ? 'text-red-500' : 'text-zinc-600'}`} />
                    <span className="truncate italic font-medium">AI Assess: {inc.aiAssessment.summary}</span>
                  </div>
                )}
              </div>
            );
          })}

          {incidents.length === 0 && (
            <p className="text-center py-10 text-xs italic text-zinc-600">No active SOS alerts found. Keeping guard...</p>
          )}
        </div>
      </div>

      {/* RIGHT PANEL: Live Interactive Workspace (8 Cols) */}
      <div className="lg:col-span-8 flex flex-col max-h-[720px] overflow-y-auto bg-zinc-950">
        {selectedIncident ? (
          <div className="p-4 lg:p-6 space-y-6 flex-1">
            
            {/* Header section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-zinc-800 pb-4 gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-semibold bg-zinc-900 px-2 py-0.5 rounded text-zinc-400 border border-zinc-800">Case ID: {selectedIncident.id}</span>
                  <span className={`text-xs px-2.5 py-0.5 rounded font-mono font-bold uppercase ${
                    selectedIncident.status === "ACTIVE"
                      ? "bg-red-950/40 text-red-400 border border-red-900/30"
                      : selectedIncident.status === "DISPATCHED"
                        ? "bg-amber-950 text-amber-400 border border-amber-900"
                        : "bg-green-950 text-green-400 border border-green-900"
                  }`}>
                    {selectedIncident.status}
                  </span>
                </div>
                <h3 className="font-display font-bold text-lg text-zinc-100 mt-2 flex items-center gap-2">
                  {selectedIncident.citizenName}
                  <span className="text-xs text-zinc-500 font-sans font-medium">({selectedIncident.citizenPhone})</span>
                </h3>
                <p className="text-[11px] text-zinc-500 font-mono mt-1">
                  Alert Registered: {new Date(selectedIncident.timestamp).toLocaleString()}
                </p>
              </div>

              {/* Geo tracking pins info */}
              <div className="bg-zinc-900 px-4 py-2.5 rounded border border-zinc-800 flex items-center gap-3">
                <MapPin className="w-5 h-5 text-red-500 animate-bounce" />
                <div className="font-mono text-[11px]">
                  <div className="text-zinc-500 uppercase text-[9px] font-semibold">Incident Coordinates</div>
                  <div className="text-zinc-200 mt-0.5">Lat: {selectedIncident.latitude.toFixed(5)}</div>
                  <div className="text-zinc-200">Lng: {selectedIncident.longitude.toFixed(5)}</div>
                </div>
              </div>
            </div>

            {/* Layout Grid: Map and Media playback side-by-side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              {/* Technical SVG Live Tracking Map */}
              <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 flex flex-col h-[340px]">
                <div className="flex justify-between items-center mb-2.5">
                  <div>
                    <h4 className="font-display font-bold text-xs text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Navigation className="w-3.5 h-3.5 text-red-500 animate-pulse" />
                      AP Live Dispatch Tracking Map
                    </h4>
                    <span className="text-[8px] text-zinc-500 uppercase font-mono font-bold block">TACTICAL DISPATCH MATRIX</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => setAdminMapZoom(prev => Math.min(3, prev + 0.5))}
                      className="p-1 bg-zinc-950 border border-zinc-850 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white cursor-pointer"
                      title="Zoom In"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => setAdminMapZoom(prev => Math.max(1, prev - 0.5))}
                      className="p-1 bg-zinc-950 border border-zinc-850 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white cursor-pointer"
                      title="Zoom Out"
                    >
                      <ZoomOut className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => { setPanX(0); setPanY(0); setAdminMapZoom(1); }}
                      className="p-1 bg-zinc-950 border border-zinc-850 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white cursor-pointer text-[9px] font-bold font-mono px-1.5"
                      title="Recenter"
                    >
                      RESET
                    </button>
                  </div>
                </div>

                {/* Map mode and pan joystick toolbar */}
                <div className="grid grid-cols-2 gap-2 mb-2 shadow-inner">
                  {/* Mode Buttons */}
                  <div className="grid grid-cols-3 gap-1 bg-zinc-950 p-1 rounded-lg border border-zinc-850 text-[10px] font-semibold text-center text-zinc-400">
                    <button 
                      onClick={() => setAdminMapMode("vector")}
                      className={`py-0.5 rounded cursor-pointer transition-colors ${adminMapMode === "vector" ? "bg-red-600 text-white font-bold" : "hover:bg-zinc-900"}`}
                    >
                      GRID
                    </button>
                    <button 
                      onClick={() => setAdminMapMode("satellite")}
                      className={`py-0.5 rounded cursor-pointer transition-colors ${adminMapMode === "satellite" ? "bg-red-600 text-white font-bold" : "hover:bg-zinc-900"}`}
                    >
                      SATELLITE
                    </button>
                    <button 
                      onClick={() => setAdminMapMode("heatmap")}
                      className={`py-0.5 rounded cursor-pointer transition-colors ${adminMapMode === "heatmap" ? "bg-red-600 text-white font-bold" : "hover:bg-zinc-900"}`}
                    >
                      HEATMAP
                    </button>
                  </div>

                  {/* Panning Joystick */}
                  <div className="flex items-center justify-between bg-zinc-950 p-1 rounded-lg border border-zinc-850 px-2">
                    <span className="text-[9px] text-zinc-500 font-bold uppercase font-mono">Pan Camera:</span>
                    <div className="flex gap-1">
                      <button onClick={() => setPanY(p => p - 15)} className="p-0.5 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white cursor-pointer"><ArrowUp className="w-3 h-3" /></button>
                      <button onClick={() => setPanY(p => p + 15)} className="p-0.5 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white cursor-pointer"><ArrowDown className="w-3 h-3" /></button>
                      <button onClick={() => setPanX(p => p - 15)} className="p-0.5 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white cursor-pointer"><ArrowLeft className="w-3 h-3" /></button>
                      <button onClick={() => setPanX(p => p + 15)} className="p-0.5 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white cursor-pointer"><ArrowRight className="w-3 h-3" /></button>
                    </div>
                  </div>
                </div>

                <div className="flex-1 bg-zinc-950 rounded overflow-hidden border border-zinc-800 relative">
                  {/* Dynamic viewBox SVG Canvas */}
                  <svg 
                    className="w-full h-full text-zinc-800" 
                    viewBox={`${120 - 160 / adminMapZoom + panX} ${110 - 110 / adminMapZoom + panY} ${320 / adminMapZoom} ${220 / adminMapZoom}`}
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <defs>
                      <pattern id="admin-grid" width="24" height="24" patternUnits="userSpaceOnUse">
                        <path d="M 24 0 L 0 0 0 24" fill="none" stroke="currentColor" strokeWidth="0.5" />
                      </pattern>
                    </defs>
                    
                    {/* Background Grid */}
                    {adminMapMode === "satellite" ? (
                      <>
                        <rect width="1000" height="1000" x="-300" y="-300" fill="#09090b" />
                        <rect x="15" y="15" width="85" height="40" fill="#141416" rx="2" stroke="#222" strokeWidth="0.5" />
                        <rect x="150" y="15" width="100" height="40" fill="#141416" rx="2" stroke="#222" strokeWidth="0.5" />
                        <rect x="15" y="95" width="85" height="70" fill="#141416" rx="2" stroke="#222" strokeWidth="0.5" />
                        <rect x="150" y="95" width="100" height="70" fill="#141416" rx="2" stroke="#222" strokeWidth="0.5" />
                        <rect x="270" y="15" width="80" height="150" fill="#141416" rx="2" stroke="#222" strokeWidth="0.5" />
                      </>
                    ) : (
                      <rect width="1000" height="1000" x="-300" y="-300" fill="url(#admin-grid)" className="opacity-15" />
                    )}

                    {/* Heatmap overlay circles */}
                    {adminMapMode === "heatmap" && (
                      <>
                        <circle cx="100" cy="90" r="45" fill="rgba(239, 68, 68, 0.15)" filter="blur(8px)" />
                        <circle cx="280" cy="140" r="35" fill="rgba(245, 158, 11, 0.1)" filter="blur(6px)" />
                        <circle cx="50" cy="190" r="25" fill="rgba(239, 68, 68, 0.08)" filter="blur(5px)" />
                      </>
                    )}
                    
                    {/* Simulated Streets Grid for AP Layout */}
                    <path d="-200,80 L600,80" stroke={adminMapMode === "satellite" ? "#1e1e24" : "#27272a"} strokeWidth="5" strokeLinecap="round" />
                    <path d="-200,180 L600,180" stroke={adminMapMode === "satellite" ? "#1e1e24" : "#27272a"} strokeWidth="4" strokeLinecap="round" />
                    <path d="120,-200 L120,500" stroke={adminMapMode === "satellite" ? "#1e1e24" : "#27272a"} strokeWidth="5" strokeLinecap="round" />
                    <path d="280,-200 L280,500" stroke={adminMapMode === "satellite" ? "#1e1e24" : "#27272a"} strokeWidth="4" strokeLinecap="round" />
                    
                    {/* Secondary roads */}
                    <path d="40,-200 L40,500" stroke="#1c1c1f" strokeWidth="2.5" strokeDasharray="3 3" />
                    <path d="-200,240 L600,240" stroke="#1c1c1f" strokeWidth="2" strokeDasharray="3 3" />

                    {/* Street name labels */}
                    <text x="14" y="75" fill="#52525b" fontSize="6" fontFamily="monospace" fontWeight="bold">M.G. ROAD CORRIDOR</text>
                    <text x="286" y="174" fill="#52525b" fontSize="6" fontFamily="monospace" fontWeight="bold">BENZ CIRCLE FLYOVER</text>

                    {/* Patrol Cruiser Route Trail */}
                    {selectedIncident?.status === "DISPATCHED" && (
                      <line 
                        x1={120 + (cruiserOffset.lng * 25000)} 
                        y1={180 + (cruiserOffset.lat * 25000)} 
                        x2="120" 
                        y2="80" 
                        stroke="#ef4444" 
                        strokeWidth="2.5" 
                        strokeDasharray="4 4" 
                        className="animate-pulse" 
                      />
                    )}

                    {/* Citizen emergency pin (Benz Circle simulated position) */}
                    <g transform="translate(120, 80)">
                      <circle cx="0" cy="0" r="22" fill="rgba(239, 68, 68, 0.15)" />
                      <circle cx="0" cy="0" r="14" fill="none" stroke="#ef4444" strokeWidth="1" className="animate-radar" />
                      <circle cx="0" cy="0" r="4.5" fill="#ef4444" className="animate-pulse" />
                      <circle cx="0" cy="0" r="2" fill="#ffffff" />
                    </g>

                    {/* Dispatched Patrol Cruiser Representation (Alpha-1) */}
                    <g 
                      transform={`translate(${120 + (cruiserOffset.lng * 25000)}, ${180 + (cruiserOffset.lat * 25000)})`}
                      className="cursor-pointer"
                      onClick={() => setSelectedPatrolUnitId("P-1")}
                    >
                      <circle cx="0" cy="0" r="9" fill="none" stroke="#3b82f6" strokeWidth="0.8" className="opacity-40" />
                      <circle cx="0" cy="0" r="5" fill="#3b82f6" />
                      <circle cx="0" cy="0" r="8" fill="none" stroke="#3b82f6" strokeWidth="0.5" className="animate-ping" style={{ animationDuration: '2s' }} />
                    </g>

                    {/* Inactive Standby Patrol Unit (Bravo-2) */}
                    <g 
                      transform="translate(280, 50)" 
                      className="cursor-pointer group"
                      onClick={() => setSelectedPatrolUnitId("P-2")}
                    >
                      <circle cx="0" cy="0" r="8" fill="none" stroke="#e4e4e7" strokeWidth="0.6" className="opacity-20 group-hover:opacity-40" />
                      <circle cx="0" cy="0" r="3.5" fill="#a1a1aa" />
                      <text x="0" y="-10" fill="#a1a1aa" fontSize="5" textAnchor="middle" fontWeight="bold">BRAVO-2 (IDLE)</text>
                    </g>

                    {/* Outer Ring Patrol Unit (Gamma-3) */}
                    <g 
                      transform="translate(40, 240)" 
                      className="cursor-pointer group"
                      onClick={() => setSelectedPatrolUnitId("P-3")}
                    >
                      <circle cx="0" cy="0" r="8" fill="none" stroke="#e4e4e7" strokeWidth="0.6" className="opacity-20 group-hover:opacity-40" />
                      <circle cx="0" cy="0" r="3.5" fill="#a1a1aa" />
                      <text x="0" y="-10" fill="#a1a1aa" fontSize="5" textAnchor="middle" fontWeight="bold">GAMMA-3 (IDLE)</text>
                    </g>
                  </svg>

                  {/* Citizen visual tag on map */}
                  <div className="absolute top-[28%] left-[28%] bg-red-600 border border-red-500 text-[8px] px-1.5 py-0.2 rounded font-bold uppercase shadow-md flex items-center gap-1 text-white pointer-events-none">
                    <AlertCircle className="w-2 h-2 shrink-0 animate-bounce" />
                    CITIZEN IN DISTRESS
                  </div>

                  {/* Live telemetry detail overlay */}
                  {selectedPatrolUnitId && (
                    <div className="absolute bottom-2 left-2 right-2 bg-zinc-900/95 border border-zinc-800 p-2 rounded-md font-mono text-[9px] text-zinc-300 shadow-xl flex justify-between items-center animate-fade-in">
                      <div>
                        <div className="font-bold text-blue-400 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                          {selectedPatrolUnitId === "P-1" ? "PATROL ALPHA-1" : selectedPatrolUnitId === "P-2" ? "PATROL BRAVO-2" : "PATROL GAMMA-3"}
                        </div>
                        <div className="text-[8px] text-zinc-500 mt-0.5">
                          {selectedPatrolUnitId === "P-1" ? "Active Dispatch Unit • Responding" : "Stationed Standby • Available"}
                        </div>
                        <div className="text-zinc-400 mt-1">
                          Speed: {selectedPatrolUnitId === "P-1" ? "42 km/h" : "0 km/h"} • Fuel: {selectedPatrolUnitId === "P-1" ? "74%" : "92%"}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button 
                          onClick={() => {
                            const name = selectedPatrolUnitId === "P-1" 
                              ? "Vijayawada City Patrol Alpha-1" 
                              : selectedPatrolUnitId === "P-2" 
                                ? "Vijayawada Central Patrol Bravo-2" 
                                : "Vijayawada Outer Ring Patrol Gamma-3";
                            setDispatchUnitName(name);
                          }}
                          className="px-2 py-1 bg-red-600 text-white font-bold rounded hover:bg-red-500 cursor-pointer text-[10px]"
                        >
                          ASSIGN
                        </button>
                        <button 
                          onClick={() => setSelectedPatrolUnitId(null)}
                          className="px-1.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded cursor-pointer text-[10px]"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* SOS Audio/Video Playback Center */}
              <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 flex flex-col h-72">
                <div className="flex justify-between items-center mb-2.5">
                  <h4 className="font-display font-bold text-xs text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Video className="w-3.5 h-3.5 text-red-500" />
                    SOS Media Dispatch Monitor
                  </h4>
                  <span className="text-[9px] bg-red-950/40 text-red-400 px-1.5 py-0.5 rounded border border-red-900/20 font-bold font-mono">10 SEC PACKET</span>
                </div>

                <div className="flex-1 bg-black rounded overflow-hidden border border-zinc-800 relative flex flex-col items-center justify-center p-3">
                  {selectedIncident.audioVideoBase64 && 
                   !selectedIncident.audioVideoBase64.includes("GpsSimulatedEmergencyFeedPlaceholderData") ? (
                    /* Real captured camera feed */
                    <video 
                      src={selectedIncident.audioVideoBase64} 
                      controls 
                      className="w-full h-full object-contain rounded"
                      playsInline
                    />
                  ) : (
                    /* High-tech interactive simulated playback */
                    <div className="absolute inset-0 bg-zinc-950 flex flex-col items-center justify-center text-center font-mono p-4">
                      {isPlayingSimulated ? (
                        <>
                          <div className="relative mb-2">
                            <Video className="w-8 h-8 text-red-500 animate-pulse" />
                            <span className="absolute top-0 right-0 flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                            </span>
                          </div>
                          <span className="text-[10px] text-red-400 font-bold uppercase tracking-wider animate-pulse">STREAMING DISTRESS DATA...</span>
                          <p className="text-[9px] text-zinc-400 mt-1 max-w-xs leading-relaxed">
                            Audio/video dispatch packet is decrypted. Live voice signature processing...
                          </p>

                          {/* Animated equalizer wave */}
                          <div className="flex items-end justify-center gap-1.5 mt-3 h-10 w-full">
                            {Array.from({ length: 15 }).map((_, i) => (
                              <div 
                                key={i} 
                                className="w-1 bg-red-500 rounded-full animate-pulse" 
                                style={{ 
                                  height: `${Math.floor(Math.random() * 80) + 20}%`,
                                  animationDelay: `${i * 0.05}s`,
                                  animationDuration: `${0.3 + Math.random() * 0.5}s`
                                }} 
                              />
                            ))}
                          </div>

                          <div className="w-full max-w-xs mt-3 flex items-center justify-between gap-3">
                            <button 
                              onClick={() => setIsPlayingSimulated(false)}
                              className="bg-red-950/40 border border-red-900/30 hover:bg-red-900/40 text-red-400 text-[10px] px-2 py-1 rounded transition-colors flex items-center gap-1 cursor-pointer"
                            >
                              <Pause className="w-3 h-3" /> Pause
                            </button>
                            <span className="text-[9px] text-red-400 font-bold">0:0{simulatedTime} / 0:10</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <Video className="w-8 h-8 text-zinc-600 mb-2" />
                          <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider">MEDIA READY FOR DECRYPTION</span>
                          <p className="text-[10px] text-zinc-500 mt-1.5 max-w-xs leading-relaxed">
                            Click Play to run safe simulation and verify registered vocal signatures.
                          </p>
                          <button 
                            onClick={() => setIsPlayingSimulated(true)}
                            className="mt-4 bg-red-600 hover:bg-red-500 text-white font-bold text-[11px] uppercase tracking-wider px-4 py-2 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-lg shadow-red-900/20"
                          >
                            <Play className="w-3.5 h-3.5 fill-current" /> Play Simulation
                          </button>
                        </>
                      )}
                    </div>
                  )}

                  {/* Real visual watermark overlay */}
                  <div className="absolute top-2 left-2 bg-red-950/40 border border-red-900/20 text-[9px] px-1.5 py-0.5 rounded font-mono font-medium text-red-400">
                    DI-DECRYPTED
                  </div>
                </div>
              </div>

            </div>

            {/* AI Emergency Co-Pilot Assessment */}
            {selectedIncident.aiAssessment && (
              <div className="bg-zinc-900 p-5 rounded-xl border border-red-900/20">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-display font-bold text-sm text-red-400 uppercase tracking-widest flex items-center gap-2">
                      <Activity className="w-4.5 h-4.5 text-red-500 animate-pulse" />
                      AI Emergency Co-Pilot Report
                    </h4>
                    <p className="text-[10px] text-zinc-500 font-mono mt-0.5">Powered by Gemini 3.5-Flash Dispatch Cognitive Engine</p>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded text-xs font-bold font-mono border uppercase ${
                    selectedIncident.aiAssessment.severity === "HIGH"
                      ? "bg-red-950/40 text-red-400 border-red-900/30 animate-pulse"
                      : selectedIncident.aiAssessment.severity === "MEDIUM"
                        ? "bg-amber-950 text-amber-400 border-amber-900"
                        : "bg-green-950 text-green-400 border-green-900"
                  }`}>
                    {selectedIncident.aiAssessment.severity} SEVERITY
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-12 gap-5 text-xs">
                  <div className="md:col-span-8 space-y-3">
                    <div>
                      <span className="text-[10px] text-zinc-500 uppercase block font-semibold">Incident Diagnostics</span>
                      <p className="text-zinc-200 mt-1 leading-relaxed text-sm bg-zinc-950 p-3 rounded border border-zinc-850 font-medium">
                        "{selectedIncident.aiAssessment.summary}"
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 uppercase block font-semibold">AP Disha Suggested Dispatch Action</span>
                      <p className="text-green-400 font-medium mt-1 leading-relaxed">
                        👉 {selectedIncident.aiAssessment.recommendedAction}
                      </p>
                    </div>
                  </div>

                  <div className="md:col-span-4 bg-zinc-950 p-3 rounded border border-zinc-850 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] text-zinc-500 uppercase block font-semibold mb-2">Audible Indicators</span>
                      <div className="space-y-1.5">
                        {selectedIncident.aiAssessment.detectedSounds.map((sound, i) => (
                          <div key={i} className="flex items-center gap-1.5 text-zinc-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                            <span className="font-mono text-[10px] text-zinc-400">{sound}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="mt-3 pt-3 border-t border-zinc-800 text-[9px] text-zinc-500 font-mono text-center">
                      Accuracy Probability: 94.6%
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Emergency Action Control Terminal */}
            <div className="bg-zinc-900 p-5 rounded-xl border border-zinc-800">
              <h4 className="font-display font-bold text-xs text-zinc-400 uppercase tracking-widest mb-4 flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5 text-red-500" />
                Emergency Dispatch & Communications Center
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 text-xs">
                {/* Select cruiser unit */}
                <div className="md:col-span-5 space-y-3.5">
                  <div>
                    <label className="text-[10px] text-zinc-500 uppercase font-semibold block mb-1.5">Select AP Patrol Cruiser</label>
                    <select 
                      value={dispatchUnitName}
                      onChange={(e) => setDispatchUnitName(e.target.value)}
                      disabled={selectedIncident.status === "RESOLVED"}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-200 focus:outline-none focus:border-red-500/30 disabled:opacity-50 font-sans"
                    >
                      {patrolUnits.map(unit => (
                        <option key={unit.id} value={unit.name}>
                          {unit.name} ({unit.currentLocationName})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Actions Terminal */}
                  <div className="flex gap-3">
                    <button
                      onClick={handleDispatch}
                      disabled={selectedIncident.status === "RESOLVED" || selectedIncident.status === "DISPATCHED"}
                      className="bg-red-600 hover:bg-red-500 disabled:bg-zinc-800 text-white font-bold py-2 px-4 rounded transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:text-zinc-500 cursor-pointer text-xs"
                    >
                      <Navigation className="w-4 h-4" /> Dispatch Patrol
                    </button>
                    
                    <button
                      onClick={handleResolve}
                      disabled={selectedIncident.status === "RESOLVED"}
                      className="bg-zinc-800 hover:bg-zinc-700 disabled:bg-zinc-900 text-zinc-200 border border-zinc-700 py-2 px-4 rounded transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:text-zinc-600 cursor-pointer text-xs"
                    >
                      <CheckCircle2 className="w-4 h-4 text-green-400" /> Close Case
                    </button>
                  </div>
                </div>

                {/* Staff commentary input */}
                <div className="md:col-span-7 flex flex-col font-sans">
                  <label className="text-[10px] text-zinc-500 uppercase font-semibold block mb-1.5">Dispatch Logs & Case comments</label>
                  <textarea 
                    placeholder="Enter command desk updates or dispatcher notes..." 
                    value={staffComment}
                    onChange={(e) => setStaffComment(e.target.value)}
                    className="flex-1 min-h-[75px] bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-zinc-200 focus:outline-none focus:border-red-500/30 resize-none text-xs"
                  />
                </div>
              </div>

              {/* Display existing dispatcher instructions if any */}
              {selectedIncident.dishaStaffComment && (
                <div className="mt-4 bg-zinc-950 p-3.5 rounded border border-zinc-850 flex gap-2.5">
                  <MessageSquare className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] text-zinc-500 uppercase font-mono block">Latest Dispatcher Log</span>
                    <p className="text-zinc-300 text-xs mt-1 leading-relaxed italic">
                      "{selectedIncident.dishaStaffComment}"
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Citizen's Emergency Contacts notified section */}
            <div className="bg-zinc-900 p-5 rounded-xl border border-zinc-800">
              <h4 className="font-display font-bold text-xs text-zinc-400 uppercase tracking-widest mb-3.5 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-red-500" />
                Citizen Emergency Circle Notified
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs">
                {selectedIncident.emergencyContactsNotified.map((contact, i) => (
                  <div key={i} className="bg-zinc-950 p-3 rounded border border-zinc-850 flex justify-between items-center">
                    <div>
                      <div className="font-semibold text-zinc-200">{contact.split(" - ")[0]}</div>
                      <div className="font-mono text-[10px] text-zinc-500 mt-1">{contact.split(" - ")[1]}</div>
                    </div>
                    <span className="text-[9px] bg-zinc-900 text-green-400 border border-green-900/30 px-2 py-0.5 rounded font-mono font-bold uppercase">SMS Active</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Outbound SMS Alert logs panel */}
            <div className="bg-zinc-900 p-5 rounded-xl border border-zinc-800">
              <h4 className="font-display font-bold text-xs text-zinc-400 uppercase tracking-widest mb-3.5 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-red-500" />
                AP Disha Outbound Communications Log
              </h4>
              <div className="bg-zinc-950 p-3.5 rounded border border-zinc-850 font-mono text-[11px] text-zinc-500 space-y-2.5 max-h-48 overflow-y-auto">
                {selectedIncident.smsLogs.map((log, i) => (
                  <div key={i} className="flex gap-2 pb-2 border-b border-zinc-900 last:border-0">
                    <span className="text-red-500 shrink-0 font-bold">[SMS]</span>
                    <span className="leading-relaxed text-zinc-400">{log}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Captured SOS Distress Video & Audio Evidence Playback */}
            <div id="distress-media-evidence-playback" className="bg-zinc-900 p-5 rounded-xl border-2 border-red-900/40 shadow-lg shadow-red-950/10">
              <h4 className="font-display font-bold text-xs text-red-500 uppercase tracking-widest mb-3.5 flex items-center gap-2">
                <Video className="w-4.5 h-4.5 text-red-500 animate-pulse" />
                <span>🚨 Case Distress Video & Audio Evidence Player</span>
              </h4>
              <p className="text-[10px] text-zinc-500 mb-4 font-mono">
                Decrypted 10-second automated audio and video recording captured at GPS coordinates ({selectedIncident.latitude.toFixed(4)}, {selectedIncident.longitude.toFixed(4)}) during citizen's SOS trigger.
              </p>

              <div className="aspect-video bg-black rounded-lg overflow-hidden border border-zinc-800 relative flex items-center justify-center">
                {selectedIncident.audioVideoBase64 && 
                 !selectedIncident.audioVideoBase64.includes("GpsSimulatedEmergencyFeedPlaceholderData") ? (
                  /* Play actual captured browser camera and microphone video/audio */
                  <video 
                    src={selectedIncident.audioVideoBase64} 
                    controls 
                    className="w-full h-full object-contain"
                    autoPlay={false}
                    playsInline
                  />
                ) : (
                  /* Beautiful animated interactive simulation of camera/audio telemetry feed */
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-5 bg-zinc-950 text-center font-mono">
                    {isPlayingSimulated ? (
                      <>
                        <div className="relative mb-3">
                          <div className="absolute -inset-3 bg-red-600/15 rounded-full blur animate-pulse" />
                          <Video className="w-10 h-10 text-red-500 relative animate-bounce" style={{ animationDuration: '2.5s' }} />
                        </div>
                        <span className="text-xs text-red-400 font-bold uppercase tracking-wider animate-pulse">STREAMING DECIPHERED EVIDENCE FEED</span>
                        <p className="text-[10px] text-zinc-400 mt-1.5 max-w-sm">
                          Playing 10s audio & video captured from {selectedIncident.citizenName}'s device.
                        </p>

                        {/* Interactive sound equalizer waves */}
                        <div className="flex items-end justify-center gap-1 mt-5 h-12 w-48">
                          {Array.from({ length: 18 }).map((_, i) => (
                            <div 
                              key={i} 
                              className="w-1 bg-red-500 rounded-full animate-pulse" 
                              style={{ 
                                height: `${Math.floor(Math.random() * 85) + 15}%`,
                                animationDelay: `${i * 0.07}s`,
                                animationDuration: `${0.4 + Math.random() * 0.5}s`
                              }} 
                            />
                          ))}
                        </div>

                        <div className="w-full max-w-xs mt-4 flex items-center justify-between text-xs">
                          <button 
                            onClick={() => setIsPlayingSimulated(false)}
                            className="bg-red-950/50 border border-red-900/40 hover:bg-red-900/40 text-red-400 text-[10px] px-2.5 py-1.5 rounded transition-colors flex items-center gap-1 cursor-pointer font-bold uppercase"
                          >
                            <Pause className="w-3 h-3 fill-current" /> Pause
                          </button>
                          <span className="text-[10px] text-zinc-500">PLAYING TIME: <span className="text-red-400 font-bold">0:0{simulatedTime} / 0:10</span></span>
                        </div>
                      </>
                    ) : (
                      <>
                        <Video className="w-10 h-10 text-zinc-600 mb-3" />
                        <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider">EVIDENCE DECRYPTION UNIT STANDBY</span>
                        <p className="text-[10px] text-zinc-500 mt-1.5 max-w-sm leading-relaxed">
                          This case contains a simulated distress media packet. Tap button below to initiate high-fidelity simulation playback with synchronized alarm audio.
                        </p>
                        <button 
                          onClick={() => setIsPlayingSimulated(true)}
                          className="mt-4 bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-widest px-5 py-2.5 rounded-lg flex items-center gap-2 transition-colors cursor-pointer shadow-lg shadow-red-900/20"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" /> Start Evidence Playback
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-12 text-zinc-500">
            <ShieldAlert className="w-12 h-12 text-zinc-700 mb-2.5 animate-pulse" />
            <h3 className="font-display font-semibold text-sm text-zinc-400 uppercase tracking-wider">Awaiting Emergency Alert</h3>
            <p className="text-xs text-zinc-600 mt-1 max-w-sm">
              Disha Central Command Desk is secure and monitoring. Select an active SOS alert on the left to review metrics.
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
