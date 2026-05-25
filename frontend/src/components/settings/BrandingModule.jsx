import React, { useRef } from 'react';
import { Upload, Palette, MessageSquare, ShieldCheck, Eraser } from 'lucide-react';
import WhatsAppPreview from './WhatsAppPreview';

const BrandingModule = ({ branding, setBranding }) => {
  const fileInputRef = useRef(null);

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 500 * 1024) {
        alert("El logo debe pesar menos de 500KB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setBranding({ ...branding, logo: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleResetBranding = () => {
    if (confirm("¿Estás seguro de restablecer el branding por defecto?")) {
      setBranding({
        logo: null,
        accentColor: '#0ea5e9',
        successMsg: '¡Pago verificado con éxito! 🔥 {monto} Ref: {referencia}',
        errorMsg: 'No pudimos verificar el pago. ❌ Monto: {monto}. Por favor contacta soporte.'
      });
    }
  };

  const handleApplyEliteTemplate = () => {
    const eliteTemplate = `━━━━━━━━━━━━━━━━━━━━━━━\n   💠 *PAYLENS ELITE*   \n━━━━━━━━━━━━━━━━━━━━━━━\n🏢 *{empresa}*\n\n✅ *PAGO VERIFICADO*\n\n💰 MONTO: {monto}\n🎫 REF: {referencia}\n📅 FECHA: {fecha}\n\n━━━━━━━━━━━━━━━━━━━━━━━\n_Validación automática por IA_\n🚀 _Powered by PayLens_\n━━━━━━━━━━━━━━━━━━━━━━━`;
    setBranding({ ...branding, successMsg: eliteTemplate });
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* 1. Identidad Visual */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          <div className="space-y-4">
             <div className="flex items-center gap-3 text-cyan-500">
                <Palette size={20} />
                <h3 className="font-black uppercase tracking-widest text-sm">Identidad Visual</h3>
             </div>
             
             {/* Commercial Name Input */}
             <div className="space-y-2 max-w-sm">
                <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-1">Nombre Comercial de la Empresa</label>
                <input 
                  type="text"
                  className="input-elite w-full glass-extreme"
                  value={branding.companyName || ''}
                  onChange={(e) => setBranding({...branding, companyName: e.target.value})}
                  placeholder="Ej: Mi Tienda Pro"
                />
             </div>

             <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Logo Upload */}
                <div className="glass-extreme p-6 rounded-3xl border-zinc-800/50 flex flex-col items-center gap-4 text-center">
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-24 h-24 rounded-2xl bg-zinc-900 border-2 border-dashed border-zinc-700 flex items-center justify-center cursor-pointer hover:border-cyan-500/50 hover:bg-cyan-500/5 transition-all overflow-hidden relative group"
                  >
                    {branding.logo ? (
                      <img src={branding.logo} alt="Branding Logo" className="w-full h-full object-contain p-2" />
                    ) : (
                      <Upload size={24} className="text-zinc-600 group-hover:text-cyan-500" />
                    )}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                       <span className="text-[10px] font-black text-white uppercase tracking-widest">Cambiar</span>
                    </div>
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                  <div className="space-y-1">
                    <p className="text-xs font-black text-white uppercase">Logo Corporativo</p>
                    <p className="text-[9px] text-zinc-500 uppercase font-black">PNG/SVG - MAX 500KB</p>
                  </div>
                </div>

                {/* Color Picker */}
                <div className="glass-extreme p-6 rounded-3xl border-zinc-800/50 flex flex-col items-center gap-4 text-center">
                   <div 
                     className="w-24 h-24 rounded-2xl border-4 border-zinc-900 shadow-xl relative overflow-hidden flex items-center justify-center"
                     style={{ backgroundColor: branding.accentColor }}
                   >
                     <input 
                       type="color" 
                       className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                       value={branding.accentColor} 
                       onChange={(e) => setBranding({...branding, accentColor: e.target.value})}
                     />
                     <span className="text-[10px] font-black text-white/50 pointer-events-none uppercase">Elegir Color</span>
                   </div>
                   <div className="space-y-1">
                    <p className="text-xs font-black text-white uppercase">Color de Acento</p>
                    <p className="text-[9px] text-zinc-500 uppercase font-black">{branding.accentColor}</p>
                  </div>
                </div>
             </div>
          </div>

          {/* 2. Configuración de Mensajería */}
          <div className="space-y-6 pt-4">
             <div className="flex items-center gap-3 text-emerald-500">
                <MessageSquare size={20} />
                <h3 className="font-black uppercase tracking-widest text-sm">Motores de Respuesta</h3>
             </div>

             <div className="space-y-4">
                <div className="flex items-center justify-between">
                   <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-1">Mensaje de Éxito</label>
                   <button 
                     onClick={handleApplyEliteTemplate}
                     className="text-[8px] font-black text-cyan-500 uppercase tracking-widest bg-cyan-500/10 px-3 py-1.5 rounded-lg border border-cyan-500/20 hover:bg-cyan-500/20 transition-all flex items-center gap-2"
                   >
                     <ShieldCheck size={12} /> Aplicar Plantilla Ticket Elite
                   </button>
                </div>
                <div className="space-y-2">
                   <textarea 
                     className="input-elite w-full h-40 glass-extreme resize-none font-medium text-[11px] leading-relaxed"
                     value={branding.successMsg}
                     onChange={(e) => setBranding({...branding, successMsg: e.target.value})}
                   />
                </div>
                <div className="space-y-2">
                   <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-1">Mensaje de Error</label>
                   <textarea 
                     className="input-elite w-full h-24 glass-extreme resize-none font-medium text-xs leading-relaxed"
                     value={branding.errorMsg}
                     onChange={(e) => setBranding({...branding, errorMsg: e.target.value})}
                   />
                </div>
                <div className="p-3 bg-cyan-500/5 border border-cyan-500/10 rounded-xl flex items-center gap-3">
                   <ShieldCheck size={16} className="text-cyan-500" />
                   <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-tight">Variables soportadas: <span className="text-cyan-500">{"{monto}"}</span>, <span className="text-cyan-500">{"{referencia}"}</span></p>
                </div>
             </div>
          </div>
        </div>

        {/* 3. Live Preview */}
        <div className="space-y-6">
           <div className="flex items-center gap-3 text-white">
              <h3 className="font-black uppercase tracking-widest text-[10px]">Vista Previa Real-Time</h3>
           </div>
           <div className="space-y-8 sticky top-8">
              <div className="space-y-4">
                 <p className="text-[9px] font-black text-center text-zinc-600 uppercase tracking-widest">Escenario: Pago Exitoso</p>
                 <WhatsAppPreview 
                   message={branding.successMsg} 
                   type="success" 
                   companyName={branding.companyName}
                 />
              </div>
              {/* Reset Branding Button */}
              <button 
                onClick={handleResetBranding}
                className="w-full py-3 flex items-center justify-center gap-2 text-zinc-500 hover:text-white transition-colors text-[9px] font-black uppercase tracking-widest border-t border-zinc-800 pt-8"
              >
                <Eraser size={14} /> Restablecer Valores Elite
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default BrandingModule;
