import React, { useState, useEffect } from 'react';
import MainLayout from './components/layout/MainLayout';
import IntelligenceMosaic from './components/stats/IntelligenceMosaic';
import LiveFeed from './components/monitor/LiveFeed';
import PerformanceCenter from './components/charts/PerformanceCenter';
import SetupWizard from './components/onboarding/SetupWizard';
import BrandingModule from './components/settings/BrandingModule';
import SecurityShield from './components/monitor/SecurityShield';
import RevenueInsights from './components/monitor/RevenueInsights';
import Fuse from 'fuse.js';
import { supabase } from './lib/supabase';
import { Settings, ShieldCheck, Globe, MessageCircle, Palette } from 'lucide-react';

function App() {
  const apiBase = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
  const apiUrl = (path) => `${apiBase}${path}`;

  const [activeTab, setActiveTab] = useState('dashboard');
  const [receipts, setReceipts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [onboardingComplete, setOnboardingComplete] = useState(
    localStorage.getItem('paylens_onboarding_elite') === 'true'
  );
  const [config, setConfig] = useState(
    JSON.parse(localStorage.getItem('paylens_config') || '{}')
  );
  
  const [branding, setBranding] = useState(() => {
    const saved = localStorage.getItem('paylens_branding');
    return saved ? JSON.parse(saved) : {
      logo: null,
      accentColor: '#0ea5e9',
      companyName: 'PayLens',
      successMsg: '¡Pago verificado con éxito! 🔥 {monto} Ref: {referencia}',
      errorMsg: 'No pudimos verificar el pago. ❌ Monto: {monto}. Por favor contacta soporte.'
    };
  });

  useEffect(() => {
    localStorage.setItem('paylens_branding', JSON.stringify(branding));
  }, [branding]);

  const [stats, setStats] = useState({
    score: 0,
    totalVolume: 0,
    fraudCount: 0
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const resReceipts = await fetch(apiUrl('/api/processed-receipts'));
        if (resReceipts.ok) {
          const dataReceipts = await resReceipts.json();
          setReceipts(Array.isArray(dataReceipts) ? dataReceipts : []);
        }
        
        const resStats = await fetch(apiUrl('/api/dashboard-stats'));
        if (resStats.ok) {
          const dataStats = await resStats.json();
          setStats(dataStats);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    if (onboardingComplete) {
      fetchData();
      
      // Suscripción Realtime (SRE Accuracy)
      const channel = supabase
        ? supabase
          .channel('db-changes')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'processed_receipts' }, fetchData)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'bank_notifications' }, fetchData)
          .subscribe()
        : null;

      const interval = setInterval(fetchData, 10000); // Fallback poll cada 10s
      return () => {
        clearInterval(interval);
        if (supabase && channel) supabase.removeChannel(channel);
      };
    }
  }, [onboardingComplete]);

  const handleSetupComplete = (data) => {
    setConfig(data);
    localStorage.setItem('paylens_config', JSON.stringify(data));
    localStorage.setItem('paylens_onboarding_elite', 'true');
    setOnboardingComplete(true);
  };

  const fuse = receipts.length > 0 ? new Fuse(receipts, {
    keys: ['ocr_reference', 'whatsapp_from', 'ocr_amount'],
    threshold: 0.3,
  }) : null;

  const filteredReceipts = searchTerm && fuse
    ? fuse.search(searchTerm).map(result => result.item)
    : receipts;

  const safeStats = {
    score: stats?.score || 0,
    totalVolume: stats?.totalVolume || 0,
    fraudCount: stats?.fraudCount || 0
  };

  return (
    <MainLayout 
      activeTab={activeTab} 
      setActiveTab={setActiveTab}
      searchTerm={searchTerm}
      setSearchTerm={setSearchTerm}
      branding={branding}
    >
      {!onboardingComplete && <SetupWizard onComplete={handleSetupComplete} branding={branding} />}
      
      <div className={`transition-all duration-700 h-full ${!onboardingComplete ? 'blur-md pointer-events-none scale-[0.98]' : 'blur-0'}`}>
        {activeTab === 'dashboard' && (
          <div className="flex flex-col h-full bg-[#09090b] space-y-8 pb-10">
            <IntelligenceMosaic stats={safeStats} />
            <div className="px-10">
               <SecurityShield fraudCount={safeStats.fraudCount} />
            </div>
            <div className="px-10">
               <RevenueInsights receipts={receipts} />
            </div>
            <LiveFeed transactions={filteredReceipts} />
          </div>
        )}
        
        {activeTab === 'analytics' && (
          <PerformanceCenter />
        )}

        {activeTab === 'history' && (
          <div className="flex flex-col h-full bg-[#09090b]">
             <LiveFeed transactions={filteredReceipts} />
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="p-12 max-w-4xl mx-auto space-y-12">
            <div className="space-y-2">
              <h2 className="text-4xl font-black tracking-tight text-white uppercase italic">Configuración Elite</h2>
              <p className="text-zinc-500 font-medium">Gestione los parámetros de su robot Plug & Play.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="glass-elite p-8 rounded-3xl space-y-6">
                <div className="flex items-center gap-4 text-cyan-500">
                  <ShieldCheck size={24} />
                  <h3 className="font-black uppercase tracking-widest text-sm">Canales de Entrada</h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Banco Principal</label>
                    <p className="text-white font-black">{config.bank || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Relay Email Activo</label>
                    <code className="text-emerald-500 text-xs bg-zinc-950 px-3 py-1 rounded-lg">user_elite@paylens.ai</code>
                  </div>
                </div>
              </div>

              <div className="glass-elite p-8 rounded-3xl space-y-6">
                <div className="flex items-center gap-4 text-emerald-500">
                  <MessageCircle size={24} />
                  <h3 className="font-black uppercase tracking-widest text-sm">Business API</h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Phone ID</label>
                    <p className="text-white font-black">{config.phoneId || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">API Status</label>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_#10b981]"></div>
                      <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Sincronizado</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
               <div className="flex items-center gap-4 text-white">
                  <Palette size={24} />
                  <h3 className="font-black uppercase tracking-widest text-sm">Marca Blanca & Personalización</h3>
               </div>
               <BrandingModule branding={branding} setBranding={setBranding} />
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}

export default App;
