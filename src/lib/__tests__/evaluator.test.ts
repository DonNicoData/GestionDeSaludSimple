import { describe, expect, it } from 'vitest'
import {
  basalMetabolicRate,
  evaluate,
  idealWeightKg,
} from '../evaluator'
import type { Client, Gender, WristContexture } from '@/types'

function makeClient(overrides: Partial<Client> = {}): Client {
  return {
    id: 1,
    firstName: 'Test',
    lastName1: 'User',
    lastName2: 'Mock',
    birthDate: '1990-01-01',
    age: 35,
    gender: 'M',
    heightCm: 175,
    wristContexture: 'normal',
    createdAt: new Date(),
    ...overrides,
  }
}

function makeRecord(
  overrides: Partial<{
    weight: number
    bmi: number
    bodyFatPct: number
    muscleMassPct: number
    calories: number
    bioAge: number
    visceralFat: number
  }> = {},
) {
  return {
    weight: 75,
    bmi: 22.5,
    bodyFatPct: 18,
    muscleMassPct: 42,
    calories: 2000,
    bioAge: 35,
    visceralFat: 5,
    ...overrides,
  }
}

function getEval(
  evals: ReturnType<typeof evaluate>,
  key: 'weight' | 'bmi' | 'bodyFatPct' | 'muscleMassPct' | 'calories' | 'bioAge' | 'visceralFat',
) {
  const found = evals.find((e) => e.key === key)
  if (!found) throw new Error(`No evaluation found for ${key}`)
  return found
}

describe('idealWeightKg - Lorentz + contextura', () => {
  it('hombre 175cm contextura normal → ~68.75 kg', () => {
    // (175 - 100 - (25/4)) × 1.0 = 68.75
    expect(idealWeightKg(makeClient())).toBeCloseTo(68.75, 2)
  })

  it('mujer 165cm contextura normal → ~58 kg', () => {
    // (165 - 100 - (15/2.5)) × 1.0 = 59
    const c = makeClient({ gender: 'F' as Gender, heightCm: 165 })
    expect(idealWeightKg(c)).toBeCloseTo(59, 2)
  })

  it('ajusta por contextura delgada (×0.95)', () => {
    const c = makeClient({ wristContexture: 'thin' as WristContexture })
    expect(idealWeightKg(c)).toBeCloseTo(68.75 * 0.95, 2)
  })

  it('ajusta por contextura gruesa (×1.05)', () => {
    const c = makeClient({ wristContexture: 'thick' as WristContexture })
    expect(idealWeightKg(c)).toBeCloseTo(68.75 * 1.05, 2)
  })
})

describe('basalMetabolicRate - Mifflin-St Jeor', () => {
  it('hombre 35 años, 75kg, 175cm → ~1652 kcal', () => {
    // 10*75 + 6.25*175 - 5*35 + 5 = 750 + 1093.75 - 175 + 5 = 1673.75
    const tmb = basalMetabolicRate(makeClient(), 75)
    expect(tmb).toBeCloseTo(1673.75, 0)
  })

  it('mujer 35 años, 65kg, 165cm → ~1339 kcal', () => {
    // 10*65 + 6.25*165 - 5*35 - 161 = 650 + 1031.25 - 175 - 161 = 1345.25
    const tmb = basalMetabolicRate(
      makeClient({ gender: 'F', heightCm: 165 }),
      65,
    )
    expect(tmb).toBeCloseTo(1345.25, 0)
  })
})

describe('evaluate - IMC (OMS)', () => {
  it('IMC 17 → warning (bajo peso)', () => {
    const evals = evaluate(makeRecord({ bmi: 17 }), makeClient())
    expect(getEval(evals, 'bmi').status).toBe('warning')
  })

  it('IMC 18.5 → normal', () => {
    const evals = evaluate(makeRecord({ bmi: 18.5 }), makeClient())
    expect(getEval(evals, 'bmi').status).toBe('normal')
  })

  it('IMC 22 (centro del rango) → normal', () => {
    const evals = evaluate(makeRecord({ bmi: 22 }), makeClient())
    expect(getEval(evals, 'bmi').status).toBe('normal')
  })

  it('IMC 24.9 (techo del rango) → normal', () => {
    const evals = evaluate(makeRecord({ bmi: 24.9 }), makeClient())
    expect(getEval(evals, 'bmi').status).toBe('normal')
  })

  it('IMC 25 → warning (sobrepeso)', () => {
    const evals = evaluate(makeRecord({ bmi: 25 }), makeClient())
    expect(getEval(evals, 'bmi').status).toBe('warning')
  })

  it('IMC 29.9 → warning', () => {
    const evals = evaluate(makeRecord({ bmi: 29.9 }), makeClient())
    expect(getEval(evals, 'bmi').status).toBe('warning')
  })

  it('IMC 30 → alert (obesidad)', () => {
    const evals = evaluate(makeRecord({ bmi: 30 }), makeClient())
    expect(getEval(evals, 'bmi').status).toBe('alert')
  })

  it('IMC 40 → alert', () => {
    const evals = evaluate(makeRecord({ bmi: 40 }), makeClient())
    expect(getEval(evals, 'bmi').status).toBe('alert')
  })
})

describe('evaluate - % grasa (rangos por edad × género)', () => {
  it('hombre 35 años, 19% → normal (rango 12-21)', () => {
    const evals = evaluate(
      makeRecord({ bodyFatPct: 19 }),
      makeClient({ age: 35, gender: 'M' }),
    )
    expect(getEval(evals, 'bodyFatPct').status).toBe('normal')
  })

  it('hombre 35 años, 25% → warning (aceptable)', () => {
    const evals = evaluate(
      makeRecord({ bodyFatPct: 25 }),
      makeClient({ age: 35, gender: 'M' }),
    )
    expect(getEval(evals, 'bodyFatPct').status).toBe('warning')
  })

  it('hombre 35 años, 28% → alert', () => {
    const evals = evaluate(
      makeRecord({ bodyFatPct: 28 }),
      makeClient({ age: 35, gender: 'M' }),
    )
    expect(getEval(evals, 'bodyFatPct').status).toBe('alert')
  })

  it('hombre 35 años, 10% → warning (demasiado bajo)', () => {
    const evals = evaluate(
      makeRecord({ bodyFatPct: 10 }),
      makeClient({ age: 35, gender: 'M' }),
    )
    expect(getEval(evals, 'bodyFatPct').status).toBe('warning')
  })

  it('mujer 25 años, 20% → normal (rango 16-24)', () => {
    const evals = evaluate(
      makeRecord({ bodyFatPct: 20 }),
      makeClient({ age: 25, gender: 'F' }),
    )
    expect(getEval(evals, 'bodyFatPct').status).toBe('normal')
  })

  it('mujer 50 años, 35% → warning (rango 22-30, alerta ≥37)', () => {
    const evals = evaluate(
      makeRecord({ bodyFatPct: 35 }),
      makeClient({ age: 50, gender: 'F' }),
    )
    // 22-30 normal, 31-36 aceptable, ≥37 alert. 35 está en aceptable.
    expect(getEval(evals, 'bodyFatPct').status).toBe('warning')
  })

  it('mujer 50 años, 38% → alert', () => {
    const evals = evaluate(
      makeRecord({ bodyFatPct: 38 }),
      makeClient({ age: 50, gender: 'F' }),
    )
    expect(getEval(evals, 'bodyFatPct').status).toBe('alert')
  })

  it('brackets etarios respetan fronteras', () => {
    // 40 años cae en bracket 40-49
    const evals40 = evaluate(
      makeRecord({ bodyFatPct: 25 }),
      makeClient({ age: 40, gender: 'M' }),
    )
    // bracket 40-49 M: 14-23 normal, 24-29 aceptable, ≥30 alert
    expect(getEval(evals40, 'bodyFatPct').status).toBe('warning')

    // 39 años cae en bracket 30-39
    const evals39 = evaluate(
      makeRecord({ bodyFatPct: 25 }),
      makeClient({ age: 39, gender: 'M' }),
    )
    // bracket 30-39 M: 12-21 normal, 22-27 aceptable, ≥28 alert
    expect(getEval(evals39, 'bodyFatPct').status).toBe('warning')
  })
})

describe('evaluate - % masa muscular', () => {
  it('hombre 35 años, 45% → normal (≥40)', () => {
    const evals = evaluate(
      makeRecord({ muscleMassPct: 45 }),
      makeClient({ age: 35, gender: 'M' }),
    )
    expect(getEval(evals, 'muscleMassPct').status).toBe('normal')
  })

  it('hombre 35 años, 38% → warning (<40)', () => {
    const evals = evaluate(
      makeRecord({ muscleMassPct: 38 }),
      makeClient({ age: 35, gender: 'M' }),
    )
    expect(getEval(evals, 'muscleMassPct').status).toBe('warning')
  })

  it('mujer 45 años, 30% → normal (≥29)', () => {
    const evals = evaluate(
      makeRecord({ muscleMassPct: 30 }),
      makeClient({ age: 45, gender: 'F' }),
    )
    expect(getEval(evals, 'muscleMassPct').status).toBe('normal')
  })

  it('mujer 45 años, 25% → warning (<29)', () => {
    const evals = evaluate(
      makeRecord({ muscleMassPct: 25 }),
      makeClient({ age: 45, gender: 'F' }),
    )
    expect(getEval(evals, 'muscleMassPct').status).toBe('warning')
  })

  it('no se penaliza masa muscular alta (atlético)', () => {
    const evals = evaluate(
      makeRecord({ muscleMassPct: 55 }),
      makeClient({ age: 35, gender: 'M' }),
    )
    expect(getEval(evals, 'muscleMassPct').status).toBe('normal')
  })
})

describe('evaluate - grasa visceral', () => {
  it('nivel 5 → normal', () => {
    const evals = evaluate(makeRecord({ visceralFat: 5 }), makeClient())
    expect(getEval(evals, 'visceralFat').status).toBe('normal')
  })

  it('nivel 9 (techo) → normal', () => {
    const evals = evaluate(makeRecord({ visceralFat: 9 }), makeClient())
    expect(getEval(evals, 'visceralFat').status).toBe('normal')
  })

  it('nivel 10 → warning', () => {
    const evals = evaluate(makeRecord({ visceralFat: 10 }), makeClient())
    expect(getEval(evals, 'visceralFat').status).toBe('warning')
  })

  it('nivel 14 (techo) → warning', () => {
    const evals = evaluate(makeRecord({ visceralFat: 14 }), makeClient())
    expect(getEval(evals, 'visceralFat').status).toBe('warning')
  })

  it('nivel 15 → alert', () => {
    const evals = evaluate(makeRecord({ visceralFat: 15 }), makeClient())
    expect(getEval(evals, 'visceralFat').status).toBe('alert')
  })

  it('nivel 25 → alert', () => {
    const evals = evaluate(makeRecord({ visceralFat: 25 }), makeClient())
    expect(getEval(evals, 'visceralFat').status).toBe('alert')
  })
})

describe('evaluate - peso vs ideal (Lorentz)', () => {
  it('peso exactamente igual al ideal → normal', () => {
    // hombre 175cm normal: ideal ≈ 68.75
    const evals = evaluate(makeRecord({ weight: 68.75 }), makeClient())
    expect(getEval(evals, 'weight').status).toBe('normal')
  })

  it('peso 8% sobre el ideal → normal', () => {
    // ideal 68.75 + 8% = 74.25
    const evals = evaluate(makeRecord({ weight: 74.25 }), makeClient())
    expect(getEval(evals, 'weight').status).toBe('normal')
  })

  it('peso 15% sobre el ideal → warning', () => {
    // ideal 68.75 × 1.15 = 79.06
    const evals = evaluate(makeRecord({ weight: 79.06 }), makeClient())
    expect(getEval(evals, 'weight').status).toBe('warning')
  })

  it('peso 25% sobre el ideal → alert', () => {
    // ideal 68.75 × 1.25 = 85.94
    const evals = evaluate(makeRecord({ weight: 85.94 }), makeClient())
    expect(getEval(evals, 'weight').status).toBe('alert')
  })

  it('peso 15% bajo el ideal → warning (simetría)', () => {
    // ideal 68.75 × 0.85 = 58.44
    const evals = evaluate(makeRecord({ weight: 58.44 }), makeClient())
    expect(getEval(evals, 'weight').status).toBe('warning')
  })

  it('contextura gruesa eleva el ideal → mismo peso puede cambiar status', () => {
    // 75kg, contextura gruesa: ideal = 68.75 × 1.05 = 72.19, diff = 3.7% → normal
    const evals = evaluate(
      makeRecord({ weight: 75 }),
      makeClient({ wristContexture: 'thick' }),
    )
    expect(getEval(evals, 'weight').status).toBe('normal')

    // 75kg, contextura delgada: ideal = 68.75 × 0.95 = 65.31, diff = 14.8% → warning
    const evals2 = evaluate(
      makeRecord({ weight: 75 }),
      makeClient({ wristContexture: 'thin' }),
    )
    expect(getEval(evals2, 'weight').status).toBe('warning')
  })
})

describe('evaluate - calorías vs TMB', () => {
  it('calorías exactamente en TMB → normal', () => {
    // hombre 35 años, 75kg, 175cm: TMB ≈ 1673.75
    const evals = evaluate(
      makeRecord({ weight: 75, calories: 1674 }),
      makeClient(),
    )
    expect(getEval(evals, 'calories').status).toBe('normal')
  })

  it('calorías dentro de TMB + 300 → normal', () => {
    const evals = evaluate(
      makeRecord({ weight: 75, calories: 1900 }),
      makeClient(),
    )
    expect(getEval(evals, 'calories').status).toBe('normal')
  })

  it('calorías dentro de TMB - 300 → normal', () => {
    const evals = evaluate(
      makeRecord({ weight: 75, calories: 1450 }),
      makeClient(),
    )
    expect(getEval(evals, 'calories').status).toBe('normal')
  })

  it('calorías TMB + 500 → warning', () => {
    const evals = evaluate(
      makeRecord({ weight: 75, calories: 2200 }),
      makeClient(),
    )
    expect(getEval(evals, 'calories').status).toBe('warning')
  })

  it('calorías TMB - 500 → warning', () => {
    const evals = evaluate(
      makeRecord({ weight: 75, calories: 1100 }),
      makeClient(),
    )
    expect(getEval(evals, 'calories').status).toBe('warning')
  })
})

describe('evaluate - edad biológica', () => {
  it('bioAge igual a edad cronológica → normal', () => {
    const evals = evaluate(
      makeRecord({ bioAge: 35 }),
      makeClient({ age: 35 }),
    )
    expect(getEval(evals, 'bioAge').status).toBe('normal')
  })

  it('bioAge edad - 5 (límite inferior) → normal', () => {
    const evals = evaluate(
      makeRecord({ bioAge: 30 }),
      makeClient({ age: 35 }),
    )
    expect(getEval(evals, 'bioAge').status).toBe('normal')
  })

  it('bioAge edad + 5 (techo) → normal', () => {
    const evals = evaluate(
      makeRecord({ bioAge: 40 }),
      makeClient({ age: 35 }),
    )
    expect(getEval(evals, 'bioAge').status).toBe('normal')
  })

  it('bioAge menor a edad - 5 (mejor que cronológica) → normal', () => {
    const evals = evaluate(
      makeRecord({ bioAge: 25 }),
      makeClient({ age: 35 }),
    )
    expect(getEval(evals, 'bioAge').status).toBe('normal')
  })

  it('bioAge mayor a edad + 5 → warning', () => {
    const evals = evaluate(
      makeRecord({ bioAge: 45 }),
      makeClient({ age: 35 }),
    )
    expect(getEval(evals, 'bioAge').status).toBe('warning')
  })
})

describe('evaluate - API general', () => {
  it('siempre devuelve 7 evaluaciones en orden', () => {
    const evals = evaluate(makeRecord(), makeClient())
    expect(evals).toHaveLength(7)
    expect(evals.map((e) => e.key)).toEqual([
      'weight',
      'bmi',
      'bodyFatPct',
      'muscleMassPct',
      'calories',
      'bioAge',
      'visceralFat',
    ])
  })

  it('todas las métricas tienen value numérico (siempre requeridas)', () => {
    const evals = evaluate(makeRecord(), makeClient())
    for (const e of evals) {
      expect(typeof e.value).toBe('number')
      expect(Number.isFinite(e.value)).toBe(true)
    }
  })

  it('idealRange siempre presente', () => {
    const evals = evaluate(makeRecord(), makeClient())
    for (const e of evals) {
      expect(e.idealRange).not.toBeNull()
      expect(e.idealRange!.length).toBeGreaterThan(0)
    }
  })

  it('messageKey sigue el formato results.status.{status}', () => {
    const evals = evaluate(makeRecord(), makeClient())
    for (const e of evals) {
      expect(e.messageKey).toMatch(/^results\.status\.(normal|warning|alert)$/)
    }
  })

  it('weight.evaluation incluye contexture del cliente', () => {
    const evals = evaluate(
      makeRecord(),
      makeClient({ wristContexture: 'thick' }),
    )
    expect(getEval(evals, 'weight').contexture).toBe('thick')
  })

  it('las métricas que no son weight no incluyen contexture', () => {
    const evals = evaluate(
      makeRecord(),
      makeClient({ wristContexture: 'thin' }),
    )
    for (const e of evals) {
      if (e.key !== 'weight') {
        expect(e.contexture).toBeUndefined()
      }
    }
  })
})

// ╔════════════════════════════════════════════════════════════════════╗
// ║  ⚠️  TESTS DE CALIBRACIÓN POR CONTEXTURA                          ║
// ║                                                                  ║
// ║  Si rompés alguno de estos tests, sabés que el ajuste por         ║
// ║  contextura cambió. Ver MILESTONES.md → "PUNTO DE                ║
// ║  CALIBRACIÓN FUTURO" para saber dónde tocar las constantes.      ║
// ╚════════════════════════════════════════════════════════════════════╝

describe('evaluate - % grasa con contextura (CONTEXTURE)', () => {
  // CONTEXTURE: hombre 35 años, contextura thick, 28% grasa
  // Base (normal): 12-21 normal, 22-27 aceptable, ≥28 alert
  // Ajustado (thick): 12-21 normal, 22-28 aceptable, ≥29 alert
  // 28% cae en "aceptable" con thick, pero en "alert" con normal/thin
  it('thick frame amplía acceptableUpper +1% (28% → warning, no alert)', () => {
    const thick = evaluate(
      makeRecord({ bodyFatPct: 28 }),
      makeClient({ age: 35, gender: 'M', wristContexture: 'thick' }),
    )
    expect(getEval(thick, 'bodyFatPct').status).toBe('warning')

    const normal = evaluate(
      makeRecord({ bodyFatPct: 28 }),
      makeClient({ age: 35, gender: 'M', wristContexture: 'normal' }),
    )
    expect(getEval(normal, 'bodyFatPct').status).toBe('alert')
  })

  // CONTEXTURE: mujer 35 años, contextura thin, 16% grasa
  // Base (normal): 17-25 normal, 26-32 aceptable, ≥33 alert
  // Ajustado (thin): 16-25 normal, 26-32 aceptable, ≥33 alert
  // 16% es normal con thin (lower -1), warning con normal
  it('thin frame reduce lower -1% (16% → normal, no warning)', () => {
    const thin = evaluate(
      makeRecord({ bodyFatPct: 16 }),
      makeClient({ age: 35, gender: 'F', wristContexture: 'thin' }),
    )
    expect(getEval(thin, 'bodyFatPct').status).toBe('normal')

    const normal = evaluate(
      makeRecord({ bodyFatPct: 16 }),
      makeClient({ age: 35, gender: 'F', wristContexture: 'normal' }),
    )
    expect(getEval(normal, 'bodyFatPct').status).toBe('warning')
  })

  // CONTEXTURE: con contextura normal NO hay ajustes
  it('normal frame mantiene rangos ACE base', () => {
    const evals = evaluate(
      makeRecord({ bodyFatPct: 19 }),
      makeClient({ age: 35, gender: 'M', wristContexture: 'normal' }),
    )
    // bracket 30-39 M: 12-21 normal, 22-27 aceptable, ≥28 alert
    expect(getEval(evals, 'bodyFatPct').status).toBe('normal')
  })
})

describe('evaluate - % músculo con contextura (CONTEXTURE)', () => {
  // CONTEXTURE: hombre 35 años, contextura thick, 41% músculo
  // Base (normal): ≥40 normal
  // Ajustado (thick): ≥42 normal
  // 41% cae en warning con thick, normal con normal
  it('thick frame sube lower +2% (41% → warning, no normal)', () => {
    const thick = evaluate(
      makeRecord({ muscleMassPct: 41 }),
      makeClient({ age: 35, gender: 'M', wristContexture: 'thick' }),
    )
    expect(getEval(thick, 'muscleMassPct').status).toBe('warning')

    const normal = evaluate(
      makeRecord({ muscleMassPct: 41 }),
      makeClient({ age: 35, gender: 'M', wristContexture: 'normal' }),
    )
    expect(getEval(normal, 'muscleMassPct').status).toBe('normal')
  })

  // CONTEXTURE: hombre 35 años, contextura thin, 38% músculo
  // Base (normal): ≥40 normal
  // Ajustado (thin): ≥38 normal
  // 38% es normal con thin, warning con normal
  it('thin frame baja lower -2% (38% → normal, no warning)', () => {
    const thin = evaluate(
      makeRecord({ muscleMassPct: 38 }),
      makeClient({ age: 35, gender: 'M', wristContexture: 'thin' }),
    )
    expect(getEval(thin, 'muscleMassPct').status).toBe('normal')

    const normal = evaluate(
      makeRecord({ muscleMassPct: 38 }),
      makeClient({ age: 35, gender: 'M', wristContexture: 'normal' }),
    )
    expect(getEval(normal, 'muscleMassPct').status).toBe('warning')
  })

  // CONTEXTURE: ajustes no rompen el piso mínimo (thin frame en % grasa 3%)
  it('thin frame respeta piso mínimo de lower (no baja de 3)', () => {
    // hombre 30-39: lower base = 12, thin → 11 (no toca piso)
    // hombre 60+: lower base = 17, thin → 16 (no toca piso)
    const evals = evaluate(
      makeRecord({ bodyFatPct: 4 }),
      makeClient({ age: 65, gender: 'M', wristContexture: 'thin' }),
    )
    // bracket 60+ M: lower base 17, thin → 16. 4% < 16 → warning
    expect(getEval(evals, 'bodyFatPct').status).toBe('warning')
  })
})