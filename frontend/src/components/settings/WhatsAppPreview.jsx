import React from 'react';
import { motion } from 'framer-motion';
import { CheckCheck } from 'lucide-react';

const WhatsAppPreview = ({ message, type = 'success', companyName = 'PayLens' }) => {
  // Simple variable replacement for preview
  const previewText = message
    .replace('{monto}', '$50.000')
    .replace('{referencia}', 'REF-99283')
    .replace('{empresa}', companyName || 'PayLens Enterprise')
    .replace('{fecha}', new Date().toLocaleDateString());

  return (
    <div className="w-full max-w-xs mx-auto perspective-1000">
      <motion.div 
        initial={{ rotateY: -10, opacity: 0 }}
        animate={{ rotateY: 0, opacity: 1 }}
        className="bg-[#0b141a] rounded-2xl overflow-hidden shadow-2xl border border-zinc-800"
      >
        {/* Header WhatsApp */}
        <div className="bg-[#202c33] p-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center">
            <div className="w-4 h-4 bg-zinc-500 rounded-full" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-white leading-none">PayLens Bot</p>
            <p className="text-[8px] text-emerald-500 font-bold uppercase tracking-widest mt-0.5">En línea</p>
          </div>
        </div>

        {/* Chat Area */}
        <div className="p-4 space-y-4 bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat bg-center bg-[#0d141b] bg-opacity-20 flex flex-col min-h-[160px]">
           <motion.div 
             initial={{ scale: 0.9, opacity: 0 }}
             animate={{ scale: 1, opacity: 1 }}
             className={`max-w-[85%] p-3 rounded-2xl rounded-tl-none relative shadow-md self-start
               ${type === 'success' ? 'bg-[#005c4b] text-[#e9edef]' : 'bg-[#3b3a3a] text-[#e9edef]'}`}
           >
              <p className="text-xs whitespace-pre-wrap font-medium">{previewText}</p>
              <div className="flex justify-end items-center gap-1 mt-1">
                <span className="text-[8px] text-zinc-300">12:00 PM</span>
                <CheckCheck size={10} className="text-cyan-400" />
              </div>
              {/* Triangle Tail */}
              <div className={`absolute top-0 -left-2 w-0 h-0 border-t-[10px] border-r-[10px] border-transparent 
                ${type === 'success' ? 'border-r-[#005c4b]' : 'border-r-[#3b3a3a]'}`} />
           </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default WhatsAppPreview;
