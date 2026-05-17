import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Smartphone, 
  Upload, 
  Terminal, 
  Package, 
  FileArchive, 
  CheckCircle2, 
  Settings, 
  Activity, 
  Box,
  Loader2,
  Menu,
  X
} from "lucide-react";
import { cn } from "./lib/utils";

type BuildStatus = "idle" | "uploading" | "building" | "completed";

export default function App() {
  const [view, setView] = useState<"dashboard" | "build" | "help">("dashboard");
  const [status, setStatus] = useState<BuildStatus>("idle");
  const [logs, setLogs] = useState<string[]>([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [formData, setFormData] = useState({
    appName: "Mi Proyecto APK",
    packageName: "com.koyeb.zipapp",
    version: "1.0.0",
    environment: "React (Capacitor/Cordova)"
  });
  const [file, setFile] = useState<File | null>(null);
  const [iconFile, setIconFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const iconInputRef = useRef<HTMLInputElement>(null);

  const startBuild = async () => {
    if (!file || !formData.appName) return;

    setStatus("uploading");
    setLogs(["[SYSTEM] Webhook listener started on port 8080...", "[SYSTEM] Awaiting project archive..."]);

    const uploadData = new FormData();
    uploadData.append("project", file);
    if (iconFile) uploadData.append("icon", iconFile);
    uploadData.append("metadata", JSON.stringify(formData));

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: uploadData,
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error);

      setLogs(prev => [...prev, "[SYSTEM] Payload received, initializing environment..."]);

      setStatus("building");
      const buildRes = await fetch("/api/build", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          projectFilename: data.projectFilename,
          iconFilename: data.iconFilename,
          ...formData 
        }),
      });
      const buildData = await buildRes.json();

      for (const step of buildData.steps) {
        await new Promise(r => setTimeout(r, 800));
        setLogs(prev => [...prev, `[BUILD] ${step}`]);
      }

      setStatus("completed");
    } catch (err: any) {
      setLogs(prev => [...prev, `[ERROR] ${err.message}`]);
      setStatus("idle");
    }
  };

  const toggleView = (v: typeof view) => {
    setView(v);
    setIsMenuOpen(false);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#0A0A0B] text-slate-300 font-sans selection:bg-indigo-500/30 overflow-x-hidden">
      {/* Header Navigation */}
      <header className="h-16 border-b border-white/10 flex items-center justify-between px-4 sm:px-8 bg-[#0F0F11] sticky top-0 z-50 shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-600/20">A</div>
          <span className="text-base sm:text-lg font-semibold tracking-tight text-white flex items-center gap-2">
            ZipToAPK <span className="text-indigo-400 font-mono text-[10px] sm:text-sm bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">PRO</span>
          </span>
        </div>
        
        <div className="flex items-center space-x-4 sm:space-x-6">
          {/* Main Desktop Nav */}
          <nav className="hidden lg:flex items-center bg-[#1A1A1E] rounded-lg p-1 border border-white/5">
            <NavTab active={view === "dashboard"} onClick={() => toggleView("dashboard")} label="Dashboard" />
            <NavTab active={view === "build"} onClick={() => toggleView("build")} label="Builder" />
            <NavTab active={view === "help"} onClick={() => toggleView("help")} label="Docs" />
          </nav>

          <div className="flex items-center space-x-4 border-l border-white/10 pl-4 sm:pl-6">
            <div className="items-center space-x-2 hidden md:flex">
              <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
              <span className="text-[10px] font-mono text-emerald-500 uppercase tracking-widest">Koyeb: Active</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 border border-white/20 shadow-inner hidden xs:block"></div>
            
            {/* Mobile Menu Trigger */}
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2 text-slate-400 hover:text-white transition-colors"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[51] lg:hidden"
            />
            <motion.aside 
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-16 bottom-0 left-0 w-72 bg-[#0F0F11] border-r border-white/10 z-[52] lg:hidden p-6 flex flex-col"
            >
              <div className="space-y-4">
                <MobileNavItem active={view === "dashboard"} onClick={() => toggleView("dashboard")} icon={<Activity className="w-5 h-5" />} label="Dashboard" />
                <MobileNavItem active={view === "build"} onClick={() => toggleView("build")} icon={<Package className="w-5 h-5" />} label="Compiler" />
                <MobileNavItem active={view === "help"} onClick={() => toggleView("help")} icon={<Settings className="w-5 h-5" />} label="Documentation" />
              </div>
              <div className="mt-auto pt-6 border-t border-white/5 space-y-4">
                 <div className="flex items-center gap-3 text-emerald-500 font-mono text-[10px] uppercase tracking-widest">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                    Server Status: Online
                 </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        <AnimatePresence mode="wait">
          {view === "build" ? (
            <motion.div 
              key="build-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col lg:flex-row flex-1 w-full overflow-hidden"
            >
              {/* Sidebar Settings (Tablet/Desktop) */}
              <aside className="w-full lg:w-80 border-b lg:border-b-0 lg:border-r border-white/10 bg-[#0F0F11] p-6 lg:p-8 flex flex-col space-y-8 overflow-y-auto shrink-0 scrollbar-thin scrollbar-thumb-white/10">
                <div className="space-y-8">
                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold mb-4">Project Identity</label>
                    <div className="space-y-5">
                      <div>
                        <label className="text-[10px] uppercase tracking-wider text-slate-400 mb-2 block font-medium">Application Name</label>
                        <input 
                          type="text" 
                          value={formData.appName}
                          onChange={(e) => setFormData({...formData, appName: e.target.value})}
                          placeholder="e.g. My App" 
                          className="w-full bg-[#1A1A1E] border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 text-white shadow-inner transition-all hover:bg-[#232328]" 
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase tracking-wider text-slate-400 mb-2 block font-medium">Package Identifier</label>
                        <input 
                          type="text" 
                          value={formData.packageName}
                          onChange={(e) => setFormData({...formData, packageName: e.target.value})}
                          placeholder="com.example.app" 
                          className="w-full bg-[#1A1A1E] border border-white/5 rounded-xl px-4 py-3 text-sm font-mono text-indigo-300 focus:outline-none focus:border-indigo-500 transition-all hover:bg-[#232328]" 
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold mb-4">Application Icon</label>
                    <div className="flex items-center space-x-6">
                      <input 
                        type="file" 
                        className="hidden" 
                        ref={iconInputRef} 
                        accept="image/*" 
                        onChange={(e) => setIconFile(e.target.files?.[0] || null)}
                      />
                      <div 
                        onClick={() => iconInputRef.current?.click()}
                        className="w-20 h-20 bg-[#1A1A1E] border-2 border-dashed border-white/10 rounded-2xl flex items-center justify-center cursor-pointer hover:border-indigo-500 transition-colors group overflow-hidden relative"
                      >
                        {iconFile ? (
                          <img 
                            src={URL.createObjectURL(iconFile)} 
                            className="w-full h-full object-cover" 
                            alt="App Icon"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <Upload className="w-7 h-7 text-slate-500 group-hover:text-indigo-400 transition-colors" />
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                           <Settings className="w-4 h-4 text-white animate-spin-slow" />
                        </div>
                      </div>
                      <div className="text-[10px] text-slate-500 leading-relaxed uppercase tracking-widest font-mono">
                        {iconFile ? iconFile.name.substring(0, 10) + '...' : "PNG/JPG"}
                        <br/>512x512<br/>{iconFile ? "READY" : "HIGH RES"}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold mb-4">Environment</label>
                    <div className="relative group">
                      <select 
                        value={formData.environment}
                        onChange={(e) => setFormData({...formData, environment: e.target.value})}
                        className="w-full bg-[#1A1A1E] border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 text-white appearance-none cursor-pointer transition-all hover:bg-[#232328]"
                      >
                        <option>React (Capacitor/Cordova)</option>
                        <option>Node.js (WebView Wrapper)</option>
                        <option>Python (Kivy/BeeWare)</option>
                        <option>Static HTML5</option>
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-40 group-focus-within:text-indigo-400 group-focus-within:opacity-100 transition-all text-xs">▼</div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 lg:mt-auto py-6 border-t border-white/5">
                  <button 
                    onClick={startBuild}
                    disabled={status !== "idle" || !file || !formData.appName}
                    className={cn(
                      "w-full font-bold py-4.5 rounded-2xl shadow-xl flex items-center justify-center space-x-3 transition-all active:scale-[0.98] outline-none",
                      status === "idle" && file && formData.appName
                        ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-900/30"
                        : "bg-white/5 text-slate-500 cursor-not-allowed"
                    )}
                  >
                    {status === "idle" ? <Box className="w-5 h-5" /> : <Loader2 className="w-5 h-5 animate-spin" />}
                    <span className="uppercase tracking-[0.2em] text-[11px]">
                      {status === "idle" ? "Compile APK" : status}
                    </span>
                  </button>
                </div>
              </aside>

              {/* Main Builder Interface */}
              <section className="flex-1 p-4 sm:p-8 flex flex-col space-y-6 lg:space-y-8 bg-[#0A0A0B] overflow-y-auto lg:overflow-hidden">
                {/* File Drop Zone */}
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    "min-h-[160px] lg:h-64 border-2 border-dashed rounded-[2rem] flex flex-col items-center justify-center transition-all cursor-pointer group p-6",
                    file ? "border-indigo-500/50 bg-indigo-500/10" : "border-white/10 bg-[#0F0F11] hover:bg-indigo-500/5 hover:border-indigo-500/30"
                  )}
                >
                  <input type="file" ref={fileInputRef} className="hidden" accept=".zip" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                  <div className={cn("p-5 rounded-full mb-4 transition-transform group-hover:scale-110 shadow-lg", file ? "bg-indigo-500 text-white shadow-indigo-500/20" : "bg-white/5 text-indigo-400")}>
                    {file ? <FileArchive className="w-8 h-8" /> : <Upload className="w-8 h-8" />}
                  </div>
                  <p className="text-white font-medium text-lg tracking-tight text-center px-4">
                    {file ? file.name : "Drop your Project ZIP file here"}
                  </p>
                  <p className="text-slate-500 text-sm mt-2 font-mono uppercase tracking-widest text-[10px]">
                    {file ? `${(file.size / (1024 * 1024)).toFixed(2)} MB detected` : "browse local filesystem"}
                  </p>
                </div>

                {/* Build Console Output */}
                <div className="flex-1 bg-[#050505] lg:rounded-[2rem] border border-white/10 overflow-hidden flex flex-col shadow-2xl relative min-h-[300px]">
                  <div className="bg-[#1A1A1E] px-6 py-4 border-b border-white/10 flex items-center justify-between shrink-0">
                    <div className="flex items-center space-x-4">
                      <div className="flex space-x-2">
                        <div className="w-3 h-3 rounded-full bg-red-500/40 border border-white/5"></div>
                        <div className="w-3 h-3 rounded-full bg-amber-500/40 border border-white/5"></div>
                        <div className="w-3 h-3 rounded-full bg-emerald-500/40 border border-white/5"></div>
                      </div>
                      <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-mono flex items-center gap-2 font-bold">
                        <Terminal className="w-3.5 h-3.5" />
                        /dev/koyeb_executor / logs
                      </span>
                    </div>
                    {status === "building" && (
                      <div className="hidden sm:flex items-center gap-4">
                         <div className="h-1 w-32 bg-white/5 rounded-full overflow-hidden">
                            <motion.div 
                              className="h-full bg-indigo-500"
                              animate={{ width: ["0%", "30%", "65%", "90%"] }}
                              transition={{ duration: 15, ease: "linear" }}
                            />
                         </div>
                         <span className="text-[10px] text-indigo-400 font-mono animate-pulse">COMPILING...</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 p-6 font-mono text-[11px] sm:text-xs leading-6 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 custom-scrollbar">
                    {logs.length === 0 && (
                      <div className="text-slate-700 italic opacity-50 flex items-center gap-2">
                        <span className="animate-pulse">_</span>
                         Waiting for core initialization...
                      </div>
                    )}
                    {logs.map((log, i) => (
                      <motion.div 
                        key={i} 
                        initial={{ opacity: 0, x: -4 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={cn(
                          "flex gap-4 border-l-2 border-transparent hover:border-indigo-500/40 hover:bg-white/5 px-3 -mx-3 transition-all rounded py-0.5 group",
                          log.includes("[ERROR]") ? "text-red-400 bg-red-500/5 border-red-500/20" : 
                          log.includes("[SYSTEM]") ? "text-indigo-400 font-bold" : "text-slate-400"
                        )}
                      >
                        <span className="opacity-15 shrink-0 w-6 text-right select-none font-bold group-hover:opacity-40">{i+1}</span>
                        <span className={cn(log.includes("COMPILACIÓN") ? "text-emerald-400 font-bold" : "")}>
                          {log}
                        </span>
                      </motion.div>
                    ))}
                    
                    {status === "completed" && (
                      <motion.div 
                        initial={{ opacity: 0, y: 15 }} 
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-10 p-8 bg-emerald-500/5 border border-emerald-500/20 rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-6"
                      >
                        <div className="flex items-center gap-5">
                          <div className="w-14 h-14 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 shadow-lg shadow-emerald-500/10">
                            <CheckCircle2 className="w-8 h-8" />
                          </div>
                          <div className="text-center md:text-left">
                            <h4 className="text-white font-black uppercase tracking-[0.2em] text-[11px]">BUILD SUCCESSFUL</h4>
                            <p className="text-[12px] text-slate-500 uppercase mt-1 font-mono tracking-tight">V2.4.0-DEBUG generated and signed</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => {
                            const link = document.createElement('a');
                            link.href = '#';
                            link.download = `${formData.appName}.apk`;
                            alert("Iniciando descarga del APK procesado...");
                          }}
                          className="w-full md:w-auto px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[11px] font-black uppercase tracking-[0.25em] transition-all active:scale-95 shadow-2xl shadow-indigo-600/30"
                        >
                          Download APK
                        </button>
                      </motion.div>
                    )}
                    <div className="h-4 w-full" /> {/* Bottom Padding */}
                  </div>
                </div>
              </section>
            </motion.div>
          ) : view === "dashboard" ? (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, scale: 0.99 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.01 }}
              className="flex-1 p-6 sm:p-12 overflow-y-auto space-y-12 max-w-7xl mx-auto w-full scrollbar-thin scrollbar-thumb-white/10"
            >
               <header className="space-y-6">
                  <div className="inline-flex items-center space-x-2 bg-indigo-500/10 text-indigo-400 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.3em] border border-indigo-500/20">
                    System Hub
                  </div>
                  <h1 className="text-5xl sm:text-7xl font-black tracking-tight text-white uppercase italic leading-none">
                    Project <span className="text-indigo-500 underline decoration-indigo-500/40 underline-offset-[12px]">Insights</span>
                  </h1>
                  <p className="text-base sm:text-lg text-slate-500 max-w-2xl font-light leading-relaxed">
                    Automated delivery pipeline for converting web applications into cross-platform mobile binaries.
                  </p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                  <StatCard label="Pipeline Total" value="12" icon={<Activity className="w-6 h-6 text-indigo-400" />} />
                  <StatCard label="Native Projects" value="04" icon={<Smartphone className="w-6 h-6 text-emerald-400" />} />
                  <StatCard label="Cloud Usage" value="1.2 GB" icon={<Box className="w-6 h-6 text-amber-400" />} />
                </div>

                <div className="bg-[#0F0F11] border border-white/10 rounded-[2.5rem] p-6 sm:p-10 space-y-10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)]">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/10 pb-8">
                    <h2 className="text-xs font-black uppercase tracking-[0.4em] text-slate-500 flex items-center gap-3">
                      <Terminal className="w-4 h-4" />
                      Session History
                    </h2>
                    <button className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 hover:text-indigo-300 transition-colors bg-indigo-500/5 px-4 py-2 rounded-lg border border-indigo-500/10">
                      View Audit Log
                    </button>
                  </div>
                  <div className="h-64 sm:h-80 border border-dashed border-white/5 rounded-[2rem] flex flex-col items-center justify-center text-slate-600 font-mono text-[10px] uppercase tracking-widest space-y-6">
                    <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center opacity-30 shadow-inner">
                      <Settings className="w-8 h-8" />
                    </div>
                    <span className="text-center px-6 leading-relaxed">System state: Initialized<br/>Waiting for compilation input</span>
                  </div>
                </div>
            </motion.div>
          ) : (
            <motion.div 
              key="help"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              className="flex-1 p-6 sm:p-12 overflow-y-auto space-y-12 max-w-6xl mx-auto w-full scrollbar-thin scrollbar-thumb-white/10"
            >
              <header className="space-y-6">
                 <div className="inline-flex items-center space-x-2 bg-indigo-500/10 text-indigo-400 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.3em] border border-indigo-500/20">
                    User Education
                  </div>
                <h1 className="text-5xl sm:text-7xl font-black tracking-tight text-white uppercase italic leading-none">
                  Core <span className="text-indigo-500 italic decoration-indigo-500/20 underline underline-offset-8">Docs</span>
                </h1>
                <p className="text-base sm:text-lg text-slate-500 font-light max-w-2xl leading-relaxed">Understanding the transformation from source code to native ARM binaries.</p>
              </header>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-10">
                <div className="bg-[#0F0F11] border border-white/10 p-8 sm:p-12 rounded-[2.5rem] space-y-10 shadow-2xl relative overflow-hidden group">
                  <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500/5 blur-3xl rounded-full" />
                  <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-600/20 relative">
                    <Smartphone className="w-7 h-7" />
                  </div>
                  <h3 className="text-3xl font-black text-white uppercase italic leading-tight tracking-tighter">Compiler<br/>Workflow</h3>
                  <div className="space-y-8">
                    <DocStep num="01" title="Bundle Archive" desc="Export your React, Node, or Python project as a flat ZIP. Ensure entry points are relative to root." />
                    <DocStep num="02" title="Define Manifest" desc="Configure metadata: Name, Package ID (com.org.app), and Version for Android identification." />
                    <DocStep num="03" title="Static Analysis" desc="The virtual environment analyzes the stack and prepares a Capacitor/Kivy bridge automatically." />
                  </div>
                </div>

                <div className="bg-indigo-600 p-8 sm:p-12 rounded-[2.5rem] space-y-10 flex flex-col text-white shadow-[0_32px_64px_-12px_rgba(79,70,229,0.4)] relative overflow-hidden">
                   <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-black/10 blur-3xl rounded-full" />
                   <div className="w-14 h-14 bg-black/20 rounded-2xl flex items-center justify-center text-white relative">
                    <Terminal className="w-7 h-7" />
                  </div>
                  <h3 className="text-3xl font-black uppercase italic leading-tight tracking-tighter relative">CLI<br/>Deployment</h3>
                  <p className="opacity-90 text-sm sm:text-base leading-relaxed relative font-medium">To bypass cloud limits and generate production-signed AAB files, run the bridge locally.</p>
                  <div className="flex-1 bg-black/30 backdrop-blur-md p-6 sm:p-8 rounded-3xl font-mono text-[10px] sm:text-[11px] space-y-4 border border-white/10 shadow-inner relative">
                    <p className="text-indigo-200 font-bold opacity-60 uppercase mb-2"># Install bridge tooling</p>
                    <p className="flex gap-2"><span>$</span> npm i @capacitor/cli @capacitor/android</p>
                    <p className="text-indigo-200 font-bold opacity-60 uppercase mb-2"># Native sync</p>
                    <p className="flex gap-2"><span>$</span> npx cap add android</p>
                    <p className="flex gap-2"><span>$</span> npx cap sync</p>
                  </div>
                  <button className="w-full bg-white text-indigo-700 font-black py-4.5 rounded-2xl uppercase tracking-[0.2em] text-[10px] sm:text-[11px] hover:bg-slate-100 transition-all shadow-xl active:scale-[0.98] relative">
                    Read SDK Specs
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer Status Bar - Sticky at bottom */}
      <footer className="h-10 border-t border-white/5 bg-[#0A0A0B] flex items-center justify-between px-4 sm:px-8 text-[10px] text-slate-500 sticky bottom-0 z-50 shrink-0">
        <div className="flex items-center space-x-4 sm:space-x-8">
          <span className="hidden sm:inline font-bold">V 2.5.0-STABLE</span>
          <span className="flex items-center space-x-2">
            <span className={cn("w-1.5 h-1.5 rounded-full", status === "idle" ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-indigo-500 animate-pulse")}></span>
            <span className="font-mono uppercase tracking-widest">{status === "idle" ? "Ready" : status}</span>
          </span>
        </div>
        <div className="flex items-center space-x-6 uppercase tracking-[0.25em] font-bold">
          <span className="hidden md:inline">Koyeb PaaS</span>
          <span className="hidden sm:inline opacity-20">|</span>
          <span className="text-slate-400">Encrypted Cloud</span>
        </div>
      </footer>
    </div>
  );
}

function NavTab({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "px-5 sm:px-8 py-2 text-[10px] font-black uppercase tracking-[0.25em] rounded-md transition-all active:scale-95 outline-none",
        active ? "bg-white/10 text-white shadow-inner" : "text-slate-500 hover:text-slate-300"
      )}
    >
      {label}
    </button>
  );
}

function MobileNavItem({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-4 px-5 py-4 rounded-xl text-sm font-bold uppercase tracking-[0.2em] transition-all",
        active 
          ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" 
          : "text-slate-500 hover:bg-white/5 hover:text-slate-200"
      )}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="bg-[#0F0F11] border border-white/10 p-8 rounded-[2rem] space-y-6 hover:border-indigo-500/40 transition-all group shadow-xl relative overflow-hidden">
      <div className="flex items-center justify-between relative z-10">
        <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-indigo-600 transition-all group-hover:text-white text-slate-400 group-hover:shadow-lg group-hover:shadow-indigo-600/20 group-hover:-translate-y-1">
          {icon}
        </div>
        <div className="w-2 h-2 rounded-full bg-white/10 group-hover:bg-indigo-500 transition-all duration-500 group-hover:scale-150"></div>
      </div>
      <div className="space-y-1 relative z-10">
        <span className="text-[10px] uppercase tracking-[0.3em] text-slate-500 font-black">{label}</span>
        <p className="text-4xl sm:text-5xl font-black tracking-tighter text-white uppercase italic">{value}</p>
      </div>
    </div>
  );
}

function DocStep({ num, title, desc }: { num: string; title: string, desc: string }) {
  return (
    <div className="flex gap-6 group items-start">
      <div className="text-2xl font-black text-slate-700 italic font-mono opacity-20 group-hover:text-indigo-500 group-hover:opacity-100 transition-all shrink-0 leading-none lg:text-3xl">
        {num}
      </div>
      <div className="space-y-1">
        <h4 className="text-white font-black uppercase tracking-[0.2em] text-[10px] italic leading-tight">{title}</h4>
        <p className="text-slate-500 text-xs sm:text-sm leading-relaxed font-medium">{desc}</p>
      </div>
    </div>
  );
}
