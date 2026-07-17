# Calla y Come 🍳 (La Cocina de la Abuela)

Una aplicación móvil e híbrida moderna diseñada para planificar comidas semanales, gestionar existencias de la despensa, autogenerar la lista de la compra y coordinar menús familiares en tiempo real. 

Construido utilizando **React**, **TypeScript**, **Vite**, **Supabase** y **Capacitor** para ofrecer una experiencia nativa fluida en Android y Web.

---

## ✨ Características Principales

*   📅 **Planificador de Menús**: Organiza y planifica desayunos, comidas y cenas. Permite autogenerar un plan óptimo basado en preferencias e ingredientes.
*   🍲 **Priorización Inteligente de Sobras**: 
    *   **Autogenerado**: Si tienes sobras en la despensa (por ejemplo, `"Sobras de Paella"`), la receta original de esa comida recibe un aumento de prioridad masivo en la autogeneración para planificarla y consumirla primero.
    *   **Asignador Manual**: Al añadir un plato al menú manualmente, las recetas con sobras disponibles se listan primero e incorporan un identificador visual verde `🍲 Sobras`.
*   🍎 **Despensa Cuantitativa con Buscador**: Controla existencias y busca rápidamente cualquier artículo en tiempo real.
    *   **Buscador dinámico**: Filtra los artículos al instante con indicadores de estado vacío si no hay coincidencias.
    *   **Conversor inteligente de unidades**: Reconoce automáticamente equivalencias compatibles (peso: `g`/`kg`/`gr`; volumen: `ml`/`l`; conteo: `uds`/`lonchas`/`rebanadas`).
    *   **Consumo automático**: Al marcar un día como cocinado, los ingredientes se descuentan proporcionalmente.
    *   **Eliminación parcial**: Ventana interactiva al borrar ingredientes manuales para restar porciones específicas.
*   🛒 **Lista de Compra Dinámica con Buscador**: Genera una lista inteligente calculando la diferencia entre el menú planificado y el stock actual. Incluye búsqueda en tiempo real para encontrar rápidamente los artículos manuales o automáticos.
*   🚨 **Boton de Pánico y Modo Nevera**: Sugiere recetas cocinables de forma inmediata evaluando las compras pendientes.
*   👥 **Modo Familiar e Individual**: Sincronización colaborativa o uso privado e individualizado mediante políticas RLS dedicadas.
*   🔔 **Centro de Notificaciones**: Bandeja modal persistente con historial cronológico y control de alertas flotantes (toasts) limitados a un máximo de 3 para evitar saturación de pantalla.

---

## 🛠️ Stack Tecnológico

*   **Frontend**: React (Hooks, Context, Realtime Hooks) + TypeScript + Vite.
*   **Design**: Vanilla CSS altamente pulido, Dark Mode y Material UI (MUI).
*   **Base de Datos**: Supabase (PostgreSQL) con RLS y Realtime.
*   **Compilación Nativa**: Capacitor.
*   **Pruebas**: Vitest.

---

## 🚀 Comenzar a Usar

### Instalación
1.  Instala las dependencias:
    ```bash
    npm install
    ```
2.  Configura tus variables de entorno creando un archivo `.env` en la raíz:
    ```env
    VITE_SUPABASE_URL=tu-supabase-url
    VITE_SUPABASE_ANON_KEY=tu-supabase-anon-key
    ```
3.  Inicia el servidor de desarrollo:
    ```bash
    npm run dev
    ```

---

## 🧪 Pruebas y Compilación

*   **Ejecutar Tests**:
    ```bash
    npm run test
    ```
*   **Compilar Producción**:
    ```bash
    npm run build
    ```
*   **Sincronizar con Móvil (Capacitor)**:
    ```bash
    npx cap sync
    ```
