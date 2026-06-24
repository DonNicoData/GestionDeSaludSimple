# Salud en 7 Parámetros

Aplicación local (PWA + APK Android) para que profesionales de la salud registren y den seguimiento a 7 métricas corporales de sus clientes con visualización por semáforo y exportación a Excel/PDF.

> **Estado:** Plan aprobado — pendiente de implementación.
> Ver [`PLAN.md`](./PLAN.md) para la planificación completa y [`MILESTONES.md`](./MILESTONES.md) para el historial de hitos.

## Características planificadas

- 7 métricas: Peso, IMC, % Grasa, % Masa muscular, Calorías, Edad biológica, Grasa visceral
- Datos básicos: nombre, fecha de nacimiento, edad (auto), altura, género, contextura de muñeca
- Resultados con semáforo (verde / ámbar / coral) y tooltips explicativos
- Sección de evolución cuando los datos básicos coinciden con un cliente existente
- Exportación a Excel (`.xlsx`) y PDF con formato `NombreApellido_Fecha_Hora`
- Panel de administración con CRUD, filtro por nombre y "Ver todos"
- Identidad visual cálida, paleta de verdes y tonos suaves
- Bilingüe: Español (por defecto) / Inglés
- 100% local: IndexedDB (vía Dexie), sin servidor, sin envío automático de datos
- PWA instalable + APK Android compartible

## Stack

- React 18 + Vite + TypeScript
- Tailwind CSS
- Dexie.js (IndexedDB)
- SheetJS (Excel) + jsPDF (PDF)
- i18next (ES/EN)
- Capacitor (wrap APK)

## Privacidad

Todos los datos se guardan **únicamente en el dispositivo**. Nada se envía a internet. La exportación a Excel/PDF es siempre una acción manual del usuario.

## Desarrollo (cuando se implemente)

```bash
npm install
npm run dev          # desarrollo
npm run build        # build de producción
npm run preview      # preview local
```

## Licencia

Privado / Personal.
