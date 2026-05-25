import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend, 
  Filler 
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { Clock, Wallet, CheckCircle2, TrendingUp } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Custom Plugin for Glow Effect
const glowPlugin = {
  id: 'glowPlugin',
  beforeDatasetsDraw: (chart, args, options) => {
    const { ctx } = chart;
    ctx.save();
    ctx.shadowBlur = 15;
    ctx.shadowColor = 'rgba(14, 165, 233, 0.4)';
  },
  afterDatasetsDraw: (chart, args, options) => {
    chart.ctx.restore();
  }
};

const RevenueInsights = ({ receipts = [] }) => {
  // 1. Procesamiento de Datos en Tiempo Real
  const stats = useMemo(() => {
    const bankCounts = { Nequi: 0, Bancolombia: 0, Otros: 0 };
    const hourlyDistribution = Array(24).fill(0);
    
    receipts.forEach(r => {
      // Agrupación por Banco
      const bank = (r.ocr_bank || '').toLowerCase();
      if (bank.includes('nequi')) bankCounts.Nequi++;
      else if (bank.includes('bancolombia')) bankCounts.Bancolombia++;
      else bankCounts.Otros++;

      // Agrupación por Horas Pico
      try {
        const date = new Date(r.ocr_date || Date.now());
        const hour = date.getHours();
        if (!isNaN(hour)) hourlyDistribution[hour]++;
      } catch (e) {
        // Fallback for invalid dates
      }
    });

    return { bankCounts, hourlyDistribution };
  }, [receipts]);

  // Configuraciones de Estética Elite (Glow Plugins & Options)
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#0c0c0e',
        titleFont: { size: 10, weight: 'bold' },
        bodyFont: { size: 12 },
        borderColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 12,
        displayColors: false,
      }
    },
    scales: {
      x: { 
        grid: { display: false },
        ticks: { color: '#52525b', font: { size: 9, weight: 'bold' } }
      },
      y: { 
        grid: { color: 'rgba(255,255,255,0.03)', drawBorder: false },
        ticks: { color: '#52525b', font: { size: 9, weight: 'bold' }, stepSize: 1 }
      }
    }
  };

  const bankData = {
    labels: ['NEQUI', 'BANCOLOMBIA', 'OTROS'],
    datasets: [{
      data: [stats.bankCounts.Nequi, stats.bankCounts.Bancolombia, stats.bankCounts.Otros],
      backgroundColor: [
        'rgba(16, 185, 129, 0.5)', // Emerald
        'rgba(14, 165, 233, 0.5)', // Cyan
        'rgba(139, 92, 246, 0.5)'  // Violet
      ],
      borderColor: [
        '#10b981', '#0ea5e9', '#8b5cf6'
      ],
      borderWidth: 1,
      borderRadius: 8,
      hoverBackgroundColor: [
        'rgba(16, 185, 129, 0.8)',
        'rgba(14, 165, 233, 0.8)',
        'rgba(139, 92, 246, 0.8)'
      ],
      // Propiedades de sombra para el efecto GLOW (usando custom properties o extendiendo)
    }]
  };

  const hourlyData = {
    labels: Array.from({ length: 24 }, (_, i) => `${i}:00`),
    datasets: [{
      label: 'Transacciones',
      data: stats.hourlyDistribution,
      backgroundColor: 'rgba(14, 165, 233, 0.3)',
      borderColor: '#0ea5e9',
      borderWidth: 2,
      borderRadius: 4,
      hoverBackgroundColor: '#0ea5e9',
    }]
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Gráfico de Bancos */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="lg:col-span-1 glass-extreme p-8 rounded-[40px] border-white/5 relative overflow-hidden group"
      >
        <div className="flex items-center gap-3 mb-8">
           <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-500">
              <Wallet size={18} />
           </div>
           <h3 className="text-xs font-black uppercase tracking-widest text-zinc-300 italic">Desglose por Emisor</h3>
        </div>
        <div className="h-64 relative">
           <Bar data={bankData} options={chartOptions} plugins={[glowPlugin]} />
        </div>
      </motion.div>

      {/* Gráfico de Horas Pico */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="lg:col-span-1 glass-extreme p-8 rounded-[40px] border-white/5 relative overflow-hidden group"
      >
        <div className="flex items-center gap-3 mb-8">
           <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
              <Clock size={18} />
           </div>
           <h3 className="text-xs font-black uppercase tracking-widest text-zinc-300 italic">Horas Pico de Flujo</h3>
        </div>
        <div className="h-64 relative">
           <Bar 
             data={hourlyData} 
             options={{
               ...chartOptions,
               scales: {
                 ...chartOptions.scales,
                 x: { ...chartOptions.scales.x, ticks: { ...chartOptions.scales.x.ticks, stepSize: 4 } }
               }
             }} 
             plugins={[glowPlugin]}
           />
        </div>
      </motion.div>

      {/* Métrica de Eficiencia IA */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="lg:col-span-1 glass-extreme p-8 rounded-[40px] border-white/5 relative overflow-hidden group flex flex-col justify-between"
      >
        <div className="space-y-6">
           <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                 <CheckCircle2 size={18} />
              </div>
              <h3 className="text-xs font-black uppercase tracking-widest text-zinc-300 italic">Eficiencia de Validación</h3>
           </div>
           
           <div className="py-8 text-center space-y-2">
              <p className="text-6xl font-black text-white tracking-tighter shadow-cyan-500/10 drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">1.2<span className="text-2xl text-cyan-500 italic">s</span></p>
              <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Tiempo Promedio</p>
           </div>
        </div>

        <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
           <div className="flex items-center justify-between mb-2">
              <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Latencia de IA</span>
              <TrendingUp size={14} className="text-emerald-500" />
           </div>
           <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: '94%' }}
                className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
              />
           </div>
           <p className="text-[8px] text-zinc-600 font-bold uppercase mt-2">Sincronización Sub-segundo Optimizada</p>
        </div>
      </motion.div>
    </div>
  );
};

export default RevenueInsights;
