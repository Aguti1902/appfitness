# FitApp - Aplicación Fitness con IA

Una aplicación web completa de fitness construida con React, TypeScript, Tailwind CSS y Supabase. Incluye integración con IA para recomendaciones personalizadas de entrenamientos y nutrición.

## Características

- **Autenticación completa**: Registro, login y gestión de perfil
- **Entrenamientos**: Registra ejercicios con pesos, repeticiones y seguimiento de PRs
- **Nutrición**: Dietas personalizadas con IA, recetas y lista de compra automática
- **Progreso**: Fotos de evolución y gráficas de peso/medidas
- **Social**: Sistema de amigos, rankings y comparativas
- **Horarios**: Programa entrenamientos y comidas con recordatorios
- **AI Coach**: Chat con IA para consejos personalizados
- **PWA**: Instalable en móvil con notificaciones push

## Tecnologías

- **Frontend**: React 18 + Vite + TypeScript
- **Estilos**: Tailwind CSS
- **Estado**: Zustand
- **Backend**: Supabase (Auth, PostgreSQL, Storage)
- **IA**: OpenAI API (GPT-4)
- **Gráficas**: Recharts
- **Routing**: React Router DOM

## Instalación

1. Clona el repositorio
2. Instala las dependencias:
   ```bash
   npm install
   ```

3. Configura las variables de entorno en `.env`:
   ```
   VITE_SUPABASE_URL=tu_supabase_url
   VITE_SUPABASE_ANON_KEY=tu_supabase_anon_key
   VITE_OPENAI_API_KEY=tu_openai_api_key
   ```

4. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```

## Configuración de Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com)
2. Ejecuta el schema SQL en el editor de Supabase (disponible en `src/lib/supabase.ts`)
3. Configura el Storage bucket para las fotos de progreso
4. Copia las credenciales al archivo `.env`

## Modo Demo

La app incluye un modo demo que funciona sin configurar Supabase ni OpenAI:
- Email: `demo@fitapp.com`
- Password: `demo123`

## Scripts

- `npm run dev` - Inicia el servidor de desarrollo
- `npm run build` - Compila para producción
- `npm run preview` - Previsualiza la build de producción

## Estructura del proyecto

```
src/
├── components/
│   ├── auth/           # Login, Register, ProtectedRoute
│   ├── dashboard/      # Panel principal
│   ├── workouts/       # Registro de entrenos
│   ├── nutrition/      # Dietas, recetas, lista compra
│   ├── social/         # Amigos, rankings, comparativas
│   ├── progress/       # Fotos, gráficas, medidas
│   ├── schedule/       # Horarios y recordatorios
│   ├── ai/             # AI Coach chat
│   ├── settings/       # Configuración
│   └── ui/             # Componentes reutilizables
├── hooks/              # Custom hooks
├── lib/
│   ├── supabase.ts     # Cliente Supabase
│   ├── openai.ts       # Integración IA
│   └── notifications.ts # Sistema notificaciones
├── stores/             # Zustand stores
├── types/              # TypeScript types
└── utils/              # Utilidades
```

## Funcionalidades Principales

### Entrenamientos
- Registro de ejercicios con peso y repeticiones
- Historial por tipo (Gimnasio, CrossFit, etc.)
- Tracking de récords personales (PRs)
- Sugerencias de IA basadas en objetivos

### Nutrición
- Plan de dieta generado por IA
- Recetas detalladas con instrucciones
- Lista de compra semanal automática
- Contador de calorías y macros

### Progreso
- Galería de fotos (frontal, lateral, espalda)
- Gráficas de evolución de peso
- Registro de medidas corporales

### Social
- Sistema de amigos
- Rankings semanales/mensuales
- Comparativas con gráficas

### Recordatorios
- Horarios de entrenamientos
- Recordatorios de comidas
- Notificaciones push (PWA)

## Licencia

MIT
