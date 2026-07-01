# Hitos del Proyecto — Salud en 7 Parámetros

Registro histórico de los hitos importantes del proyecto. Cada hito corresponde a un commit taggeado.

Convenciones de tags:
- `v0.0.0-*` — hitos de planificación
- `v0.X.0-faseN` — cierre de la fase N

---

## 🟢 Punto de Control — Dónde estamos

**Estado al cierre de este hito:** v0.6.2-fase6-i18n

**Última fase completada:** ✅ Fase 6 — Persistencia real con Dexie (IndexedDB) + detección de coincidencia por tripleta + historial del cliente + guardado real en Results

**Próxima fase por hacer:** ⏭️ Fase 7 — Exportación a Excel (.xlsx) y PDF (jsPDF + autoTable)

**Atajos para retomar en otro momento:**

| Si quieres decir... | Di o pide... |
|---|---|
| ¿En qué fase vamos? | *"¿Dónde quedamos?"* o *"estado del proyecto"* |
| Continuar con la siguiente fase | *"Sigamos con la fase N"* |
| Volver a un hito específico | *"Volvamos a `v0.6.0-fase6`"* |
| Ver qué falta | *"¿Qué falta para terminar?"* |

**Tags disponibles:**
- `v0.0.0-plan` — planificación aprobada
- `v0.1.0-fase1` — setup base, i18n, Home
- `v0.2.0-fase2` — formulario datos básicos + persistencia
- `v0.3.0-fase3` — formulario de métricas
- `v0.4.0-fase4` — evaluador + pantalla de resultados con semáforo
- `v0.5.0-fase5` — recomendaciones para hoy (hidratación basada en peso)
- `v0.6.0-fase6` — persistencia Dexie + matching por tripleta + historial del cliente
- `v0.6.1-fase6-hotfix` — refinamientos post-validación + fix crítico de Rules of Hooks
- `v0.6.2-fase6-i18n` — neutralización de copy a español latino neutro *(ESTAMOS AQUÍ)*

### Comandos git para retomar en cualquier momento

**Volver a este punto exacto (HEAD actual):**
```bash
git checkout main              # rama principal
git pull origin main           # sincronizar cambios remotos
```

**Volver al tag exacto v0.6.0-fase6 (modo detached):**
```bash
git checkout v0.6.0-fase6
```

**Volver a cualquier hito anterior:**
```bash
git checkout v0.5.0-fase5      # ver el estado de Fase 5
git checkout v0.4.0-fase4      # ver el estado de Fase 4
git checkout v0.3.0-fase3      # ver el estado de Fase 3
# ...etc
git checkout main              # volver al HEAD cuando termines
```

**Listar todos los tags disponibles:**
```bash
git tag                        # lista simple
git tag -l --sort=-v:refname   # lista ordenada (más reciente primero)
```

**Ver los commits desde el último tag:**
```bash
git log v0.5.0-fase5..main --oneline
```

### Cómo levantar el proyecto después de clonar / cambiar de máquina

```bash
cd /home/nico/projects/GestionDeSaludSimple
bash scripts/run.sh install    # instala dependencias (WSL-aware)
bash scripts/run.sh test       # corre 95 tests
bash scripts/run.sh typecheck  # verifica tipos (0 errores)
bash scripts/run.sh dev        # levanta http://localhost:5173
```

**Equivalentes sin WSL (npm directo):**
```bash
npm install
npm test            # = vitest run
npm run typecheck   # = tsc --noEmit
npm run dev         # = vite (http://localhost:5173)
```

### Si el puerto 5173 está ocupado

```bash
# Liberar puerto 5173 (matar Vite previo)
lsof -ti:5173 | xargs -r kill -9
pkill -9 -f vite
# Luego volver a levantar
bash scripts/run.sh dev
```

### Probar en el celular (datos móviles o WiFi ajena) — Cloudflare Tunnel

Útil cuando no estás en la misma WiFi que la PC, o querés probar desde datos móviles / compartir con amigos. No requiere cuenta.

**Requisitos previos:**
- `vite.config.ts` debe tener `server.allowedHosts: true` (para que Vite no bloquee el host del túnel).
- Vite corriendo en WSL (`bash scripts/run.sh dev`).

**Paso 1 — Descargar `cloudflared` para Windows** (solo la primera vez):
- Descargar `cloudflared-windows-amd64.exe` desde <https://github.com/cloudflare/cloudflared/releases>
- Moverlo a `C:\Users\User\Downloads\` (o la ruta que prefieras)

**Paso 2 — Levantar el túnel** (PowerShell o cmd de Windows, en una terminal aparte de la de Vite):
```powershell
cd C:\Users\User\Downloads
.\cloudflared-windows-amd64.exe tunnel --url http://172.18.96.1:5173
```
> Reemplazar `172.18.96.1` por la IP interna de WSL que muestra `ipconfig` bajo `vEthernet (WSL (Hyper-V firewall))`. Puede cambiar entre reinicios.

**Paso 3 — Copiar la URL pública** que imprime cloudflared, algo como:
```
https://football-technician-valuable-tel.trycloudflare.com
```

**Paso 4 — Abrir esa URL en Chrome del celular** (datos móviles o cualquier red).

**Notas:**
- La URL es **temporal**: muere al cerrar cloudflared. Cada vez genera una URL nueva.
- Es **pública**: cualquiera con el link puede entrar. Apto para testeo, no para producción.
- Cada dispositivo tiene su propio IndexedDB — los datos no se comparten entre quien pruebe.
- Para detener: `Ctrl+C` en la PowerShell de cloudflared.

### Crear nuevo hito (cuando se cierra una fase)

Patrón usado por commits previos:

```bash
# 1. Commits de feature mientras se trabaja
git add <archivos>
git commit -m "feat(faseN): descripción corta"

# 2. Commit milestone al cerrar la fase (documenta en MILESTONES.md)
git add MILESTONES.md
git commit -m "milestone(faseN): document complete Fase N with <resumen>"

# 3. Tag anotado
git tag -a v0.X.0-faseN -m "v0.X.0-faseN — <título de la fase>

<detalle de lo entregado>"

# 4. Push de rama y tag
git push origin main
git push origin v0.X.0-faseN
```

### Si el dev server queda colgado

```bash
tail -f /tmp/vite-dev.log      # ver logs en vivo del server en background
kill <PID>                     # detener el server (PID aparece al arrancar)
```

### Resumen del estado actual

- **Rama:** `main`
- **Último commit:** `67a1fe1 fix(i18n): replace voseo with neutral LatAm Spanish in user copy`
- **Tag más reciente:** `v0.6.2-fase6-i18n` (neutralización de copy ES a español latino neutro)
- **Tags disponibles:** `v0.6.0-fase6`, `v0.6.1-fase6-hotfix`, `v0.6.2-fase6-i18n`
- **Tests:** 95 pasando (67 evaluator + 19 repo Dexie + 6 useFormDraftDB + 3 hooksOrder regression)
- **Typecheck:** 0 errores
- **Build de producción:** OK (`dist/` generado, ~432 kB JS / 132 kB gzip)
- **Dev server:** http://localhost:5173 (puerto configurable en `vite.config.ts`)

---

## v0.6.0-fase6 — Persistencia Dexie + matching por tripleta + historial del cliente
**Fecha:** Junio 2026
**Estado:** ✅ Completa

### Descripción general

Reemplaza la persistencia volátil de Fase 2 (`sessionStorage`) por una base de datos local real con Dexie (IndexedDB). A partir de ahora **las mediciones sobreviven al cerrar la pestaña o reiniciar el dispositivo**. Esta fase habilita el guardado real desde la pantalla de resultados, la detección de coincidencia entre clientes y el historial del cliente (predecesor del panel admin de Fase 8).

### Decisión arquitectónica importante

Antes de implementar, validadas contigo dos preguntas que afectan toda la fase:

- **¿Orden?** Fase 6 antes que Fase 7 (Excel/PDF). Sin persistencia no hay datos para exportar.
- **¿Quién ve el historial?** Cliente (por tripleta detectada, sin login) **y** admin (Fase 8). El cliente se identifica por nombre normalizado + fecha de nacimiento + altura, lo que evita fricción sin sacrificar la curva clínica de revisión profesional.

### Stack adicional

| Paquete | Versión | Propósito |
|---|---|---|
| dexie | 4.0.x | Wrapper de IndexedDB con API reactiva y schema versionado |
| fake-indexeddb | 6.0.x (dev) | Polyfill para correr Dexie en el entorno node de vitest |

### Schema Dexie (`db/schema.ts`)

```ts
db.version(1).stores({
  clients:  '++id, normalizedName, birthDate, heightCm, createdAt',
  records:  '++id, clientId, date, [clientId+date]',
  meta:     'key',
  drafts:   'key, updatedAt',
})
```

- **`clients`**: ficha del cliente. `normalizedName` se calcula al insertar (lowercase + sin diacríticos + trim). Indexado por separado para acelerar el matching.
- **`records`**: cada medición. Índice compuesto `[clientId+date]` pensado para resolver "último registro del cliente" rápido (actualmente se hace con `where('clientId').equals().reverse().sortBy('date')`).
- **`meta`**: settings internos. Hoy solo `schemaVersion`.
- **`drafts`**: borradores de formularios (basic + metrics) en IndexedDB. Reemplazan al viejo `sessionStorage`.

### Capa de repositorio (`db/repo.ts`)

Funciones públicas:

| Función | Propósito |
|---|---|
| `findClientMatch(input)` | Matching por tripleta → `{ level: 'high' \| 'partial' \| 'none', client?, candidates? }` |
| `createClient(input)` | Inserta cliente, calcula `normalizedName`, devuelve id |
| `getClient(id)` | Lookup por PK |
| `listAllClients()` | Para admin (Fase 8) — ordenado por `createdAt` desc |
| `saveRecord(clientId, input)` | Inserta medición con `date = new Date()` |
| `getRecordsForClient(id)` | Historial del cliente, desc por fecha |
| `getLastRecordForClient(id)` | Última medición del cliente |
| `getLatestRecord()` | Última medición global (alimenta saludo del Home) |
| `deleteClient(id)` | Cascade: borra cliente + todos sus records en transacción |
| `clearAllData()` | Wipe total (clients + records + drafts + meta) — para botón "borrar DB" del admin (Fase 8) |

### Matching por tripleta (PLAN §5)

| Nivel | Criterio | UX mostrada |
|---|---|---|
| **high** | nombre + fecha + altura idénticos (normalizado) | Banner verde "¡Qué gusto verte de nuevo!" + CTA "Sí, soy yo" |
| **partial** | nombre coincide y (fecha O altura coincide) | Banner ámbar "Encontré datos similares, ¿eres tú?" + lista candidatos + "No, soy alguien nuevo" |
| **none** | Ningún campo coincide | Avance directo, el cliente se crea al confirmar medición |

Cualquier edición de campo tras submit invalida la fase de matching para evitar decisiones sobre datos viejos.

### Borradores en IndexedDB

`useFormDraftDB` reemplaza a `useFormDraft`:
- Misma forma externa (`value / setValue / clearDraft`) → migración de componentes directa.
- Lectura inicial asíncrona (devuelve `loading: true` hasta hidratar).
- Escritura con debounce 300ms + flush al desmontar.
- **Sobreviven al cerrar la pestaña**: la próxima vez que el usuario vuelve, retoma donde quedó.

Limpieza selectiva:
- `DRAFT_KEY_BASIC` se borra al confirmar match → avanzando a métricas.
- `DRAFT_KEY_METRICS` se borra al confirmar guardado del record en ResultsPage.

### Pantalla de resultados — guardado real

Antes (Fase 5): botón "Guardar" abría modal cálido pero no persistía.
Ahora (Fase 6): el modal cálido gana un CTA **"Guardar mis datos"** que:

1. Crea el cliente en Dexie si no venía del matching (id asignado).
2. Inserta el record con `date = new Date()`.
3. Cierra el modal y navega al Home.
4. Refresca `lastVisitDays = 0` y `activeClientId` para que el saludo y el botón "Ver mi historial" aparezcan inmediatamente.

Estados del modal:
- `saving`: spinner "Guardando...", botones deshabilitados.
- `saveError`: alert rojo traducible + reintento.

### Historial del cliente (`HistoryPage`)

Nueva página accesible desde el botón **"Ver mi historial"** del Home (solo si `activeClientId != null`).

- Lista todas las mediciones del cliente, desc por fecha.
- Cada tarjeta: punto de color (rojo/ámbar/verde según semáforos agregados) + fecha + peso + resumen (`{n} normales · {n} atención · {n} alerta`).
- Click expande el detalle con las 7 evaluaciones completas.
- Mensaje cálido superior según cantidad de registros (PLAN §7.6):
  - 0-1 registros: *"Esta es tu primera medición con nosotros…"*
  - 2-3: *"Mira, ya tenemos N registros tuyos…"*
  - 4+: *"Llevas N mediciones con nosotros…"*

### Home actualizado

- Saludo cambia según contexto: primera vez / volvió hace N días / volvió hoy / "Hola, [nombre]".
- Botón **"Ver mi historial"** aparece cuando ya hay datos guardados.
- Banner de borrador se mantiene cuando hay drafts sin confirmar.

### Pruebas añadidas (`db/__tests__/repo.test.ts`)

16 tests nuevos con `fake-indexeddb`:

- `createClient` / `getClient` — id asignado, `normalizedName` derivado, normalización de acentos y mayúsculas.
- `findClientMatch` — los 3 niveles + caso de "ningún match aunque 2 campos coincidan".
- `saveRecord` / `getRecordsForClient` — orden desc, getLastRecordForClient, getLatestRecord cross-cliente.
- `listAllClients` — ordenado por createdAt desc.
- `deleteClient` — cascade transactional.
- `clearAllData` — limpia todo e idempotente.

### Archivos entregados

```
src/
├── db/
│   ├── schema.ts                            # Dexie subclass + initSchema
│   ├── repo.ts                              # CRUD + findClientMatch
│   └── __tests__/repo.test.ts               # 16 tests con fake-indexeddb
├── hooks/
│   └── useFormDraftDB.ts                    # Reemplaza useFormDraft (sessionStorage)
├── pages/
│   └── HistoryPage.tsx                      # Nueva pantalla de historial
└── (modificados) App.tsx, HomePage.tsx, ResultsPage.tsx,
    BasicDataForm.tsx, MetricsForm.tsx,
    src/types/index.ts (+normalizedName),
    src/lib/__tests__/evaluator.test.ts (+normalizedName en fixtures)
└── (eliminados) src/hooks/useFormDraft.ts
```

### Decisiones técnicas cerradas en esta fase

| Decisión | Valor |
|---|---|
| Persistencia | Dexie (IndexedDB) |
| Borradores | IndexedDB (sobreviven entre sesiones) |
| Identidad del cliente | Tripleta normalizada (nombre + fecha + altura) |
| Matching | 3 niveles (high/partial/none) — PLAN §5 |
| Quien ve historial | Cliente (sin login) + admin (Fase 8) |
| Borrado de DB | Solo botón explícito en admin (Fase 8); no auto-cleanup |
| Drafts | Auto-limpieza al confirmar guardado; si el usuario sale, persisten para retomar |
| Esquema | Versionado desde día 1 (`schemaVersion` en meta) |
| Tests de DB | `fake-indexeddb` para no requerir navegador |

### Limitaciones conocidas

- Sin UI de admin para listar/eliminar clientes: entra en Fase 8.
- Sin exportación Excel/PDF: entra en Fase 7.
- Sin sincronización entre pestañas: si el usuario abre 2 pestañas, la última escritura gana (Dexie no resuelve conflictos).
- `deleteClient` borra en cascada sin confirmación UI: la confirmación queda para Fase 8.

---

## Refinamientos post-validación de Fase 6 (commit `7ac558b`)

**Fecha:** Junio 2026
**Estado:** ✅ Aplicado sobre el tag `v0.6.0-fase6`

### Por qué este commit

Durante la validación manual posterior al cierre de Fase 6 detectamos dos issues que afectan la usabilidad central:

1. **Bug crítico de preservación de trabajo**: al submitear BasicDataForm, el draft se borraba de IndexedDB. Esto causaba que al volver "atrás" desde MetricsPage, el form de datos básicos apareciera **vacío** (sensación de "se borró todo").
2. **Modal confuso + falta de ruta clara al Home**: el botón "Ahora no, gracias" cerraba el modal sin feedback; el logo del Header no era clickeable.

El tag NO se mueve — son refinamientos detectados tras la validación, parte del mismo hito `v0.6.0-fase6`.

### Cambios (resumen)

#### Work preservation — drafts sobreviven al submit

| Antes | Ahora |
|---|---|
| `handleBasicDataSubmit` borraba `DRAFT_KEY_BASIC` | Solo setea `basicData` en estado; el draft persiste |
| `handleResultsSaved` borraba `DRAFT_KEY_METRICS` | Borra AMBOS drafts (basic + metrics) |
| `useFormDraftDB` flushPending usaba `setTimeout` | Cancelación + escritura inmediata al desmontar (último keystroke no se pierde) |

Resultado: tras ir a métricas y volver, BasicDataForm se rehidrata con los datos completos. F5, cerrar pestaña, o navegar "atrás" en cualquier punto del flujo **nunca borran datos**.

#### Navegación clara

- **SaveModal**:
  - Title: *"¡Listo! Tus datos están guardados"* (afirmación falsa) → *"¿Querés guardar tus datos?"* (pregunta).
  - Body: *"Si los guardás, vamos a poder mostrarte tu historial la próxima vez. Si no, podés volver al inicio sin guardarlos."*
  - Skip: *"Ahora no, gracias"* → *"Volver al inicio sin guardar"* (consecuencia explícita).
  - Orden invertido: primary (Guardar) a la izquierda; skip (outline) a la derecha (mobile: arriba/abajo).
- **ResultsPage**: botón outline secundario **"Volver al inicio"** debajo de los CTAs principales. Llama a `requestGoHome` que dispara `DiscardConfirmDialog` si hay datos en memoria.
- **DiscardConfirmDialog** (nuevo, en `src/components/shared/`): modal cálido con copy PLAN §7.8. Foco automático al botón "Quedarme aquí" (la opción conservadora). Captura Escape.

#### Header — Logo como Home + indicador

- Logo/título ahora es `<button>` con `aria-label="Volver al inicio"`. Al click:
  - Sin datos en memoria → navega directo al Home.
  - Con datos en memoria → abre `DiscardConfirmDialog`.
- Punto ámbar `bg-warning` con `ring-bone` aparece junto al logo cuando hay `basicData` o `metrics` en memoria sin persistir (`hasUnsavedFlowData`).

#### Hidratación de activeClientName (P1-5)

- Nuevo helper `getLatestRecordContext` en `db/repo.ts`: devuelve record + cliente en una llamada.
- App.tsx ahora hidrata `activeClientName` desde `getLatestRecordContext` en el `useEffect` de mount.
- Resultado: tras F5 con datos existentes, el saludo dice *"Hola, Juan Pérez González. ¿Quieres registrar nuevos datos o revisar tu evolución?"* desde la primera carga.

#### Anti-flash de form vacío (P1-6)

- Skeleton animado (`animate-pulse`) mientras `useFormDraftDB.loading && !hydrated` en BasicDataForm y MetricsForm.
- Solo se muestra la primera vez que se hidrata el draft; navegaciones internas son instantáneas (porque `hydrated=true`).

### Tests añadidos (92 totales)

**`src/hooks/__tests__/useFormDraftDB.test.ts`** (6 tests nuevos):
- `writeDraftForTest` persiste un draft en IndexedDB.
- `readDraftForTest` devuelve null si no hay draft.
- `clearDraftByKey` borra SOLO la key indicada (no la otra).
- Drafts Basic y Metrics coexisten (no se sobrescriben entre sí).
- `clearAllData` limpia ambos.
- Schema incluye tabla `drafts` (regression).

**`src/db/__tests__/repo.test.ts`** (3 tests nuevos para `getLatestRecordContext`):
- Devuelve record + cliente asociado.
- Devuelve undefined cuando no hay records.
- Resuelve el cliente aunque haya varios clientes con records.

### Decisiones de UX aplicadas

| Principio | Aplicación |
|---|---|
| **Work Preservation** (Nielsen + iOS HIG) | Drafts sobreviven a F5, cierre de pestaña y navegación atrás |
| **El camino destructivo debe ser opt-in y explícito** | Botón "Volver al inicio sin guardar" + DiscardConfirm |
| **Confirmaciones cálidas, no alertas frías** | Copy PLAN §7.8 aplicado al DiscardConfirmDialog |
| **El header no es decorativo, es funcional** | Logo = Home (GOV.UK + Apple HIG) con indicador de estado |
| **Jerarquía visual: primary primero** | Invertido respecto a Fase 5 (Fitts's Law + lectura L→R) |

### Archivos modificados / nuevos

```
src/App.tsx                                          # +66 / -10
src/components/form/BasicDataForm.tsx                # skeleton
src/components/form/MetricsForm.tsx                  # skeleton
src/components/layout/Header.tsx                     # logo + dot
src/components/shared/DiscardConfirmDialog.tsx       # NUEVO
src/db/repo.ts                                       # +getLatestRecordContext
src/db/__tests__/repo.test.ts                        # +3 tests
src/hooks/useFormDraftDB.ts                          # flushPending reforzado + helpers test
src/hooks/__tests__/useFormDraftDB.test.ts           # NUEVO (+6 tests)
src/i18n/{es,en}.json                                # +savedBody, +discardConfirm, +unsavedIndicator, +goHome
src/pages/ResultsPage.tsx                            # +Volver al inicio, modal copy + orden
```

### Limitaciones remanentes

- La confirmación al descartar es **siempre obligatoria** (sin toggle "no volver a preguntar"). Si te parece molesto para power users, se puede agregar en Fase 11 (pulido).
- El indicador ámbar del Header solo se ve mientras hay datos en **memoria React** (`basicData` o `metrics`). Si el usuario tiene drafts en IndexedDB pero nunca llegó a submitear, el indicador no se muestra (porque no hay memoria). Esto es aceptable porque el banner del Home "Tienes una medición a medio terminar" ya comunica esa información.

---

## Refinamientos adicionales de Fase 6 (commits `e0d39f6`, `a86a087`, `d3d0bbf`)

**Fecha:** Junio 2026
**Estado:** ✅ Aplicado sobre el tag `v0.6.0-fase6`

Estos son fixes y pulidos adicionales detectados en una segunda ronda de validación manual.

### 1. Bug crítico de Rules of Hooks (`e0d39f6`) ⚠️

**Síntoma reportado:** *"Una vez pasa al segundo formulario. Se queda en blanco y no responde."*

**Causa raíz:** En el commit `7ac558b`, el conditional render del skeleton (`if (draft.loading && !hydrated) return <skeleton />`) en `MetricsForm.tsx` estaba ubicado **entre** los `useState` de errores/touched/submitAttempted/showSummary y el `return` principal del form.

Esto rompe las **Rules of Hooks** de React:

| Render 1 (loading=true) | Render 2 (loading=false) |
|---|---|
| `useFormDraftDB` | `useFormDraftDB` |
| `useState(form)` | `useState(form)` |
| `useState(hydrated)` | `useState(hydrated)` |
| `useEffect(...)` | `useEffect(...)` |
| **return early** → no llama más | `useState(errors)` ← **nuevo hook** |
| | `useState(touched)` ← **nuevo hook** |

React ve que el orden de hooks cambia entre renders → estado inconsistente → pantalla en blanco + form que no responde.

**Fix:** mover los 4 `useState` problemáticos **arriba** del early return. Ahora todos los hooks van juntos al tope de la función; el conditional render queda al final, justo antes del `return (`.

`BasicDataForm.tsx` no tenía este bug (sus hooks ya estaban en el orden correcto). Verificado con grep.

### 2. Regression test para Rules of Hooks (`a86a087`)

`src/components/form/__tests__/hooksOrder.test.ts` — test estático (regex-based) que verifica:

1. El `if (draft.loading && !hydrated) return <skeleton />` está **después** del último hook en ambos archivos.
2. No hay hooks dentro de early returns.

Si alguien vuelve a romper el orden, el test falla antes de que llegue a la UI (3 tests nuevos).

### 3. Shorter label en SaveModal (`d3d0bbf`)

Feedback del usuario: el botón "Volver al inicio sin guardar" era largo y agresivo dentro del modal.

| Antes | Ahora |
|---|---|
| ES: "Volver al inicio sin guardar" | ES: **"Volver al inicio"** |
| EN: "Go to home without saving" | EN: **"Back to home"** |

El detail cálido de "sin guardar" sigue presente — vive en el `DiscardConfirmDialog` que `App.tsx` abre por detrás cuando hay datos en memoria. Así el botón queda limpio y el contexto emocional se mantiene.

---

## v0.6.2-fase6-i18n — Neutralización de copy a español latino neutro
**Fecha:** Junio 2026
**Estado:** ✅ Aplicado sobre el tag `v0.6.1-fase6-hotfix`

### Descripción

Pequeño ajuste de i18n detectado durante una validación manual posterior al cierre de Fase 6: algunas cadenas en español del archivo `src/i18n/es.json` empleaban conjugaciones de **voseo** (características del español rioplatense/argentino), en un copy cuyo tono general apunta a español latino neutro. Se reemplazaron las formas afectadas por sus equivalentes en **tú**, consistentes con el resto de la copia de la aplicación.

### Cambios

| Clave i18n | Antes | Ahora |
|---|---|---|
| `common.discardConfirm.body` | "Si salís ahora…" | "Si sales ahora…" |
| `results.modal.title` | "¿Querés guardar tus datos?" | "¿Quieres guardar tus datos?" |
| `results.modal.askBody` | "Si los guardás… podés volver…" | "Si los guardas… puedes volver…" |
| `results.modal.savedBody` | "Cuando quieras, podés volver…" | "Cuando quieras, puedes volver…" |

- Solo archivo `src/i18n/es.json` modificado.
- Sin cambios en componentes ni en `en.json`.
- Typecheck: 0 errores. **95/95 tests pasando**.

### Decisión de tono cerrada

| Decisión | Valor |
|---|---|
| Conjugación usada | **tú** (consistente con el resto de la app) |
| Justificación | Tono cálido e informal ya establecido en el copy existente ("Hola, qué bueno tenerte aquí", "Cuéntame un poco sobre ti", "¿Quieres registrar nuevos datos?") |
| Alcance geográfico | Latinoamérica en general — México, Perú, Chile, Colombia, etc. |

### Commit

- `67a1fe1` — `fix(i18n): replace voseo with neutral LatAm Spanish in user copy`

---

## v0.2.0-fase2 — Formulario de datos básicos + métricas + persistencia (versión definitiva)
**Fecha:** Junio 2026
**Estado:** ✅ Completa y validada (incluye persistencia de borradores)

### Descripción general

Fase 2 entrega dos formularios reales (datos básicos + 7 métricas), reemplazando los placeholders "Próximamente". Introduce la arquitectura completa de:

- Navegación entre páginas
- Validación con Zod (schemas separados con mensajes cálidos traducidos)
- Componentes de formulario reutilizables con estados visuales
- Accesibilidad WCAG 2.1
- Manejo robusto del nombre en 3 componentes (Nombre + Primer apellido + Segundo apellido)
- Persistencia de borradores con sessionStorage (sobrevive a refresh y navegación)

La misma arquitectura se reutilizará en las siguientes fases.

### Stack adicional

| Paquete | Versión | Propósito |
|---|---|---|
| zod | 3.23.x | Validación runtime con schemas |

### Funcionalidad visible

**Home (3 estados):**
1. Sin borrador: saludo cálido + botón "Registrar mis datos"
2. Con borrador: banner cálido *"Tienes una medición a medio terminar"* + 2 botones ("Continuar mi medición" / "Empezar de nuevo")
3. Tras completar: alert informativo (placeholder para Fase 4/5/6)

**Form de datos básicos (8 campos):**

| # | Campo | Tipo | Validación |
|---|---|---|---|
| 1 | Tu nombre | Texto (given-name) | 2-50 chars, letras/espacios/guiones/apóstrofes |
| 2 | Primer apellido | Texto (family-name) | Mismo regex estricto |
| 3 | Segundo apellido | Texto (additional-name) | Mismo regex estricto |
| 4 | Fecha de nacimiento | Date picker (max=hoy) | ISO YYYY-MM-DD, no futuro, edad 10-120 |
| 5 | Edad | Display auto-calculado | Derivada de birthDate |
| 6 | Altura | Numérico (cm) | 100-230 cm |
| 7 | Género | Segmented control | 'F' o 'M' |
| 8 | Contextura de muñeca | Radio cards | 'thin' / 'normal' / 'thick' |

**Form de métricas (7 campos):**

| # | Métrica | Tipo | Requerido | Rango |
|---|---|---|---|---|
| 1 | Peso | decimal | ✅ Sí | 20-300 kg |
| 2 | IMC | decimal | ❌ Opcional (0 = no medido) | 0-60 |
| 3 | % Grasa corporal | decimal | ❌ Opcional | 0-50% |
| 4 | % Masa muscular | decimal | ❌ Opcional | 0-70% |
| 5 | Calorías | entero | ✅ Sí | 800-6000 kcal |
| 6 | Edad biológica | entero | ❌ Opcional | 0-100 años |
| 7 | Grasa visceral | entero | ✅ Sí | 1-30 |

### Estados visuales de input (neutral/error/valid)

| Estado | Borde | Cuándo |
|---|---|---|
| Neutral | Gris | Nunca tocado |
| Error | Rojo | Inválido tras onBlur o submit |
| Válido | Verde | Tocado y válido |

### Validación robusta (Zod)

- **Helpers compartidos** en `validation.ts`: `requiredNumberField(min, max, rangeErrorKey)` y `optionalNumberField(max, rangeErrorKey)`
- **Patrón string→transform→number**: acepta strings del form, transforma a números con parse, usa claves i18n cálidas para errores de rango
- **Bugfix crítico**: selectField helper para radio/segmented (evita stale closure)
- **Mensajes cálidos ES/EN**: "Ups, parece que este dato se nos olvidó. ¿Me lo compartes?"

### Persistencia de borradores (sessionStorage)

- **Hook genérico `useFormDraft<T>(key)`**: lee al montar, escribe con debounce 300ms, hace flush al desmontar
- **Auto-guardado**: cada cambio en los forms persiste automáticamente
- **Sobrevive a**: refresh (F5), navegación Form ↔ Metrics, cerrar y reabrir pestaña
- **Se limpia**: al volver al Home (per requerimiento del usuario)
- **Prefix `salud_draft_`** para identificación

### Inputs numéricos blindados

- Internamente `type="text"` + `inputMode="decimal"` (sin comportamiento nativo de número)
- Filtro regex `/^[\d]*([.,][\d]*)?$/` en onChange (solo dígitos y un separador decimal)
- Bloqueado: mouse wheel, flechas ↑/↓, spinners nativos, pegado de letras
- Permitido: typing manual, borrado, navegación con ← →, teclado numérico del móvil

### Decisiones técnicas cerradas

| Decisión | Valor |
|---|---|
| Validación | Zod 3.x, schemas centralizados |
| Estructura del nombre | firstName + lastName1 + lastName2 (separados, no string único) |
| Display del nombre | Concatenado: "Juan Pérez González" |
| Normalización para matching | Lowercase + sin tildes + trim (Fase 6) |
| Layout de los 3 nombres | 3 filas separadas verticales |
| Terminología | "Primer apellido" / "Segundo apellido" (neutral) |
| Estricto | Los 3 campos de nombre son obligatorios |
| Validación visual | onBlur + re-validación onChange post-touched |
| Persistencia | sessionStorage con debounce 300ms |
| Limpieza de borrador | Automática al volver al Home |
| Routing | State-based simple en App.tsx |
| Accesibilidad | WCAG 2.1 (aria-required, aria-invalid, aria-live, focus on error) |
| Idioma | i18next (ES default + EN, persistido en localStorage) |

### Archivos entregados (Fase 2 completa)

```
src/
├── hooks/
│   └── useFormDraft.ts                     # Persistencia sessionStorage
├── components/
│   ├── form/
│   │   ├── BasicDataForm.tsx               # 8 campos con persistencia
│   │   ├── FormField.tsx                   # Wrapper label + help + error + a11y
│   │   ├── RadioGroup.tsx                  # Radio cards
│   │   ├── SegmentedControl.tsx            # iOS-style selector
│   │   └── MetricsForm.tsx                 # 7 campos con persistencia
│   ├── layout/
│   │   └── Header.tsx                      # Logo + ES/EN + Admin (placeholder)
│   └── shared/
│       ├── Button.tsx                      # 4 variants × 3 sizes
│       └── Input.tsx                       # type=text + inputMode + filtro regex
├── lib/
│   ├── age.ts                              # calculateAge desde birthDate
│   ├── name.ts                             # combineName, normalizeName, fullNameOf
│   └── validation.ts                       # Zod schemas (básico + métricas) + helpers
├── pages/
│   ├── HomePage.tsx                        # Con banner de borrador
│   ├── FormPage.tsx                        # Wrapper BasicDataForm
│   └── MetricsPage.tsx                     # Wrapper MetricsForm
└── App.tsx                                 # Routing + hasDraft tracking

scripts/run.sh                              # WSL wrapper (install, dev, build, typecheck)
index.html                                  # HTML raíz con Plus Jakarta Sans + theme-color
tailwind.config.js                          # Paleta salud
postcss.config.js
tsconfig.json / tsconfig.node.json
vite.config.ts                              # Vite + React + alias @/
package.json
PLAN.md / README.md / MILESTONES.md
```

### Accesibilidad (WCAG 2.1)

- `aria-required="true"` en todos los campos requeridos
- `aria-invalid="true"` en inputs con error
- `aria-live="polite"` en mensajes de error y contadores
- `aria-live="assertive"` en banner summary (interrumpe al usuario)
- `aria-describedby` vincula input con help y error
- Focus automático al primer campo con error al fallar submit
- Scroll suave al campo con error
- Labels asociados con `htmlFor`

### Métricas de build

- **78 módulos transformados** (era 56 en Fase 1)
- HTML: 0.95 kB
- CSS: 15.52 kB (gzip 3.70 kB)
- JS: ~290 kB (gzip ~87 kB)

### Cómo probar

```bash
cd /home/nico/projects/GestionDeSaludSimple
bash scripts/run.sh dev   # http://localhost:5173
```

**Tests críticos:**

1. ✅ **Persistencia**: llena form → F5 → datos intactos
2. ✅ **Volver al Home**: navega Form → Metrics → Home → banner aparece
3. ✅ **Continuar borrador**: click "Continuar mi medición" → form con datos
4. ✅ **Empezar de nuevo**: click "Empezar de nuevo" → form vacío
5. ✅ **Validación tiempo real**: campos numéricos cambian a verde instantáneo
6. ✅ **Wheel bloqueado**: scroll de mouse sobre input numérico no cambia valor
7. ✅ **Solo números**: escribir "abc" → rechazado en tiempo real
8. ✅ **Toggle ES/EN**: cambia toda la UI al instante
9. ✅ **Mobile (DevTools)**: responsive, teclado numérico aparece

### Pendiente (orden de ejecución)

| Fase | Descripción | Estado |
|---|---|---|
| **Fase 3** | Formulario de 7 métricas | ✅ **COMPLETADA** (`v0.3.0-fase3`) |
| **Fase 4** | Lógica de evaluación con rangos médicos por edad/género + Pantalla de Resultados con semáforo 🟢🟡🔴 | ✅ **COMPLETADA** (`v0.4.0-fase4`) |
| **Fase 5** | Tooltips explicativos en cada métrica + mensajes contextuales | ⏭️ **SIGUIENTE** |
| **Fase 6** | Persistencia con Dexie (IndexedDB) + detección de duplicados | Pendiente |
| **Fase 7** | Exportación a Excel (.xlsx) y PDF | Pendiente |
| **Fase 8** | Panel admin con login + CRUD + filtro por nombre | Pendiente |
| **Fase 9** | PWA instalable + service worker | Pendiente |
| **Fase 10** | APK Android con Capacitor | Pendiente |
| **Fase 11** | Pulido visual y de tono | Pendiente |

---

### Fix post-Fase 4 — Política "7 métricas requeridas"

- El plan original (PLAN §7.3) trataba bmi, % grasa, % músculo, edad biológica como opcionales, aceptando "déjalo en 0 si no lo tienes".
- En pruebas manuales se detectó que llegar a la pantalla de resultados con tarjetas en estado "No medido" generaba la sensación de flujo incompleto.
- Decisión del product owner: los 7 valores vienen del equipo de medición del profesional (báscula inteligente, examen de composición corporal), por lo que deben ingresarse manualmente en todos los casos.
- Cambios:
  - `validation.ts`: `optionalNumberField` eliminado. Los 4 campos antes opcionales ahora usan `requiredNumberField` con `min` realista (bmi 10, grasa 3, músculo 10, bioAge 10).
  - `MetricsForm.tsx`: `FIELD_RANGES` con `min` para todos los campos. `isOptional = range.min === 0` ya marca los 7 como required.
  - `evaluator.ts`: eliminado `notProvided()` y todas las ramas `provided=false`. `calculateBmi`/`effectiveBmi` removidas (BMI siempre viene del usuario).
  - `MetricCard.tsx`: rama "No medido" eliminada. Las 7 tarjetas siempre muestran valor + rango ideal.
  - `types/index.ts`: `MetricEvaluation` simplificado (sin `provided`, `value: number` en vez de `number | null`).
  - `ResultsSummary.tsx` + `ResultsPage.tsx`: filtros sobre `e.provided` eliminados (siempre true).
  - i18n: help texts cambiaron de "déjalo en 0 si no lo tienes" a "lo marca tu báscula o examen". `results.notMeasured` removido.
  - `PLAN.md` §7.3 actualizado con la nueva política y rangos de validación.
- Tests: 8 tests de "no provisto" y cálculo automático de BMI eliminados. **53 tests pasando** (antes 59).
- Typecheck: 0 errores. Build: 83 módulos, 303 kB.

### Fix post-Fase 4 — Bug i18n en SemaphoreBadge

- Las etiquetas cortas del badge ("Normal", "Atención", "Alerta") estaban
  hardcodeadas en español en `SemaphoreBadge.tsx`. Al toggle ES/EN se
  mantenían en español en ambas lenguas.
- Fix: agregada clave `results.statusShort.{normal|warning|alert}` en
  `es.json` ("Normal"/"Atención"/"Alerta") y `en.json`
  ("Normal"/"Attention"/"Alert"). Componente ahora usa `useTranslation`
  y `t(\`results.statusShort.${status}\`)` tanto para `aria-label`
  como para el texto visible.

### Fix post-Fase 4 — Contextura de muñeca enlazada a resultados

- La contextura de muñeca ya influía en el cálculo del peso ideal
  (Lorentz × factor 0.95/1.00/1.05), pero el impacto era invisible
  para el usuario.
- Mejoras implementadas:
  - **ClientProfileBanner** (nuevo componente) siempre visible arriba
    de la pantalla de resultados: muestra contextura, peso ideal
    estimado (Lorentz × contextura), TMB (Mifflin-St Jeor) y desvío
    del peso actual vs ideal.
  - **Mensajes contexture-aware en card de peso**: el mensaje bajo el
    rango ideal menciona explícitamente que la evaluación consideró
    la contextura de muñeca (ES/EN).
  - **Ajustes médicos ±1-2% en % grasa y % músculo**: las tablas ACE
    universales se ajustan ahora por contextura (thick +1% en grasa,
    thin -1% en grasa; thick +2% en músculo lower, thin -2% en músculo
    lower). Implementado en helpers `adjustBodyFatRange` y
    `adjustMuscleRange` con un bloque de comentario destacado
    "PARÁMETROS SUJETOS A AJUSTE FUTURO".
  - **i18n**: nuevas claves `results.profile.*` (título, contextura,
    peso ideal, TMB) y `results.metrics.weight.message.{normal|
    warning|alert}` contexture-aware.
  - **PLAN.md §6.10** nuevo: documenta formalmente los ajustes y cómo
    calibrarlos.
  - **Tests nuevos (6)**: bloque `// CONTEXTURE` al final de
    `evaluator.test.ts` que cubre las 3 contexturas × 2 métricas
    ajustadas.
- 53 tests originales + 6 nuevos = **59 tests pasando**.
- Typecheck: 0 errores. Build: 83 módulos, 304 kB.

---

## ⚠️ PUNTO DE CALIBRACIÓN FUTURO — Ajustes por contextura de muñeca

> **¿Qué es esto?** Los ajustes ±1-2% aplicados al % grasa y % músculo
> según la contextura de muñeca son **parámetros sujetos a revisión
> clínica futura**. El producto final puede requerir ajustes finos
> basados en:
> - Feedback de usuarios profesionales
> - Guías clínicas actualizadas (OMS, ACE, NIH, etc.)
> - Papers o estudios específicos de composición corporal por contextura

### 📍 Dónde tocar

| Archivo | Qué buscar | Líneas aproximadas |
|---|---|---|
| `src/lib/evaluator.ts` | Helpers `adjustBodyFatRange` y `adjustMuscleRange` | ~155-205 |
| `src/lib/evaluator.ts` | Constantes `BODY_FAT_TABLE` y `MUSCLE_TABLE` | ~70-115 |
| `src/lib/evaluator.ts` | Factor de Lorentz (0.95 / 1.00 / 1.05) en `idealWeightKg` | ~210-230 |
| `src/lib/__tests__/evaluator.test.ts` | Tests marcados como `// CONTEXTURE` | al final del archivo |
| `PLAN.md` §6.10 | Documentación formal de los ajustes | ~234-265 |

### 🔧 Cómo ajustar un valor

1. Identificar la métrica a tocar (ej: % grasa con contextura gruesa).
2. Modificar la constante en `evaluator.ts` (ej: `acceptableUpper + 1`
   → `acceptableUpper + 2`).
3. Correr `bash scripts/run.sh test` — los tests `// CONTEXTURE` te
   dicen qué evaluaciones cambiaron de status.
4. Si querés, actualizar `PLAN.md` §6.10 con la nueva justificación
   clínica.

### ⚡ Tests de calibración

Si rompes alguno de estos tests, sabés que el ajuste por contextura
cambió:

```
// CONTEXTURE
- evaluate - % grasa con contextura
  ✓ thick frame amplía acceptableUpper +1%
  ✓ thin frame reduce lower -1%
  ✓ normal frame mantiene rangos ACE base
- evaluate - % músculo con contextura
  ✓ thick frame sube lower +2%
  ✓ thin frame baja lower -2%
  ✓ thin frame respeta piso mínimo de lower
```

### 📐 Tabla resumen de ajustes actuales

| Contextura | % Grasa (ajuste) | % Músculo (lower) |
|---|---|---|
| `thin` | `lower - 1%` (mínimo 3%) | `lower - 2%` (mínimo 10%) |
| `normal` | sin ajuste | sin ajuste |
| `thick` | `acceptableUpper + 1%` Y `alertLower + 1%` | `lower + 2%` |

### 🎯 Ejemplo concreto del impacto

Hombre 35 años, contextura gruesa, 28% grasa:
- Sin ajuste (normal/thin): **alert** (≥28% es alta)
- Con ajuste thick: **warning** (28% cae en aceptable 22-28)

Esto refleja que una persona con contextura gruesa puede tener +1%
grasa sin riesgo clínico adicional (más hueso = más tejido magro =
más reserva estructural).

### Fix post-Fase 4 — Línea de metodología en card de peso

- La card de peso ahora muestra una línea sintética explicando el método:
  `↳ Calculado con Lorentz × tu contextura Normal`
- Es la única métrica con esta línea porque es la única cuya evaluación
  usa una fórmula ajustada (Lorentz × factor de contextura). Las demás
  usan tablas universales que no requieren explicación.
- Implementación: `MetricEvaluation.contexture?: WristContexture`
  (campo opcional, solo seteado en weight). UI agnóstica del cliente
  (MetricCard no recibe el cliente, solo la evaluación).
- Tono cálido-profesional consistente con el resto de la app.
- i18n: 2 claves nuevas por idioma (`methodology`, `methodologyWithValue`).
- 2 tests nuevos: verifican que solo `weight` incluye `contexture` y que
  refleja el del cliente.
- **59 tests originales + 2 nuevos = 61 tests pasando**.
- Typecheck: 0 errores. Build: 84 módulos, 307 kB.

---

## ⚠️ PUNTO DE EVALUACIÓN FUTURA — Línea de metodología en card de peso

> **¿Qué es esto?** La línea `↳ Calculado con Lorentz × tu contextura X`
> en la card de peso es **un punto de evaluación futura**. Puede
> requerir ajustes basados en:
> - Si el usuario final lee esta línea y le resulta útil o confusa
> - Si el formato (línea chiquita con `↳`) se ve bien en mobile y desktop
> - Si conviene mostrarla siempre, solo cuando la contextura no es
>   "Normal", o detrás de un toggle
> - Si conviene moverla al ClientProfileBanner en vez de la card de peso

### 📍 Dónde tocar

| Archivo | Qué buscar |
|---|---|
| `src/components/results/MetricCard.tsx` | Render condicional `{key === 'weight' && evaluation.contexture && ...}` |
| `src/i18n/es.json` | `results.metrics.weight.methodology` y `.methodologyWithValue` |
| `src/i18n/en.json` | idem en inglés |
| `src/lib/evaluator.ts` | Set de `evaluation.contexture` solo en weight |
| `src/types/index.ts` | Campo opcional `contexture?: WristContexture` en `MetricEvaluation` |

### 🔧 Cómo ajustar

- **Cambiar el copy**: editar las claves `methodology*` en los JSON de i18n.
- **Ocultar la línea**: comentar el bloque en `MetricCard.tsx`.
- **Mostrar solo en Normal**: agregar `&& evaluation.contexture === 'normal'`
  al render.
- **Mover al ClientProfileBanner**: pasar `contexture` al banner en vez
  de la card.
- **Cambiar el icono `↳`**: editar la clase CSS en `MetricCard.tsx`
  (ahora `italic text-graphite/50`).

### 🎨 Mockup actual

```
┌──────────────────────────────────────────────────┐
│ Peso                                    [Normal] │
│ 72 kg                                             │
│ Peso ideal estimado: 61.9 – 75.6 kg (×normal)     │
│ ↳ Calculado con Lorentz × tu contextura Normal    │
│ Tu peso está dentro del rango saludable          │
│ para tu contextura de muñeca.                     │
└──────────────────────────────────────────────────┘
```

---

## v0.4.0-fase4 — Lógica de evaluación + Pantalla de Resultados con semáforo
**Fecha:** Junio 2026
**Estado:** ✅ Completa y validada

### Descripción general

Fase 4 entrega el **motor de evaluación médica** y la **pantalla de resultados** con semáforo 🟢🟡🔴. El evaluador es una función pura, sin React ni DOM, totalmente testeable con Vitest. La UI pinta 7 tarjetas (una por métrica) con badge de estado, valor formateado y rango ideal contextual.

Las métricas no provistas (opcionales que el usuario dejó en 0) se muestran como "No medido" y **no afectan el resumen global** (no son malas ni buenas, simplemente no se midieron).

El botón "Guardar" abre un modal cálido (PLAN §7.5) pero **no persiste aún**: el guardado real llega en Fase 6 con Dexie (IndexedDB). Los botones Excel/PDF están deshabilitados hasta Fase 7.

### Stack adicional

| Paquete | Versión | Propósito |
|---|---|---|
| vitest | 2.1.x | Test runner del evaluador |

### Funcionalidad visible

**Pantalla de resultados:**
- Header con título y subtítulo cálidos
- Banner de resumen global (4 variantes según combinación normal/warning/alert)
- Grid responsive de 7 tarjetas (`grid-cols-1 sm:grid-cols-2`)
- Cada tarjeta muestra:
  - Etiqueta de la métrica + badge de semáforo
  - Valor grande con sufijo (kg, %, kcal, etc.) o "No medido"
  - Rango ideal formateado (ej. "18.5 – 24.9")
  - Mensaje corto según estado
- Botones: "Volver a las mediciones" (outline) + "Guardar mis datos" (primary)
- Modal cálido post-guardado con subtítulo adaptado al estado global

### Motor de evaluación (`src/lib/evaluator.ts`)

Función pura: `evaluate(record, client): MetricEvaluation[]` → siempre 7 entradas.

| Métrica | Reglas (PLAN §6) |
|---|---|
| **Peso** | vs peso ideal Lorentz × contextura. ±10% normal, ±10–20% warning, >20% alert |
| **IMC** | OMS universal. 18.5–24.9 normal, fuera warning, ≥30 alert. Calculado desde peso/altura si el usuario lo dejó vacío |
| **% Grasa** | Tabla por edad × género (5 brackets × 2 géneros). < lower warning, lower–upper normal, upper–acceptableUpper warning, ≥ alertLower alert |
| **% Músculo** | Tabla por edad × género. < lower warning. Altos no se penalizan (atlético) |
| **Calorías** | TMB Mifflin-St Jeor ±300 = normal, fuera warning |
| **Edad biológica** | vs edad cronológica ±5 = normal. > +5 warning. < -5 normal (mejor) |
| **Grasa visceral** | 1–9 normal, 10–14 warning, ≥15 alert |

### Semáforo

| Estado | Color | Borde / fondo |
|---|---|---|
| `normal` | Verde salud (`#4CAF7C`) | `border-primary` / `bg-primary-soft/40` |
| `warning` | Ámbar (`#F4B860`) | `border-warning/60` / `bg-warning/15` |
| `alert` | Coral (`#E57373`) | `border-alert/60` / `bg-alert/15` |

Acento lateral izquierdo en cada tarjeta (1px vertical bar) refuerza el color del estado.

### Resumen global

Cuenta sobre métricas **provistas** (`provided=true`):

| Alerts | Warnings | Clave i18n |
|---|---|---|
| ≥1 | * | `results.summary.hasAlerts` (plural con count) |
| 0 | 0 | `results.summary.allNormal` |
| 0 | 1–2 | `results.summary.fewWarnings` |
| 0 | ≥3 | `results.summary.manyWarnings` |

El banner cambia color según severidad (rojo si hay alerts, ámbar si warnings, verde si todo normal).

### Tests unitarios (Vitest)

**59 tests pasando** en `src/lib/__tests__/evaluator.test.ts`. Cobertura:

- ✅ IMC: bajo peso, normal (centro y techo), sobrepeso (techo), obesidad (≥30), cálculo automático
- ✅ % Grasa: rangos por género × 5 brackets etarios, fronteras (39→40 años)
- ✅ % Músculo: bajo warning, alto normal (atlético)
- ✅ Grasa visceral: techo de cada rango (9, 14, 15)
- ✅ Peso: simetría desvíos (±10/15/25%), contextura cambiando status
- ✅ Calorías: en TMB exacto, ±300, ±500
- ✅ Edad biológica: igual, ±5, mejor que cronológica, peor que cronológica
- ✅ Helpers: `calculateBmi`, `idealWeightKg` (Lorentz + contextura), `basalMetabolicRate` (Mifflin-St Jeor)
- ✅ API: 7 evaluaciones siempre, orden estable, idealRange presente, `provided` correcto

### Decisiones técnicas cerradas en esta fase

| Decisión | Valor |
|---|---|
| Evaluador | Función pura en `lib/evaluator.ts`, sin React |
| Framework de tests | Vitest (rápido, ESM nativo, mismo bundler que Vite) |
| Cobertura | Solo `evaluator.ts` (lógica médica crítica) |
| Render del semáforo | Pastilla con borde + dot de color + texto |
| Métricas no provistas | Badge "No medido", no cuentan en el resumen |
| Guardar en esta fase | Modal cálido con placeholder, botones Excel/PDF deshabilitados |
| Persistencia real | Diferida a Fase 6 (Dexie/IndexedDB) |
| i18n | Plurales con `_one` / `_other` (i18next built-in) |

### Archivos entregados (Fase 4)

```
src/
├── components/results/
│   ├── SemaphoreBadge.tsx          # Pastilla verde/ámbar/coral
│   ├── MetricCard.tsx              # Tarjeta con valor + badge + rango ideal
│   └── ResultsSummary.tsx          # Banner resumen global con plurales
├── pages/
│   └── ResultsPage.tsx             # Grid + modal cálido de "guardado"
├── lib/
│   ├── evaluator.ts                # Función pura evaluate()
│   └── __tests__/evaluator.test.ts # 59 tests Vitest
└── types/index.ts                  # + MetricKey, MetricEvaluation

vitest.config.ts                    # Alias @/ y entorno node
package.json                        # + scripts test, test:watch
scripts/run.sh                      # + comando test
```

### Cómo probar

```bash
cd /home/nico/projects/GestionDeSaludSimple
bash scripts/run.sh test      # 59 tests pasan
bash scripts/run.sh typecheck # 0 errores
bash scripts/run.sh dev       # http://localhost:5173
```

**Flujo manual completo:**
1. Home → "Registrar mis datos"
2. Llenar datos básicos → "Continuar"
3. Llenar métricas (probar varias combinaciones: dejar BMI vacío, dejar % grasa en 0, etc.)
4. "Ver mis resultados"
5. Verificar:
   - Banner resumen coherente con la cantidad de alertas/advertencias
   - 7 tarjetas con colores correctos
   - IMC calculado si quedó vacío
   - Métricas no medidas aparecen en gris con "No medido"
   - Botón "Volver a las mediciones" regresa al form de métricas con datos
   - "Guardar mis datos" abre modal con subtítulo adaptado
   - Modal muestra Excel/PDF deshabilitados
   - "Ahora no, gracias" cierra modal y vuelve al Home
6. Toggle ES/EN → toda la UI se traduce

### Pendiente (orden de ejecución)

| Fase | Descripción | Estado |
|---|---|---|
| **Fase 5** | Tooltips explicativos en cada métrica + mensajes contextuales | ⏭️ **SIGUIENTE** |
| **Fase 6** | Persistencia con Dexie (IndexedDB) + detección de duplicados | Pendiente |
| **Fase 7** | Exportación a Excel (.xlsx) y PDF | Pendiente |
| **Fase 8** | Panel admin con login + CRUD + filtro por nombre | Pendiente |
| **Fase 9** | PWA instalable + service worker | Pendiente |
| **Fase 10** | APK Android con Capacitor | Pendiente |
| **Fase 11** | Pulido visual y de tono | Pendiente |

---

## v0.3.0-fase3 — Formulario de 7 métricas (versión definitiva)
**Fecha:** Junio 2026
**Estado:** ✅ Completa y validada

### Descripción general

Fase 3 entrega el formulario real de las 7 métricas corporales, reemplazando el placeholder "Próximamente". Comparte la misma arquitectura que Fase 2:

- Validación con Zod (schemas separados con mensajes cálidos traducidos)
- Persistencia de borrador con sessionStorage (sobrevive a refresh)
- Estados visuales de input (neutral / error / valid)
- Accesibilidad WCAG 2.1
- Inputs numéricos blindados (sin spinners nativos, sin wheel)

### Funcionalidad visible

**Form de métricas (7 campos):**

| # | Métrica | Tipo | Requerido | Rango |
|---|---|---|---|---|
| 1 | Peso | decimal | ✅ Sí | 20–300 kg |
| 2 | IMC | decimal | ❌ Opcional (0 = no medido) | 0–60 |
| 3 | % Grasa corporal | decimal | ❌ Opcional | 0–50% |
| 4 | % Masa muscular | decimal | ❌ Opcional | 0–70% |
| 5 | Calorías | entero | ✅ Sí | 800–6000 kcal |
| 6 | Edad biológica | entero | ❌ Opcional | 0–100 años |
| 7 | Grasa visceral | entero | ✅ Sí | 1–30 |

**Comportamiento clave:**
- Si IMC = 0 → en la pantalla de resultados se calcula desde peso/altura
- % grasa / músculo / edad biológica = 0 → se muestran como "No medido" en resultados

### Archivos entregados (Fase 3)

```
src/components/form/MetricsForm.tsx    # 7 campos con persistencia
src/lib/validation.ts                  # + metricsSchema, validateMetricField
```

### Decisiones técnicas cerradas

| Decisión | Valor |
|---|---|
| IMC opcional | Si = 0, se calcula automáticamente en resultados |
| Edad biológica opcional | Si = 0, no se evalúa (no flaggea como "mejor que cronológica") |
| Calorías requeridas | Necesarias para calcular TMB en Mifflin-St Jeor |
| Grasa visceral requerida | Métrica clínica crítica, no opcional |

---

## v0.1.0-fase1 — Setup base, i18n y Home
**Fecha:** Junio 2026
**Estado:** ✅ Completa y validada

### Descripción general

Fase 1 entrega el esqueleto funcional de la app: un proyecto React + TypeScript + Vite con Tailwind configurado, sistema de internacionalización ES/EN funcional, y una pantalla de inicio con el saludo cálido y el CTA principal. La base es lo suficientemente sólida para soportar las siguientes fases (formularios, DB local, exportación, admin, PWA, APK).

### Stack instalado

| Paquete | Versión | Propósito |
|---|---|---|
| react / react-dom | 18.3.x | UI |
| typescript | 5.6.x | Tipado estricto (`strict: true`) |
| vite | 5.4.x | Build/dev server |
| tailwindcss | 3.4.x | Estilos con paleta personalizada |
| postcss + autoprefixer | latest | Pipeline de CSS |
| i18next | 23.15.x | Internacionalización |
| react-i18next | 15.0.x | Bindings de React para i18next |
| i18next-browser-languagedetector | 8.0.x | Detección de idioma (solo localStorage) |

### Archivos entregados

```
src/
├── App.tsx                     # Layout raíz + state-based routing
├── main.tsx                    # Entry point (monta React, carga i18n)
├── index.css                   # Tailwind + base styles
├── vite-env.d.ts               # Tipos de Vite
├── components/
│   ├── layout/Header.tsx       # Logo + toggle ES/EN + botón Admin
│   └── shared/Button.tsx       # Botón reutilizable (4 variants × 3 sizes)
├── pages/
│   └── HomePage.tsx            # Bienvenida cálida + CTA principal
├── i18n/
│   ├── index.ts                # Config i18next (ES default, solo localStorage)
│   ├── es.json                 # Textos en español
│   └── en.json                 # Textos en inglés
└── types/
    └── index.ts                # Tipos Client, Record, Gender, WristContexture, etc.

scripts/run.sh                  # Wrapper WSL (install, dev, build, preview, typecheck, sync)
public/favicon.svg              # Ícono verde con estrella (placeholder)
index.html                      # HTML raíz con fuentes y meta PWA
tailwind.config.js              # Paleta salud + Plus Jakarta Sans
postcss.config.js               # Pipeline de Tailwind
tsconfig.json / tsconfig.node.json  # TS estricto + paths alias (@/*)
vite.config.ts                  # Vite + React plugin + alias @/
package.json                    # Dependencias y scripts
README.md                       # Documentación de uso (incluye nota WSL)
```

### Funcionalidad visible

- **Header sticky** con fondo semi-transparente y blur
- **Logo** verde con ícono de corazón + nombre "Salud en 7 Parámetros"
- **Toggle ES / EN** funcional: cambia toda la UI en caliente y persiste en `localStorage`
- **Botón Admin** con placeholder que muestra tooltip "Próximamente" durante 2.5s
- **HomePage** con:
  - Ícono decorativo verde suave
  - Saludo cálido: *"Hola, qué bueno tenerte aquí. Hoy vamos a revisar cómo está tu salud, con calma y sin prisas."*
  - Botón principal grande: *"Registrar mis datos"* (acción placeholder: alert)
  - Aviso de privacidad al pie
- **Componente Button** reutilizable con 4 variantes (`primary`, `secondary`, `ghost`, `outline`) y 3 tamaños (`sm`, `md`, `lg`)

### Decisiones técnicas cerradas en esta fase

| Decisión | Valor |
|---|---|
| Idioma por defecto | **Español** (sin consultar `navigator`) |
| Persistencia de idioma | `localStorage` clave `salud_lang` |
| Tipografía | Plus Jakarta Sans (Google Fonts CDN) |
| Color primario | `#4CAF7C` (verde salud) |
| Color de fondo | `#FAF8F5` (hueso) |
| Border radius | `1rem` (`rounded-2xl`) |
| Touch targets | mínimo 44px de alto |
| Routing | State-based simple en `App.tsx` (sin router aún) |

### Fixes aplicados durante la fase

**Fix 1 — `scripts/run.sh` install**
- **Problema:** invocar `node.exe` con la ruta WSL `/mnt/c/Program Files/nodejs/npm.cmd` hacía que node interpretara la ruta como `C:\mnt\c\...` (inexistente).
- **Solución:** usar el script bash `npm` (WSL-aware) en lugar de `npm.cmd` vía node, y reordenar `PATH` para que el dir de node de Windows tenga prioridad sobre `/usr/bin`.
- **Commit:** `0f94e9b`

**Fix 2 — Idioma por defecto**
- **Problema:** en la primera visita, `LanguageDetector` consultaba `navigator` después de `localStorage`. En navegadores con locale inglés, eso forzaba la app a mostrar inglés por defecto.
- **Solución:** eliminar `navigator` del `order` de detección. Sin entrada en localStorage, i18next cae al `fallbackLng: 'es'`.
- **Commit:** `4113573`

### Cómo probar

```bash
cd /home/nico/projects/GestionDeSaludSimple
bash scripts/run.sh dev        # abre http://localhost:5173
```

Checklist:
- [ ] Header con logo + ES/EN + Admin visibles
- [ ] Saludo cálido en español por defecto
- [ ] Click EN → todo cambia a inglés, recarga → persiste
- [ ] Click ES → vuelve a español
- [ ] Click Admin → tooltip "Próximamente" 2.5s
- [ ] Responsive: DevTools mobile → sin scroll horizontal
- [ ] Build OK: `bash scripts/run.sh build`

### Métricas de build

- 56 módulos transformados
- HTML: 0.95 kB (gzip 0.51 kB)
- CSS: 11.56 kB (gzip 3.06 kB)
- JS: ~208 kB (gzip ~66 kB)

---

## v0.0.0-plan — Plan aprobado
**Fecha:** Junio 2026

### Logros
- Stack tecnológico definido (React + Vite + TS + Tailwind + Dexie + Capacitor)
- Arquitectura validada (PWA + APK, 100% local)
- Modelo de datos diseñado (clients + records + meta con versionado)
- Rangos médicos estándar documentados con fuentes
- Mensajes cálidos y profesionales aprobados (ES + EN)
- Decisiones de privacidad y ética definidas (cero telemetría, sin envío automático)
- Buenas prácticas profesionales incorporadas (Zod, normalización, debounce, etc.)
- Plan de implementación en 11 fases definido

### Decisiones cerradas en este hito
- Nombre de la app: **Salud en 7 Parámetros**
- Idioma por defecto: Español (alternativo: Inglés)
- Credenciales admin: `admin` / `adminadmin`
- Persistencia: 100% local con Dexie (IndexedDB)
- Google Sheets: fuera de alcance por ahora

### Archivos de este hito
- `PLAN.md` — fuente de verdad del plan completo
- `MILESTONES.md` — este archivo
- `README.md` — descripción general del proyecto
- `.gitignore` — exclusiones de Git

### Pendiente (al momento de este hito)
- ✅ Iniciar Fase 1: Setup del proyecto + Tailwind + Header + i18n + Home

---

## v0.5.0-fase5 — Recomendaciones para hoy (hidratación basada en peso)

**Fecha:** Junio 2026

### Logros
- Nueva sección "Recomendaciones para hoy" entre "Tu perfil" y los 7 parámetros
- Card de hidratación con cálculo automático en litros/día basado en el peso del cliente
- Línea de metodología al pie: explica que la fórmula es 35 ml × kg (referencia EFSA / IOM) y que es un punto de partida amable
- 7 parámetros quedan **agrupados y juntos** debajo de las recomendaciones, como pidió el usuario
- 67 tests pasando (61 previos + 6 nuevos `// WATER`)

### Decisiones cerradas en esta fase

| Decisión | Valor |
|---|---|
| Fórmula de hidratación | 35 ml × kg de peso corporal |
| Fuentes citadas | EFSA (Autoridad Europea de Seguridad Alimentaria) + IOM (Instituto de Medicina, EE.UU.) |
| Rango de referencia | 30–35 ml/kg (usamos 35 = valor más generoso y conservador del rango) |
| Formato en pantalla | Litros con 1 decimal (`2.5 L/día`) |
| Ubicación | Sección nueva **entre** "Tu perfil" y el banner resumen. Los 7 parámetros quedan agrupados debajo |
| Tono del copy | Español latino neutro (tuteo, sin voseo). Sin culpabilizar, cierra con acción concreta |
| Extensibilidad | Card full-width preparada para sumar más recomendaciones (sueño, pasos, sol) sin tocar arquitectura |

### Cambios técnicos

**Helper nuevo en `src/lib/evaluator.ts`:**
```ts
export function recommendedWaterIntakeLiters(weightKg: number): number {
  const liters = (weightKg * 35) / 1000
  return Math.round(liters * 10) / 10
}
```

**Componente nuevo:** `src/components/results/RecommendationCard.tsx`
- Estilo espejado con `ClientProfileBanner` (mismo border `border-primary-soft`, mismo `bg-primary-soft/20`)
- Header con ícono de gota (`<path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>`)
- Card interna full-width con: valor grande, hint cálido, línea de metodología separada por divisor
- Título del banner = nombre de la recomendación (no label interna redundante)

**Renderizado en `ResultsPage.tsx`** — insertado entre `ClientProfileBanner` y `ResultsSummary`:
```tsx
<ClientProfileBanner client={client} currentWeight={record.weight} />
<RecommendationCard currentWeight={record.weight} />
<div className="mb-6"><ResultsSummary evaluations={evaluations} /></div>
```

**i18n — claves nuevas** en `src/i18n/es.json` y `en.json`:
```json
"recommendation": {
  "title": "Agua recomendada",
  "water": {
    "value": "{{liters}} L/día",
    "hint": "Según tu peso actual ({{weight}} kg), tomar alrededor de {{liters}} litros de agua al día ayuda a tu cuerpo a funcionar bien. Si hace calor o haces más actividad física de lo habitual, suma un poco más. Pequeños sorbos frecuentes funcionan mejor que mucho de golpe.",
    "methodology": "Esta sugerencia se basa en la fórmula de 35 mililitros por cada kilogramo de peso corporal, una referencia usada por la Autoridad Europea de Seguridad Alimentaria (EFSA) y el Instituto de Medicina de los Estados Unidos (IOM). Es un punto de partida amable: si tu actividad física o el clima cambian, puedes ajustar un poco hacia arriba."
  }
}
```

### Tests nuevos (// WATER)

| Test | Esperado |
|---|---|
| 70 kg → 2.5 L/día | Redondeo a 1 decimal |
| 50 kg → 1.8 L/día | Borde bajo |
| 100 kg → 3.5 L/día | Borde alto, valor exacto |
| 45 kg → 1.6 L/día | Peso bajo realista |
| Monotonía creciente | Más peso nunca da menos litros |
| Factor 35 ml/kg | Verificable: `liters ≈ kg × 0.035` |

Marcados como `// WATER` en `src/lib/__tests__/evaluator.test.ts` para que sirvan como punto de calibración futura si se cambia la fórmula.

### Cómo probar

```bash
bash scripts/run.sh test      # 67 tests pasan (61 previos + 6 WATER)
bash scripts/run.sh typecheck # 0 errores
bash scripts/run.sh dev       # http://localhost:5173
```

**Checklist visual:**
- [ ] Llenar datos básicos → métricas → "Ver mis resultados"
- [ ] Verificar que entre "Tu perfil" y los 7 parámetros aparece la nueva sección "Recomendaciones para hoy"
- [ ] Card de hidratación muestra: ícono gota + label "Agua recomendada", valor `2.5 L/día`, mensaje cálido de 3 frases, línea de metodología separada por divisor
- [ ] Cambiar el peso en el formulario y verificar que el valor de litros se recalcula automáticamente
- [ ] Toggle ES/EN → toda la sección se traduce (incluida la línea de metodología)
- [ ] Probar con pesos bordes: 45 kg → 1.6 L, 100 kg → 3.5 L

### Métricas de Fase 5

- 1 helper nuevo + 6 tests nuevos
- 1 componente nuevo + 1 inserción en ResultsPage
- 1 bloque i18n nuevo (ES + EN)
- **67 tests pasando** (era 61)

### Refinamientos de Fase 5 (post-lanzamiento inicial)

Aplicados tras feedback del usuario en la misma fase, sin esperar a Fase 6:

| # | Cambio | Razón |
|---|---|---|
| 1 | Título de la sección: `"Recomendaciones para hoy"` → `"Agua recomendada"` | El nombre del banner debe ser la recomendación misma, no una categoría genérica |
| 2 | Removida label interna redundante (`Agua recomendada`) dentro de la card | El header ya nombra la recomendación; la card arranca directo con el valor |
| 3 | Mensaje de warning: `"Atención suave: revisa este valor"` → `"Te recomiendo revisar este valor"` | "Atención suave" podía sugerir un nivel intermedio entre normal y alerta, generando confusión. El nuevo texto es claro y profesional |
| 4 | Color del texto warning: `text-graphite` → `text-warning-dark` (`#C77F2E`) | Mantiene coherencia cromática con el badge naranja, el borde `border-warning/60` y el accent `before:bg-warning`. Warning ahora tiene su propio tono real, no gris neutro |
| 5 | Tooltip ⓘ en las 6 métricas no-peso (IMC, % grasa, % músculo, calorías, edad biológica, grasa visceral) | Educación sin salir del flujo: cada métrica ahora explica brevemente qué mide |
| 6 | Carácter `↳` → `*` antes de la línea de metodología del peso | Símbolo más universal y conocido en español latino |
| 7 | Nueva tonalidad `warning-dark` en `tailwind.config.js` | Necesaria para el texto de warning con contraste WCAG AA sobre fondo blanco |

### Componentes y archivos nuevos / modificados en los refinamientos

**Nuevos:**
- `src/components/results/MetricInfoTip.tsx` — tooltip accesible vía `<details>/<summary>` nativos, sin estado

**Modificados:**
- `src/components/results/MetricCard.tsx` — color warning, integración con `MetricInfoTip`, `*` en vez de `↳`
- `src/components/results/RecommendationCard.tsx` — sin label interna redundante
- `tailwind.config.js` — color `warning-dark`
- `src/i18n/es.json` + `en.json` — título actualizado, mensaje warning actualizado, 6 tooltips nuevos por métrica, label común `infoLabel`

### Implementación técnica del tooltip

- `<details>` + `<summary>` nativos del HTML → sin `useState`, accesible por teclado y lector de pantalla
- Mismo comportamiento en desktop (click) y mobile (tap)
- Panel flotante con `position: absolute`, anclado al ícono, ancho fijo de 16rem (`w-64`)
- `aria-label` en el summary para lectores de pantalla (clave `results.infoLabel`)
- Color del ícono: `text-graphite/50` en reposo, `text-graphite` en hover

### Pendiente para Fase 6
- Persistencia real con Dexie (IndexedDB) — `src/lib/db.ts`
- Historial del cliente (último registro, comparación con registros previos)
- Reemplazar el modal cálido actual por un guardado real + modal de éxito con descarga efectiva
