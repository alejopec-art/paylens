import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Rocket, 
  ChevronRight, 
  UploadCloud, 
  Activity, 
  ShieldCheck, 
  Database, 
  LayoutDashboard 
} from 'lucide-react';

import RadarPulse from './RadarPulse';
import WizardStep from './WizardStep';
import { FormInput, ActionButton, CopyBox } from './SetupForm';

const SetupWizard = ({ onComplete, branding }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  
  const [formData, setFormData] = useState({
    wsToken: '',
    phoneId: '',
    bank: 'Nequi',
    companyName: branding?.companyName || '',
    successMsg: branding?.successMsg || '¡Pago verificado con éxito! 🔥',
  });

  const handleTestConnection = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }, 2000);
  };

  const simulateOCR = () => {
    setLoading(true);
    let prog = 0;
    const interval = setInterval(() => {
      prog += 5;
      setOcrProgress(prog);
      if (prog >= 100) {
        clearInterval(interval);
        setLoading(false);
      }
    }, 100);
  };

  const handleFinish = () => {
    onComplete(formData);
  };

  return (
    <div 
      className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-6 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-cyan-950/20 via-transparent to-transparent"
      style={{ '--accent-color': branding?.accentColor || '#0ea5e9' }}
    >
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl w-full h-[600px] glass-extreme rounded-[40px] flex flex-col overflow-hidden relative"
      >
        {/* Decorative Top Line */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent"></div>

        <div className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <WizardStep key="step1">
                <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-500 mb-8 border border-cyan-500/20 overflow-hidden">
                  {branding?.logo ? (
                    <img src={branding.logo} alt="Logo" className="w-full h-full object-contain p-2" />
                  ) : (
                    <ShieldCheck size={32} />
                  )}
                </div>
                <h2 className="text-4xl font-black text-white uppercase tracking-tight mb-2 italic">Enlace WhatsApp</h2>
                {branding?.companyName && <p className="text-cyan-500 text-[10px] font-black uppercase tracking-[0.2em] mb-1">{branding.companyName}</p>}
                <p className="text-zinc-500 mb-10 text-sm font-medium tracking-wide">Configuración del motor de mensajería empresarial</p>
                
                <div className="w-full max-w-sm space-y-6">
                  <FormInput 
                    label="Access Token" 
                    placeholder="EAA..." 
                    mono 
                    value={formData.wsToken} 
                    onChange={(e) => setFormData({...formData, wsToken: e.target.value})}
                  />
                  <FormInput 
                    label="Phone Number ID" 
                    placeholder="1092..." 
                    value={formData.phoneId} 
                    onChange={(e) => setFormData({...formData, phoneId: e.target.value})}
                  />
                  <ActionButton 
                    label="PROBAR CONEXIÓN" 
                    loading={loading} 
                    success={success} 
                    onClick={handleTestConnection} 
                  />
                </div>
              </WizardStep>
            )}

            {step === 2 && (
              <WizardStep key="step2">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 mb-8 border border-amber-500/20">
                  <Database size={32} />
                </div>
                <h2 className="text-4xl font-black text-white uppercase tracking-tight mb-2 italic">Gateway Bancario</h2>
                <p className="text-zinc-500 mb-10 text-sm font-medium tracking-wide">Vinculación de canal de entrada de datos</p>

                <div className="w-full max-w-sm space-y-8">
                  <div className="space-y-4">
                    {['Nequi', 'Bancolombia'].map(bank => (
                      <button 
                        key={bank}
                        onClick={() => setFormData({...formData, bank})}
                        className={`w-full p-4 rounded-xl border flex items-center justify-between transition-all ${formData.bank === bank ? 'border-cyan-500 bg-cyan-500/5' : 'border-zinc-800 bg-zinc-900/40 opacity-50'}`}
                      >
                        <span className="font-bold text-sm">{bank}</span>
                        {formData.bank === bank && <Activity size={18} className="text-cyan-500" />}
                      </button>
                    ))}
                  </div>
                  <CopyBox text={`relay_${Math.random().toString(36).substring(7)}@paylens.ai`} />
                </div>
              </WizardStep>
            )}

            {step === 3 && (
              <WizardStep key="step3">
                <h2 className="text-4xl font-black text-white uppercase tracking-tight mb-2 italic">Personalización</h2>
                <p className="text-zinc-500 mb-10 text-sm font-medium tracking-wide">Identidad visual y de respuesta de la IA</p>

                <div className="w-full max-w-sm space-y-6">
                  <FormInput 
                    label="Nombre de Empresa" 
                    placeholder="PayLens Pro" 
                    value={formData.companyName}
                    onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                  />
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Respuesta Automática</label>
                    <textarea 
                      className="input-elite w-full h-32 glass-extreme resize-none font-medium text-sm"
                      value={formData.successMsg}
                      onChange={(e) => setFormData({...formData, successMsg: e.target.value})}
                    />
                  </div>
                </div>
              </WizardStep>
            )}

            {step === 4 && (
              <WizardStep key="step4">
                <div className="mb-8">
                   <RadarPulse />
                </div>
                <h2 className="text-4xl font-black text-white uppercase tracking-tight mb-2 italic">Simulación Final</h2>
                <p className="text-zinc-500 mb-10 text-sm font-medium tracking-wide">Test de reconocimiento óptico y cruce</p>

                <div className="w-full max-w-sm space-y-8">
                  <div 
                    onClick={simulateOCR}
                    className="border-2 border-dashed border-zinc-700/50 rounded-3xl p-8 flex flex-col items-center gap-4 group cursor-pointer hover:border-cyan-500/50 hover:bg-cyan-500/5 transition-all"
                  >
                    <UploadCloud size={40} className="text-zinc-600 group-hover:text-cyan-500 transition-colors" />
                    <p className="text-[10px] font-black tracking-widest uppercase text-zinc-500 group-hover:text-white transition-colors">Arrastra comprobante aquí</p>
                  </div>

                  {ocrProgress > 0 && (
                    <div className="space-y-3">
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                        <span className="text-cyan-500">Mapeando OCR...</span>
                        <span>{ocrProgress}%</span>
                      </div>
                      <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                        <motion.div 
                          className="h-full bg-cyan-500"
                          initial={{ width: 0 }}
                          animate={{ width: `${ocrProgress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {ocrProgress === 100 && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-center p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl"
                    >
                      <p className="text-xs font-black text-emerald-500 uppercase tracking-widest">¡Robot Configurado y Operativo!</p>
                    </motion.div>
                  )}
                </div>
              </WizardStep>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation Footer */}
        <div className="p-10 border-t border-zinc-800/50 flex items-center justify-between glass-extreme">
          <div className="flex gap-2">
            {[1, 2, 3, 4].map(s => (
              <div key={s} className={`w-3 h-1.5 rounded-full transition-all duration-500 ${step === s ? 'w-8 bg-cyan-500 shadow-[0_0_10px_#0ea5e9]' : s < step ? 'bg-emerald-500' : 'bg-zinc-800'}`} />
            ))}
          </div>

          <div className="flex gap-4">
             {step > 1 && (
               <button onClick={() => setStep(step - 1)} className="px-6 py-3 font-bold text-zinc-500 hover:text-white transition-colors uppercase text-[10px] tracking-widest">
                 Atrás
               </button>
             )}
             <button 
               onClick={() => step < 4 ? setStep(step + 1) : handleFinish()} 
               className="bg-zinc-100 text-black px-8 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2 hover:bg-white active:scale-95 transition-all shadow-[0_10px_20px_rgba(255,255,255,0.1)]"
             >
               {step === 4 ? 'Iniciar Dashboard' : 'Siguiente'}
               <ChevronRight size={14} />
             </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default SetupWizard;
