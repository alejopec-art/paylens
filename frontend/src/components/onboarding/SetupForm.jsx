import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Loader2, Copy, CheckCircle2 } from 'lucide-react';

export const FormInput = ({ label, placeholder, type = "text", value, onChange, mono = false }) => (
  <div className="space-y-2 w-full">
    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] ml-1">{label}</label>
    <input
      type={type}
      placeholder={placeholder}
      className={`input-elite w-full glass-extreme relative z-10 ${mono ? 'font-mono text-xs' : ''}`}
      value={value}
      onChange={onChange}
    />
  </div>
);

export const ActionButton = ({ onClick, label, loading, success, icon: Icon }) => (
  <button
    onClick={onClick}
    disabled={loading}
    className={`w-full py-4 rounded-xl font-black text-[12px] tracking-widest uppercase transition-all flex items-center justify-center gap-3 relative overflow-hidden group
    ${success ? 'bg-emerald-500 shadow-[0_10px_30px_rgba(16,185,129,0.3)]' : 'bg-cyan-500 hover:bg-cyan-600 shadow-[0_10px_30px_rgba(14,165,233,0.3)]'}`}
  >
    <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
    {loading ? (
      <Loader2 className="animate-spin" size={20} />
    ) : success ? (
      <>
        <Check size={20} />
        SISTEMA VINCULADO
      </>
    ) : (
      <>
        {label}
        {Icon && <Icon size={20} />}
      </>
    )}
  </button>
);

export const CopyBox = ({ text }) => {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full p-4 bg-zinc-950/80 rounded-2xl border border-zinc-800 flex items-center justify-between group">
      <div className="space-y-1">
        <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Relay Endpoint</span>
        <p className="font-mono text-xs text-emerald-500">{text}</p>
      </div>
      <button 
        onClick={handleCopy}
        className={`p-2 rounded-lg transition-all ${copied ? 'bg-emerald-500/10 text-emerald-500' : 'bg-zinc-800 text-zinc-500 group-hover:text-cyan-400'}`}
      >
        {copied ? <CheckCircle2 size={18} /> : <Copy size={18} />}
      </button>
    </div>
  );
};
