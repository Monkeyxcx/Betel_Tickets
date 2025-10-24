# Betel_Tickets - Plataforma de Venta de Tickets para Eventos Cristianos

Betel_Tickets es una plataforma web moderna y completa para la gestión y venta de entradas para eventos cristianos. Construida con Next.js y Supabase, ofrece una experiencia fluida tanto para los compradores de tickets como para los administradores y el personal del evento.

## ✨ Características Principales

La plataforma está diseñada con un sistema robusto de roles y permisos, ofreciendo funcionalidades específicas para cada tipo de usuario.

### Para Usuarios (Compradores)
- **Autenticación Segura:** Registro e inicio de sesión con email/contraseña y a través de proveedores OAuth como Google.
- **Recuperación de Contraseña:** Flujo completo para restablecer la contraseña olvidada.
- **Exploración de Eventos:** Visualización de eventos disponibles.
- **Compra de Tickets:** Proceso de compra intuitivo, seleccionando tipo y cantidad de entradas.
- **Perfil de Usuario:** Acceso a un perfil personal para ver el historial de compras y los tickets adquiridos.
- **Tickets Digitales:** Recepción de tickets con código QR único para el acceso al evento.

### Para Personal del Evento (Staff)
- **Escáner de QR:** Interfaz optimizada para escanear códigos QR de los tickets en tiempo real desde un dispositivo móvil.
- **Validación de Tickets:** El sistema valida instantáneamente si un ticket es válido, ya ha sido utilizado o es inválido.
- **Historial de Escaneos:** Acceso a un registro de los tickets escaneados.

### Para Administradores (Admin)
- **Dashboard de Administración:** Panel centralizado para la gestión completa de la plataforma.
- **Gestión de Eventos:** Crear, editar y gestionar todos los detalles de los eventos.
- **Gestión de Staff:** Asignar y remover personal (rol `staff`) a eventos específicos.
- **Gestión de Roles de Usuario:** Capacidad para cambiar el rol de cualquier usuario (`user`, `staff`, `admin`).
- **Estadísticas de Eventos:** Visualización de métricas clave como el total de tickets vendidos, escaneados y pendientes por evento.

## 🏗️ Arquitectura del Proyecto

El proyecto sigue una arquitectura moderna basada en componentes, separando claramente las responsabilidades del frontend y el backend, aunque ambos están integrados en un monorepo de Next.js.

### Frontend
- **Framework:** **Next.js 14+** con **App Router**. Se utilizan Server Components para el renderizado estático y dinámico en el servidor, y Client Components (`"use client"`) para la interactividad en el cliente.
- **Lenguaje:** **TypeScript**.
- **UI:**
    - **React:** Para la construcción de la interfaz de usuario.
    - **shadcn/ui:** Colección de componentes de UI reutilizables, accesibles y personalizables.
    - **Tailwind CSS:** Para un estilizado rápido y consistente.
    - **Lucide React:** Biblioteca de iconos.
- **Gestión de Estado:**
    - **React Context API:** Se utiliza a través de hooks personalizados (`useAuth`, `useRole`) para gestionar el estado de la sesión y los roles de usuario de forma global.
    - **Estado Local (`useState`, `useEffect`):** Para la gestión del estado a nivel de componente.
- **Funcionalidades Específicas:**
    - **Escáner QR:** Implementado con la biblioteca `html5-qrcode` para un escaneo eficiente directamente en el navegador.

### Backend (BaaS - Backend as a Service)
- **Plataforma:** **Supabase**. Se utiliza como la solución integral de backend.
- **Autenticación:** **Supabase Auth** gestiona todo el ciclo de vida de la autenticación de usuarios, incluyendo registro, inicio de sesión, OAuth (Google) y recuperación de contraseñas.
- **Base de Datos:** **Supabase (PostgreSQL)**. La aplicación interactúa directamente con la base de datos a través del cliente de Supabase. El esquema principal incluye las siguientes tablas:
    - `users`: Almacena información del perfil de usuario (nombre, email, rol). Se sincroniza con `auth.users`.
    - `events`: Contiene los detalles de los eventos.
    - `ticket_types`: Define los diferentes tipos de tickets para un evento (ej. VIP, General).
    - `orders`: Registra las órdenes de compra.
    - `tickets`: Almacena cada ticket individual con su código QR único y estado.
    - `staff_members`: Asocia usuarios (staff) con eventos específicos.
    - `ticket_scans`: Guarda un historial de todos los intentos de escaneo de tickets.
- **API:**
    - **Cliente de Supabase:** La mayoría de las interacciones con el backend se realizan a través del cliente JavaScript de Supabase, tanto en el cliente como en el servidor.
    - **API Routes de Next.js:** Se utilizan para tareas específicas que requieren un entorno de servidor, como el envío de correos electrónicos (`/api/send-support-email`).

### Estructura de Carpetas
```
/
├── app/                # Rutas y páginas del App Router de Next.js
│   ├── (auth)/         # Rutas de autenticación (login, register, etc.)
│   ├── admin/          # Rutas y vistas del panel de administración
│   ├── staff/          # Rutas para el personal (escáner)
│   ├── api/            # API Routes de Next.js
│   └── ...             # Páginas públicas (contacto, privacidad, etc.)
├── components/         # Componentes de React reutilizables
│   ├── ui/             # Componentes de shadcn/ui
│   └── qr-scanner.tsx  # Componente específico para el escáner QR
├── hooks/              # Hooks personalizados (useAuth, useRole)
├── lib/                # Lógica de negocio y comunicación con Supabase
│   ├── auth.ts         # Funciones de autenticación
│   ├── events.ts       # Funciones para gestionar eventos
│   ├── staff.ts        # Funciones para el personal y escaneo
│   ├── tickets.ts      # Funciones para la compra de tickets
│   └── supabase.ts     # Configuración del cliente de Supabase
└── ...                 # Otros archivos de configuración
```

## 🚀 Cómo Empezar

Sigue estos pasos para configurar y ejecutar el proyecto en tu entorno local.

### Prerrequisitos
- Node.js (v18 o superior)
- npm, pnpm o yarn
- Una cuenta de Supabase

### 1. Clonar el Repositorio
```bash
git clone https://github.com/tu-usuario/Betel_Tickets.git
cd Betel_Tickets
```

### 2. Instalar Dependencias
```bash
npm install
# o
pnpm install
# o
yarn install
```

### 3. Configurar Variables de Entorno
Crea un archivo `.env.local` en la raíz del proyecto y añade las credenciales de tu proyecto de Supabase.

```env
# URL de tu proyecto de Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxxxxxxxxx.supabase.co

# Clave anónima (pública) de tu proyecto de Supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=ey...

# (Opcional) Clave de servicio para operaciones de admin desde el servidor
SUPABASE_SERVICE_ROLE_KEY=ey...
```

> **Nota:** El proyecto incluye un **modo mock** que permite ejecutar la aplicación sin configurar Supabase. Esto es útil para el desarrollo rápido de la UI. El modo mock se activa automáticamente si las variables de entorno de Supabase no están presentes.

### 4. Configurar la Base de Datos de Supabase
Asegúrate de que tu base de datos en Supabase tenga las tablas y columnas necesarias según se define en la lógica de `lib/*.ts`. Deberás crear las tablas `events`, `users`, `ticket_types`, `orders`, `tickets`, `staff_members` y `ticket_scans`.

### 5. Ejecutar el Proyecto

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
