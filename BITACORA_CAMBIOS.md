# Bitacora de cambios

## 2026-06-16

- Corrige el flujo del escaner QR de staff para usar la sesion real del usuario autenticado.
- Evita escaneos duplicados consecutivos desde la camara con un debounce corto por codigo.
- Mejora `scanTicket()` para manejar concurrencia y devolver `already_used` si otro proceso consume el ticket.
- Estabiliza `useAuth()` para prevenir redirecciones espurias y errores silenciosos en rutas protegidas.
- Muestra un error visible si el escaner intenta procesar un codigo sin sesion valida de staff.
- Evita pantallas de carga infinitas cuando una sesion vieja o rota de Supabase queda abierta en el navegador.
