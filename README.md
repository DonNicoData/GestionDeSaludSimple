# Salud en 7 Parámetros

Aplicación local (PWA + APK Android + IPA iOS) para que profesionales de la salud registren y den seguimiento a 7 métricas corporales de sus clientes con visualización por semáforo y exportación a Excel/PDF.

> **Estado actual:** v0.12.0-fase12 — PWA desplegada en producción, admin funcional.
> - **App en vivo:** https://DonNicoData.github.io/GestionDeSaludSimple/
> - Ver [`PLAN.md`](./PLAN.md) para la planificación completa y [`MILESTONES.md`](./MILESTONES.md) para el historial de hitos y recetas de modificación.

## Características

- 7 métricas: Peso, IMC, % Grasa, % Masa muscular, Calorías, Edad biológica, Grasa visceral
- Datos básicos: nombre, fecha de nacimiento, edad (auto), altura, género, contextura de muñeca
- Resultados con semáforo (verde / ámbar / coral) y tooltips explicativos
- Sección de evolución cuando los datos básicos coinciden con un cliente existente
- Exportación a Excel (`.xlsx`) y PDF con formato `NombreApellido_Fecha_Hora`
- Panel de administración con login bcrypt + lockout de 3 intentos, CRUD, filtro por nombre y "Ver todos"
- Identidad visual cálida, paleta de verdes y tonos suaves
- Bilingüe: Español (por defecto) / Inglés
- 100% local: IndexedDB (vía Dexie), sin servidor, sin envío automático de datos
- PWA instalable (Chrome/Safari) + APK Android + IPA iOS para sideloading

## Stack

- React 18 + Vite + TypeScript
- Tailwind CSS (paleta salud)
- Dexie.js (IndexedDB)
- SheetJS (Excel) + jsPDF (PDF)
- i18next (ES/EN)
- Capacitor 7 (wrap APK + IPA)
- bcryptjs (hash de password admin)
- vite-plugin-pwa (service worker + manifest)

## Privacidad

Todos los datos se guardan **únicamente en el dispositivo**. Nada se envía a internet. La exportación a Excel/PDF es siempre una acción manual del usuario.

## Desarrollo

### Entorno estándar (Linux/macOS)

```bash
npm install
npm run dev          # desarrollo
npm run build        # build de producción
npm run typecheck    # verificación de tipos
npm run test         # tests unitarios (Vitest)
npm run preview      # preview local
```

### Entorno WSL (este equipo)

Este equipo usa WSL2 con node de Windows. `npm` falla con rutas UNC. Usa el wrapper:

```bash
bash scripts/run.sh install     # instalar dependencias
bash scripts/run.sh dev         # servidor de desarrollo
bash scripts/run.sh build       # build de producción
bash scripts/run.sh typecheck   # verificación de tipos
bash scripts/run.sh test        # tests unitarios (Vitest)
bash scripts/run.sh preview     # preview local
```

El wrapper sincroniza las fuentes a `/mnt/c/Users/User/projects_tmp/salud` (filesystem nativo de Windows) antes de ejecutar vite/esbuild, y rsyncea el `dist/` resultante de vuelta al path WSL nativo para que `python3 -m http.server` sirva el bundle actualizado.

### Setup de `.env.local` (gitignored, solo dev local)

```bash
cp .env.example .env.local
# Editar .env.local y poner VITE_ADMIN_PASSWORD=adminadmin
```

### Setup de GitHub Secret (para que el deploy funcione)

1. https://github.com/DonNicoData/GestionDeSaludSimple/settings/secrets/actions
2. New repository secret: `VITE_ADMIN_PASSWORD` = `adminadmin`
3. Cualquier push a `main` (con cambios en `src/`, `vite.config.ts`, etc.) va a triggerear el workflow `deploy-pwa.yml` que inyecta el secret al build.

## Deploy

- **PWA:** Push a `main` → workflow `deploy-pwa.yml` → rama `gh-pages` → Pages lo sirve en `https://DonNicoData.github.io/GestionDeSaludSimple/`
- **iOS:** Push a `main` (o manual) → workflow `ios-build.yml` → publica `.ipa` en rama `ipa-dist` (sideloading con AltStore/Sideloadly)
- **Android:** Build local con `npm run android:build` → APK debug en `android/app/build/outputs/apk/debug/app-debug.apk`

## Licencia

Privado / Personal.
