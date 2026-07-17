# Calla y Come 🍳 (La Cocina de la Abuela)

Una aplicación móvil e híbrida moderna diseñada para planificar comidas semanales, gestionar existencias de la despensa, autogenerar la lista de la compra y coordinar menús familiares en tiempo real. 

Construido utilizando **React**, **TypeScript**, **Vite**, **Supabase** y **Capacitor** para ofrecer una experiencia nativa fluida en Android y Web.

---

## ✨ Características Principales

*   📅 **Planificador de Menús**: Organiza y planifica desayunos, comidas y cenas para los próximos días. Permite autogenerar un plan óptimo basado en las preferencias y el stock actual.
*   🍎 **Despensa Cuantitativa**: Controla existencias de forma precisa. 
    *   **Conversor inteligente de unidades**: Reconoce automáticamente equivalencias compatibles (peso: `g`/`kg`/`gr`; volumen: `ml`/`l`; conteo: `uds`/`lonchas`/`rebanadas`).
    *   **Consumo automático**: Al marcar un día como cocinado, los ingredientes correspondientes se descuentan proporcionalmente según las raciones indicadas.
    *   **Eliminación parcial**: Ventana interactiva al borrar ingredientes manuales para restar porciones específicas.
*   🛒 **Lista de Compra Dinámica**: Genera una lista inteligente calculando la diferencia entre los ingredientes necesarios para el menú planificado y las existencias reales en tu despensa.
*   🚨 **Boton de Pánico y Modo Nevera**: ¿No sabes qué cocinar? El modo nevera evalúa los ingredientes actuales y te sugiere recetas con menor cantidad de compras pendientes.
*   👥 **Modo Familiar e Individual**:
    *   **Familiar**: Crea una unidad familiar, invita a miembros mediante códigos y comparte la planificación. Gestión de roles (**Cocinitas** con permisos de edición y **Miembros** con vista de lectura y quejómetro).
    *   **Individual**: Los usuarios sin unidad familiar pueden utilizar la despensa y la compra de forma totalmente privada e individualizada con políticas RLS dedicadas.
*   🔔 **Centro de Notificaciones**: Notificaciones internas en tiempo real sincronizadas mediante canales Supabase. Cuenta con un límite máximo de 3 toasts en pantalla para evitar saturación y una bandeja de entrada modal persistente para revisar el historial.

---

## 🛠️ Stack Tecnológico

*   **Frontend**: React (Hooks, Context, Realtime Hooks) + TypeScript + Vite.
*   **Diseño y Estilos**: Vanilla CSS altamente pulido, Dark Mode premium y componentes basados en Material UI (MUI).
*   **Base de Datos y Tiempo Real**: Supabase (PostgreSQL) con RLS (Row Level Security) y canales de suscripción en tiempo real.
*   **Compilación Nativa**: Capacitor (Plugins oficiales para control de ciclo de vida de la aplicación y notificaciones locales).
*   **Pruebas**: Vitest (Unit Testing de hooks y lógica de negocio).

---

## 🚀 Comenzar a Usar

### Prerrequisitos
*   Node.js (versión 18 o superior)
*   NPM o Yarn

### Instalación
1.  Clona este repositorio:
    ```bash
    git clone https://github.com/Ana-Alonso/LCDLA.git
    cd LCDLA
    ```

2.  Instala las dependencias necesarias:
    ```bash
    npm install
    ```

3.  Configura tus variables de entorno creando un archivo `.env` en la raíz del proyecto:
    ```env
    VITE_SUPABASE_URL=tu-supabase-url
    VITE_SUPABASE_ANON_KEY=tu-supabase-anon-key
    ```

4.  Inicia el servidor de desarrollo local:
    ```bash
    npm run dev
    ```

---

## 🧪 Pruebas y Compilación

*   **Ejecutar Tests Unitarios**:
    ```bash
    npm run test
    ```
*   **Generar Build de Producción**:
    ```bash
    npm run build
    ```
*   **Sincronizar con Dispositivo Móvil (Android/Capacitor)**:
    ```bash
    npx cap sync
    ```

---

## 📁 Estructura del Proyecto

*   `src/components/`: Componentes modulares de interfaz organizados por áreas (planificador, despensa, compra, nevera, familia, autenticación).
*   `src/hooks/`: Lógica de negocio y hooks de estado (planificador, despensa, compra, sincronizadores locales y remotos en tiempo real).
*   `src/utils/`: Funciones auxiliares de cálculo y conversión de unidades.
*   `src/recipesData.json`: Catálogo base inicial de recetas.
*   `supabase/migrations/`: Archivos de migración de base de datos SQL, incluyendo políticas RLS.
