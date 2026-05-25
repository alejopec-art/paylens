import React from 'react';
import JoyrideModule from 'react-joyride';
const Joyride = JoyrideModule.default || JoyrideModule;

const OnboardingTour = ({ run, setRun }) => {
  const steps = [
    {
      target: '.shadow-cyan-500\\/20',
      content: '¡Bienvenido a PayLens Elite! Este es tu nuevo centro de control financiero.',
      disableBeacon: true,
    },
    {
      target: '.lg\\:grid-cols-4',
      content: 'Aquí verás el Score de Conciliación AI y las métricas clave de salud del sistema.',
    },
    {
      target: '.custom-scrollbar-elite',
      content: 'El monitor en vivo muestra cada transacción en tiempo real con animaciones cinemáticas.',
    },
    {
      target: 'input[placeholder*="Búsqueda Inteligente"]',
      content: 'Usa la búsqueda global para encontrar cualquier referencia o monto al instante.',
    }
  ];

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      showProgress
      showSkipButton
      styles={{
        options: {
          primaryColor: '#0ea5e9',
          backgroundColor: '#18181b',
          textColor: '#fafafa',
          arrowColor: '#18181b',
        }
      }}
      callback={(data) => {
        if (data.status === 'finished' || data.status === 'skipped') {
          setRun(false);
        }
      }}
    />
  );
};

export default OnboardingTour;
