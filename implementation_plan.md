# La Joya de la Corona 👑 — Modo Evento en Vivo (Live Stadium Broadcast) & Medallero

Diseño e implementación de la funcionalidad **Modo Evento en Vivo**, permitiendo transmitir en tiempo real a las pantallas de los padres de familia qué Hit está en pista, quiénes ganaron el Hit anterior (incluyendo soporte de empates) y quiénes corren a continuación, mientras el maestro registra los 1.er, 2.º y 3.er lugares y marca los alumnos ausentes desde su celular.

---

## 🎯 Requisitos y Reglas de Juzgamiento en Vivo

### 1. 🔴 Pantalla Pública del Estadio (Para Papás y Alumnos)
Diseñada en 3 niveles de jerarquía visual:

1. **🔴 HIT ACTUAL EN PISTA (Gran Banner Principal)**:
   - Encabezado destacado animado: `🔴 EN PISTA AHORA` con el nombre de la prueba, categoría y grado.
   - Tarjetas gigantes de los competidores por **Carril / Posición** (`Carril #1`, `Carril #2`...) con su nombre completo y grupo (`1º A`, `1º B`).
   - Revelación animada de ganadores cuando el maestro envía los resultados.

2. **🥇 HIT ANTERIOR (Resultados Recientes con Soporte de Empates)**:
   - Muestra la carrera recién finalizada con su podio oficial:
     - 🥇 **1.er Lugar** (Medalla de Oro - Permite empates compartidos)
     - 🥈 **2.º Lugar** (Medalla de Plata - Permite empates compartidos)
     - 🥉 **3.er Lugar** (Medalla de Bronce - Permite empates compartidos)
   - Etiqueta clara `⚠️ No se presentó (DNS)` para alumnos ausentes por enfermedad.

3. **⏭️ SIGUIENTE HIT (Próximo a Salir)**:
   - Vista previa compacta del siguiente Hit en el programa para que los papás preparen a sus hijos antes de ser llamados a la línea de salida.

---

### 2. 🎛️ Consola de Control del Maestro en Vivo (Panel Privado)
- **Selector de Hit Activo**: Controles `⏮️ Hit Anterior` | `⏭️ Siguiente Hit`.
- **Registro Táctil de Ganadores y Ausencias**:
  - Botones interactivos para asignar **🥇 1.º**, **🥈 2.º** y **🥉 3.º** lugar a los competidores con 1 toque.
  - **Soporte de Empates**: Se pueden asignar 2 o más primeros lugares, segundos lugares o terceros lugares si cruzan la meta juntos.
  - **Botón `⚠️ No se presentó`**: Para marcar a niños ausentes por enfermedad o imprevistos.
  - Registro de Tiempo o Marca opcional.
- **Botón "Guardar Resultados y Transmitir Siguiente Hit"**:
  - Actualiza las pantallas de todos los padres de familia en tiempo real.

---

### 3. 📊 Medallero Institucional e Informe Oficial para Directivos
- **Tabla de Medallero General por Salón** (Ej: `1º A`: 5 Oro, 3 Plata, 2 Bronce = 10 Medallas).
- **Lista General de Campeones y Registro de Asistencia/DNS**.
- **Exportación de Informe de Resultados** listo para imprimir y entregar a los Directores del Colegio La Salle de Tuxtla.

---

## 🏗️ Archivos a Crear y Modificar

### Nuevos Componentes:
1. **`[NEW] LiveEventPublicView.tsx`** ([file:///p:/app%20olimpiada/src/components/LiveEventPublicView.tsx](file:///p:/app%20olimpiada/src/components/LiveEventPublicView.tsx)):
   - Pantalla en vivo con Hit Actual (Gigante), Hit Anterior (Podio + Empates + DNS) y Siguiente Hit.
2. **`[NEW] LiveEventControlConsole.tsx`** ([file:///p:/app%20olimpiada/src/components/LiveEventControlConsole.tsx](file:///p:/app%20olimpiada/src/components/LiveEventControlConsole.tsx)):
   - Consola táctil para marcar lugares, empates, ausencias (`No se presentó`) y avanzar Hits.
3. **`[NEW] TournamentReportView.tsx`** ([file:///p:/app%20olimpiada/src/components/TournamentReportView.tsx](file:///p:/app%20olimpiada/src/components/TournamentReportView.tsx)):
   - Medallero por grupo e informe impreso para directores.

### Modificaciones de Tipos y Estado:
- **`[MODIFY] olympics.ts`** ([file:///p:/app%20olimpiada/src/types/olympics.ts](file:///p:/app%20olimpiada/src/types/olympics.ts)):
  - Añadir interfaz `HeatResult` (`place: 1 | 2 | 3 | 'DNS'`, `timeMark?: string`).
- **`[MODIFY] Header.tsx`** & **`App.tsx`**:
  - Integrar pestañas `🔴 En Vivo` y `📊 Medallero & Informe`.

---

## 🧪 Plan de Verificación

1. **Simulación de Empates y Ausencias**:
   - Asignar a 2 alumnos en 1.er lugar (empate de oro) y a 1 alumno como `No se presentó`.
   - Verificar que la vista pública muestre las 2 medallas de oro y la etiqueta de ausente sin romper el flujo.
2. **Generación del Medallero**:
   - Comprobar que las medallas compartidas por empate sumen al medallero por grupo (`1º A`, `1º B`).
3. **Compilación de Producción**:
   - Ejecutar `npx vite build` para asegurar cero errores de tipo.
