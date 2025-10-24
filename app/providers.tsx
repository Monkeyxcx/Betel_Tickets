'use client';

import { ReactNode, useEffect } from 'react';
import { signOut } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';

// Tiempo de inactividad en milisegundos (15 minutos)
const INACTIVITY_TIMEOUT = 15 * 60 * 1000;

export function SessionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return; // Solo aplicar el temporizador si hay un usuario autenticado
    
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
  }, [router, user]);

  return <>{children}</>;
}