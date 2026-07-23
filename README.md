<div align="center">

<img src="public/logo.jpg" alt="La Cocina de la Abuela" width="120" style="border-radius: 50%;" />

# Calla y Come 🍳
### La Cocina de la Abuela

Una aplicación híbrida **web + Android** para planificar menús semanales, gestionar la despensa, autogenerar la lista de la compra y coordinar recetas en familia — en tiempo real.

[![CI/CD](https://github.com/Ana-Alonso/la-cocina-de-la-abuela/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/Ana-Alonso/la-cocina-de-la-abuela/actions/workflows/ci-cd.yml)
[![Live](https://img.shields.io/badge/🌐%20Live-callaycome.onrender.com-f26841)](https://callaycome.onrender.com)
![React](https://img.shields.io/badge/React-19-61dafb?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-6-3178c6?logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ecf8e?logo=supabase)
![Render](https://img.shields.io/badge/Deploy-Render-46e3b7?logo=render)

</div>

---

## ✨ Características

| Módulo | Descripción |
|--------|-------------|
| 📅 **Planificador** | Organiza desayunos, comidas y cenas. Autogenera el plan óptimo según preferencias e ingredientes disponibles |
| 🍲 **Gestión de Sobras** | Prioriza automáticamente recetas con sobras en la despensa. Indicador visual `🍲 Sobras` en el asignador manual |
| 🍎 **Despensa** | Control cuantitativo de stock con buscador en tiempo real, conversor inteligente de unidades (`g/kg`, `ml/l`, `uds`) y consumo automático al cocinar |
| 🛒 **Lista de Compra** | Generación inteligente: calcula la diferencia entre el menú planificado y el stock actual. Incluye búsqueda en tiempo real |
| 🚨 **Modo Nevera** | Botón de pánico que sugiere recetas cocinables al instante con lo que hay en casa |
| 👥 **Modo Familiar** | Sincronización colaborativa en tiempo real con políticas RLS por familia o uso individual |
| 🔔 **Notificaciones** | Centro de alertas con historial cronológico y máximo 3 toasts simultáneos para no saturar la pantalla |
| 🔒 **Acceso por Invitación** | App privada. El acceso es solo para miembros invitados |

---

## 🛠️ Stack Tecnológico

- **Frontend**: React 19 · TypeScript 6 · Vite 5
- **Estilos**: Vanilla CSS · Dark Mode · Material UI (MUI)
- **Backend**: Supabase (PostgreSQL + RLS + Realtime)
- **Nativo**: Capacitor (Android)
- **Tests**: Vitest · Testing Library
- **Lint**: Oxlint
- **Deploy**: Render (Static Site)
- **CI/CD**: GitHub Actions

---

## 🚀 Desarrollo local

### 1. Instalar dependencias

```bash
npm install
```

### 2. Variables de entorno

Crea un archivo `.env` en la raíz:

```env
VITE_SUPABASE_URL=tu-supabase-url
VITE_SUPABASE_ANON_KEY=tu-supabase-anon-key
```

### 3. Iniciar servidor de desarrollo

```bash
npm run dev
```

---

## 🧪 Scripts disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción (`/dist`) |
| `npm run preview` | Preview del build local |
| `npm run lint` | Lint con Oxlint |
| `npm test` | Tests con Vitest |
| `npm run test:watch` | Tests en modo watch |
| `npx cap sync` | Sincronizar con Android (Capacitor) |

---

## ⚙️ CI/CD

El pipeline de GitHub Actions se ejecuta automáticamente en cada push y pull request a `main`:

```
Push / PR ──► 🔍 Lint  ──► 🧪 Tests  ──► 🏗️ Build
                                              │
                                    (solo push a main)
                                              ▼
                                    🚀 Deploy a Render
```

### Secrets requeridos en GitHub

| Secret | Descripción |
|--------|-------------|
| `VITE_SUPABASE_URL` | URL del proyecto Supabase |
| `VITE_SUPABASE_ANON_KEY` | Clave anon de Supabase |
| `RENDER_DEPLOY_HOOK_URL` | Deploy Hook de Render (Settings → Deploy Hook) |

---

## 📁 Estructura del proyecto

```
src/
├── components/
│   ├── auth/          # Pantalla de login
│   ├── common/        # Componentes reutilizables
│   ├── recipes/       # Módulo de recetas
│   ├── planner/       # Planificador semanal
│   ├── pantry/        # Despensa
│   ├── nevera/        # Modo nevera / botón de pánico
│   ├── shopping/      # Lista de la compra
│   ├── budget/        # Presupuesto
│   └── family/        # Gestión familiar
├── hooks/             # Custom hooks
├── services/          # Integración con Supabase
├── types/             # Tipos TypeScript
└── utils/             # Utilidades
```

---

## 🌐 Demo

🔗 **[https://callaycome.onrender.com](https://callaycome.onrender.com)**

La app es privada y de acceso solo por invitación. Si eres reclutador/a y quieres ver una demo, [contáctame](mailto:alonsogomezana03@gmail.com).

---

<div align="center">
  Hecho con ❤️ y mucha sazón · Ana Alonso
</div>
