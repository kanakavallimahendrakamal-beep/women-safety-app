import React, { useState, useEffect } from "react";
import { 
  ShieldAlert, Users, Radio, MapPin, Activity, Shield,
  Layers, Lock, AlertOctagon, HelpCircle, Bell
} from "lucide-react";
import CitizenView from "./components/CitizenView";
import AdminView from "./components/AdminView";
import { Incident } from "./types";

export default function App() {
  const [activeTab, setActiveTab] = useState<"citizen" | "admin">("citizen");
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [lastIncidentCount, setLastIncidentCount] = useState(0);

  // Synthesize alarm sound via Web Audio API to notify command desk of active emergencies
  const playAlertSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Beep 1
      const osc1 = audioCtx.createOscillator();
      const gain1 = audioCtx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
      gain1.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
      osc1.connect(gain1);
      gain1.connect(audioCtx.destination);
      osc1.start();
      osc1.stop(audioCtx.currentTime + 0.4);

      // Beep 2 slightly offset
      setTimeout(() => {
        const osc2 = audioCtx.createOscillator();
        const gain2 = audioCtx.createGain();
        osc2.type = "sine";
        osc2.frequency.setValueAtTime(1109, audioCtx.currentTime); // C#6 note
        gain2.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
        osc2.connect(gain2);
        gain2.connect(audioCtx.destination);
        osc2.start();
        osc2.stop(audioCtx.currentTime + 0.5);
      }, 150);

    } catch (e) {
      console.warn("AudioContext failed or blocked by browser gesture constraints:", e);
    }
  };

  // Fetch incidents list from Express backend
  const fetchIncidents = async (silent = false) => {
    try {
      const response = await fetch("/api/incidents");
      if (!response.ok) {
        throw new Error(`HTTP Error! Status: ${response.status}`);
      }
      const data = await response.json();
      setIncidents(data);
      setError(null);

      // If we are in Admin view and the incident list size grows, play a distress alert beep!
      if (data.length > lastIncidentCount) {
        if (lastIncidentCount > 0 && !silent) {
          playAlertSound();
        }
        setLastIncidentCount(data.length);
      }
    } catch (err: any) {
      console.error("Error fetching incidents:", err);
      setError("Unable to sync in real-time. Operating in offline demonstration mode.");
    }
  };

  // Poll for incidents updates periodically every 5 seconds to ensure real-time citizen-to-admin communication
  useEffect(() => {
    fetchIncidents(true); // Silent initial load
    const interval = setInterval(() => {
      fetchIncidents(false);
    }, 5000);
    return () => clearInterval(interval);
  }, [lastIncidentCount]);

  // Callback when citizen activates SOS
  const handleSOSTriggered = (newIncident: Incident) => {
    // Append to local state and refetch
    setIncidents(prev => [newIncident, ...prev]);
    setLastIncidentCount(prev => prev + 1);
    playAlertSound();
  };

  // Callback when admin updates incident status
  const handleUpdateIncident = async (id: string, updates: Partial<Incident>) => {
    try {
      const response = await fetch(`/api/incidents/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates)
      });
      if (!response.ok) {
        throw new Error("Failed to update incident on server.");
      }
      const data = await response.json();
      if (data.success) {
        // Update local state item immediately
        setIncidents(prev => prev.map(inc => inc.id === id ? data.incident : inc));
      }
    } catch (err: any) {
      console.error("Error updating incident status:", err);
      // Local state fallback in case of connection loss
      setIncidents(prev => prev.map(inc => {
        if (inc.id === id) {
          const updated = { ...inc, ...updates };
          if (updates.status === "DISPATCHED" && updates.dispatchUnit) {
            updated.smsLogs = [...updated.smsLogs, `LOCAL DISPATCH UPDATE: Cruiser ${updates.dispatchUnit} deployed.`];
          }
          return updated;
        }
        return inc;
      }));
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-300 flex flex-col font-sans antialiased">
      
      {/* GLOBAL GOVERNMENT TOP BRANDING BAR */}
      <header className="bg-zinc-900 border-b border-zinc-800 py-3.5 px-4 md:px-8 flex flex-col sm:flex-row justify-between items-center gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          {/* Logo symbol */}
          <div className="w-10 h-10 bg-red-950/40 rounded-lg flex items-center justify-center border border-red-900/40 shadow-inner">
            <Shield className="w-6 h-6 text-red-500" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] bg-red-950/30 text-red-400 px-1.5 py-0.2 rounded font-mono font-bold uppercase tracking-wider">AP STATE SAFETY PORTAL</span>
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            </div>
            <h1 className="font-display font-bold text-base md:text-lg tracking-tight text-zinc-100">
              ANDHRA PRADESH DISHA PLATFORM
            </h1>
          </div>
        </div>

        {/* Dual-Interface Switcher */}
        <div className="flex bg-zinc-950 border border-zinc-800 p-1.5 rounded-xl gap-1.5 w-full sm:w-auto max-w-sm">
          <button
            id="tab-citizen-mode"
            onClick={() => setActiveTab("citizen")}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === "citizen"
                ? "bg-zinc-800 text-zinc-100 shadow border border-zinc-700"
                : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900"
            }`}
          >
            <Lock className="w-3.5 h-3.5 text-zinc-400" /> Citizen Portal
          </button>
          
          <button
            id="tab-admin-mode"
            onClick={() => setActiveTab("admin")}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer relative ${
              activeTab === "admin"
                ? "bg-red-950/40 text-red-400 border border-red-900/50"
                : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900"
            }`}
          >
            <Layers className="w-3.5 h-3.5" /> Command Board
            {/* Blinking badge if there are active unprocessed incidents */}
            {incidents.some(i => i.status === "ACTIVE") && (
              <span className="absolute -top-1.5 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 text-[9px] text-white font-bold items-center justify-center">!</span>
              </span>
            )}
          </button>
        </div>
      </header>

      {/* OFFLINE WARNING / DISPATCH ALERT BANNER */}
      {error && (
        <div className="bg-red-950/20 border-b border-red-900/30 text-red-400 px-4 py-2 text-center text-xs font-mono font-medium flex items-center justify-center gap-2">
          <AlertOctagon className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* MAIN VIEWPORT */}
      <main className="flex-1 flex flex-col p-4 md:p-8 max-w-7xl w-full mx-auto justify-center">
        
        {activeTab === "citizen" ? (
          <div className="w-full flex items-center justify-center py-2 md:py-4">
            <CitizenView onSOSTriggered={handleSOSTriggered} incidents={incidents} />
          </div>
        ) : (
          /* Central Command Board Dashboard */
          <div className="space-y-4">
            {/* Real-time indicator line */}
            <div className="flex justify-between items-center text-xs text-zinc-400 bg-zinc-900 px-4 py-2.5 rounded border border-zinc-800">
              <div className="flex items-center gap-2 font-mono">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                <span className="text-red-400 font-bold uppercase tracking-wider">AP DISHA RESPONSE PORTAL ACTIVE</span>
              </div>
              <span className="font-mono text-[11px] text-zinc-500">System Status: <span className="text-green-500 font-bold">OPTIMAL</span> | Active Patrols: 4 | Alerts: <span className="text-red-500 font-bold">{incidents.filter(i => i.status === 'ACTIVE').length}</span> Active</span>
            </div>

            <AdminView 
              incidents={incidents} 
              onUpdateIncident={handleUpdateIncident}
              onRefresh={() => fetchIncidents(true)}
            />
          </div>
        )}

      </main>

      {/* FOOTER */}
      <footer className="bg-zinc-900 border-t border-zinc-800 py-5 px-4 text-center text-xs text-zinc-500 font-medium mt-auto">
        Designed for Andhra Pradesh Police & Women Safety Wing. Powered by Gemini Safety Intel and Full-stack Node coordination.
      </footer>
    </div>
  );
}
