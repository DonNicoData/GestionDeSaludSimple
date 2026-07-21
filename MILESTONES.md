# Hitos del Proyecto — Salud en 7 Parámetros

Registro histórico de los hitos importantes del proyecto. Cada hito corresponde a un commit taggeado.

Convenciones de tags:
- `v0.0.0-*` — hitos de planificación
- `v0.X.0-faseN` — cierre de la fase N

---

## 🟢 Punto de Control — Dónde estamos

**Estado al cierre de este hito:** v0.11.0-fase11 (iOS scaffold + CI build verde + PWA deploy workflow + APK v0.11.0 actualizado)

**Última fase completada:** ✅ Fase 11 — iOS scaffold + GitHub Actions workflow publicando `.ipa` en rama `ipa-dist` (sin firmar, corre en simulator o vía AltStore/Sideloadly) + workflow de deploy PWA a GitHub Pages + APK Android rebuildeado y publicado vía jsDelivr — tag `v0.11.0-fase11`

**Próxima fase por hacer:** ⏭️ Fase 12 — Reemplazar íconos iOS default + splash iOS personalizado (mismo enfoque que Android: hoja verde con `scripts/generate-ios-icons.mjs`)

---

### 📌 Checkpoint — Sesión del 2026-07-21 (cierre real de Fase 11: deploy PWA + validación cross-device)

**Sesión motivada por:** El usuario probó el link `.ipa` en su celular iOS y no funcionó. Análisis: el `.ipa` se generó con `-sdk iphonesimulator` + `CODE_SIGNING_ALLOWED=NO`, lo que produce un binario solo para simulator (x86_64/arm64-simulator), no instalable en iPhone real. iOS rechaza IPAs sin firmar y de simulator SDK.

#### Trabajo hecho en esta sesión

1. **Verificación de causa raíz del link iOS roto**:
   - HTTP 200 en `https://raw.githubusercontent.com/DonNicoData/GestionDeSaludSimple/ipa-dist/dist-ipa/app.ipa` (2.07 MB, archivo válido)
   - El link descarga OK, el archivo es un IPA válido (contiene `Payload/App.app/`, `AppIcon60x60@2x.png`, `Info.plist`)
   - **Pero el contenido no se puede instalar en iPhone real**:
     - SDK = `iphonesimulator` (en `.github/workflows/ios-build.yml:67`)
     - Code signing = `CODE_SIGN_IDENTITY=""` + `CODE_SIGNING_ALLOWED=NO` (líneas 73-75)
   - **Conclusión**: El IPA solo sirve para Xcode Simulator (necesita Mac) o para sideloading con re-firma (Sideloadly/AltStore, requiere PC/Mac)

2. **Deploy permanente de la PWA vía GitHub Pages** (resolver problema del subdominio aleatorio de serveo):
   - Workflow nuevo: `.github/workflows/deploy-pwa.yml`
   - Estrategia: `peaceiris/actions-gh-pages@v4` (no requiere Pages habilitado de antemano)
   - Trigger: push a main con cambios en `src/`, `public/`, `package.json`, configs
   - Build: `npm ci && npm run build` → publica rama `gh-pages` con el contenido de `dist/`
   - 2 runs OK (35s y 31s)
   - **Pendiente del usuario**: 1 click en Settings → Pages → Branch: `gh-pages` para activar `https://DonNicoData.github.io/GestionDeSaludSimple/`

3. **Rebuild del APK Android a v0.11.0** (incluye polish de Fase 10: íconos hoja verde + 2da línea preview):
   - Build local: `./scripts/run.sh build` → `cap sync android` (vía Windows path por UNC issue) → `./gradlew assembleDebug`
   - APK actualizado: `android/app/build/outputs/apk/debug/app-debug.apk`
   - MD5 nuevo: `72fa63f34a4210d3bb36e83c96b1606e` (4.96 MB)
   - Pusheado a rama `apk-dist` (en `.apk-dist/app-debug.apk`)
   - **Workaround para cache de GitHub raw**: el viejo MD5 `ec6fc4d0...` se sigue sirviendo en `raw.githubusercontent.com/.../apk-dist/app-debug.apk` por cache (max-age=300)
   - **URL alternativa sin cache**: `https://cdn.jsdelivr.net/gh/DonNicoData/GestionDeSaludSimple@apk-dist/.apk-dist/app-debug.apk` (jsDelivr siempre devuelve la versión actual del ref)

4. **Entorno de validación inmediata activado** (testing HOY):
   - HTTP server local: `python3 -m http.server 5173 --bind 0.0.0.0` (PID 2020) sirviendo `dist/`
   - Tunnel serveo: `ssh -R 80:localhost:5173 nokey@serveo.net` (PID 2047)
   - **URL pública serveo**: `https://8443dc6b6c91fba1-64-43-50-35.serveousercontent.com`
   - Verificado: HTTP 200, manifest PWA correcto, iconos servidos

#### Cómo validar (receta para retomar)

**Laptop**:
```
https://8443dc6b6c91fba1-64-43-50-35.serveousercontent.com
```
o local: `http://localhost:5173/`

**Android (2 opciones)**:
- APK: descargar `https://cdn.jsdelivr.net/gh/DonNicoData/GestionDeSaludSimple@apk-dist/.apk-dist/app-debug.apk` → instalar (permitir origen desconocido) → abrir "Salud 7"
- PWA: abrir URL serveo en Chrome mobile → menú ⋮ → "Agregar a pantalla de inicio"

**iOS (sin Mac, sin pagar)**:
- PWA: abrir URL serveo en **Safari** → botón compartir ↑ → "Añadir a pantalla de inicio" → aparece como app con icono propio
- Sideloadly (alternativa con PC Windows): descargar Sideloadly → conectar iPhone USB → arrastrar `.ipa` viejo de `ipa-dist` → re-firma con Apple ID → ⚠️ caduca en 7 días

**Para dejarlo 100% permanente**: Settings → Pages → Branch: `gh-pages` → Save → URL fija `https://DonNicoData.github.io/GestionDeSaludSimple/`

#### Decisiones de la sesión

| Decisión | Razón |
|---|---|
| `peaceiris/actions-gh-pages@v4` en vez de `actions/deploy-pages@v4` | El primero no requiere Pages habilitado de antemano; el segundo falla con `HttpError: Not Found` si Pages no está activo |
| jsDelivr como CDN alternativo para el APK | El cache de `raw.githubusercontent.com` (max-age=300) sigue sirviendo el APK viejo; jsDelivr siempre sirve la versión actual del ref |
| Rama `apk-dist/.apk-dist/app-debug.apk` (con punto al inicio) | El punto evita que GitHub Pages (cuando se active) interprete el archivo como página; sigue siendo descargable vía raw y jsDelivr |
| No commitear cambios en `android/` generados por `cap sync` | Esos cambios son ruido (line endings, files con diff=0); solo importa el `app-debug.apk` final |

#### Commits nuevos (todos pusheados)

```
ab204bf ci(pwa): usar peaceiris/actions-gh-pages (no requiere Pages habilitado)
7ddad7e ci(pwa): deploy a GitHub Pages en push a main
342549f build(android): APK debug v0.11.0 actualizado (md5 72fa63f3)
```

#### Servicios activos (a matar cuando se decida cerrar el entorno de testing)

- `python3 -m http.server 5173 --bind 0.0.0.0` (PID 2020) — sirve `dist/`
- `ssh -R 80:localhost:5173 nokey@serveo.net` (PID 2047) — tunnel HTTPS público
- URL pública: `https://8443dc6b6c91fba1-64-43-50-35.serveousercontent.com`
- ⚠️ Subdominio aleatorio: si se matan y se relanzan, cambia la URL. **Para URL fija: activar GitHub Pages**

#### Artefactos publicados al cierre de sesión

| Asset | URL | MD5 | Tamaño |
|---|---|---|---|
| APK Android (v0.11.0) | `https://cdn.jsdelivr.net/gh/DonNicoData/GestionDeSaludSimple@apk-dist/.apk-dist/app-debug.apk` | `72fa63f34a4210d3bb36e83c96b1606e` | 4.96 MB |
| PWA bundle | `https://8443dc6b6c91fba1-64-43-50-35.serveousercontent.com` | (cambia en cada build) | — |
| IPA iOS (viejo v0.10, sin polish Fase 10) | `https://raw.githubusercontent.com/DonNicoData/GestionDeSaludSimple/ipa-dist/dist-ipa/app.ipa` | `d893ac04d3591a2c874dd6e32c535548` | 2.07 MB |

#### Contexto WSL/Python para retomar

- En WSL, **no hay node** (`/usr/bin/node` no existe). Solo está en `/mnt/c/Program Files/nodejs/node.exe`. Por eso `scripts/run.sh` invoca node.exe de Windows desde WSL, con sync previo.
- El bundle siempre queda en `/mnt/c/Users/User/projects_tmp/salud/dist/` después de `./scripts/run.sh build`. Hay que rsyncearlo a WSL antes de servirlo localmente con python.
- Para Android: `source scripts/android-env.sh` antes de cualquier `gradlew`. Herramientas en `$HOME/jdk-21/` y `$HOME/android-sdk/`.
- Para `cap sync android` desde WSL: falla por UNC paths. Hay que correrlo desde `/mnt/c/Users/User/projects_tmp/salud/` con `node.exe` de Windows, después rsync el resultado a WSL.

#### Pendiente para Fase 12

1. **Generar íconos iOS hoja verde** (`AppIcon-512@2x.png` de 1024x1024): mismo enfoque que Android, script `scripts/generate-ios-icons.mjs` que lee `public/icons/leaf-source.svg` y renderiza a 1024×1024 con `sharp`.
2. **Generar splash iOS personalizado** (3 archivos `splash-2732x2732{,-1,-2}.png`): fondo `#4CAF7C` + hoja centrada.
3. **Validar con nuevo workflow iOS** (push dispara build → verificar íconos en el nuevo IPA).
4. (Opcional, requiere Apple Developer Account USD 99/año): signing + notarization para App Store.

---

### 📌 Checkpoint — Sesión del 2026-07-19 (cierre Fase 10 polish + Fase 11 iOS scaffold)

**Trabajo hecho en esta sesión (no commiteado aún como milestone al tag, ver bloque inferior):**

#### Fase 10 — Polish
1. **Reemplazo de íconos Android (hoja verde)**:
   - `android/app/src/main/res/values/ic_launcher_background.xml`: fondo `#FFFFFF` → `#4CAF7C` (matchea PWA)
   - 15 PNGs nuevos generados: `ic_launcher.png`, `ic_launcher_round.png`, `ic_launcher_foreground.png` × 5 densidades (mdpi/hdpi/xhdpi/xxhdpi/xxxhdpi)
   - Script nuevo: `scripts/generate-android-icons.mjs` (idempotente, rerunnable)
   - Foreground SVG fuente: `scripts/leaf-foreground.svg` (solo la hoja, sin rect verde, fondo transparente)
   - Genera desde `public/icons/leaf-source.svg` (master)
2. **Preview de mediciones con 2da línea** (`src/admin/pages/AdminClientDetailPage.tsx:273-277`):
   - Antes: 1 línea con `weight · IMC · bodyFatPct`
   - Ahora: 2 líneas — la 1ra igual + 2da con `muscleMassPct% músculo · calories kcal · bioAge años · visceralFat visceral`

#### Fase 11 — iOS scaffold + CI
1. **Dependencia nueva**: `@capacitor/ios@^7.6.8` (en `dependencies`)
2. **Config iOS**: `capacitor.config.ts` ahora tiene bloque `ios: { contentInset: 'automatic', backgroundColor: '#FAF8F5' }`
3. **Scripts nuevos en `package.json`**: `cap:sync:ios`, `cap:open:ios`, `ios:build`
4. **Carpeta `ios/`** generada con `npx cap add ios` (committeada al repo — Capacitor docs lo recomienda):
   - `ios/App/App.xcodeproj/`, `ios/App/App.xcworkspace/`, `ios/App/Podfile`, `ios/App/App/AppDelegate.swift`, `ios/App/App/Assets.xcassets/` (con slots de íconos y splash vacíos)
   - `ios/App/App/public/` bundle web syncronizado vía `npx cap sync ios`
5. **GitHub Actions workflow** (`.github/workflows/ios-build.yml`):
   - Trigger: push a main (con cambios relevantes) o manual (`workflow_dispatch`)
   - Runner: `macos-latest`, Node 21, Ruby 3.2, CocoaPods
   - Steps: install deps → `npm run build` → `npx cap sync ios` → `pod install` → `xcodebuild -sdk iphonesimulator` (sin firma) → package `.ipa` → upload artifact + publicar a rama `ipa-dist`
   - Permisos: `contents: write` (para pushear a `ipa-dist`)
   - Tiempo: ~3 min con caches; primer build ~10-15 min
6. **Publicación del `.ipa`**:
   - URL raw: `https://raw.githubusercontent.com/DonNicoData/GestionDeSaludSimple/ipa-dist/dist-ipa/app.ipa`
   - Tamaño: ~2 MB
   - **Sin firmar**: solo corre en Xcode Simulator (necesita Mac) o vía AltStore (gratis, refresh cada 7 días desde PC/Mac con AltServer)
   - MD5 cambia en cada build

#### Bugfixes descubiertos y resueltos en la sesión

1. **Bug de `npm ci` en CI**: lockfile no estaba sincronizado con `@capacitor/ios`. Resuelto committeando `package-lock.json` regenerado.
2. **Bug de `pod install` path**: `Podfile` está en `ios/App/Podfile` (no `ios/Podfile`). Resuelto con `working-directory: ios/App`.
3. **Bug de permissions para push**: GITHUB_TOKEN default es read-only. Resuelto con `permissions: contents: write` a nivel de workflow.
4. **Bug de checkout de rama nueva**: `git checkout -B ipa-dist origin/main` fallaba en shallow clone. Resuelto con `git checkout ipa-dist 2>/dev/null || git checkout -b ipa-dist`.
5. **Bug de `dist/` desactualizado en WSL** (descubierto durante validación interna del cambio de preview):
   - `./scripts/run.sh build` sincroniza `src/` WSL → Windows path, ejecuta Vite allá, deja el bundle nuevo en `/mnt/c/Users/User/projects_tmp/salud/dist/`
   - Pero el `python3 -m http.server` local sirve `/home/nico/.../dist/` (WSL), que quedaba con el bundle viejo
   - Solución aplicada: `rsync -a --delete /mnt/c/Users/User/projects_tmp/salud/dist/ /home/nico/projects/GestionDeSaludSimple/dist/` después del build
   - **Recomendación a futuro**: agregar este rsync inverso al wrapper `scripts/run.sh build` para que no haya que acordarse manualmente. Issue abierta.

#### Servicios de prueba levantados en la sesión (a matar cuando se termine)

- `python3 -m http.server 5173 --bind 0.0.0.0` (PID 2269) — sirve `dist/` para testing local
- `ssh -R 80:localhost:5173 nokey@serveo.net` (PID 3063) — tunnel HTTPS público
  - URL pública: `https://f8bb3c107a0db82b-64-43-50-9.serveousercontent.com`
  - **Probado y funcionando** en iPad y Android del product owner
  - ⚠️ Subdominio aleatorio: si se mata y se relanza cambia la URL

#### Artefactos publicados

| Asset | URL | MD5 (al cierre de sesión) |
|---|---|---|
| APK Android | `https://raw.githubusercontent.com/DonNicoData/GestionDeSaludSimple/apk-dist/app-debug.apk` | `ec6fc4d04e2476dd3c1f825220a12065` (4.96 MB) |
| IPA iOS | `https://raw.githubusercontent.com/DonNicoData/GestionDeSaludSimple/ipa-dist/dist-ipa/app.ipa` | `d893ac04d3591a2c874dd6e32c535548` (2.07 MB) |

Ambos artefactos se rebuildean automáticamente en cada push a main (APK requiere build manual local; IPA via GitHub Actions).

#### Commits nuevos (todos pusheados)

```
55bca48 fix(ci): permissions contents:write + checkout robusto en rama nueva
74f1ccc ci(ios): publicar .ipa en rama ipa-dist (descarga sin auth)
4f7554d fix(ci): pod install corre desde ios/App (donde está el Podfile)
1c7a949 chore(deps): regenerar package-lock.json con @capacitor/ios
f0a3b9b feat(fase11): iOS scaffold + GitHub Actions workflow para .ipa
dfce083 feat(fase10): hoja verde en launcher Android + 2da línea en preview de mediciones
```

#### Pendiente real para Fase 12+

1. **Reemplazar íconos iOS default** (slots ya preparados en `ios/App/App/Assets.xcassets/AppIcon.appiconset/`). Mismo enfoque que Android: PNGs hoja verde en todas las densidades que pide iOS (20/29/40/58/60/76/87/120/152/167/180/1024).
2. **Splash iOS personalizado** (slots en `ios/App/App/Assets.xcassets/Splash.imageset/`).
3. **Signing + notarization** para App Store (solo con Apple Developer Account):
   - Agregar secrets al repo: `APPLE_TEAM_ID`, `APPLE_CERT_P12_BASE64`, `APPLE_CERT_PASSWORD`, `APPLE_PROVISIONING_PROFILE_BASE64`, `APPLE_APP_STORE_CONNECT_API_KEY`
   - Modificar el workflow para usar `xcodebuild ... -allowProvisioningUpdates` + `xcrun altool` para subir a App Store Connect
4. **Fix del rsync inverso**: agregar al script `scripts/run.sh build` el paso `rsync -a --delete /mnt/c/Users/User/projects_tmp/salud/dist/ dist/` para que `dist/` de WSL siempre quede sincronizado. Issue menor pero molesta.
5. **Cleanup**: matar `python3 -m http.server` (PID 2269) y `ssh serveo.net` (PID 3063) cuando se decida cerrar el entorno de testing.
6. **Commit del MILESTONES** + tag `v0.11.0-fase11` (este commit).
7. **Deploy permanente de la PWA** (Cloudflare Pages, surge, GitHub Pages) para evitar el subdominio aleatorio del tunnel cada vez que se relanza.

#### Próxima sesión — orden sugerido

1. Re-leer este checkpoint
2. Decidir si se quiere cerrar Fase 11 con tag o seguir a Fase 12 directamente
3. Si se va a iOS: agregar íconos + splash iOS primero (es lo más visible)
4. Si se va a Web: deploy permanente de la PWA
5. El bugfix del rsync inverso da igual cuándo se haga, es interno

#### Contexto WSL/Python para retomar

- En WSL, **no hay node** (`/usr/bin/node` no existe). Solo está en `/mnt/c/Program Files/nodejs/node.exe`. Por eso `scripts/run.sh` invoca node.exe de Windows desde WSL, con sync previo.
- El bundle siempre queda en `/mnt/c/Users/User/projects_tmp/salud/dist/` después de `./scripts/run.sh build`. Hay que rsyncearlo a WSL antes de servirlo localmente con python.
- GitHub Actions funciona bien con ~3 min de build para iOS después de los primeros cachés.

---

### 📌 Checkpoint — Julio 2026 (post-fase8 polish: colores de admin + bug de cascade)

**Sesión del 2026-07-17 (cerrada):**

Sesión de refinamiento visual y bugfix estructural. No cierra una fase, deja v0.8.0 más pulido.

**Cambios funcionales (5 archivos):**

1. **`Button.tsx`** — Nuevo variant `destructive` que encapsula `bg-alert-dark text-white hover:bg-alert-darker shadow-soft hover:shadow-card`. Patrón simétrico al `primary` (verde). Reemplaza todos los usos previos con `className="!bg-alert-dark..."`.

2. **`tailwind.config.js`** — Paleta suma:
   - `alert-dark: '#DC2626'` (Tailwind red-600) — vive red, contraste 5.7:1 con blanco (AA)
   - `alert-darker: '#B91C1C'` (Tailwind red-700) — hover, contraste 5.5:1 (AA)

3. **`AdminClientDetailPage.tsx`** (2 botones) — "Editar" y "Editar datos" usan `variant` default (primary, bg-info override). "Eliminar" (por medición) y "Eliminar cliente" (bottom) usan `variant="destructive"`. **Cero `!important` en código de feature.**

4. **`DeleteClientDialog.tsx` + `ConfirmDialog.tsx`** — Submit del modal con contraseña y el variant condicional del ConfirmDialog usan `variant="destructive"`/`"primary"` directamente.

5. **`AdminStatsHeader.tsx`** — Bugfix: el header de KPIs (clientes / mediciones / última fecha) mostraba **skeleton con `animate-pulse` para siempre** en el admin list. Causa: `AdminListPage` pasaba `stats={null}` y el `useEffect` lo interpretaba como "ya tengo stats" (`null !== undefined`), nunca fetcheaba. Fix: distinguir `null` de `undefined` en el effect.

**Tag pusheado:**
- `v0.8.1-admin-buttons` (en `609c73d`)
- `pre-fase9-2026-07-17` (mismo commit, para rollback target)

**Métricas:**
- Tests: 173/173 verde (sin cambios, bugfix sin tests añadidos por ser visual)
- Typecheck: 0 errores
- Build: OK
- Archivos modificados: 7 (1 shared, 1 config, 5 admin)

**Decisiones de arquitectura de la sesión:**

| Decisión | Razón |
|---|---|
| `variant="destructive"` en Button | Patrón idiomático React. Encapsula `!important` a nivel del componente, no en features. |
| CSS generado SIN `!important` (`.bg-alert-dark` puro) | Los variants de Button emiten las clases en el mismo string, sin cascade竞争. |
| Brighter red (#DC2626) en vez de #B91C1C | Referencia visual del usuario pidió "vivo y saturado". #DC2626 matchea el rojo típico de admin templates (Bootstrap danger-like). |
| NO agregamos `bg-alert-darker` para hover al palette previo | Cada color sigue con patrón `-dark`/-darker` simétrico a `info`/`info-dark`. |

**Bug histórico investigado (no es código):**

**"Los clientes desaparecen al reabrir cloudflared"** — NO es bug del código, es comportamiento esperado:
- IndexedDB se aísla por origen (scheme+host+port, [MDN Same-origin policy](https://developer.mozilla.org/en-US/docs/Web/Security/Same-origin_policy#cross-origin_data_storage_access))
- Cloudflare **Quick Tunnel** genera un subdominio aleatorio nuevo (`*.trycloudflare.com`) cada vez que se reinicia `cloudflared`
- Cada subdominio = origen distinto = IndexedDB vacío para el navegador
- Los datos **siguen ahí** (en el origen viejo que ya no visitás), no se borraron

**Workarounds documentados en MILESTONES.md (sección Cloudflare Tunnel):**
1. Misma WiFi + IP local: gratis, sin tunnel. Origen estable.
2. Cloudflare Pages / Vercel / Netlify: gratis, deploy. URL fija.
3. Cloudflare Named Tunnel: gratis pero requiere dominio propio.
4. ngrok paid plan: ~$8/mes, subdominio fijo.

Recomendación: hacer deploy a Cloudflare Pages antes de seguir con Fase 9 (PWA), para evitar este problema en dev prolongado.

**Pendiente para próximas sesiones:**
- Validar visualmente el admin en el celular después del refactor de botones
- Decidir si arranca Fase 9 (PWA) o hay más polish pendiente
- Considerar `safelist` en `tailwind.config.js` para blindar contra HMR flaky de Tailwind JIT al agregar colores nuevos al palette
- **Re-evaluar la Zona Peligrosa**: ¿se reactiva? ¿se reemplaza por export-then-wipe? ¿se difiere permanentemente?
- Resolver el problema de origen (deploy o alternativa) antes de extender el dev por tunnel

**Para retomar:**
```bash
./scripts/run.sh sync    # sincroniza repo a Windows
./scripts/run.sh dev     # levanta el server en localhost:5173
./scripts/run.sh test    # corre los 173 tests
```

---

### 📌 Checkpoint — Julio 2026 (Fase 8 cerrada + 3 refinamientos)

**Sesión del 2026-07-08 (cerrada):**

Fase 8 completa (panel de admin) + 3 refinamientos posteriores en la misma sesión:

1. **`f0d28f4` — `fix(admin)`** — Agregar contraseña al borrar un cliente (doble barrera: tipeo del nombre + reingreso de contraseña).
2. **`ac57d83` — `refactor(admin)`** — Simplificar `DeleteClientDialog` a barrera única (solo contraseña). El tipeo del nombre agregaba fricción sin valor real de seguridad.
3. **commit nuevo — `refactor(admin)`** — **Eliminar la Zona Peligrosa (wipe total)**, diferida para una fase futura. Se removieron `AdminDangerZonePage`, `WipeAllDialog` y todas las claves i18n `admin.wipe.*` + `admin.actions.dangerZone`. `clearAllData` y `getAdminStats` siguen en `repo.ts` por si se retoman.

**Tag pusheado:**
- `v0.8.0-fase8` (en `16c75cd`, cierre de Fase 8 — NO se mueve con los refinamientos)
- `pre-fase8-2026-07-08` (en `262e939`, fin de v0.7.3)

**Métricas (al cierre de la sesión):**
- Tests: 146 → 173 verde (+27 nuevos en Fase 8: 14 auth + 6 undo + 7 admin/repo)
- Typecheck: 0 errores
- Build: OK, 1.165 MB main + **51.05 kB admin** (bajó -4.5 kB tras quitar la danger zone) — lazy-loaded, no se descarga hasta click en "Admin"
- Archivos nuevos: 13 (5 admin pages, 4 componentes, 3 auth, 1 hook) → tras refactor: 11 (-2 archivos borrados: `AdminDangerZonePage`, `WipeAllDialog`)
- Archivos modificados: 8 → 11 (+ refinamientos: AdminApp, DeleteClientDialog, i18n)

**Decisiones clave de la sesión completa:**
- Login con bcryptjs (10 rounds) + comparación contra `VITE_ADMIN_PASSWORD` (sin hashear en disco). Cumple `PLAN §8`.
- Sesión admin en `sessionStorage` (muere al cerrar pestaña) — `PLAN §8`.
- Lockout tras 3 intentos fallidos (30s) en `sessionStorage`.
- Búsqueda con `useDeferredValue` (React 18) en lugar de `setTimeout` — typing fluido.
- Eliminar medición = undo 5s, sin modal previo (NN/g).
- **Eliminar cliente = contraseña única** (tras refinamiento) + undo 5s. Más simple que tipeo + contraseña, igualmente seguro.
- ~~Wipe total = triple barrera~~ — **diferido** (refinamiento #3). `clearAllData` queda en repo.ts.
- Code splitting del admin vía `React.lazy` (cumple `PLAN §9`).
- Notas por medición activadas (campo `notes?: string` que ya existía en el modelo desde Fase 2).
- Snapshots para undo vía `getClientSnapshot()` + `restoreClientSnapshot()` (transacción Dexie atómica).

**Escalera de gravedad final del admin:**

| Acción | Barrera | Undo |
|---|---|---|
| Borrar 1 medición | — | Sí (5s) |
| Borrar 1 cliente | Contraseña de admin | Sí (5s) |
| ~~Borrar todo (wipe)~~ | ~~DIFERIDO~~ | ~~No~~ |

**Patrones de UX aplicados (de la investigación pre-fase):**
- **NN/g Confirmation Dialogs** → ofrecemos undo en lugar de confirmaciones genéricas.
- **NN/g User Control & Freedom** → "emergency exit" siempre visible.
- **Mailchimp pattern** → re-autenticación (contraseña) para acciones destructivas.
- **Notion / Airtable** → delete individual con undo en toast.
- **Kent C. Dodds — State colocation** → provider global solo en admin.

**Pendiente para próximas sesiones:**
- Validar visualmente el admin en el celular.
- Decidir si Fase 9 (PWA) arranca o si hay más polish pendiente.
- **Re-evaluar la Zona Peligrosa**: ¿se reactiva? ¿se reemplaza por export-then-wipe? ¿se difiere permanentemente?
- Considerar roles/permisos si en el futuro se comparte el dispositivo.

**Para retomar:**
```bash
./scripts/run.sh sync    # sincroniza repo a Windows
./scripts/run.sh dev     # levanta el server en localhost:5173
./scripts/run.sh test    # corre los 173 tests
```

---

**Atajos para retomar en otro momento:**

---

### 📌 Checkpoint — Julio 2026 (sesión de polish UI cerrada)

**Sesión del 2026-07-07 (cerrada):**

5 commits de polish UI posteriores a `v0.7.2-fase7-scope-fix`:

1. **`07e861b` feat(wrist-help)**: cada botón del segmented de contextura de muñeca muestra su propia ilustración SVG (label → icon → description). 3 SVG en `public/images/`.
2. **`6dea027` feat(wrist-help)`**: intro explicativo arriba del segmented ("Envuelve tu muñeca con el pulgar y el dedo medio de la otra mano. Elige según lo que veas."), sin tooltip ⓘ, sin help de abajo.
3. **`eb09270` fix(numeric-input)`**: aceptar coma como decimal (teclado iOS en LatAm muestra `,`). Fix en dos capas: `Input.tsx` normaliza al tipear (feedback visual), `validation.ts` como defensa en profundidad.
4. **`aa287db` fix(home)`**: saludo único con pluralización correcta (`_one`/`_other`). Eliminado el doble saludo redundante. Tono pasa de pregunta a afirmación informativa.
5. **`262e939` style(button)`**: variant `outline` con `bg-white` por defecto y `hover:shadow-soft` (afecta 9 lugares).

**Tags pusheados:**
- `pre-polish-2026-07-07` (en `a1a89f0`, punto de partida)
- `v0.7.3-ui-polish` (en `262e939`, cierre de sesión)

**Métricas:**
- Tests: 136 → 146 verde (10 nuevos en `src/lib/__tests__/validation.test.ts`)
- Typecheck: 0 errores
- Build: OK
- Archivos modificados: 8 (1 doc, 2 i18n, 4 código, 1 test nuevo)

**Decisiones clave de la sesión:**
- Wrist contexture: ilustración inline > tooltip (más autoexplicativo).
- Numeric input: belt-and-suspenders (UI + validation), no solo UI.
- Home: 1 saludo > 2 apilados. Tono afirmativo > pregunta redundante con botones.
- Button outline: cambio global del variant (consistencia en los 9 usos).

**Pendiente para próxima sesión (no tocado):**
- Validar visualmente todo en el celular (`./scripts/run.sh dev` + Cloudflare Tunnel).
- Confirmar que el teclado iOS LatAm ahora acepta `,` correctamente.
- Decidir si Fase 8 (panel admin) arranca o si hay más polish pendiente.

**Para retomar:**
```bash
./scripts/run.sh sync    # sincroniza repo a Windows
./scripts/run.sh dev     # levanta el server en localhost:5173
./scripts/run.sh test    # corre los 136 tests
```

**Si algo se rompe durante la validación visual:** el rollback está documentado más abajo (Cómo hacer rollback).

---

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
- `v0.6.2-fase6-i18n` — neutralización de copy a español latino neutro
- `v0.7.0-fase7` — exportación a Excel (.xlsx) y PDF con semáforo por celda
- `v0.7.1-fase7-refinement` — selector de alcance + CTA de historial gated por sesión
- `v0.7.2-fase7-scope-fix` — fix race condition del scope filter + HistoryPage read-only
- `v0.7.3-ui-polish` — sesión de polish UI: wrist help, numeric input, home greeting, button outline
- `pre-fase8-2026-07-08` — checkpoint del estado antes de la Fase 8 (rollback target)
- `v0.8.0-fase8` — panel de admin completo
- `v0.8.1-admin-buttons` — polish de botones destructivos + bugfix de stats header
- `v0.9.0-fase9` — PWA: manifest + service worker + íconos
- `v0.10.0-fase10` — APK Android con Capacitor (scaffold + sync de assets) *(ESTAMOS AQUÍ)*

### Cómo hacer rollback

El proyecto taggea cada hito, así que el rollback es siempre via `git checkout` del tag anterior:

```bash
# Si algo se rompe después de este commit, volver a v0.7.0-fase7:
git fetch --tags
git checkout v0.7.0-fase7          # modo detached, solo lectura

# O volver a main y descartar el último commit (DESTRUCTIVO en local):
git checkout main
git reset --hard 231c83d            # el hash anterior al commit actual

# O crear un commit de reversión sin perder historial:
git checkout main
git revert 94186af                  # crea un commit nuevo que deshace los cambios
git push origin main
```

Si el push a `main` aún no se hizo, basta con `git reset --soft HEAD~1` (conserva cambios staged) o `git reset --hard HEAD~1` (limpia el working tree).

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
- ⚠️ **Cada subdominio de `trycloudflare.com` también es un origen distinto.** Si reabrís cloudflared, el navegador genera un subdominio aleatorio nuevo (`abc.trycloudflare.com` → `xyz.trycloudflare.com`). Al ser orígenes diferentes según la [Same-Origin Policy](https://developer.mozilla.org/en-US/docs/Web/Security/Same-origin_policy#cross-origin_data_storage_access), cada uno tiene su propio almacén. **Los datos no se borraron: están en el origen viejo que ya no visitás.** Para que sobrevivan, hace falta un origen estable (deploy en Cloudflare Pages/Vercel/Netlify, ngrok paid con subdominio fijo, o Cloudflare Named Tunnel con dominio propio).
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
- **Último commit:** refinamiento #3 (commit nuevo que elimina la Zona Peligrosa)
- **Tag más reciente:** `v0.8.0-fase8` (Fase 8 cerrada el 2026-07-08; NO se mueve con refinamientos)
- **Snapshot pre-sesión:** `pre-fase8-2026-07-08` (en `262e939`, fin de v0.7.3)
- **Tests:** 173 verde (sin cambios en refinamientos)
- **Typecheck:** 0 errores
- **Build de producción:** OK (`dist/` generado, ~1.165 MB JS principal / gzip 374 kB + **51.05 kB** chunk admin lazy-loaded / gzip 17.5 kB — bajó -4.5 kB tras quitar la danger zone)
- **Dev server:** http://localhost:5173 (puerto configurable en `vite.config.ts`)
- **Diferido para fase futura:** Zona Peligrosa (wipe total). `clearAllData` y `getAdminStats` siguen en `repo.ts` listos para retomarse.

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

## v0.7.0-fase7 — Exportación a Excel y PDF
**Fecha:** Julio 2026

### Logros
- **Export a Excel (.xlsx)** con `xlsx` (SheetJS) — multi-hoja: hoja "Cliente" con datos básicos + 1 hoja por medición con las 7 métricas en filas (Métrica | Valor | Unidad | Rango ideal | Estado).
- **Export a PDF A4** con `jsPDF` + `jspdf-autotable` — encabezado con datos del cliente, secciones por medición con tabla coloreada por semáforo en la celda "Estado" (verde / ámbar / coral).
- **Helper `useExportHistory()`** que arma labels i18n y serializa el payload. Usado desde el modal de guardado y desde la página de historial (DRY).
- **`serializeForExport()`** pura (sin i18n ni Dexie) — recibe cliente + records + labels y devuelve un payload testeable.
- **Toast efímero** (componente + hook `useToast`) para feedback de éxito/error del export.
- **SaveModal** ahora tiene 4 fases: `asking` (confirmar guardar) → `saving` (spinner) → `error` (reintento) → `saved` (ofrece descarga). El botón "Volver al inicio" del estado `saved` cierra el modal y navega al home con la confirmación de guardado exitosa.
- **HistoryPage** ahora tiene un panel "Descargar historial completo" con dos botones: Excel y PDF (solo aparece si hay registros).
- **Filename** formato `NombreApellido_YYYY-MM-DD_HHmm.xlsx` (sin acentos, sin espacios). Ej: `MariaGarciaLopez_2026-07-01_1430.xlsx`.
- **i18n ES/EN** completo: headers de columna, títulos, mensajes de toast, label del botón "Descargar historial completo".
- 16 tests nuevos (16/16 verde) — total 111 tests pasando, 0 errores de tipo.

### Decisiones de diseño
- **Por defecto descarga el historial completo** (no solo la medición recién guardada). Decisión del usuario: separar la decisión del modal de guardado (momento de cierre) y la página de historial (momento de pensar en el progreso). Si en el futuro se quiere ofrecer "solo esta medición", basta con pasar `[currentRecord]` al helper — el export no se entera.
- **Excel multi-hoja** en vez de una hoja plana con todo. Razón: una medición por hoja evita que el archivo se "ensucie" con 20 columnas ilegibles cuando hay varias mediciones; la hoja "Cliente" sirve de índice legible.
- **PDF con colores en celda de estado** (no solo texto). Refuerza el semáforo visualmente para、印刷 fácil de leer.
- **Toast efímero** en vez de alert modal. Razón: el alert modal interrumpiría el flujo post-guardado, que ya es un momento tenso (decisión, navegación). El toast desaparece solo y refuerza la sensación de "listo, ya está".

### Archivos nuevos
- `src/lib/export/serialize.ts` — payload puro.
- `src/lib/export/filename.ts` — generador de nombres de archivo.
- `src/lib/export/excel.ts` — wrapper xlsx.
- `src/lib/export/pdf.ts` — wrapper jspdf.
- `src/lib/export/index.ts` — barrel.
- `src/hooks/useExportHistory.ts` — hook con labels i18n.
- `src/components/shared/Toast.tsx` — provider + `useToast`.
- `src/lib/export/__tests__/serialize.test.ts` — 9 tests.
- `src/lib/export/__tests__/filename.test.ts` — 7 tests.

### Archivos modificados
- `src/pages/ResultsPage.tsx` — SaveModal reescrito a 4 fases, integración con `useToast` y `useExportHistory`.
- `src/pages/HistoryPage.tsx` — panel "Descargar historial completo" con botones Excel/PDF.
- `src/App.tsx` — mount de `<ToastProvider>`.
- `src/i18n/es.json` y `src/i18n/en.json` — keys `results.export.*`, `results.modal.exportError`, `history.downloadHistory*`, `toast.*`.
- `vite.config.ts` — `server.allowedHosts: true` (necesario para que Vite no bloquee el host del túnel cloudflared en pruebas en celular).
- `package.json` — deps `xlsx`, `jspdf`, `jspdf-autotable`; devDep `@types/xlsx`.

### Métricas build
- 485 módulos transformados
- JS: 1.15 MB (gzip 370 kB) — bundle grande por xlsx + jspdf, aceptable para una app local; se puede code-splitear más adelante con dynamic import si molesta.
- 111 tests pasando (16 nuevos para export).

---

## Refinamiento post-Fase 7 — Alcance del export + "Ver mi historial" por sesión
**Fecha:** Julio 2026

### Contexto
Dos detalles del flujo post-guardado merecían una segunda vuelta:

1. **"Ver mi historial" en el Home aparecía siempre que había datos históricos en Dexie**, incluso en un refresh en frío (F5 con la pestaña recargada). Esto era ruido: el usuario aterrizaba en el Home sin contexto y veía un CTA a algo que ya había visto o que no necesitaba ahora.
2. **El modal post-guardado descargaba siempre el historial completo**, sin dar opción de bajar "solo esta medición". Un usuario que acaba de guardar una sola medición probablemente quiere bajar esa, no las 5 anteriores.

### Cambios

**A. Flag de sesión para "Ver mi historial" en el Home**
- Nuevo helper `src/lib/sessionFlag.ts` con `readSessionSavedFlag()` / `writeSessionSavedFlag()`, respaldado en `sessionStorage` (clave `gds:has-saved-in-session`).
- `App.tsx` ahora condiciona el paso de `onViewHistory` a `HomePage` por la bandera de sesión: el CTA **solo aparece si el usuario guardó al menos un record en esta pestaña**.
- Sobrevive a F5 (misma pestaña), muere al cerrar la pestaña — semántica nativa de sessionStorage.
- El state también se hidrata al mount, así que un refresh casual mantiene el flag.

**B. Selector de alcance en el SaveModal post-guardado**
- Cuando hay más de 1 medición del cliente, aparece un fieldset con dos radios: "Esta medición" / "Tu historial completo".
- Si solo hay 1 medición, el selector se oculta (la decisión es trivial: implícitamente "esta medición").
- Default: `'current'` (la recién guardada). El usuario puede cambiar con un click.
- Nuevo helper puro `pickRecordsForScope()` en `src/lib/export/scope.ts` (testeable sin DOM ni Dexie).

**C. Link a "Ver tus mediciones anteriores" en el SaveModal**
- Nuevo link secundario debajo de los botones de formato, navega a `HistoryPage`. Reemplaza la aparición incondicional en el Home: el usuario ahora descubre el historial en el momento post-guardado, cuando es relevante.

### Decisiones de diseño
- **Flag de sesión en sessionStorage, no localStorage**: queremos que "ya guardé" sea un evento del flujo actual, no un estado permanente del usuario. Si abre la app mañana en frío, sigue siendo una primera visita real.
- **Selector oculto cuando hay 1 sola medición**: ofrecer "actual vs historial" cuando ambas opciones son la misma cosa es ruido. La complejidad aparece solo donde hay decisión real.
- **Default a `'current'` en lugar de `'history'`**: el usuario acaba de guardar; lo más probable es que quiera descargar eso. Los usuarios que quieren el historial completo van a hacer un click extra, los demás no.
- **Link a historial en el modal, no en el Home**: la sesión actual ya garantiza que el usuario tuvo un "acto de guardado" reciente; ese es el momento natural para ofrecer ver más. En el Home ese momento no es seguro.

### Archivos nuevos
- `src/lib/export/scope.ts` — `pickRecordsForScope()` helper puro.
- `src/lib/export/__tests__/scope.test.ts` — 6 tests (history devuelve todos, current filtra por id, id inexistente → [], no muta, records vacío).
- `src/lib/sessionFlag.ts` — `readSessionSavedFlag()` / `writeSessionSavedFlag()` SSR-safe.
- `src/lib/__tests__/sessionFlag.test.ts` — 7 tests (default false, "1" → true, otros valores → false, getItem throwing → false, setItem throwing no rompe, idempotencia).

### Archivos modificados
- `src/App.tsx` — state `hasSavedInSession` con lazy initializer desde `readSessionSavedFlag()`; write en `handleResultsSaved`; condición de `onViewHistory` para HomePage cambiada de `activeClientId != null` a `hasSavedInSession`; `handleViewHistory` se pasa ahora también a `ResultsPage`.
- `src/pages/ResultsPage.tsx` — captura `savedRecordId` (id del record recién guardado), `savedRecordsCount` (para decidir si mostrar el selector), y `exportScope`; `handleExport` filtra con `pickRecordsForScope()` antes de pasar a `runExport`; `SaveModal` recibe nuevos props (`savedRecordsCount`, `exportScope`, `onChangeExportScope`, `onViewHistory`) y renderiza el fieldset con radios + el link a historial.
- `src/i18n/es.json` y `src/i18n/en.json` — 4 claves nuevas en `results.modal`: `exportScopeQuestion`, `exportScopeCurrent`, `exportScopeHistory`, `viewHistoryLink`.

---

## Refinamiento post-v0.7.1 — Fix scope filter + HistoryPage = solo vista
**Fecha:** Julio 2026

### Contexto
Después de mergear v0.7.1, dos issues aparecieron en uso real:

1. **Bug funcional del scope filter**: seleccionar "Esta medición" en el save modal y descargar podía bajar el historial completo. El usuario veía el radio marcado correctamente antes de descargar, lo que descartaba un bug de UI. El culpable más probable: race entre el re-render de React (triggered por `setExportScope`) y el `handleExport` ejecutado en el mismo tick por un click rápido — el closure capturaba el state anterior.
2. **Redundancia**: el save modal tenía un link "Ver tus mediciones anteriores" que llevaba a `HistoryPage`, y `HistoryPage` a su vez tenía sus propios botones "Descargar Excel/PDF". Tres caminos distintos para descargar = ruido y confusión.

### Cambios

**A. Fix del scope filter (closure-resilience)**
- En `ResultsPage`, `exportScope` ahora se mantiene en una `useRef` sincronizada con `setExportScope` en el mismo tick (vía un wrapper `updateExportScope` que actualiza ambos atómicamente).
- `handleExport` lee siempre desde `exportScopeRef.current`, no desde el state. Esto garantiza el último valor aunque el re-render no se haya procesado.
- Nuevo test de integración `src/lib/export/__tests__/exportScopeRef.test.ts` (7 tests) que simula el patrón React state + ref + sync atómico y verifica la resiliencia bajo cambios rápidos. Incluye un escenario explícito del bug reportado.

**B. HistoryPage = solo lectura**
- Quitado el panel "Descargar historial completo" (Excel/PDF).
- Quitados de `HistoryPage`: `useExportHistory`, `useToast`, `handleDownload`, state `exporting`, y sus imports asociados.
- La descarga vive exclusivamente en el save modal post-guardado. Un solo lugar, una decisión.
- El link "Ver tus mediciones anteriores" del save modal sigue navegando a `HistoryPage`, pero ahora lleva a una vista pura — el usuario entiende que "ver" no es lo mismo que "descargar".

**C. i18n cleanup**
- Quitadas 3 claves huérfanas en `es.json` y `en.json`: `history.downloadHistory`, `history.downloadHistoryExcel`, `history.downloadHistoryPdf`. Solo las usaba el panel eliminado.

### Decisiones de diseño
- **Fix con useRef + sync atómico, no useEffect**: `useEffect` corre después del render, dejando una ventana de 1 frame donde el ref queda desactualizado. Sincronizar la ref en el mismo handler del state update elimina esa ventana.
- **HistoryPage sin download**: violaba "one decision point per action". El usuario tiene ahora exactamente un lugar donde descargar (modal post-guardado), con la elección explícita de scope (esta vs completa) en el mismo componente.
- **Test "behavioral simulation" en lugar de testing-library real**: el proyecto no tiene `@testing-library/react` ni `jsdom`. En lugar de agregar deps, el test simula el patrón React (state + ref + sync atómico) en JS plano. Captura la clase de bug (sincronización state↔ref) sin necesitar React real.

### Archivos nuevos
- `src/lib/export/__tests__/exportScopeRef.test.ts` — 7 tests del patrón state↔ref con sync atómico, incluyendo el escenario exacto del bug reportado.

### Archivos modificados
- `src/pages/ResultsPage.tsx` — `useRef` para `exportScope`; wrapper `updateExportScope` que sincroniza state y ref en el mismo tick; `handleExport` lee desde `exportScopeRef.current`.
- `src/pages/HistoryPage.tsx` — removido panel de descarga + imports (`useExportHistory`, `useToast`) + state (`exporting`) + `handleDownload`.
- `src/i18n/es.json`, `src/i18n/en.json` — removidas 3 claves `history.downloadHistory*`.

---

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

---

## v0.7.3-ui-polish — Sesión de polish UI (2026-07-07)

**Fecha:** Julio 2026
**Estado:** ✅ Completa
**Tag:** `v0.7.3-ui-polish`
**Snapshot previo:** `pre-polish-2026-07-07` (en `a1a89f0`)

### Descripción general

Bundle de 5 ajustes menores de UX, copy e i18n aplicados después de cerrar Fase 7. No agregan features nuevas: refinan la experiencia existente para que se sienta más pulida, más clara y más consistente con el resto del proyecto.

### Commits incluidos

| Hash | Tipo | Resumen |
|---|---|---|
| `07e861b` | feat(wrist-help) | Ilustraciones SVG inline en cada botón del segmented |
| `6dea027` | feat(wrist-help) | Intro explicativo arriba del segmented (sin help ni tooltip) |
| `eb09270` | fix(numeric-input) | Aceptar coma como decimal (i18n LatAm en iOS) |
| `aa287db` | fix(home) | Saludo único con pluralización correcta |
| `262e939` | style(button) | `outline` variant con fondo blanco + shadow en hover |

### Cambios por feature

#### A. Wrist contexture help (commits `07e861b`, `6dea027`)

Mejora la UX del campo "Tu contextura de muñeca" en el formulario de datos básicos.

**Antes**: 3 radios en cards separadas con texto de ayuda `help` debajo ("Mide tu muñeca justo encima del hueso...") que no coincidía con el método real.

**Después**: 
- 3 botones conectados en un `SegmentedControl` con label arriba, ilustración SVG en el medio y descripción corta abajo.
- 3 SVG en `public/images/wrist-{thin,normal,thick}.svg` (~1.5 KB cada uno, total ~4 KB).
- Intro plano arriba: *"Envuelve tu muñeca con el pulgar y el dedo medio de la otra mano. Elige según lo que veas."*
- Sin tooltip ⓘ, sin help de abajo.

**Decisiones**:
- Ilustración inline > tooltip: el usuario ve el gesto sin abrir nada.
- 1 solo texto introductorio: el segmented ya muestra los 3 casos visualmente.
- Cambio de `RadioGroup` (cards separadas) a `SegmentedControl` (conectado): unifica con el patrón de género.

#### B. Numeric input coma/punto (commit `eb09270`)

Arregla el bug donde usuarios de iPhone en LatAm tipeaban `22,5` en el IMC y la app rechazaba con *"Mmm, ese número no me cuadra"*.

**Causa raíz**: `Input.tsx` aceptaba ambos separadores en el regex, pero `validation.ts` usaba `Number(s)` que solo entiende punto.

**Fix en dos capas (belt-and-suspenders)**:
- **Capa 1 (UI)**: `Input.tsx` normaliza `,` → `.` en el `onChange` numérico. El usuario ve `.` inmediatamente al tipear.
- **Capa 2 (validation)**: `requiredNumberField` también normaliza antes de `Number()`. Defensa en profundidad para drafts viejos y rutas que bypasseen Input.

**Cobertura**: 8 campos numéricos (heightCm + 7 métricas).

**Tests**: 10 nuevos en `src/lib/__tests__/validation.test.ts` cubriendo `.`, `,`, `,5`, `22,`, mezcla inválida, rango, no numérico, y 4 campos distintos (bmi, heightCm, weight, bodyFatPct).

#### C. Home greeting unificado (commit `aa287db`)

Arregla tres problemas en el saludo del Home:

1. **Error de gramática**: `"hace 1 días"` (siempre plural). Solucionado con pluralización de i18next (`_one`/`_other`).
2. **Doble saludo redundante**: la página apilaba un saludo genérico + uno con nombre, ambos preguntando "¿quieres registrar?". Ahora se renderiza UNO solo, con el nombre integrado.
3. **Tono**: pasa de pregunta a afirmación informativa. Los botones hacen el CTA, el saludo es contexto.

**Estructura nueva de i18n (ES y EN)**:
- `welcomeFirst` (sin cambios)
- `welcomeReturningNamed_one` / `_other` / `Today`
- `welcomeReturningAnon_one` / `_other` / `Today`

Eliminadas: `welcomeReturning`, `welcomeReturningToday`, `welcomeNamed`.

#### D. Button outline style (commit `262e939`)

Mejora la variant `outline` del componente `Button`:

**Antes**: `bg-transparent` (botón invisible sobre fondo claro), `hover:bg-bone` (cream sutil).

**Después**: `bg-white` por defecto, `hover:bg-bone hover:border-primary-soft hover:shadow-soft`.

**Cobertura**: 9 lugares usan `variant="outline"`:
- HomePage: "Empezar de nuevo"
- BasicDataForm / MetricsForm / HistoryPage: botones "Volver"
- ResultsPage: "Volver al inicio", "Ver mis mediciones anteriores"
- DiscardConfirmDialog: "Quedarme aquí"
- BasicDataForm match banner: "No, soy alguien nuevo"

**Decisión**: cambio global del variant (no nuevo variant ni override) porque todos los usos se benefician del mismo fix.

### Archivos nuevos

- `public/images/wrist-thin.svg`
- `public/images/wrist-normal.svg`
- `public/images/wrist-thick.svg`
- `src/lib/__tests__/validation.test.ts`

### Archivos modificados

- `src/components/shared/Input.tsx` — normalización `,` → `.` en onChange numérico
- `src/components/shared/Button.tsx` — `outline` variant con `bg-white` + `hover:shadow-soft`
- `src/components/form/SegmentedControl.tsx` — soporte para `icon` (ReactNode) opcional por opción
- `src/components/form/BasicDataForm.tsx` — wrist options con `icon` y `description`, sin `help`
- `src/pages/HomePage.tsx` — saludo unificado con pluralización
- `src/lib/validation.ts` — defensa en profundidad en `requiredNumberField`
- `src/i18n/es.json` — nuevas claves (wrist intro, descriptions, welcome returning)
- `src/i18n/en.json` — idem en inglés
- `MILESTONES.md` — este documento

### Métricas finales

- **Tests:** 146/146 verde (10 archivos, +10 nuevos)
- **Typecheck:** 0 errores
- **Build:** OK
- **Bundle gzipped:** ~371 KB (igual a v0.7.2; las nuevas imágenes se sirven como assets estáticos fuera del bundle JS)
- **Commits de la sesión:** 5
- **Archivos tocados:** 10

### Decisiones de diseño

1. **Ilustraciones inline vs tooltip**: el tooltip requería click extra y mostraba info que el segmented ya tenía. Inline es más directo y autoexplicativo.
2. **Belt-and-suspenders en numeric input**: cubrir tanto la UI como la validation cuesta 6 líneas más y cierra categorías distintas de falla.
3. **Pluralización con `_one`/`_other`**: i18next soporta pluralización nativa por idioma. Más correcto que un `if days === 1` en código.
4. **Variant global para button outline**: los 9 usos tienen el mismo problema, así que un solo cambio los arregla a todos.

### Español neutro

Todo el copy nuevo sigue la convención del proyecto: **español neutro LatAm, sin voseo**. Ejemplos verificados:
- *"Envuelve tu muñeca..."* (no "Envolvé")
- *"Elige según lo que veas"* (no "Elegí")
- *"Hola otra vez, María. Tu última visita fue hace 1 día."* (no "Tu última visita fue hace 1 días.")

### Próximos pasos sugeridos

- **Validar visualmente** todo el polish en el celular (Cloudflare Tunnel como se documenta en este archivo).
- **Confirmar el fix de numeric input** tipeando `22,5` en un campo numérico desde iPhone.
- **Fase 8**: panel de admin (login + CRUD + filtro + ver todos los clientes).

---

## v0.8.0-fase8 — Panel de administración completo (login + CRUD + danger zone + notas)

**Fecha:** Julio 2026
**Estado:** ✅ Completa
**Tag de rollback:** `pre-fase8-2026-07-08` (commit `262e939`, fin de v0.7.3)

### Descripción general

La Fase 8 entrega el panel de administración completo que el `PLAN §7.7 + §10` reservaba para esta etapa. Es la última fase puramente de la app cliente: a partir de acá, las siguientes (9, 10) son empaquetado (PWA, APK).

**Funcionalidades visibles:**

1. **Acceso**: el botón "Admin" del header (antes mostraba un "Próximamente") ahora abre el panel lazy-loaded. Al cerrar, vuelve al home de la app.
2. **Login con PIN**: el admin tipea la contraseña configurada en `.env` (`VITE_ADMIN_PASSWORD=adminadmin` por defecto). 3 intentos fallidos → bloqueo de 30s con countdown visible.
3. **Lista de clientes**:
   - Header con 3 KPIs: total de clientes, total de mediciones, fecha de la última.
   - Búsqueda con `useDeferredValue` (typing fluido sin debounce manual). Tolera acentos y mayúsculas.
   - Cards con: iniciales, nombre completo, edad/altura, N° de mediciones, fecha de última visita.
   - Estado vacío cálido (PLAN §7.7) cuando no hay clientes.
4. **Detalle de cliente**:
   - Datos personales + mediciones en cards separadas.
   - Cada medición: peso, IMC, % grasa + nota si la tiene. Acciones: Editar / Eliminar.
   - Eliminar medición = **undo 5s en toast** (sin modal previo, patrón Notion/Airtable).
   - Editar datos del cliente o una medición: reusa los mismos Field components que `BasicDataForm` y `MetricsForm` (no se duplica código de forms).
   - Eliminar cliente = modal con **tipeo del nombre completo** (patrón Mailchimp, NN/g) + undo 5s post-confirmación. Cascade transaccional.
5. **Zona peligrosa**:
   - Acción única: borrar todos los datos.
   - **Triple barrera**: tipeo literal "BORRAR TODO" + reingreso de contraseña + botón destructive. Sin undo.
   - Honestidad sobre el alcance: muestra cuántos clientes y mediciones se van a borrar antes de pedir la confirmación.

### Stack adicional

| Paquete | Versión | Propósito |
|---|---|---|
| bcryptjs | 3.0.x | Hash y verificación de contraseña de admin (10 rounds) |
| @types/bcryptjs | 2.4.x (dev) | Tipos de bcryptjs |
| happy-dom | 20.x (dev) | DOM en tests para hooks que tocan sessionStorage |
| @testing-library/react | 16.x (dev) | `renderHook` y `act` para tests de hooks |

### Autenticación (capa `src/admin/auth/`)

**Tres módulos independientes con tests:**

- `hash.ts` — `hashPassword(plain)` y `verifyPassword(plain, expectedHash)`. Compara con `bcrypt.compare` (constant-time sobre el derivado, mitigación básica de timing attacks).
- `session.ts` — `startAdminSession()`, `endAdminSession()`, `isAdminAuthenticated()`. Marca opaca (timestamp) en `sessionStorage`. Memoria como fallback si sessionStorage no está disponible.
- `lockout.ts` — `recordFailedAttempt()`, `readLockoutState()`, `isLocked()`, `getRemainingLockoutMs()`, `clearLockout()`. Estado en `sessionStorage`. Default: 3 intentos → 30s de bloqueo.

Decisión de seguridad: la contraseña se lee desde `VITE_ADMIN_PASSWORD` y se hashea en runtime. **Nunca persistimos el hash en disco** porque el bundle del cliente ya la contiene (es un filtro básico, no seguridad de servidor — `PLAN §8`).

### Extensión de la capa de datos (`src/db/repo.ts`)

Funciones nuevas, todas con tests en `src/db/__tests__/repo.test.ts`:

| Función | Propósito | Tests |
|---|---|---|
| `updateClient(id, input)` | Edita datos básicos, recalcula `normalizedName` y `age` | 2 |
| `updateRecord(id, input)` | Edita una medición, preserva id/clientId/date | 1 |
| `deleteRecord(id)` | Elimina una sola medición (sin tocar otras) | 1 |
| `getClientSnapshot(id)` | Devuelve `{ client, records[] }` para usar en undo | 1 |
| `restoreClientSnapshot(snap)` | Restaura cliente + records (transacción Dexie atómica, nuevos IDs) | 1 |
| `getAdminStats()` | Cuenta clientes y records + fecha del último, en 1 query paralela | 1 |
| `deleteClient` | Ya existía; ahora cubierto por undo con snapshot | (existente) |

### Hooks nuevos (`src/admin/hooks/`)

- **`useAdminAuth`** — encapsula login, lockout, logout, sesión. Devuelve `authenticated`, `submitting`, `errorKey`, `lockedSecondsRemaining`, `login(password)`, `logout()`.
- **`useClients`** — carga inicial de clientes + N° de records + última medición (paralelo). Devuelve `items` (filtrados) y `allItems`. Búsqueda vía `useDeferredValue`.
- **`useUndoableDelete<T>`** — patrón genérico de "soft delete en UI + commit diferido" con undo. **No se usa directamente en esta fase** (en su lugar usamos el `UndoToastProvider` global), pero queda como bloque reutilizable. Tiene 6 tests que cubren: pending, commit, undo, cancel, segundo trigger sobreescribe, timer cleanup.

### Componentes nuevos (`src/admin/components/`)

- **`UndoToastProvider`** — provider global del toast con acción "Deshacer" + countdown visible. Solo 1 toast a la vez: si se dispara uno nuevo, el anterior se commitea.
- **`AdminStatsHeader`** — 3 KPIs en una sola card. Variante "empty" para estado sin clientes.
- **`ClientSearchBar`** — input con icono de búsqueda, sin debounce (el padre usa `useDeferredValue`).
- **`ClientCard`** — card de cliente en la lista.
- **`EditClientModal`** — modal de edición que reusa `FormField` + `Input` + `GenderField` + `SegmentedControl`. Validación con `basicDataSchema` directo.
- **`EditRecordModal`** — modal de edición con los 7 campos + notas. Validación con `metricsSchema`.
- **`DeleteClientDialog`** — modal con tipeo del nombre (Mailchimp pattern). El botón se habilita solo cuando `typed === fullNameOf(client)`.
- **`WipeAllDialog`** — triple barrera. Token de tipeo localizado (ES: "BORRAR TODO", EN: "DELETE ALL") + campo de contraseña + botón destructive.
- **`ConfirmDialog`** — modal genérico reutilizable (para logout del admin).

### Páginas (`src/admin/pages/`)

- **`AdminLoginPage`** — formulario de password. Maneja estado de error y countdown de lockout. Botón "Volver a la app" para cancelar.
- **`AdminListPage`** — header de stats + search bar + lista (o empty state). Botón "Ver todos" en estado filtrado-sin-resultados.
- **`AdminClientDetailPage`** — datos + mediciones + acciones. Implementa el soft delete + undo. `useUndoToast()` para disparar el toast.
- **`AdminDangerZonePage`** — solo una acción hoy (borrar todo). La página existe como lugar extensible.

### Activación del campo `notes` (Fase 8 también)

El campo `notes?: string` existía en el modelo `Record` desde `PLAN §4` pero nunca se usaba. La Fase 8 lo activa:

- `src/lib/validation.ts` — `metricsSchema.notes` agregado (opcional, max 500).
- `src/components/form/MetricsForm.tsx` — textarea opcional con contador. Persiste en `sessionStorage` (no en draft de IndexedDB — son efímeras y complementarias, no métricas críticas).
- `src/pages/ResultsPage.tsx` — card con la nota en la pantalla de resultados (entre `RecommendationCard` y el grid de métricas).
- `src/pages/HistoryPage.tsx` — la nota ya se mostraba en el detalle expandido (se agregó en esta fase).
- `src/admin/components/EditRecordModal.tsx` — textarea de notas con contador.

### Code splitting (cumpliendo `PLAN §9`)

En `src/App.tsx`:

```ts
const AdminApp = lazy(() =>
  import('@/admin/AdminApp').then((m) => ({ default: m.AdminApp })),
)
```

Resultado del build: el bundle principal queda en ~1.16 MB (igual que antes; bcryptjs NO se incluye en él) y aparece un chunk separado `AdminApp-*.js` de **55.6 kB (18.3 kB gzip)** que **solo se descarga cuando el usuario hace click en "Admin"**. El TTI del flujo cliente no se ve afectado.

### Decisiones técnicas cerradas

| Decisión | Valor | Justificación |
|---|---|---|
| Hash | bcryptjs 10 rounds | Filtro básico, no seguridad real (PLAN §8) |
| Storage del hash | Variable de entorno + cálculo en runtime | Nunca persistido en disco; bundle del cliente ya contiene la password |
| Storage de sesión | sessionStorage | Muere al cerrar pestaña (compartido en casa) |
| Lockout | 3 intentos → 30s | Suficiente fricción sin castigar al usuario honesto |
| Búsqueda | useDeferredValue (no setTimeout) | Cancelación automática, sin cleanup, sin 300ms de latencia |
| Pattern undo | Soft delete UI + commit diferido | Cumple NN/g "ofrecer undo > pedir confirmación" |
| Pattern delete cliente | Tipeo del nombre + undo | Cumple NN/g Mailchimp pattern para acciones destructivas |
| Wipe total | Triple barrera sin undo | Honestidad sobre la gravedad; no recuperable |
| Code splitting | React.lazy del módulo admin | Cumple PLAN §9 "admin lazy-loaded" |
| Bundle admin | 55.6 kB / 18.3 kB gzip | Acceptable; se descarga 1 vez y se cachea |
| Notas | sessionStorage (no IndexedDB) | Complemento efímero, no métrica crítica |
| Hard delete cliente | Transaccional en repo (`db.transaction('rw', ...)`) | Atomicidad garantizada por Dexie |

### Patrones de UX aplicados (de la investigación pre-fase)

| Fuente | Aplicación |
|---|---|
| **NN/g — Confirmation Dialogs** (Jakob Nielsen, 2018) | "Ofrecer undo es mejor que pedir confirmación genérica" → undo 5s en lugar de modal previo para delete de record |
| **NN/g — User Control & Freedom** (H3) | "Emergency exit" siempre visible → botón "Volver a la app" en login, "Cerrar sesión" en header del admin |
| **Mailchimp** | Tipeo del nombre como barrera para acciones destructivas (deleteClient, wipeAll) |
| **Notion / Airtable** | Delete individual = undo en toast, sin modal previo |
| **Google Drive** | Confirmación específica con cantidad ("3 archivos") antes de borrar |
| **Kent C. Dodds — App State Management** | State del undo vive en un provider global solo para el admin; el resto del state se levanta localmente |

### Limitaciones conocidas

- **Single-user**: el admin no tiene roles. Si en el futuro se comparte el dispositivo, habría que agregar roles. Hoy es por diseño (PLAN §1: "menos de 20 clientes, proyecto personal").
- **Sin audit log**: las acciones destructivas no se loguean. Para un proyecto de hobby no hace falta, pero un consultorio profesional real lo querría.
- **Sin export masivo del admin**: "Exportar todo" quedó fuera de esta fase para mantener el scope acotado. Se puede agregar en Fase 11 (pulido) reusando el motor de Fase 7.
- **Sin paginación**: si se pasa de 20 clientes (PLAN §1), la lista se hace lenta. No es un problema hoy; se aborda con `useDeferredValue` + virtualización si hace falta.
- **El undo de un cliente con muchos records es lento**: `restoreClientSnapshot` re-inserta uno por uno en una transacción. Para 50 records es ~200ms; aceptable.

### Archivos entregados

```
src/admin/                                    # Lazy-loaded, ~56 kB
├── AdminApp.tsx                              # Shell con routing interno
├── auth/
│   ├── hash.ts                               # bcryptjs wrapper
│   ├── lockout.ts                            # 3 intentos → 30s
│   ├── session.ts                            # sessionStorage
│   └── __tests__/                            # 14 tests
├── components/
│   ├── AdminStatsHeader.tsx                  # 3 KPIs
│   ├── ClientCard.tsx                        # Card de cliente
│   ├── ClientSearchBar.tsx                   # Input de búsqueda
│   ├── ConfirmDialog.tsx                     # Modal genérico (logout)
│   ├── DeleteClientDialog.tsx                # Tipeo del nombre (Mailchimp)
│   ├── EditClientModal.tsx                   # Reusa BasicDataForm fields
│   ├── EditRecordModal.tsx                   # Reusa MetricsForm fields
│   ├── UndoToast.tsx                         # Provider de undo 5s
│   ├── WipeAllDialog.tsx                     # Triple barrera
│   └── format.ts                             # Helpers de fecha
├── hooks/
│   ├── useAdminAuth.ts                       # Login + lockout
│   ├── useClients.ts                         # Lista + búsqueda
│   ├── useUndoableDelete.ts                  # Soft delete + commit diferido
│   └── __tests__/useUndoableDelete.test.ts   # 6 tests
└── pages/
    ├── AdminClientDetailPage.tsx             # Datos + mediciones + acciones
    ├── AdminDangerZonePage.tsx               # Wipe all
    ├── AdminListPage.tsx                     # Búsqueda + lista
    └── AdminLoginPage.tsx                    # Password + lockout

(modificados)
src/App.tsx                                   # +page 'admin' + lazy + Suspense
src/components/layout/Header.tsx              # Botón Admin navega a /admin
src/components/shared/Input.tsx               # +type='password'
src/components/form/MetricsForm.tsx           # +textarea notas
src/db/repo.ts                                # +updateClient, +updateRecord, +deleteRecord, +getClientSnapshot, +restoreClientSnapshot, +getAdminStats
src/db/__tests__/repo.test.ts                 # +7 tests admin
src/i18n/{es,en}.json                         # +sección admin.* + notes.*
src/lib/validation.ts                         # +notes en metricsSchema, +MetricsFormState exportado
src/pages/ResultsPage.tsx                     # +card de nota
.env.example                                  # NUEVO (template)
.gitignore                                    # .env.local ya estaba

(nuevos infraestructura)
vitest.config.ts                              # +environmentMatchGlobs para happy-dom
package.json                                  # +bcryptjs, +@types/bcryptjs, +happy-dom, +@testing-library/react
```

### Decisiones pendientes para Fase 9+

- **PWA**: service worker, manifest, installable, offline. Ver `PLAN §10`.
- **APK con Capacitor**: wrap del build web en APK Android compartible por WhatsApp. Ver `PLAN §10`.

---

## Refinamientos post-Fase 8 (commits `f0d28f4`, `ac57d83`, y nuevo)

**Fecha:** Julio 2026
**Estado:** ✅ Aplicado sobre el tag `v0.8.0-fase8`

Estos son 3 refinamientos detectados en la misma sesión de validación de la Fase 8. **El tag NO se mueve** — son iteraciones del mismo milestone, mismo patrón que `v0.6.1-fase6-hotfix` y `v0.7.1-fase7-refinement`.

### 1. `f0d28f4` — `fix(admin)`: pedir contraseña para eliminar un cliente

**Síntoma reportado (feedback del product owner):** *"Quiero que al momento de eliminar un cliente en el admin y me pida alguna contraseña. Sea con la misma contraseña del admin."*

**Antes:** el `DeleteClientDialog` solo pedía tipear el nombre completo del cliente (patrón Mailchimp). Sin verificación de identidad.

**Después:** doble barrera — tipeo del nombre (ya estaba) + re-ingreso de la contraseña de admin (nuevo).

**Implementación:**
- `DeleteClientDialog.tsx`: estado `password` + `passwordError` + `handleConfirm` async que valida con `getAdminPasswordFromEnv()` + `hashPassword()` + `verifyPassword()`.
- Botón "Eliminar definitivamente" deshabilitado hasta que AMBAS barreras (name matches + password filled) pasen.
- Validación on-submit (no on-keystroke) — bcrypt es caro (~80ms).
- Reutiliza `admin.login.error` para el mensaje de error.
- Nueva clave i18n `admin.deleteClient.passwordLabel` (ES + EN).

**Justificación:** aunque el admin ya está logueado, esta acción borra un cliente + todos sus records (cascade). Re-autenticar cubre el caso de pestaña abierta y otra persona sentada a usarla — mismo patrón que `sudo mode` en Linux/macOS.

**Consistencia:** reusa el mismo patrón de validación de `WipeAllDialog` (bcrypt). Las dos acciones destructivas del admin ahora comparten la misma mecánica.

---

### 2. `ac57d83` — `refactor(admin)`: simplificar DeleteClientDialog a barrera única (contraseña)

**Síntoma reportado (feedback del product owner):** *"Quiero que se pueda eliminar solo con la contraseña del admin."*

**Decisión:** quitar el tipeo del nombre. Mantener solo la contraseña.

**Justificación:** el tipeo del nombre agregaba fricción sin valor real de seguridad. Alguien con la contraseña ya tiene autorización; tipear también el nombre es ruido visual. La contraseña es la barrera que importa.

**Implementación:**
- `DeleteClientDialog.tsx`: elimina el `typed` state, el `nameMatches` check, y el input del nombre. `canSubmit` ahora es solo `passwordFilled && !submitting`. El `inputRef` apunta al input de contraseña (foco automático).
- `i18n`: se eliminan `admin.deleteClient.typePrompt`, `.placeholder` y `.mismatch` (ya no se referencian).

**Escalera de gravedad resultante (consistente):**

| Acción | Barrera | Undo |
|---|---|---|
| Borrar 1 medición | — | Sí (5s) |
| Borrar 1 cliente | Contraseña | Sí (5s) |
| ~~Borrar todo (wipe)~~ | ~~Token + contraseña~~ | ~~No~~ |

Las tres acciones siguen un patrón coherente: **contraseña = autorización**, **undo = red de seguridad para errores recuperables**.

**Patrón:** consistente con la convención de la industria (Linear, Notion, GitHub) — para borrar un solo recurso, una sola barrera fuerte (contraseña) es suficiente. La triple barrera queda reservada para acciones verdaderamente catastróficas (wipe total) si se retoman en el futuro.

---

### 3. Commit nuevo — `refactor(admin)`: eliminar la Zona Peligrosa (diferido)

**Síntoma reportado (feedback del product owner):** *"Elimina la parte de Zona Peligrosa. Más adelante agregaremos esto."*

**Decisión:** remover completamente la página de Zona Peligrosa y todos sus componentes. Diferir para una fase futura (cuando se evalúe de nuevo la necesidad real).

**Implementación:**
- `src/admin/AdminApp.tsx`: quitar import de `AdminDangerZonePage`, botón "Zona peligrosa" del header, variante `'danger'` del tipo `AdminRoute`, y la rama `route.kind === 'danger'`.
- `git rm src/admin/pages/AdminDangerZonePage.tsx` (79 líneas borradas).
- `git rm src/admin/components/WipeAllDialog.tsx` (195 líneas borradas).
- `src/i18n/es.json` y `src/i18n/en.json`: eliminar bloque `admin.wipe.*` (8 claves por idioma) y `admin.actions.dangerZone`.

**Lo que se mantiene intacto:**
- `clearAllData()` en `src/db/repo.ts` — sigue exportado por si se retoma.
- `getAdminStats()` en `src/db/repo.ts` — lo sigue usando `AdminStatsHeader`.
- Toda la lógica de auth, CRUD, búsqueda, undo, notas — sin cambios.

**Métricas del refactor:**
- Bundle del admin: 55.6 kB → **51.05 kB** (-4.5 kB, -0.7 kB gzip).
- Líneas eliminadas: 274 (WipeAllDialog + AdminDangerZonePage) + ~50 (i18n + AdminApp).
- Typecheck: 0 errores · Tests: 173 verde · Build: OK.

**Justificación (documentada para retomar):**
- La Zona Peligrosa (wipe total) era la única acción global destructiva. Sin una necesidad concreta hoy, ocupa UI y código que se pueden simplificar.
- Si en el futuro se necesita de nuevo, el patrón está documentado en este archivo y los helpers `clearAllData` / `getAdminStats` siguen listos.
- Alternativas a explorar cuando se retome: (a) wipe simple con contraseña, (b) export-then-wipe (reusa motor de Fase 7), (c) audit log local de últimas 50 acciones, (d) acceso detrás de un toggle "modo avanzado".

**Tag:** `v0.8.0-fase8` **NO se mueve**. Este es un refinement del mismo milestone, no un nuevo tag (mismo patrón que `v0.6.1-fase6-hotfix`).

---

## v0.9.0-fase9 — PWA: Web App Manifest + Service Worker (offline) + íconos

**Fecha:** Julio 2026
**Estado:** ✅ Cerrada
**Tag:** `v0.9.0-fase9` (en este commit)

Cumple `PLAN §10 Fase 9 — PWA (instalable, offline)`. La app ahora es instalable desde el navegador (Chrome Android, Safari iOS, Edge, etc.) y funciona offline tras la primera carga.

### Stack elegido

| Pieza | Herramienta | Justificación |
|---|---|---|
| Plugin | [`vite-plugin-pwa`](https://vite-pwa-org.netlify.app/) v1.3.0 | De facto en el ecosistema Vite. Integra manifest + Workbox + auto-update + tipado TS. |
| Generator del SW | `generateSW` (Workbox) | Menos código custom que `injectManifest`, suficiente para nuestro caso (precache + runtime cache de Google Fonts). |
| Conversor SVG→PNG | `sharp` v0.35.3 (dev) | Genera los 4 íconos en una sola corrida desde `public/icons/leaf-source.svg`. |
| Actualización del SW | `autoUpdate` | El service worker se actualiza silenciosamente en segundo plano. Sin popups de "hay nueva versión" en UI. |

**Por qué no `injectManifest`:** nuestro patrón de cacheo es trivial (precache de assets + CacheFirst para Google Fonts con expiración 1 año). La generación automática de Workbox ya cubre todo sin necesidad de un `sw.ts` propio con `precacheAndRoute(self.__WB_MANIFEST)`. Si más adelante necesitamos estrategias custom (NetworkFirst para algo, stale-while-revalidate, etc.), se migra a `injectManifest`.

### Archivos nuevos (5)

1. `public/icons/leaf-source.svg` — vector maestro con la hoja minimalista.
2. `public/icons/pwa-192x192.png` — ícono 192×192 (Android Chrome, manifest estándar).
3. `public/icons/pwa-512x512.png` — ícono 512×512 (splash screen Android, máscara adaptable).
4. `public/icons/pwa-maskable-512x512.png` — ícono **maskable** (Android 12+ "Add to Home Screen", respeta safe zone del 80%).
5. `public/icons/apple-touch-icon.png` — 180×180 para Safari iOS "Add to Home Screen".
6. `scripts/generate-pwa-icons.mjs` — generador one-shot. Lee el SVG y emite los 4 PNGs. Reutilizable para futuros retoques del icono.

### Archivos modificados (3)

1. `vite.config.ts` — agrega `VitePWA({ ... })` con manifest embebido + Workbox `globPatterns` y `runtimeCaching` para `fonts.googleapis.com` y `fonts.gstatic.com`. `devOptions.enabled: false` (el SW solo vive en build, no en dev — para no contaminar el HMR).
2. `index.html` — agrega `<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png">`. El resto (manifest link, registerSW script, theme-color) lo inyecta automáticamente `vite-plugin-pwa` al transformar el HTML.
3. `package.json` — `version: 0.1.0 → 0.9.0` (alinea con la convención de tags por fase). Suma `vite-plugin-pwa` y `sharp` a `devDependencies`.

### Diseño del ícono (decision de Fase 9)

Se eligió **hoja minimalista** sobre círculo verde salud `#4CAF7C` (corde con la paleta del plan, `§3`). El cierre de PLAN §11 "Iconos PWA (placeholder verde con corazón/hoja)" queda cerrado.

| Atributo | Valor |
|---|---|
| Forma | Hoja elíptica rotada -45°, body blanco `#FAF8F5`, nervadura central verde salud |
| Fondo | Squircle `rx=96` (≈19% del lado) en `#4CAF7C` — matchea iOS app icon corner radius |
| Safe zone (maskable) | La hoja rotada tiene bounding ~235×235 dentro del canvas 512×512. Margen 138px. Safe zone inner circle tiene radio 205px. ✅ dentro del 80% safe zone. |
| Tamaños generados | 192 / 512 / maskable 512 / apple-touch 180 |

**Por qué hoja y no corazón:** la hoja conecta con la metáfora "salud natural" mejor que el corazón (que evoca más romanticismo o enfermedad cardiovascular). La decisión la tomó el product owner en sesión vía pregunta directa (opciones: hoja, corazón, reusar estrella actual — recomendada: hoja).

### Manifest emitido por el build (W3C-spec válido)

`dist/manifest.webmanifest` resultante:

```json
{
  "name": "Salud en 7 Parámetros",
  "short_name": "Salud 7",
  "description": "Aplicación local para registrar y dar seguimiento a 7 parámetros de salud.",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#FAF8F5",
  "theme_color": "#4CAF7C",
  "lang": "es",
  "scope": "/",
  "dir": "ltr",
  "orientation": "portrait",
  "icons": [
    { "src": "icons/pwa-192x192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "icons/pwa-512x512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "icons/pwa-maskable-512x512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

Campos cubren todas las specs mínimas de PWA ([web.dev/install-criteria](https://web.dev/articles/install-criteria)): `name`, `short_name`, `start_url`, `display`, `icons[]` con al menos un 192x192 + uno 512x512, `theme_color`. Cumple el requisito del Chrome `beforeinstallprompt`.

### Service Worker (Workbox)

Generado por VitePWA en `dist/sw.js` con:

- **Precache:** 23 entradas (1.6 MiB total) con `cleanupOutdatedCaches: true`. Invalida cachés de builds viejos al desplegar uno nuevo.
- **clientsClaim: true** — el SW toma control de los tabs abiertos inmediatamente tras la primera instalación (no hay que recargar para activar offline).
- **Runtime cache de Google Fonts:**
  - `https://fonts.googleapis.com/.*` → `CacheFirst` (cache `google-fonts-css`, 10 entradas, expira a 1 año, respuestas con status 0/200).
  - `https://fonts.gstatic.com/.*` → `CacheFirst` (cache `google-fonts-files`, 30 entradas, expira a 1 año, soporta `rangeRequests` para los archivos `.woff2`).
  - Justificación: Plus Jakarta Sans es la única fuente que usamos. Cachear el CSS + los archivos de fuente evita una segunda llamada de red en visitas futuras y permite renderizar el texto correcto aún offline.

### Qué cambia para el usuario

| Antes (sin PWA) | Después (con PWA) |
|---|---|
| Visitar la URL en navegador → siempre requiere red | Visitar la URL → instala como app nativa → **funciona sin internet** (offline-first post-primera carga) |
| Sin ícono en pantalla de inicio | Ícono de hoja verde en el launcher del celular |
| Sin splash screen | Splash screen verde salud mientras carga |
| URL del navegador visible arriba | Pantalla completa (`display: standalone`), sin chrome de Safari/Chrome |
| Add to Home Screen = placeholder genérico | "Salud 7" como nombre y el ícono real |

### Lo que NO se tocó (a propósito)

- **No UI de "install" custom** (`useBeforeInstallPrompt`) — Fase 11 (pulido). El navegador muestra el mini-infobar o A2HS nativo cuando el manifest es válido. Suficiente para v0.9.0.
- **No "offline indicator"** en la UI — Fase 11. La app simplemente sigue funcionando sin red; agregar un banner ahora es ruido sin valor percibido.
- **No sync con service workers de FCM o push notifications** — fuera del alcance de PLAN §2 (no hay backend).
- **No Workbox `injectManifest`** — `generateSW` alcanza. Migrar si surgen estrategias custom (NetworkFirst, offline-fallback HTML, etc.).

### Métricas del cierre

- Typecheck: 0 errores.
- Tests: 173/173 verde (sin cambios — PWA es infra, no afecta lógica).
- Build: OK, 23 entries precacheados (1.6 MiB), `sw.js` y `workbox-*.js` emitidos.
- Bundle del admin (sin cambios): **51.05 kB** (17.5 kB gzip).
- Bundle main: 1.165 MB / 373.75 kB gzip (sin cambios respecto a v0.8.1).
- Bundle nuevo del SW: `sw.js` ~1 kB + `workbox-*.js` (vía CDN-imported script de Workbox).

### Plan §11 — decisiones cerradas en esta fase

- [x] **Iconos PWA (placeholder verde con corazón/hoja)** ✅ elegido: hoja minimalista.
- [x] **Nombre del paquete para Android (`com.tuusuario.salud7`)** ⏭️ se cierra en Fase 10 (capacitor).
- [ ] **Catálogo final de mensajes i18n ES/EN** ⏭️ en progreso permanente, recibe entradas según se necesiten features.
- [ ] **Estructura exacta de pestañas dentro del Excel/PDF** ⏭️ ya cerrada en Fase 7 (ver `v0.7.0-fase7`).

### Para validar visualmente en celular

```bash
./scripts/run.sh build       # produce dist/ con el SW y el manifest
./scripts/run.sh preview     # sirve dist/ en localhost:4173 — probar A2HS
```

Para probar el A2HS en un celular real, hace falta HTTPS (los service workers no se registran en `http://` excepto `localhost`). Opciones documentadas en `MILESTONES.md` sección "Probar en el celular": deploy estático a Cloudflare Pages (gratis), Cloudflare Named Tunnel con dominio propio, o IP local en la misma WiFi (sin HTTPS, no se puede probar A2HS pero se valida todo lo demás).

### Pendiente para Fase 10 (APK Android)

- Decidir `applicationId` / `appId` de Capacitor (propuesta: `com.salud.siete.parametros`).
- Configurar `capacitor.config.ts` con `webDir: 'dist'`, íconos splash, y `server.url` opcional para modo dev.
- Probar `npx cap add android` + `npx cap sync` + `npx cap open android` (o `gradlew assembleDebug` desde CLI).
- Verificar que el SW + manifest funcionen dentro del WebView de Capacitor.
- Smoke test del APK en el celular del product owner.

### Fix post-validación (mismo tag, no se mueve)

Durante la validación en iPhone (iOS 26) descubrimos que la app se podía "Agregar a Inicio" desde Brave y Safari, pero **al tocarla abría con la barra del browser en vez de standalone**. El `display: standalone` del manifest es **ignorado por iOS** si faltan las meta tags legacy de Apple en el `<head>`.

**Fix:** agregadas al `index.html`:

```html
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
<meta name="mobile-web-app-capable" content="yes" />
```

- `apple-mobile-web-app-capable: yes` es la **clave**: le dice a iOS Safari que abra el Web Clip en modo standalone (sin barra de URL).
- `apple-mobile-web-app-status-bar-style: black-translucent` deja el status bar translúcido sobre el contenido (estético, opcional).
- `mobile-web-app-capable: yes` es el equivalente para Chrome en Android (no afecta iOS, agregada por completitud).

**Caveat importante:** iOS **cachea las propiedades del Web Clip**. Para que el fix tome efecto, el usuario tiene que:
1. Eliminar el Web Clip viejo del home (mantener presionado → "Eliminar app").
2. Reabrir la URL en Safari o Brave.
3. Volver a hacer "Agregar a Inicio".
4. El nuevo ícono sí abre standalone.

**Tag:** `v0.9.0-fase9` **NO se mueve**. Es un fix de validación del mismo milestone.

---

## v0.10.0-fase10 — APK Android con Capacitor (scaffold)

**Fecha:** Julio 2026
**Estado:** 🚧 En curso (scaffold + sync hechos; falta compilar el `.apk`)
**Tag:** `v0.10.0-fase10` (en este commit)

Cumple `PLAN §10 Fase 10 — APK Android con Capacitor`. La app deja de ser solo PWA y se envuelve en un WebView nativo que produce un `.apk` firmable y distribuible (por WhatsApp, Play Store, sideload, etc.).

### Stack elegido

| Pieza | Herramienta | Justificación |
|---|---|---|
| Core | `@capacitor/core` 7.6.8 | De facto en el ecosistema nativo-híbrido. Mantenido por Ionic. |
| CLI | `@capacitor/cli` 7.6.8 (devDep) | Scaffolding + `cap add/sync/copy` + management de plugins. |
| Android | `@capacitor/android` 7.6.8 (devDep) | Plataforma Android. Crea el proyecto Gradle. |
| Build nativo | Gradle + Android Studio (del lado del usuario) | Capacitor no compila él mismo, delega a la toolchain de Android. |

**Por qué Capacitor y no Cordova / React Native / Flutter:**
- **Cordova** está discontinuado en la práctica.
- **React Native / Flutter** implican reescribir la UI.
- **Capacitor** es "tu web, en un WebView". Reusa el 100% del código de la PWA. Service Workers, manifest, IndexedDB, todo funciona igual. Cero reescritura.

### Archivos nuevos (1) + generados (1 dir + varios)

1. `capacitor.config.ts` — config del proyecto Capacitor (appId, appName, webDir, theme Android, scheme `https`).
2. `android/` — proyecto Gradle nativo completo, generado por `cap add android`. ~50 archivos, contiene:
   - `android/app/src/main/AndroidManifest.xml` — manifest Android (permisos, MainActivity).
   - `android/app/src/main/assets/public/` — copia sincronizada del `dist/` (la PWA vive acá adentro del APK).
   - `android/app/src/main/assets/capacitor.config.json` — snapshot del config para runtime.
   - `android/app/src/main/res/` — íconos y splash defaults de Capacitor (pendiente reemplazar por los de la PWA en una segunda iteración).
   - `android/gradlew` + `android/build.gradle` — toolchain Gradle.

### Archivos modificados (2)

1. `package.json` — `version 0.9.0 → 0.10.0`. Suma `@capacitor/core` a dependencies, `@capacitor/cli` y `@capacitor/android` a devDependencies. Agrega scripts:
   - `cap:sync` — copia `dist/` al proyecto Android.
   - `cap:open:android` — abre Android Studio apuntando al proyecto.
   - `android:build` — `build` + `cap sync` + `./gradlew assembleDebug`.
   - `android:install` — `./gradlew installDebug` (al celular conectado).
2. `MILESTONES.md` — punto de control actualizado, este bloque documenta el scaffold.

### Configuración de Capacitor (`capacitor.config.ts`)

```ts
{
  appId: 'com.salud.siete.parametros',
  appName: 'Salud 7',
  webDir: 'dist',
  bundledWebRuntime: false,    // usamos el de Capacitor, no uno bundled
  android: {
    allowMixedContent: false,  // solo HTTPS en el WebView
    backgroundColor: '#FAF8F5' // matchea background_color del manifest
  },
  server: {
    androidScheme: 'https'     // carga assets vía https://localhost en el WebView
  }
}
```

**Por qué `androidScheme: 'https`:** por defecto Capacitor usa `http://localhost`, lo que rompe service workers porque algunos browsers (y WebView configs) los restringen a origins seguros. Forzando `https://localhost`, los SW y APIs sensibles (crypto, permissions) funcionan idéntico a la PWA web.

### Cómo se relacionan la PWA y el APK

```
            PWA (Fase 9)                    APK (Fase 10)
            ┌──────────┐                    ┌──────────┐
            │  dist/   │ ─── cap sync ────► │ android/ │
            │  (build) │                    │ app/src/ │
            │          │                    │ main/    │
            │ index    │                    │ assets/  │
            │ sw.js    │                    │ public/  │  ◄── WebView carga esto
            │ manifest │                    │  (PWA)   │
            │ icons/   │                    │          │
            └──────────┘                    └────┬─────┘
                                                │
                                          MainActivity
                                          (WebView nativo)
                                                │
                                                ▼
                                          ┌──────────┐
                                          │  APK     │
                                          │ firmable │
                                          └──────────┘
```

La PWA corre **idéntica** dentro del WebView: mismos assets, mismo SW, mismo manifest, mismos íconos. Lo único que cambia es que en vez de cargarse desde un servidor, se carga desde el sistema de archivos del APK.

### Qué se verificó hasta ahora

| Check | Estado |
|---|---|
| `@capacitor/*` 7.6.8 instalado | ✅ |
| `capacitor.config.ts` válido | ✅ |
| `cap add android` creó el proyecto Gradle | ✅ |
| `dist/` sincronizado a `android/app/src/main/assets/public/` | ✅ (8 archivos: index, sw.js, manifest, registerSW, workbox, favicon, icons/, images/, assets/) |
| `capacitor.config.json` generado en assets | ✅ |
| Typecheck del proyecto sigue verde | ✅ (Capacitor no toca código de la app) |
| Tests siguen verde | ✅ (173/173) |
| `gradlew assembleDebug` ejecutado | ❌ **No en este entorno** — falta Java + Android SDK |

### Pendiente de Fase 10 (build + deploy del APK)

Para terminar esta fase falta:

1. **Instalar el toolchain nativo** (opciones):
   - **Opción A (recomendada):** Android Studio en Windows + SDK + platform 35 + build-tools. Abrir la carpeta `android/` con Android Studio, dejar que sincronice Gradle, y usar el botón "Run" para compilar e instalar en el celular.
   - **Opción B:** Instalar `cmdline-tools` + SDK en WSL vía `sdkmanager` + Java 17. Más lento, más setup.

2. **Generar el APK debug**:
   ```bash
   # Dentro de WSL, una vez instalado el toolchain:
   cd /home/nico/projects/GestionDeSaludSimple
   ./scripts/run.sh build      # ya está
   rsync dist/ → WSL (ya está)
   cd android
   ./gradlew assembleDebug
   # APK queda en: android/app/build/outputs/apk/debug/app-debug.apk
   ```

3. **Reemplazar ícono y splash defaults de Capacitor** por los de la PWA (los de la hoja verde). Capacitor los pone en `android/app/src/main/res/mipmap-*/` con un placeholder. Hay que sobreescribirlos con `pwa-192x192.png` y `pwa-512x512.png`.

4. **Smoke test en el celular**:
   - Instalar el APK (`adb install` o copiar y abrir).
   - Validar: abre standalone (sin barra del WebView), el SW funciona offline, los íconos son los de la PWA, el splash es verde.

5. **(Opcional) APK release firmado** con `keystore` propio para distribuir fuera de debug.

### Caveat conocido

Capacitor carga la PWA desde `https://localhost` dentro del WebView. Los service workers del WebView de Android (que es Chromium-based) **sí funcionan**, pero hay que validar que el cache persista entre cierres de app. Esto se prueba en el smoke test del paso 4.

### Decisiones tomadas en esta sesión

- **applicationId:** `com.salud.siete.parametros` (aceptada la propuesta de `MILESTONES §v0.9.0`).
- **appName:** `Salud 7` (el short_name del manifest).
- **androidScheme:** `https` (para que SW funcione igual que en la PWA).
- **backgroundColor:** `#FAF8F5` (matchea el `background_color` del manifest, no el verde para no tener splash verde chillón).

### Lo que NO se hace en esta fase

- **iOS / Xcode.** Capacitor también lo soporta, pero requiere macOS. Queda fuera hasta que haya un Mac disponible (o se haga vía CI con un runner macOS, fuera del scope de Fase 10).
- **Publicar en Play Store.** Solo se genera el APK debug; release firmado y publicación son Fase 10.5 / 11 si se prioriza.
- **Notificaciones push / deep links / plugins nativos.** No son necesarios para v1.0.

### Update: build verificado ✅

En este commit también se verificó el build completo del APK. Se instaló el toolchain nativo en WSL (sin sudo, todo en `~/`):

| Pieza | Versión | Ubicación |
|---|---|---|
| JDK | Temurin 21.0.5 LTS | `~/jdk-21/` |
| Android cmdline-tools | 11076708 | `~/android-sdk/cmdline-tools/latest/` |
| platform-tools | 37.0.0 | `~/android-sdk/platform-tools/` |
| platforms | android-35 | `~/android-sdk/platforms/android-35/` |
| build-tools | 35.0.0 | `~/android-sdk/build-tools/35.0.0/` |

**Build output:**

```
BUILD SUCCESSFUL in 56s
85 actionable tasks: 50 executed, 35 up-to-date
```

**APK generado:** `android/app/build/outputs/apk/debug/app-debug.apk` — **4.5 MB**

```
package: com.salud.siete.parametros
versionCode: 1
versionName: 1.0
minSdkVersion: 23 (Android 6.0)
targetSdkVersion: 35 (Android 15)
application-label: Salud 7
```

**Contenido del APK (verificado con `unzip -l`):**
- `assets/public/index.html`, `sw.js`, `workbox-*.js`, `manifest.webmanifest`
- `assets/public/assets/*` (todos los JS/CSS bundleados)
- `assets/public/icons/{pwa-192,pwa-512,pwa-maskable-512,apple-touch}.png`
- `assets/capacitor.config.json` con `androidScheme: https` (clave para que el SW funcione en el WebView)

### Caveat del primer build

El primer `gradlew assembleDebug` falló porque **Capacitor 7.6.8 requiere JDK 21** (no 17). Se descargó Temurin 21 y se reintentó. El build OK con JDK 21. Esto queda documentado para la próxima vez:

```bash
# SIEMPRE usar JDK 21, no 17
export JAVA_HOME=~/jdk-21
```

### Caveat del WSL UNC path

El `npx cap add android` directo desde WSL falló por el bug de UNC paths (mismo problema que `run.sh` documenta). Workaround aplicado: invocar el binario de Capacitor directamente con `node.exe` de Windows:

```bash
/mnt/c/Program\ Files/nodejs/node.exe \
  /home/nico/projects/GestionDeSaludSimple/node_modules/@capacitor/cli/bin/capacitor \
  add android
```

Si surge de nuevo, está la receta en este milestone.

### Comandos para rebuildear (receta)

```bash
# 1. Setear env vars (siempre, en cada sesión nueva de WSL)
export JAVA_HOME=~/jdk-21
export PATH=$JAVA_HOME/bin:$PATH
export ANDROID_HOME=~/android-sdk
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools

# 2. Build de la PWA
cd /home/nico/projects/GestionDeSaludSimple
./scripts/run.sh build

# 3. Sincronizar dist/ a WSL
rsync -a --delete /mnt/c/Users/User/projects_tmp/salud/dist/ dist/

# 4. Sincronizar al proyecto Android (esto re-copia dist/ a android/app/src/main/assets/public/)
/mnt/c/Program\ Files/nodejs/node.exe \
  /home/nico/projects/GestionDeSaludSimple/node_modules/@capacitor/cli/bin/capacitor \
  sync android

# 5. Build del APK
cd android
./gradlew assembleDebug

# 6. APK queda en: app/build/outputs/apk/debug/app-debug.apk
```

### Pendiente real de Fase 10 / entrada a Fase 11

1. **Reemplazar íconos y splash defaults de Capacitor** por los de la PWA (hoja verde de `public/icons/pwa-192x192.png`, `pwa-512x512.png`, `pwa-maskable-512x512.png`). Hoy el APK tiene los placeholders de Capacitor.
2. **Smoke test en el celular real** (Android): `adb install app-debug.apk`, abrir, validar standalone + offline + íconos.
3. **Decidir deploy permanente de la PWA** (Cloudflare Pages, surge, GitHub Pages) para tener un link público estable en vez del `localtunnel` temporal.

Estos 3 puntos son los que quedan para cerrar Fase 10 / arrancar Fase 11.
