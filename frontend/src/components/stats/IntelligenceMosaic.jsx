import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, ShieldCheck, Zap, Activity, ShieldAlert } from 'lucide-react';
import CountUp from 'react-countup';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

const MosaicCard = ({ title, value, subtext, icon: Icon, colorClass, delay = 0, children }) => (
  <motion.div 
    initial={{ opacity: 0, scale: 0.9, y: 30 }}
    animate={{ opacity: 1, scale: 1, y: 0 }}
    transition={{ 
      duration: 0.8, 
      delay, 
      ease: [0.16, 1, 0.3, 1] 
    }}
    className="bg-carbon/40 backdrop-blur-md border border-zinc-800/40 rounded-3xl p-6 relative overflow-hidden group hover:border-cyan-500/30 transition-all duration-700 hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
  >
    <div className="absolute -right-4 -top-4 w-32 h-32 bg-gradient-radial from-cyan-500/10 to-transparent blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
    
    <div className="flex justify-between items-start mb-6">
      <div className={`p-3.5 rounded-2xl bg-opacity-10 ${colorClass} shadow-inner`}>
        <Icon size={22} className="group-hover:scale-110 transition-transform duration-500" />
      </div>
      <div className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em] bg-zinc-900/50 border border-zinc-800/50 px-2.5 py-1 rounded-lg">Elite v2.0</div>
    </div>

    <div className="space-y-1">
      <h3 className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">{title}</h3>
      <div className="flex items-baseline gap-2">
        <span className="text-4xl font-black tracking-tighter text-white">
          {typeof value === 'number' ? <CountUp end={value} duration={3} separator="," decimals={value % 1 !== 0 ? 1 : 0} /> : value}
        </span>
        {subtext && <span className="text-[10px] text-emerald-500 font-black uppercase tracking-widest">{subtext}</span>}
      </div>
    </div>

    <div className="mt-6 relative z-10">
      {children}
    </div>
  </motion.div>
);

const IntelligenceMosaic = ({ stats }) => {
  const todayTotal = stats?.todayTotal ?? stats?.totalVolume ?? 0;
  const todayCount = stats?.todayCount ?? 0;

  const scoreData = {
    datasets: [{
      data: [stats.score, 100 - stats.score],
      backgroundColor: ['#0ea5e9', 'rgba(39, 39, 42, 0.4)'],
      borderWidth: 0,
      circumference: 220,
      rotation: 250,
      borderRadius: 10,
    }],
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 p-10">
      {/* Conciliation Score Card */}
      <MosaicCard title="Score de Conciliación AI" value={stats.score} icon={Zap} colorClass="text-cyan-500 bg-cyan-500" delay={0.1}>
        <div className="h-28 flex items-center justify-center relative -bottom-2">
          <div className="w-full max-w-[140px]">
            <Doughnut 
              data={scoreData} 
              options={{ 
                cutout: '82%', 
                plugins: { tooltip: { enabled: false } },
                animation: { duration: 2000, easing: 'easeOutQuart' }
              }} 
            />
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center pt-4">
             <span className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">Precision</span>
             <span className="text-xs font-bold text-cyan-500">OPTIMAL</span>
          </div>
        </div>
      </MosaicCard>

      {/* Auto-Verified Volume */}
      <MosaicCard title="Total Real Hoy" value={todayTotal} icon={ShieldCheck} colorClass="text-emerald-500 bg-emerald-500" delay={0.2}>
        <div className="mt-4 h-16 flex items-end gap-1.5 px-2">
          {[35, 65, 45, 85, 55, 95, 75, 100].map((h, i) => (
            <motion.div 
              key={i}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: `${h}%`, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 + (i * 0.08), ease: "easeOut" }}
              className="flex-1 bg-gradient-to-t from-emerald-500/10 to-emerald-500/40 rounded-t-lg border-t border-emerald-500/30 shadow-[0_-5px_15px_rgba(16,185,129,0.1)]"
            />
          ))}
        </div>
      </MosaicCard>

      {/* Fraud Detection Metric */}
      <MosaicCard title="Transacciones Hoy" value={todayCount} icon={ShieldAlert} colorClass="text-rose-500 bg-rose-500" delay={0.3}>
        <div className="relative pt-6 px-1">
          <div className="h-2 w-full bg-zinc-800/50 rounded-full overflow-hidden border border-zinc-700/30">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(todayCount * 10, 100)}%` }}
              transition={{ duration: 1.5, ease: "circOut" }}
              className="h-full bg-gradient-to-r from-rose-500 to-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.6)]"
            />
          </div>
          <div className="flex justify-between mt-3">
             <div className="flex flex-col">
                <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-tighter">Estado:</span>
                <span className="text-[10px] text-emerald-500 font-black uppercase tracking-widest">Protegido</span>
             </div>
             <div className="text-right flex flex-col">
                <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-tighter">Nivel:</span>
                <span className="text-[10px] text-zinc-300 font-black uppercase tracking-widest">Seguro</span>
             </div>
          </div>
        </div>
      </MosaicCard>

      {/* Total API Requests or System Load */}
      <MosaicCard title="Integridad del Relay" value="ACTIVE" icon={Activity} colorClass="text-blue-500 bg-blue-500" delay={0.4}>
        <div className="h-16 flex items-center justify-center gap-2 mt-2 bg-zinc-900/40 rounded-xl border border-zinc-800/50 overflow-hidden">
           {[...Array(15)].map((_, i) => (
             <motion.div 
               key={i}
               animate={{ 
                 height: [12, 32, 16, 28, 12],
                 opacity: [0.3, 0.8, 0.3]
               }}
               transition={{ 
                 duration: 1 + Math.random(), 
                 repeat: Infinity, 
                 delay: i * 0.05 
               }}
               className="h-8 w-1 bg-blue-500/40 rounded-full"
             />
           ))}
        </div>
      </MosaicCard>
    </div>
  );
};

export default IntelligenceMosaic;
