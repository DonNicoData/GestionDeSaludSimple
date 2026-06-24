# Hitos del Proyecto — Salud en 7 Parámetros

Registro histórico de los hitos importantes del proyecto. Cada hito corresponde a un commit taggeado.

Convenciones de tags:
- `v0.0.0-*` — hitos de planificación
- `v0.X.0-faseN` — cierre de la fase N

---

## v0.2.0-fase2 — Formulario de datos básicos (versión pulida)
**Fecha:** Junio 2026
**Estado:** ✅ Completa y validada

### Descripción general

Fase 2 entrega el primer formulario real de la app: la pantalla de datos básicos donde el cliente se identifica. Reemplaza el placeholder "Próximamente" del botón principal de Home e introduce la arquitectura completa de navegación, validación con Zod, componentes de formulario reutilizables, estados visuales, accesibilidad WCAG 2.1 y manejo robusto del nombre en tres componentes (Nombre + Primer apellido + Segundo apellido). La misma arquitectura se reutilizará en Fase 3 (métricas).

### Stack adicional

| Paquete | Versión | Propósito |
|---|---|---|
| zod | 3.23.x | Validación runtime con schemas |

### Archivos nuevos

```
src/
├── components/
│   ├── form/
│   │   ├── BasicDataForm.tsx       # Formulario completo con 8 campos
│   │   ├── FormField.tsx           # Wrapper label + input + error + counter + a11y
│   │   ├── RadioGroup.tsx          # Radio buttons en formato cards
│   │   └── SegmentedControl.tsx    # Selector iOS para género
│   └── shared/
│       └── Input.tsx               # Input con state visual (neutral/error/valid)
├── lib/
│   ├── age.ts                      # Cálculo de edad desde birthDate
│   ├── name.ts                     # combineName, normalizeName, fullNameOf
│   └── validation.ts               # Zod schemas + validador por campo
└── pages/
    └── FormPage.tsx                # Wrapper de página para BasicDataForm
```

### Archivos modificados

| Archivo | Cambio |
|---|---|
| `package.json` | + `zod@^3.23.8` |
| `src/types/index.ts` | `Client.name` → `firstName`, `lastName1`, `lastName2` |
| `src/App.tsx` | State-based router (`home` \| `form` \| `metrics`); alert muestra `fullName` concatenado |
| `src/pages/HomePage.tsx` | Acepta `onRegister` prop y navega al form |
| `src/i18n/es.json` + `en.json` | Sección `basicForm` con 8 campos, 8 errores específicos, banner `summary.*` |

### Funcionalidad visible

**Pantalla inicial (Home):**
- Botón "Registrar mis datos" navega al formulario real (ya no muestra alert).

**Pantalla de formulario — 8 campos:**

| # | Campo | Tipo | Validación |
|---|---|---|---|
| 1 | Tu nombre | Texto (autocomplete given-name) | 2-50 chars, letras/espacios/guiones/apóstrofes |
| 2 | Primer apellido | Texto (autocomplete family-name) | Mismo regex estricto |
| 3 | Segundo apellido | Texto (autocomplete additional-name) | Mismo regex estricto |
| 4 | Fecha de nacimiento | Date picker nativo (max=hoy) | ISO YYYY-MM-DD, no futuro, edad 10-120 |
| 5 | Edad | Display auto-calculado | Derivada de birthDate |
| 6 | Altura | Numérico con sufijo "cm" | Entero 100-230 |
| 7 | Género | Segmented control | 'F' o 'M' |
| 8 | Contextura de muñeca | Radio cards | 'thin' / 'normal' / 'thick' |

Botones: **Volver** (al Home) y **Continuar →** (al submit).

### Estados visuales de input (cumplimiento UX pedido)

| Estado | Borde | Cuándo aparece |
|---|---|---|
| Neutral | Gris (`border-divider`) | Nunca tocado |
| Error | Rojo (`border-alert`) | Inválido tras onBlur o submit |
| Válido | Verde (`border-primary`) | Tocado y ahora válido |

**Comportamiento exacto:**
- Al abrir el form → todos los campos en **gris**
- onBlur con campo vacío → **rojo** + mensaje específico
- Escribir valor válido → **verde**
- Cambiar un valor inválido a válido → **verde**
- Cambiar un valor válido a inválido → **rojo** otra vez
- Click "Continuar" con errores → banner rojo arriba + scroll + focus al primer error + NO navega

### Validaciones (Zod) — mensajes cálidos

| Clave i18n | Mensaje ES |
|---|---|
| `required` | *"Ups, parece que este dato se nos olvidó. ¿Me lo compartes?"* |
| `tooShort` | *"Es muy cortito. ¿Puedes escribirlo completo?"* |
| `tooLong` | *"Es muy largo. ¿Puedes acortarlo un poco?"* |
| `invalidChars` | *"Solo letras, espacios y guiones, por favor."* |
| `needsLetters` | *"Debe contener al menos una letra."* |
| `invalidDate` | *"Mmm, esa fecha no me cuadra. ¿Puedes revisarla?"* |
| `futureDate` | *"La fecha de nacimiento no puede ser en el futuro."* |
| `heightOutOfRange` | *"Esa altura está fuera de lo que esperaba (100–230 cm). ¿La revisamos?"* |

**Banner summary al fallar submit:**
- ES: *"Antes de continuar, revisemos algunos datos. Los marqué en rojo para ti. Cuando estén bien, se pondrán en verde."*
- EN: *"Before we continue, let's review some details. I've marked them in red for you. When they're correct, they'll turn green."*

### Decisiones técnicas cerradas en esta fase

| Decisión | Valor |
|---|---|
| Validación | Zod 3.x, schemas centralizados en `lib/validation.ts` |
| Estructura del nombre | 3 campos separados (firstName, lastName1, lastName2) |
| Display del nombre | Concatenado: `Juan Pérez González` |
| Normalización para matching | Lowercase + sin tildes + trim (Fase 6) |
| Layout de los 3 nombres | 3 filas separadas verticales |
| Terminología | "Primer apellido" / "Segundo apellido" (neutral) |
| Estricto | Los 3 campos de nombre son obligatorios |
| Id de errores | Claves traducibles (no strings), se traducen en FormField |
| Estado del form | useState local + useMemo para edad |
| Edad | Derivada de `birthDate`, no se persiste como input |
| Validación onChange | Solo después de `touched` o primer submit |
| Estados visuales | 3 estados (neutral/error/valid) propagados via prop `state` |
| Validación onBlur | Sí — feedback inmediato al usuario |
| Hidden field | `normalizeName(combined)` para futuro match DB |
| Routing | State-based simple en App.tsx, sin react-router aún |
| Mensajes | Tono cálido, segunda persona, sin culpabilizar |
| Counter visible | Solo en los 3 campos de nombre (X/50) |
| Sanitización al pegar | Colapsa saltos de línea y espacios múltiples |

### Accesibilidad (WCAG 2.1)

- `aria-required="true"` en todos los campos requeridos
- `aria-invalid="true"` en inputs con error
- `aria-live="polite"` en mensajes de error y contador
- `aria-live="assertive"` en el banner summary (interrumpe al usuario)
- `aria-describedby` vincula input con su help y error
- Focus automático al primer campo con error al fallar submit
- Scroll suave al campo con error
- Labels asociados con `htmlFor`

### Cómo probar

```bash
cd /home/nico/projects/GestionDeSaludSimple
bash scripts/run.sh dev   # abre http://localhost:5173
```

**Estados visuales:**
- [ ] Abrir form → 8 campos en gris (neutral)
- [ ] Tocar "Tu nombre" y salir vacío → borde **rojo** + "Te falta tu nombre."
- [ ] Escribir "Juan" → borde **verde**
- [ ] Borrar todo → vuelve a **rojo**
- [ ] El contador "X/50" se actualiza y se pone **rojo** si pasa de 50

**Validaciones de nombre:**
- [ ] Pegar `  María    José  ` → se colapsa a `María José`
- [ ] `Juan123` → error "Solo letras, espacios y guiones"
- [ ] `María-José` (con guión) → válido
- [ ] `--` → error "Debe contener al menos una letra"
- [ ] 51 caracteres → "Es muy largo"

**Submit y banner:**
- [ ] Click "Continuar" con form vacío → banner rojo + scroll + focus al primero
- [ ] Corregir uno por uno → cada corrección se pone verde
- [ ] Cuando todos verdes → banner desaparece + "Continuar" navega
- [ ] Alert muestra: `Datos básicos OK: Juan Pérez González. Próximamente...`

**Concatenación:**
- [ ] El alert final muestra `Juan Pérez González` (un solo espacio entre componentes)

**i18n:**
- [ ] Toggle ES/EN en cualquier campo → labels, helps, placeholders, errores y banner traducen al instante

**Móvil (DevTools):**
- [ ] Campos no se cortan, scroll suave
- [ ] Banner summary legible y no tapa campos

### Métricas de build

- 75 módulos transformados (era 56 en Fase 1)
- HTML: 0.95 kB (gzip 0.51 kB)
- CSS: 15.26 kB (gzip 3.66 kB)
- JS: ~278 kB (gzip ~84 kB) — incremento de ~70 kB por Zod + componentes de form + name utilities

### Pendiente

- **Fase 3:** Formulario de 7 métricas (peso, IMC, % grasa, % músculo, calorías, edad biológica, grasa visceral) con mismas validaciones visuales y cross-checks (BMI vs peso/altura)
- **Fase 4:** Lógica de evaluación con rangos médicos por edad y género
- **Fase 5:** Pantalla de resultados con semáforo + tooltips

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

### Pendiente (cerrado en hito v0.2.0-fase2)

- ✅ **Fase 2:** Formulario de datos básicos (3 nombres + fecha + edad auto + altura + género + contextura con radio cards) + validaciones con Zod + estados visuales + a11y WCAG 2.1 — **completada y pulida**

### Pendiente activo

- **Fase 3:** Formulario de 7 métricas (peso, IMC, % grasa, % músculo, calorías, edad biológica, grasa visceral)
- **Fase 4:** Lógica de evaluación con rangos médicos por edad y género

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
- Iniciar Fase 1: Setup del proyecto + Tailwind + Header + i18n + Home
