# Hitos del Proyecto — Salud en 7 Parámetros

Registro histórico de los hitos importantes del proyecto. Cada hito corresponde a un commit taggeado.

---

## v0.1.0-fase1 — Setup base, i18n y Home
**Fecha:** Junio 2026

### Logros
- Proyecto scaffolded con Vite + React 18 + TypeScript estricto
- Tailwind CSS configurado con paleta de salud personalizada (primary `#4CAF7C`, bone `#FAF8F5`, warning, alert)
- Tipografía Plus Jakarta Sans cargada
- i18n con i18next (ES por defecto + EN), detección con localStorage
- Componente `Header` con logo + toggle ES/EN + botón Admin (placeholder)
- Página `Home` con bienvenida cálida y CTA "Registrar mis datos"
- Componente `Button` reutilizable con 4 variantes y 3 tamaños
- Tipos base (`Client`, `Record`, etc.) definidos
- Script wrapper para WSL (`scripts/run.sh`)
- Build verificado: 56 módulos, ~208 KB JS (66 KB gzip)

### Pendiente
- **Fase 2:** Formulario de datos básicos (con radio buttons de contextura y fecha de nacimiento)
- **Fase 3:** Formulario de 7 métricas

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

### Pendiente
- Iniciar Fase 1: Setup del proyecto + Tailwind + Header + i18n + Home
