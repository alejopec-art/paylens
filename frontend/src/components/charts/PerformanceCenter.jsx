import React from 'react';
import { motion } from 'framer-motion';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement,
  Title, 
  Tooltip, 
  Legend, 
  Filler 
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const ChartCard = ({ title, subtitle, children }) => (
  <motion.div 
    initial={{ opacity: 0, scale: 0.98 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.6 }}
    className="bg-[#0c0c0e]/60 border border-zinc-800/40 rounded-3xl p-8 shadow-2xl relative overflow-hidden group hover:border-cyan-500/20 transition-all duration-500"
  >
    <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 blur-[80px] rounded-full"></div>
    <div className="mb-8 relative z-10">
      <h3 className="text-xl font-black tracking-tight text-white mb-1 group-hover:text-cyan-400 transition-colors uppercase italic">{title}</h3>
      <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.3em]">{subtitle}</p>
    </div>
    <div className="h-[280px] relative z-10">
      {children}
    </div>
  </motion.div>
);

const PerformanceCenter = () => {
  const lineData = {
    labels: ['LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB', 'DOM'],
    datasets: [{
      label: 'Monto Validado',
      data: [3500000, 4200000, 3800000, 5100000, 4800000, 3200000, 2900000],
      borderColor: '#0ea5e9',
      backgroundColor: (context) => {
        const ctx = context.chart.ctx;
        const gradient = ctx.createLinearGradient(0, 0, 0, 300);
        gradient.addColorStop(0, 'rgba(14, 165, 233, 0.2)');
        gradient.addColorStop(1, 'rgba(14, 165, 233, 0)');
        return gradient;
      },
      fill: true,
      tension: 0.45,
      pointRadius: 6,
      pointBackgroundColor: '#09090b',
      pointBorderColor: '#0ea5e9',
      pointBorderWidth: 2,
      pointHoverRadius: 8,
      pointHoverBackgroundColor: '#0ea5e9',
    }]
  };

  const barData = {
    labels: ['NEQUI', 'BANCO', 'DAVIPLATA', 'OTROS'],
    datasets: [{
      label: 'Nodos de Origen',
      data: [850, 620, 240, 110],
      backgroundColor: [
        'rgba(16, 185, 129, 0.4)',
        'rgba(14, 165, 233, 0.4)',
        'rgba(245, 158, 11, 0.4)',
        'rgba(139, 92, 246, 0.4)'
      ],
      borderColor: [
        'rgba(16, 185, 129, 1)',
        'rgba(14, 165, 233, 1)',
        'rgba(245, 158, 11, 1)',
        'rgba(139, 92, 246, 1)'
      ],
      borderWidth: 1,
      borderRadius: 12,
      hoverBackgroundColor: [
        'rgba(16, 185, 129, 0.6)',
        'rgba(14, 165, 233, 0.6)',
        'rgba(245, 158, 11, 0.6)',
        'rgba(139, 92, 246, 0.6)'
      ],
    }]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#0c0c0e',
        titleFont: { size: 10, weight: 'bold', family: 'Outfit' },
        bodyFont: { size: 12, family: 'Outfit' },
        padding: 16,
        borderColor: 'rgba(39, 39, 42, 0.5)',
        borderWidth: 1,
        displayColors: false,
        cornerRadius: 12,
      }
    },
    scales: {
      y: {
        grid: { color: 'rgba(255,255,255,0.02)', drawBorder: false },
        ticks: { color: '#52525b', font: { size: 9, weight: 'bold' }, padding: 10 }
      },
      x: {
        grid: { display: false },
        ticks: { color: '#52525b', font: { size: 9, weight: 'bold' }, padding: 10 }
      }
    }
  };

  return (
    <div className="p-10 grid grid-cols-1 lg:grid-cols-2 gap-10">
      <ChartCard title="Crecimiento de Red" subtitle="Volumen financiero procesado (COP/DAILY)">
        <Line data={lineData} options={options} />
      </ChartCard>

      <ChartCard title="Carga por Emisor" subtitle="Distribución de transacciones validadas">
        <Bar data={barData} options={options} />
      </ChartCard>
    </div>
  );
};

export default PerformanceCenter;
