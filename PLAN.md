# Plan del Proyecto — Salud en 7 Parámetros

> Hito: Aprobación del plan (Junio 2026)
> Este documento es la **fuente de verdad** de las decisiones tomadas para el proyecto.

---

## 1. Resumen del proyecto

**Nombre:** Salud en 7 Parámetros

**Propósito:** Aplicación local para que un profesional de la salud registre y dé seguimiento a 7 métricas corporales de sus clientes (peso, IMC, % grasa, % masa muscular, calorías, edad biológica, grasas viscerales), con visualización de resultados por semáforo, exportación a Excel/PDF, y panel de administración con CRUD.

**Tipo de producto:**
- Web app responsive (navegador)
- PWA instalable (ícono en pantalla del celular, funciona offline)
- APK Android (compartible por WhatsApp/USB, sin Play Store)

**Usuarios objetivo:** Menos de 20 clientes registrados. Proyecto personal/profesional con datos de poca magnitud.

**Privacidad:** 100% local. Ningún dato sale del dispositivo sin acción explícita del usuario (exportación manual).

---

## 2. Stack tecnológico

| Capa | Tecnología | Justificación |
|---|---|---|
| Frontend | React 18 + Vite + TypeScript | Estándar moderno, rápido, tipos seguros |
| Estilos | Tailwind CSS (paleta salud) | Velocidad + consistencia visual |
| Almacenamiento local | **Dexie.js (IndexedDB)** | Base de datos real, gratuita, persistente, funciona en web/PWA/APK sin plugins nativos |
| Exportación Excel | SheetJS (xlsx) | Estándar de facto para .xlsx |
| Exportación PDF | jsPDF + jspdf-autotable | Tablas formateadas en PDF |
| i18n | i18next + react-i18next | Cambio ES/EN en caliente |
| Iconos | lucide-react | Ligeros, modernos, profesionales |
| Validación runtime | Zod | Schemas reutilizables en form y DB |
| Wrap APK | Capacitor | Convierte la build web en APK nativo |
| Hash admin | bcryptjs | PIN admin hasheado |

**Decisión Dexie vs SQLite:** Dexie (IndexedDB) es la opción elegida. Es una base de datos local real, gratuita, sin servidor, sin dependencias nativas. SQLite nativo requeriría plugin nativo de Capacitor y mayor complejidad de build. Para menos de 20 clientes con múltiples registros, Dexie es la opción profesional correcta.

---

## 3. Identidad visual

### Paleta de colores

| Color | Hex | Uso |
|---|---|---|
| Verde salud | `#4CAF7C` | Primario, estado "normal", CTAs |
| Verde suave | `#A8E6C9` | Fondos suaves, hover, badges |
| Ámbar | `#F4B860` | Estado "advertencia" |
| Coral | `#E57373` | Estado "alerta" |
| Hueso | `#FAF8F5` | Fondo principal |
| Grafito | `#3A4A4F` | Texto principal |
| Gris claro | `#E8ECEC` | Bordes, divisores |

### Tipografía

**Plus Jakarta Sans** (Google Fonts) — redondeada, amable, profesional.

### Estilo general

- Cards con `rounded-2xl` y `shadow-sm`
- Padding generoso (espacio para respirar)
- Iconos de línea fina (1.5px stroke)
- Microanimaciones sutiles en hover
- Header sticky con fondo semi-transparente y blur
- Mobile-first

---

## 4. Modelo de datos (Dexie)

```ts
// Tabla: clients (ficha de la persona)
{
  id?: number,             // autoincrement
  name: string,            // nombre completo normalizado
  birthDate: string,       // ISO YYYY-MM-DD
  age: number,             // calculado desde birthDate
  gender: 'F' | 'M',
  heightCm: number,
  wristContexture: 'thin' | 'normal' | 'thick',
  createdAt: Date
}

// Tabla: records (cada medición en el tiempo)
{
  id?: number,
  clientId: number,        // FK a clients.id
  date: Date,              // fecha y hora de la medición
  weight: number,          // kg
  bmi: number,             // IMC
  bodyFatPct: number,      // % grasa
  muscleMassPct: number,   // % masa muscular
  calories: number,        // kcal diarias
  bioAge: number,          // edad biológica
  visceralFat: number,     // nivel grasa visceral
  notes?: string
}

// Tabla: meta (settings internos, schema version)
{
  key: string,
  value: any
}
```

**Schema versionado desde día 1** para permitir migraciones futuras sin romper datos existentes.

---

## 5. Identidad del usuario y detección de coincidencias

### Identidad = tripleta

La identidad del cliente se define por la combinación de:

1. **Nombre** (normalizado: lowercase + trim + sin tildes)
2. **Fecha de nacimiento** (ISO YYYY-MM-DD)
3. **Altura en cm** (número entero)

### Normalización de nombre

```ts
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')  // quitar tildes
}
```

### Niveles de coincidencia

| Nivel | Criterio | UX |
|---|---|---|
| **matchAlto** | nombre + fechaNacimiento + altura idénticos | *"¡Qué gusto verte de nuevo!"* |
| **matchParcial** | 2 de 3 campos coinciden | *"Encontré datos similares, ¿eres tú?"* |
| **matchNinguno** | Ningún campo coincide | Cliente nuevo, se crea ficha |

---

## 6. Rangos médicos estándar

Fuentes: **OMS** (IMC), **American Council on Exercise** (% grasa, % músculo), **Mifflin-St Jeor** (calorías TMB), **Lorentz** (peso ideal ajustado por contextura).

### 6.1 IMC (universal)

| Estado | Rango |
|---|---|
| Bajo peso | < 18.5 |
| Normal | 18.5 – 24.9 |
| Sobrepeso | 25.0 – 29.9 |
| Obesidad | ≥ 30.0 |

### 6.2 % Grasa corporal – Hombres

| Edad | Saludable | Aceptable | Alta |
|---|---|---|---|
| 20–29 | 7–17% | 18–24% | ≥25% |
| 30–39 | 12–21% | 22–27% | ≥28% |
| 40–49 | 14–23% | 24–29% | ≥30% |
| 50–59 | 16–24% | 25–30% | ≥31% |
| 60+ | 17–25% | 26–31% | ≥32% |

### 6.3 % Grasa corporal – Mujeres

| Edad | Saludable | Aceptable | Alta |
|---|---|---|---|
| 20–29 | 16–24% | 25–30% | ≥31% |
| 30–39 | 17–25% | 26–32% | ≥33% |
| 40–49 | 19–28% | 29–34% | ≥35% |
| 50–59 | 22–30% | 31–36% | ≥37% |
| 60+ | 22–31% | 32–37% | ≥38% |

### 6.4 % Masa muscular – Hombres

| Edad | Normal | Bajo |
|---|---|---|
| 20–29 | 41–52% | < 41% |
| 30–39 | 40–50% | < 40% |
| 40–49 | 38–48% | < 38% |
| 50–59 | 36–46% | < 36% |
| 60+ | 34–44% | < 34% |

### 6.5 % Masa muscular – Mujeres

| Edad | Normal | Bajo |
|---|---|---|
| 20–29 | 32–39% | < 32% |
| 30–39 | 31–38% | < 31% |
| 40–49 | 29–37% | < 29% |
| 50–59 | 28–35% | < 28% |
| 60+ | 27–34% | < 27% |

### 6.6 Grasa visceral (universal)

| Nivel | Rango |
|---|---|
| Normal | 1 – 9 |
| Atención | 10 – 14 |
| Alta | ≥ 15 |

### 6.7 Edad biológica (universal)

| Estado | Criterio |
|---|---|
| Normal | ±5 años vs. edad cronológica |
| Mejor que cronológica | < edad cronológica - 5 |
| Mayor que cronológica | > edad cronológica + 5 |

### 6.8 Peso ideal (Lorentz ajustado por contextura)

Fórmula base de Lorentz:
- Hombres: `altura - 100 - ((altura - 150) / 4)`
- Mujeres: `altura - 100 - ((altura - 150) / 2.5)`

Ajuste por contextura de muñeca (factor multiplicativo):
- Delgada: × 0.95
- Normal: × 1.00
- Gruesa: × 1.05

### 6.9 Calorías (Mifflin-St Jeor)

TMB (Tasa Metabólica Basal):
- Hombres: `(10 × peso) + (6.25 × altura) - (5 × edad) + 5`
- Mujeres: `(10 × peso) + (6.25 × altura) - (5 × edad) - 161`

Evaluación: ingesta del usuario vs TMB ±300 kcal = normal.

### 6.10 Ajustes por contextura de muñeca

> **Estado:** ajustes ±1-2% implementados en `evaluator.ts`. Sujetos a revisión clínica futura.

La contextura de muñeca (thin / normal / thick) influye en la evaluación de las siguientes métricas:

| Métrica | Ajuste | Justificación | Constante |
|---|---|---|---|
| Peso | Lorentz × {0.95, 1.00, 1.05} | Fórmula estándar,PLAN §6.8 | `idealWeightKg` |
| % Grasa | `acceptableUpper` y `alertLower` +1% (thick); `lower` −1% (thin) | Constitución ósea = más tejido magro. Una persona thick puede tener +1% grasa sin riesgo adicional | `adjustBodyFatRange` |
| % Músculo | `lower` +2% (thick); `lower` −2% (thin) | Hueso grueso = +masa muscular por constitución, el "normal" mínimo es más alto | `adjustMuscleRange` |

**Las demás métricas (IMC, calorías, grasa visceral, edad biológica) usan rangos universales** que no se ajustan por contextura.

**Nota para mantenimiento futuro:**
estos ajustes son aproximaciones clínicas documentadas. Si encontrás guías más actualizadas o querés calibrar basado en feedback de profesionales:

1. Identificar la métrica a tocar en `src/lib/evaluator.ts` (helpers `adjustBodyFatRange` / `adjustMuscleRange`).
2. Modificar la constante correspondiente (ej: `acceptableUpper + 1` → `acceptableUpper + 2`).
3. Correr `bash scripts/run.sh test` — los tests marcados con `// CONTEXTURE` en `__tests__/evaluator.test.ts` te dirán exactamente qué evaluaciones cambiaron.
4. Si querés, actualizar esta sección con la nueva justificación.

---

## 7. Mensajes cálidos y profesionales

### Reglas de tono (consistencia)

- **Segunda persona** (tú/tu/tus), nunca "usted" ni "el usuario"
- **Verbos en presente**, sin imperativos secos
- **Frases completas**, no solo "Error" o "Éxito"
- **Emociones válidas**: orgullo por el progreso, preocupación gentil por alertas, calma por advertencias
- **Sin culpabilizar**: nunca "deberías", siempre "te sugiero"
- **Cierra con esperanza/acción**: cada mensaje sugiere un siguiente paso

### 7.1 Home y navegación

| Caso | Mensaje |
|---|---|
| Primera visita (Home) | *"Hola, qué bueno tenerte aquí. Hoy vamos a revisar cómo está tu salud, con calma y sin prisas."* |
| Vuelve con datos en DB | *"Hola otra vez. Tu última visita fue hace [X días]. ¿Quieres registrar nuevos datos?"* |
| Vuelve con nombre en localStorage | *"Hola, [Nombre]. ¿Quieres registrar nuevos datos o revisar tu evolución?"* |
| Después de guardar exitosamente | *"¡Listo, [Nombre]! Tus datos están seguros. Sigue cuidándote así de bien."* |

### 7.2 Formulario – Datos básicos

| Campo / momento | Mensaje |
|---|---|
| Título | *"Primero, cuéntame un poco sobre ti"* |
| Subtítulo | *"Estos datos me ayudan a entender tu cuerpo y personalizar tus resultados"* |
| Placeholder nombre | *"Tu nombre completo, por favor"* |
| Label fecha de nacimiento | *"¿Cuándo llegaste al mundo? Tu fecha de nacimiento"* |
| Placeholder fecha | *"DD / MM / AAAA"* |
| Label edad | *"Edad"* (auto-calculada; ayuda: *"La calculamos desde tu fecha de nacimiento"*) |
| Label altura | *"¿Cuánto mides? En centímetros"* |
| Label género | *"Eres..."* (opciones: Mujer / Hombre) |
| Label contextura | *"Tu contextura de muñeca"* (ayuda: *"Mide tu muñeca justo encima del hueso. Esto nos ayuda a calcular tu peso ideal con mayor precisión"*) |
| Radio options | Delgada / Normal / Gruesa |
| Validación: campo vacío | *"Ups, parece que este dato se nos olvidó. ¿Me lo compartes?"* |
| Validación: fecha inválida | *"Mmm, esa fecha no me cuadra. ¿Puedes revisarla?"* |
| Validación: edad <10 o >120 | *"Para usar esta app necesitas tener entre 10 y 120 años. ¿Es correcta la fecha?"* |
| Validación: altura fuera de rango | *"Esa altura está fuera de lo que esperaba (100–230 cm). ¿La revisamos?"* |
| Coincidencia alta | *"¡Qué gusto verte de nuevo! Encontré registros anteriores con tus datos."* |
| Coincidencia parcial | *"Encontré datos similares. ¿Eres tú?"* |
| Cliente nuevo | *"Perfecto, ya te conozco. Ahora sí, vamos con tus mediciones."* |
| Botón continuar | *"Continuar →"* |

### 7.3 Formulario – Métricas

> **Política (revisada en fix post-Fase 4):** las 7 métricas son **requeridas**. Los valores los trae el profesional de su equipo de medición (báscula inteligente, examen de composición corporal). No se contempla el caso "no medido" porque generaba la sensación de flujo incompleto al llegar a la pantalla de resultados con tarjetas vacías.

| Campo | Label + ayuda |
|---|---|
| Título sección | *"Ahora, las mediciones de hoy"* |
| Subtítulo | *"Anota los 7 valores que te dio tu equipo de medición."* |
| Peso | *"Tu peso actual"* / *"En kilogramos, lo más preciso posible"* |
| IMC | *"Tu IMC"* / *"Lo marca tu báscula o tu app de salud. Anota el valor exacto que te da el equipo."* |
| % Grasa | *"Porcentaje de grasa corporal"* / *"Lo marca tu báscula inteligente o tu examen de composición corporal."* |
| % Músculo | *"Porcentaje de masa muscular"* / *"Lo marca tu báscula o tu examen de composición corporal."* |
| Calorías | *"Calorías que consumes al día"* / *"Una estimación está bien, no tiene que ser exacta"* |
| Edad biológica | *"Tu edad biológica"* / *"La que indica tu cuerpo según tu último análisis. No es tu DNI."* |
| Grasa visceral | *"Nivel de grasa visceral"* / *"Viene en tu báscula o bioimpedancia. Número entero"* |
| Botón ver resultados | *"Ver mis resultados →"* |

**Rangos de validación requeridos:**

| Campo | Min | Max |
|---|---|---|
| Peso | 20 kg | 300 kg |
| IMC | 10 | 60 |
| % Grasa | 3% | 50% |
| % Músculo | 10% | 70% |
| Calorías | 800 kcal | 6000 kcal |
| Edad biológica | 10 años | 100 años |
| Grasa visceral | 1 | 30 |

### 7.4 Pantalla de resultados

| Estado | Mensaje resumen |
|---|---|
| Todos normales | *"Excelente, todos tus parámetros están dentro de los rangos saludables. Sigue cuidándote así de bien."* |
| 1–2 advertencias | *"Casi todo está muy bien. Hay un par de valores a los que vale la pena prestarles atención."* |
| 3+ advertencias | *"La mayoría de tus parámetros están en buen camino. Algunos piden un poquito más de atención."* |
| Alguna alerta | *"Detectamos [uno/varios] valor(es) fuera del rango ideal. Es importante que los revises con un profesional de salud."* |
| Mixto | *"Tienes un panorama mayormente saludable, pero hay [uno/varios] valor(es) que conviene revisar pronto."* |

Estados por card:
- Normal: *"Todo bien por aquí"*
- Advertencia: *"Atención suave: revisa este valor"*
- Alerta: *"Importante: consulta con un profesional"*

### 7.5 Guardar y exportar

| Estado | Mensaje |
|---|---|
| Modal título | *"¡Listo! Tus datos están guardados de forma segura"* |
| Subtítulo – todos normales | *"Todo está dentro de los rangos esperados. Sigue cuidándote así de bien."* |
| Subtítulo – con advertencias | *"Tus datos se guardaron. Recuerda prestar atención a los valores marcados en amarillo."* |
| Subtítulo – con alertas | *"Tus datos se guardaron, pero te recomendamos consultar los valores en rojo con tu profesional de salud."* |
| Pregunta formato | *"¿En qué formato te gustaría descargar tu registro?"* |
| Botón Excel | *"Descargar Excel"* |
| Botón PDF | *"Descargar PDF"* |
| Botón omitir | *"Ahora no, gracias"* |
| Éxito Excel | *"Tu archivo Excel está listo. Lo encontrarás en tu carpeta de descargas."* |
| Éxito PDF | *"Tu PDF está listo. Compártelo con quien quieras, sin preocupación."* |
| Error guardar | *"Ups, algo no salió como esperábamos al guardar. ¿Intentamos otra vez?"* |
| Error exportar | *"El archivo no se pudo generar. Revisa que tu dispositivo tenga espacio y volvamos a intentarlo."* |

### 7.6 Evolución (solo si hay coincidencia)

| Estado | Mensaje |
|---|---|
| Título | *"Tu evolución"* |
| Primer registro | *"Esta es tu primera medición con nosotros. La próxima vez que vuelvas, aquí verás cómo avanzas."* |
| 2–3 registros | *"Mira, ya tenemos [X] registros tuyos. Cada uno cuenta una historia."* |
| 4+ registros | *"Llevas [X] mediciones con nosotros. Revisa cómo han cambiado tus valores con el tiempo."* |
| Tendencia positiva | *"¡Qué bueno! Tus valores han mejorado desde tu última visita. Sigue así."* |
| Tendencia estable | *"Te mantienes constante, eso es señal de disciplina. Sigue así."* |
| Tendencia mixta | *"Has mejorado en algunos valores y otros siguen parecidos. Enfócate en los que faltan."* |
| Tendencia regresiva | *"Algunos valores han cambiado y conviene revisarlos. Vuelve a chequearlos pronto."* |
| Datos insuficientes | *"Aún tenemos pocos registros para mostrarte una tendencia clara, pero cada visita cuenta."* |

### 7.7 Panel admin

| Acción | Mensaje |
|---|---|
| Login título | *"Área solo para administradores"* |
| Login subtítulo | *"Ingresa tus credenciales para continuar"* |
| Login error | *"Las credenciales no coinciden. Verifícalas, por favor."* |
| Login exitoso | *"Bienvenido/a al panel de administración"* |
| Panel vacío | *"Aún no hay clientes registrados. Cuando alguien use la app, aparecerán aquí."* |
| Sin resultados de búsqueda | *"No encontré clientes con ese nombre. Prueba con otro o presiona 'Ver todos'."* |
| Confirmación eliminar | *"¿Estás seguro de eliminar a [nombre] y todos sus registros? Esta acción no se puede deshacer."* |
| Eliminado exitoso | *"[Nombre] fue eliminado/a del sistema."* |
| Editado exitoso | *"Los datos de [nombre] se actualizaron correctamente."* |
| Exportar todo | *"Descargando todos los registros en un solo archivo. Paciencia si son muchos."* |
| Cerrar sesión | *"Sesión cerrada. Cuídate."* |

### 7.8 Errores generales

| Caso | Mensaje |
|---|---|
| Sin conexión (futuro) | *"Estás sin conexión. Por ahora tus datos se guardan localmente y se enviarán cuando vuelvas a tener red."* |
| Error inesperado | *"Algo inesperado ocurrió. Te pedimos disculpas. Si continúa, intenta recargar la página."* |
| Datos corruptos | *"Encontramos un problema con tus datos guardados. Vamos a intentar recuperarlos."* |
| Mantenimiento | *"Estamos mejorando la app para ti. Vuelve en unos minutos."* |

---

## 8. Privacidad y ética

| Práctica | Implementación |
|---|---|
| Cero telemetría | Sin Google Analytics, sin scripts externos |
| Sin envío automático | Todo local; exportaciones manuales |
| Aviso visible en Home | *"Tus datos se guardan solo en este dispositivo. Nada se envía a internet."* |
| Botón "Borrar todo" | En admin, con doble confirmación |
| HTTPS obligatorio | Si se publica versión web |
| PIN admin local | No es seguridad alta, es filtro básico |

---

## 9. Buenas prácticas profesionales

### Identidad sin login

Tripleta `nombre + fechaNacimiento + altura` con normalización (lowercase, sin tildes, trim).

### Almacenamiento

- **IndexedDB (Dexie)** = única fuente de verdad para datos
- **localStorage** = solo para preferencias no sensibles (idioma)

### Validación

- **Zod** en formularios y al guardar/leer de DB
- Mensajes de error en i18n con tono cálido

### UX

- Mobile-first
- Touch targets ≥ 44px
- Estados de carga explícitos (esqueletos/spinners)
- Confirmación para acciones destructivas
- Undo de 5 segundos tras eliminar
- Búsqueda con debounce 300ms
- Accesibilidad básica (labels asociados, contraste WCAG AA, teclado)
- Sin emojis en UI

### Calidad de código

- TypeScript strict
- ESLint + Prettier
- Sin `any`
- Componentes < 150 líneas
- Hooks reutilizables
- Path aliases (`@/components`, etc.)

### Schema versionado

`db.version(1).stores({...})` con `schemaVersion` en tabla `meta` para migraciones futuras.

### Performance

- Code splitting (admin lazy-loaded)
- Memoización en evaluador y lista de clientes
- PWA cache-first después de primera carga

### Testing

- Manual en cada fase (UX)
- Unit tests en `evaluator.ts` (lógica médica crítica)
- Smoke test en APK final

---

## 10. Fases de implementación

| Fase | Entregable | Pruebas |
|---|---|---|
| 1 | Setup + Tailwind + Header + i18n + Home | ✅ Te paso versión |
| 2 | Formulario datos básicos (radio contextura, fecha nac.) + validaciones | ✅ Pruebas |
| 3 | Formulario métricas + 7 inputs | ✅ Pruebas |
| 4 | Lógica de evaluación + rangos por edad/género | ✅ Pruebas |
| 5 | Pantalla resultados con semáforo + tooltips | ✅ Pruebas |
| 6 | Persistencia Dexie + detección coincidencia + sección evolución | ✅ Pruebas |
| 7 | Exportación Excel y PDF | ✅ Pruebas |
| 8 | Admin (login + CRUD + filtro + ver todos) | ✅ Pruebas |
| 9 | PWA (instalable, offline) | ✅ Pruebas |
| 10 | APK Android con Capacitor | ✅ Pruebas en tu celular |
| 11 | Pulido visual y de tono | Final |

---

## 11. Decisiones pendientes de Fase 1+

- [ ] Nombre del paquete para Android (`com.tuusuario.salud7`)
- [ ] Iconos PWA (placeholder verde con corazón/hoja)
- [ ] Catálogo final de mensajes i18n ES/EN (se completará durante implementación)
- [ ] Estructura exacta de pestañas dentro del Excel/PDF (se ajustará con feedback del usuario)

---

## 12. Decisiones cerradas

| Decisión | Valor |
|---|---|
| Nombre de la app | **Salud en 7 Parámetros** |
| Idioma por defecto | Español |
| Idioma alternativo | Inglés |
| Usuario admin | `admin` |
| Contraseña admin | `adminadmin` (hasheada con bcryptjs, en `.env`) |
| Persistencia | 100% local con Dexie |
| Google Sheets | **No por ahora** (queda fuera del alcance hasta nueva orden) |
| Tono de la UI | Cálido, profesional, segunda persona |
| Versión del plan | 0.0.0-plan |
| Fecha de aprobación | Junio 2026 |
