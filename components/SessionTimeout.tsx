'use client';

import { useEffect } from 'react';
import { signOut } from '@/lib/auth';
import { useRouter } from 'next/navigation';

// Tiempo de inactividad en milisegundos (15 minutos)
const INACTIVITY_TIMEOUT = 15 * 60 * 1000;

export default function SessionTimeout() {
  const router = useRouter();

  useEffect(() => {
    let inactivityTimer: NodeJS.Timeout;

    // Función para reiniciar el temporizador
    const resetTimer = () => {
      if (inactivityTimer) clearTimeout(inactivityTimer);
      
      inactivityTimer = setTimeout(async () => {
        console.log('Sesión cerrada por inactividad');
        await signOut();
        router.push('/login?timeout=true');
      }, INACTIVITY_TIMEOUT);
    };

    // Eventos para detectar actividad del usuario
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    // Iniciar el temporizador
    resetTimer();
    
    // Añadir event listeners para detectar actividad
    activityEvents.forEach(event => {
      window.addEventListener(event, resetTimer);
    });

    // Limpiar al desmontar
    return () => {
      if (inactivityTimer) clearTimeout(inactivityTimer);
      activityEvents.forEach(event => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [router]);

  // Este componente no renderiza nada visible
  return null;
}