# Hitos del Proyecto — Salud en 7 Parámetros

Registro histórico de los hitos importantes del proyecto. Cada hito corresponde a un commit taggeado.

Convenciones de tags:
- `v0.0.0-*` — hitos de planificación
- `v0.X.0-faseN` — cierre de la fase N

---

## 🟢 Punto de Control — Dónde estamos

**Estado al cierre de este hito:** v0.2.0-fase2

**Última fase completada:** ✅ Fase 2 — Formulario de datos básicos + persistencia de borradores

**Próxima fase por hacer:** ⏭️ Fase 4 — Lógica de evaluación con rangos médicos (pinta los resultados con semáforo 🟢🟡🔴)

**Atajos para retomar en otro momento:**

| Si quieres decir... | Di o pide... |
|---|---|
| ¿En qué fase vamos? | *"¿Dónde quedamos?"* o *"estado del proyecto"* |
| Continuar con la siguiente fase | *"Sigamos con la fase N"* |
| Volver a un hito específico | *"Volvamos a `v0.2.0-fase2`"* |
| Ver qué falta | *"¿Qué falta para terminar?"* |

**Tags disponibles:**
- `v0.0.0-plan` — planificación aprobada
- `v0.1.0-fase1` — setup base, i18n, Home
- `v0.2.0-fase2` — formulario datos básicos + persistencia *(ESTAMOS AQUÍ)*
- `v0.3.0-fase3` — formulario de métricas

**Para volver a este punto exacto en cualquier momento:**
```bash
git checkout v0.2.0-fase2
```

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
| **Fase 3** | Formulario de 7 métricas | ✅ **COMPLETADA** (parte de v0.3.0-fase3) |
| **Fase 4** | Lógica de evaluación con rangos médicos por edad/género + Pantalla de Resultados con semáforo 🟢🟡🔴 | ⏭️ **SIGUIENTE** |
| **Fase 5** | Tooltips explicativos en cada métrica + mensajes contextuales | Pendiente |
| **Fase 6** | Persistencia con Dexie (IndexedDB) + detección de duplicados | Pendiente |
| **Fase 7** | Exportación a Excel (.xlsx) y PDF | Pendiente |
| **Fase 8** | Panel admin con login + CRUD + filtro por nombre | Pendiente |
| **Fase 9** | PWA instalable + service worker | Pendiente |
| **Fase 10** | APK Android con Capacitor | Pendiente |
| **Fase 11** | Pulido visual y de tono | Pendiente |

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
