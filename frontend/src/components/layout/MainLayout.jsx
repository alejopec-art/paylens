import React, { useState } from 'react';
import { 
  BarChart3, 
  Search, 
  Settings, 
  Menu, 
  ChevronLeft, 
  User,
  ShieldAlert,
  History,
  LayoutDashboard
} from 'lucide-react';

const SidebarItem = ({ icon: Icon, label, active, onClick, collapsed }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-4 px-4 py-3 transition-all duration-300 group
      ${active ? 'bg-cyan-precision/10 text-cyan-precision' : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50'}`}
  >
    <Icon size={20} className={active ? 'drop-shadow-[0_0_8px_rgba(14,165,233,0.5)]' : ''} />
    {!collapsed && <span className="font-medium">{label}</span>}
  </button>
);

const MainLayout = ({ children, activeTab, setActiveTab, searchTerm, setSearchTerm, branding }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  return (
    <div 
      className="flex h-screen bg-[#09090b] text-zinc-100 selection:bg-cyan-500/30 overflow-hidden"
      style={{ '--accent-color': branding?.accentColor || '#0ea5e9' }}
    >
      {/* Navigation Sidebar */}
      <aside 
        className={`glass-sidebar flex flex-col transition-all duration-500 ease-in-out z-40 relative
        ${collapsed ? 'w-22' : 'w-72'}`}
      >
        <div className="absolute inset-0 bg-cyan-500/5 opacity-20 pointer-events-none"></div>
        <div className="p-8 flex items-center gap-3">
          {branding?.logo ? (
            <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center p-1 bg-white/5 border border-white/10">
              <img src={branding.logo} alt="Logo" className="w-full h-full object-contain" />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <ShieldAlert size={22} className="text-white" />
            </div>
          )}
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-bold text-xl tracking-tight leading-none text-white">
                {branding?.companyName || 'PayLens'}
              </span>
              <span className="text-[10px] font-bold text-cyan-500 uppercase tracking-widest mt-1">PayLens Elite</span>
            </div>
          )}
        </div>

        <nav className="flex-1 mt-4 px-3 space-y-1">
          <SidebarItem 
            icon={LayoutDashboard} 
            label="Dashboard" 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')} 
            collapsed={collapsed}
          />
          <SidebarItem 
            icon={History} 
            label="Historial" 
            active={activeTab === 'history'} 
            onClick={() => setActiveTab('history')} 
            collapsed={collapsed}
          />
          <SidebarItem 
            icon={BarChart3} 
            label="Análisis" 
            active={activeTab === 'analytics'} 
            onClick={() => setActiveTab('analytics')} 
            collapsed={collapsed}
          />
        </nav>

        <div className="p-4 border-t border-zinc-800/40 bg-black/20">
          {!collapsed && (
            <div className="mb-4 px-4">
              <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full w-3/4 bg-cyan-500 shadow-[0_0_8px_#0ea5e9]"></div>
              </div>
              <p className="text-[9px] text-zinc-500 font-bold mt-2 uppercase tracking-tighter">System Integrity: 98%</p>
            </div>
          )}
          <SidebarItem 
            icon={Settings} 
            label="Ajustes" 
            active={activeTab === 'settings'}
            onClick={() => setActiveTab('settings')} 
            collapsed={collapsed}
          />
          <button 
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center gap-4 px-4 py-3 text-zinc-500 hover:text-white transition-colors"
          >
            {collapsed ? <Menu size={20} /> : <div className="flex items-center gap-4"><ChevronLeft size={20} /> <span className="text-sm font-medium">Contraer</span></div>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* Top Header */}
        <header className="h-20 glass-header flex items-center justify-between px-10 z-30">
          <div className="flex items-center gap-6 flex-1">
            <div className="relative max-w-lg w-full group" title="Busca por referencia, monto o remitente (Fuzzy Search)">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-cyan-500 transition-all duration-300" size={18} />
              <input 
                type="text" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Búsqueda Inteligente (Ref, Monto, WhatsApp)..."
                className="w-full bg-zinc-900/40 border border-zinc-700/30 rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-cyan-500/50 focus:bg-zinc-900/60 transition-all placeholder:text-zinc-600 focus:shadow-[0_0_20px_rgba(14,165,233,0.1)]"
              />
            </div>
          </div>

          <div className="flex items-center gap-8">
            <button 
              onClick={() => setShowFilters(true)}
              className="flex items-center gap-2 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700/50 px-4 py-2 rounded-lg transition-all text-xs font-bold text-zinc-300"
            >
              <BarChart3 size={14} /> FILTROS
            </button>
            <div className="flex items-center gap-2 pr-4">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_#10b981]"></div>
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Core Live</span>
            </div>
            <div className="flex items-center gap-4 pl-8 border-l border-zinc-800/80">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-black text-white leading-none">PEÑA ELITE</p>
                <p className="text-[9px] text-cyan-500 font-bold uppercase tracking-widest mt-1">Senior Arch</p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-zinc-800 border border-zinc-700/50 flex items-center justify-center text-zinc-400 shadow-xl overflow-hidden relative group cursor-pointer">
                <User size={22} />
                <div className="absolute inset-0 bg-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar-elite bg-[#09090b]">
           <div className="min-h-full pb-10">
              {children}
           </div>
        </div>
      </main>

      {/* Advanced Filter Sidebar (Retractable) */}
      <div className={`fixed right-0 top-0 h-full w-96 bg-[#0c0c0e] border-l border-zinc-800/60 shadow-[ -20px_0_40px_rgba(0,0,0,0.5)] transition-all duration-500 ease-in-out z-50 
        ${showFilters ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="h-full flex flex-col">
          <div className="p-8 flex justify-between items-center border-b border-zinc-800/40 bg-black/20">
            <div className="flex flex-col">
              <h2 className="font-black text-lg tracking-tight">FILTRADO PRO</h2>
              <span className="text-[10px] text-cyan-500 font-bold uppercase tracking-widest">Intelligence Engine</span>
            </div>
            <button onClick={() => setShowFilters(false)} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-zinc-800 text-zinc-500 hover:text-white transition-all border border-transparent hover:border-zinc-700">
              <ChevronLeft size={24} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-8 space-y-8">
             {/* Filter Sections will be built in sub-components later */}
             <div className="space-y-4">
               <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-1">Rango de Monto</label>
               <div className="h-12 bg-zinc-900/40 border border-zinc-800 rounded-xl flex items-center justify-center text-zinc-600 text-xs italic">
                 Slider Dynamic Component...
               </div>
             </div>
             
             <div className="space-y-4">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-1">Bancos de Origen</label>
                <div className="grid grid-cols-2 gap-3">
                   {['Nequi', 'Bancolombia', 'Daviplata', 'Otros'].map(bank => (
                      <button key={bank} className="px-4 py-3 bg-zinc-900/30 border border-zinc-800 rounded-xl text-xs font-medium hover:border-cyan-500/50 hover:bg-cyan-500/5 transition-all text-left">
                        {bank}
                      </button>
                   ))}
                </div>
             </div>
          </div>
          <div className="p-8 border-t border-zinc-800/40 bg-black/20">
             <button className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-cyan-500/20 transition-all active:scale-[0.98]">
               APLICAR INTELIGENCIA
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainLayout;
