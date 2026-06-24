# Hitos del Proyecto — Salud en 7 Parámetros

Registro histórico de los hitos importantes del proyecto. Cada hito corresponde a un commit taggeado.

Convenciones de tags:
- `v0.0.0-*` — hitos de planificación
- `v0.X.0-faseN` — cierre de la fase N

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

### Pendiente

- **Fase 2:** Formulario de datos básicos (nombre, fecha de nacimiento, edad auto, altura, género, contextura de muñeca con radio buttons) + validaciones con Zod
- **Fase 3:** Formulario de 7 métricas
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
