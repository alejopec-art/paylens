import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  ShieldAlert, 
  ChevronRight,
  ExternalLink,
  Ban,
  Activity,
  MessageSquare,
  User
} from 'lucide-react';

const StatusBadge = ({ status }) => {
  const configs = {
    'Matched': { color: 'text-emerald-500 bg-emerald-500/5 border-emerald-500/20', icon: CheckCircle2, text: 'VALIDADO' },
    'OCR_Error': { color: 'text-amber-500 bg-amber-500/5 border-amber-500/20', icon: AlertCircle, text: 'OCR_ERROR' },
    'Duplicated': { color: 'text-rose-500 bg-rose-500/5 border-rose-500/20', icon: Copy, text: 'DUPLICADO' },
    'Fraud_Alert': { color: 'text-rose-600 bg-rose-600/10 border-rose-600/30', icon: ShieldAlert, text: 'FRAUDE' },
    'Manual': { color: 'text-zinc-400 bg-zinc-800/20 border-zinc-700/50', icon: Activity, text: 'AUDITORÍA' },
    'Pending': { color: 'text-zinc-500 bg-zinc-500/5 border-zinc-500/20', icon: Ban, text: 'PENDIENTE' }
  };

  const config = configs[status] || configs['Pending'];
  const Icon = config.icon || Ban;

  return (
    <div className={`px-2.5 py-1 rounded-full border flex items-center gap-1.5 text-[9px] font-black tracking-widest ${config.color} shadow-sm`}>
      <Icon size={10} className="mb-[1px]" />
      {config.text}
    </div>
  );
};

const BankIcon = ({ bank = "Nequi" }) => {
  const isNequi = bank.toLowerCase().includes('nequi');
  const isBancolombia = bank.toLowerCase().includes('bancolombia');
  
  return (
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all duration-500 scale-90 group-hover:scale-100 shadow-lg
      ${isNequi ? 'bg-fuchsia-900/20 border-fuchsia-500/30 text-fuchsia-400' : 
        isBancolombia ? 'bg-yellow-900/20 border-yellow-600/30 text-yellow-500' : 
        'bg-zinc-800/40 border-zinc-700/50 text-zinc-400'}`}>
       <span className="font-black text-[10px] italic tracking-tighter">
         {isNequi ? 'NQ' : isBancolombia ? 'BC' : 'BK'}
       </span>
    </div>
  );
}

const TransactionItem = ({ data }) => {
  const status = data.matched ? 'Matched' : (data.ocr_amount ? 'Pending' : 'OCR_Error');

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      exit={{ opacity: 0, scale: 0.9, filter: 'blur(5px)' }}
      transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
      className="group relative bg-[#0c0c0e]/40 border-b border-zinc-800/30 hover:bg-zinc-800/10 transition-all duration-300 px-10 py-5 flex items-center justify-between overflow-hidden"
    >
      <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-transparent via-cyan-500/0 to-transparent group-hover:via-cyan-500/50 transition-all"></div>
      
      <div className="flex items-center gap-8 flex-1">
        <BankIcon bank={data.ocr_reference?.startsWith('M') ? 'Bancolombia' : 'Nequi'} />

        <div className="grid grid-cols-4 flex-1 gap-12 items-center">
          <div className="space-y-1">
            <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-[0.2em]">Origen / WhatsApp</p>
            <div className="flex items-center gap-2">
               <span className="text-xs font-bold text-zinc-100 group-hover:text-cyan-400 transition-colors">+{data.whatsapp_from || '573...'}</span>
               <div className="w-1 h-1 rounded-full bg-zinc-700"></div>
               <span className="text-[10px] text-zinc-500 font-medium">User ID: {data.id?.toString().slice(-4)}</span>
            </div>
          </div>
          
          <div className="space-y-1">
            <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-[0.2em]">Monto Procesado</p>
            <p className="text-sm font-black text-white leading-none">
              <span className="text-emerald-500/80 mr-1">$</span>
              {(parseFloat(data.ocr_amount) || 0).toLocaleString()}
            </p>
          </div>

          <div className="space-y-1">
             <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-[0.2em]">Referencia Única</p>
             <p className="text-[11px] font-mono text-cyan-400/70 bg-cyan-400/5 px-2 py-0.5 rounded border border-cyan-400/10 w-fit tracking-tighter group-hover:border-cyan-400/30 transition-all">
               {data.ocr_reference || 'SCANNING...'}
             </p>
          </div>

          <div className="space-y-2">
             <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-[0.2em]">Validación AI</p>
             <StatusBadge status={status} />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-5 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all duration-300">
         <button title="Ver Holograma OCR" className="w-10 h-10 flex items-center justify-center hover:bg-zinc-800 rounded-xl text-zinc-500 hover:text-cyan-400 transition-all border border-transparent hover:border-zinc-700/50">
            <ExternalLink size={18} />
         </button>
         <button className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl text-[10px] font-black tracking-widest hover:shadow-lg hover:shadow-cyan-500/20 active:scale-95 transition-all">
            DETALLES
         </button>
      </div>
    </motion.div>
  );
};

const LiveFeed = ({ transactions = [] }) => {
  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="px-10 py-8 border-b border-zinc-800/40 flex justify-between items-center bg-black/10">
        <div className="flex items-center gap-4">
          <div className="relative">
             <div className="absolute inset-0 bg-cyan-500 blur-md opacity-20 animate-pulse"></div>
             <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/20 rounded-xl text-cyan-500 relative">
               <Activity size={22} />
             </div>
          </div>
          <div className="flex flex-col">
             <h2 className="text-xl font-black tracking-tight text-white leading-none">MONITOR DE FLUJO</h2>
             <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.3em] mt-2">Real Time Verifier Engine</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
           <div className="flex -space-x-3 overflow-hidden p-1">
             {[...Array(3)].map((_, i) => (
                <div key={i} className="inline-block h-8 w-8 rounded-xl ring-2 ring-[#09090b] bg-zinc-800 flex items-center justify-center">
                   <User size={14} className="text-zinc-500" />
                </div>
             ))}
           </div>
           <span className="text-[10px] font-black text-cyan-500 uppercase bg-cyan-500/5 border border-cyan-500/10 px-4 py-2 rounded-xl">
             {transactions.length} NODOS ACTIVOS
           </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar-elite">
        <AnimatePresence initial={false}>
          {transactions.map((tx) => (
            <TransactionItem key={tx.id || Math.random()} data={tx} />
          ))}
        </AnimatePresence>
        
        {transactions.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center py-24 relative overflow-hidden">
             {/* Dynamic AI Radar */}
             <div className="relative w-48 h-48 flex items-center justify-center">
                <div className="radar-circle w-full h-full"></div>
                <div className="radar-circle w-full h-full"></div>
                <div className="radar-circle w-full h-full"></div>
                <div className="relative z-10 p-5 bg-cyan-500/10 rounded-full border border-cyan-500/20 backdrop-blur-sm">
                   <Activity size={32} className="text-cyan-500 animate-pulse" />
                </div>
             </div>
             
             <div className="mt-8 text-center space-y-2 relative z-10">
                <p className="text-xs font-black tracking-[0.4em] text-cyan-500 uppercase italic">IA Listening...</p>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest opacity-50">Motor de conciliación activo y sincronizado</p>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveFeed;
