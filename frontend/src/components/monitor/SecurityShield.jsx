import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, MessageCircle, Mail, AlertTriangle, Zap, Activity } from 'lucide-react';

const StatusIndicator = ({ label, status, icon: Icon, color }) => (
  <div className="flex items-center justify-between p-4 bg-zinc-950/40 border border-zinc-800/50 rounded-2xl group hover:border-zinc-700/80 transition-all">
    <div className="flex items-center gap-4">
      <div className={`p-2.5 rounded-xl bg-opacity-10 ${color} border border-white/5`}>
        <Icon size={18} />
      </div>
      <div>
        <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest leading-none mb-1">{label}</p>
        <p className="text-xs font-bold text-white uppercase tracking-tight">{status}</p>
      </div>
    </div>
    <div className="flex items-center gap-2">
       <div className={`w-2 h-2 rounded-full animate-pulse shadow-[0_0_8px]`} style={{ backgroundColor: color.split(' ')[0].replace('text-', '') }} />
       <span className="text-[8px] font-black text-zinc-600 uppercase tracking-tighter">Live Monitor</span>
    </div>
  </div>
);

const SecurityShield = ({ fraudCount = 0 }) => {
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    // Elegant Laser Scan cycle: 4s animation every 30s
    const interval = setInterval(() => {
      setIsScanning(true);
      setTimeout(() => setIsScanning(false), 4000);
    }, 30000);

    // Initial scan
    setTimeout(() => {
      setIsScanning(true);
      setTimeout(() => setIsScanning(false), 4000);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-extreme rounded-[40px] p-8 relative overflow-hidden group border-white/5"
    >
      {/* Laser Scan Overlay */}
      <AnimatePresence>
        {isScanning && (
          <motion.div 
            initial={{ top: '-10%', opacity: 0 }}
            animate={{ top: '110%', opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 4, ease: "linear" }}
            className="scan-line"
          />
        )}
      </AnimatePresence>

      <div className="flex flex-col lg:flex-row gap-8 items-center lg:items-stretch">
        {/* Main Status Badge */}
        <div className="lg:w-1/3 flex flex-col items-center justify-center p-6 bg-gradient-to-br from-zinc-900/60 to-zinc-950/60 rounded-[32px] border border-white/5 relative overflow-hidden">
          <div className="absolute inset-0 bg-cyan-500/5 opacity-20 pointer-events-none"></div>
          <div className="relative mb-6">
             <div className="w-24 h-24 rounded-full border-4 border-cyan-500/10 flex items-center justify-center relative">
                <motion.div 
                   animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.2, 0.1] }}
                   transition={{ duration: 4, repeat: Infinity }}
                   className="absolute inset-0 bg-cyan-500 rounded-full"
                />
                <ShieldCheck size={48} className="text-cyan-500 drop-shadow-[0_0_15px_rgba(14,165,233,0.5)]" />
             </div>
             <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-cyan-500 text-black text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">
                Verified
             </div>
          </div>
          <div className="text-center space-y-1">
             <h3 className="text-xl font-black text-white uppercase italic tracking-tight">System Shield</h3>
             <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em]">Guardiano IA Activo</p>
          </div>
        </div>

        {/* Detailed Status Grid */}
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
           <StatusIndicator 
             label="Meta Connection" 
             status="Sincronizado" 
             icon={MessageCircle} 
             color="text-emerald-500 bg-emerald-500" 
           />
           <StatusIndicator 
             label="Email Relay" 
             status="Operativo" 
             icon={Mail} 
             color="text-cyan-500 bg-cyan-500" 
           />
           
           {/* Blocked Fraud Counter */}
           <div className="sm:col-span-2 flex items-center justify-between p-6 bg-zinc-900/30 border border-zinc-800/40 rounded-3xl relative overflow-hidden">
              <div className="flex items-center gap-6">
                 <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 relative">
                    <AlertTriangle size={24} />
                    <motion.div 
                      animate={{ scale: [1, 1.4, 1], opacity: [0, 0.5, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute inset-0 bg-rose-500/20 rounded-2xl"
                    />
                 </div>
                 <div className="space-y-1">
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Ataques Bloqueados</p>
                    <div className="flex items-baseline gap-2">
                       <span className="text-3xl font-black text-white tracking-tighter">{fraudCount}</span>
                       <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">Ref Duplicadas</span>
                    </div>
                 </div>
              </div>
              <div className="hidden md:flex flex-col items-end text-right">
                 <div className="flex items-center gap-2 mb-1">
                    <Zap size={14} className="text-amber-500" />
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">Protección en Tiempo Real</span>
                 </div>
                 <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-tighter">IA está analizando cada referencia en 0.4s</p>
              </div>
           </div>
        </div>
      </div>
    </motion.div>
  );
};

export default SecurityShield;
