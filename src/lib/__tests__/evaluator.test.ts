import { describe, expect, it } from 'vitest'
import {
  basalMetabolicRate,
  calculateBmi,
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
    bmi: 0,
    bodyFatPct: 0,
    muscleMassPct: 0,
    calories: 2000,
    bioAge: 0,
    visceralFat: 5,
    ...overrides,
  }
}

function getStatus(
  evals: ReturnType<typeof evaluate>,
  key: 'weight' | 'bmi' | 'bodyFatPct' | 'muscleMassPct' | 'calories' | 'bioAge' | 'visceralFat',
) {
  const found = evals.find((e) => e.key === key)
  if (!found) throw new Error(`No evaluation found for ${key}`)
  return found
}

describe('calculateBmi', () => {
  it('calcula correctamente con valores válidos', () => {
    expect(calculateBmi(75, 175)).toBeCloseTo(24.49, 2)
    expect(calculateBmi(60, 160)).toBeCloseTo(23.44, 2)
  })

  it('devuelve 0 si el peso o la altura son 0', () => {
    expect(calculateBmi(0, 175)).toBe(0)
    expect(calculateBmi(75, 0)).toBe(0)
  })
})

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
    expect(getStatus(evals, 'bmi').status).toBe('warning')
  })

  it('IMC 18.5 → normal', () => {
    const evals = evaluate(makeRecord({ bmi: 18.5 }), makeClient())
    expect(getStatus(evals, 'bmi').status).toBe('normal')
  })

  it('IMC 22 (centro del rango) → normal', () => {
    const evals = evaluate(makeRecord({ bmi: 22 }), makeClient())
    expect(getStatus(evals, 'bmi').status).toBe('normal')
  })

  it('IMC 24.9 (techo del rango) → normal', () => {
    const evals = evaluate(makeRecord({ bmi: 24.9 }), makeClient())
    expect(getStatus(evals, 'bmi').status).toBe('normal')
  })

  it('IMC 25 → warning (sobrepeso)', () => {
    const evals = evaluate(makeRecord({ bmi: 25 }), makeClient())
    expect(getStatus(evals, 'bmi').status).toBe('warning')
  })

  it('IMC 29.9 → warning', () => {
    const evals = evaluate(makeRecord({ bmi: 29.9 }), makeClient())
    expect(getStatus(evals, 'bmi').status).toBe('warning')
  })

  it('IMC 30 → alert (obesidad)', () => {
    const evals = evaluate(makeRecord({ bmi: 30 }), makeClient())
    expect(getStatus(evals, 'bmi').status).toBe('alert')
  })

  it('IMC 40 → alert', () => {
    const evals = evaluate(makeRecord({ bmi: 40 }), makeClient())
    expect(getStatus(evals, 'bmi').status).toBe('alert')
  })

  it('IMC calculado a partir de peso y altura si está en 0', () => {
    // 75 / (1.75²) = 24.49 → normal
    const evals = evaluate(
      makeRecord({ weight: 75, bmi: 0 }),
      makeClient({ heightCm: 175 }),
    )
    const bmiEval = getStatus(evals, 'bmi')
    expect(bmiEval.provided).toBe(true)
    expect(bmiEval.value).toBeCloseTo(24.49, 2)
    expect(bmiEval.status).toBe('normal')
  })

  it('IMC como not-provided si no se puede calcular', () => {
    // weight=0 no es posible por validación, pero defensivo
    const evals = evaluate(
      makeRecord({ weight: 0, bmi: 0 }),
      makeClient({ heightCm: 0 }),
    )
    const bmiEval = getStatus(evals, 'bmi')
    expect(bmiEval.provided).toBe(false)
    expect(bmiEval.value).toBeNull()
  })
})

describe('evaluate - % grasa (rangos por edad × género)', () => {
  it('hombre 35 años, 19% → normal (rango 12-21)', () => {
    const evals = evaluate(
      makeRecord({ bodyFatPct: 19 }),
      makeClient({ age: 35, gender: 'M' }),
    )
    expect(getStatus(evals, 'bodyFatPct').status).toBe('normal')
  })

  it('hombre 35 años, 25% → warning (aceptable)', () => {
    const evals = evaluate(
      makeRecord({ bodyFatPct: 25 }),
      makeClient({ age: 35, gender: 'M' }),
    )
    expect(getStatus(evals, 'bodyFatPct').status).toBe('warning')
  })

  it('hombre 35 años, 28% → alert', () => {
    const evals = evaluate(
      makeRecord({ bodyFatPct: 28 }),
      makeClient({ age: 35, gender: 'M' }),
    )
    expect(getStatus(evals, 'bodyFatPct').status).toBe('alert')
  })

  it('hombre 35 años, 10% → warning (demasiado bajo)', () => {
    const evals = evaluate(
      makeRecord({ bodyFatPct: 10 }),
      makeClient({ age: 35, gender: 'M' }),
    )
    expect(getStatus(evals, 'bodyFatPct').status).toBe('warning')
  })

  it('mujer 25 años, 20% → normal (rango 16-24)', () => {
    const evals = evaluate(
      makeRecord({ bodyFatPct: 20 }),
      makeClient({ age: 25, gender: 'F' }),
    )
    expect(getStatus(evals, 'bodyFatPct').status).toBe('normal')
  })

  it('mujer 50 años, 35% → warning (rango 22-30, alerta ≥37)', () => {
    const evals = evaluate(
      makeRecord({ bodyFatPct: 35 }),
      makeClient({ age: 50, gender: 'F' }),
    )
    // 22-30 normal, 31-36 aceptable, ≥37 alert. 35 está en aceptable.
    expect(getStatus(evals, 'bodyFatPct').status).toBe('warning')
  })

  it('mujer 50 años, 38% → alert', () => {
    const evals = evaluate(
      makeRecord({ bodyFatPct: 38 }),
      makeClient({ age: 50, gender: 'F' }),
    )
    expect(getStatus(evals, 'bodyFatPct').status).toBe('alert')
  })

  it('brackets etarios respetan fronteras', () => {
    // 40 años cae en bracket 40-49
    const evals40 = evaluate(
      makeRecord({ bodyFatPct: 25 }),
      makeClient({ age: 40, gender: 'M' }),
    )
    // bracket 40-49 M: 14-23 normal, 24-29 aceptable, ≥30 alert
    expect(getStatus(evals40, 'bodyFatPct').status).toBe('warning')

    // 39 años cae en bracket 30-39
    const evals39 = evaluate(
      makeRecord({ bodyFatPct: 25 }),
      makeClient({ age: 39, gender: 'M' }),
    )
    // bracket 30-39 M: 12-21 normal, 22-27 aceptable, ≥28 alert
    expect(getStatus(evals39, 'bodyFatPct').status).toBe('warning')
  })

  it('no provisto (0) → provided=false', () => {
    const evals = evaluate(makeRecord({ bodyFatPct: 0 }), makeClient())
    expect(getStatus(evals, 'bodyFatPct').provided).toBe(false)
  })
})

describe('evaluate - % masa muscular', () => {
  it('hombre 35 años, 45% → normal (≥40)', () => {
    const evals = evaluate(
      makeRecord({ muscleMassPct: 45 }),
      makeClient({ age: 35, gender: 'M' }),
    )
    expect(getStatus(evals, 'muscleMassPct').status).toBe('normal')
  })

  it('hombre 35 años, 38% → warning (<40)', () => {
    const evals = evaluate(
      makeRecord({ muscleMassPct: 38 }),
      makeClient({ age: 35, gender: 'M' }),
    )
    expect(getStatus(evals, 'muscleMassPct').status).toBe('warning')
  })

  it('mujer 45 años, 30% → normal (≥29)', () => {
    const evals = evaluate(
      makeRecord({ muscleMassPct: 30 }),
      makeClient({ age: 45, gender: 'F' }),
    )
    expect(getStatus(evals, 'muscleMassPct').status).toBe('normal')
  })

  it('mujer 45 años, 25% → warning (<29)', () => {
    const evals = evaluate(
      makeRecord({ muscleMassPct: 25 }),
      makeClient({ age: 45, gender: 'F' }),
    )
    expect(getStatus(evals, 'muscleMassPct').status).toBe('warning')
  })

  it('no se penaliza masa muscular alta (atlético)', () => {
    const evals = evaluate(
      makeRecord({ muscleMassPct: 55 }),
      makeClient({ age: 35, gender: 'M' }),
    )
    expect(getStatus(evals, 'muscleMassPct').status).toBe('normal')
  })
})

describe('evaluate - grasa visceral', () => {
  it('nivel 5 → normal', () => {
    const evals = evaluate(makeRecord({ visceralFat: 5 }), makeClient())
    expect(getStatus(evals, 'visceralFat').status).toBe('normal')
  })

  it('nivel 9 (techo) → normal', () => {
    const evals = evaluate(makeRecord({ visceralFat: 9 }), makeClient())
    expect(getStatus(evals, 'visceralFat').status).toBe('normal')
  })

  it('nivel 10 → warning', () => {
    const evals = evaluate(makeRecord({ visceralFat: 10 }), makeClient())
    expect(getStatus(evals, 'visceralFat').status).toBe('warning')
  })

  it('nivel 14 (techo) → warning', () => {
    const evals = evaluate(makeRecord({ visceralFat: 14 }), makeClient())
    expect(getStatus(evals, 'visceralFat').status).toBe('warning')
  })

  it('nivel 15 → alert', () => {
    const evals = evaluate(makeRecord({ visceralFat: 15 }), makeClient())
    expect(getStatus(evals, 'visceralFat').status).toBe('alert')
  })

  it('nivel 25 → alert', () => {
    const evals = evaluate(makeRecord({ visceralFat: 25 }), makeClient())
    expect(getStatus(evals, 'visceralFat').status).toBe('alert')
  })
})

describe('evaluate - peso vs ideal (Lorentz)', () => {
  it('peso exactamente igual al ideal → normal', () => {
    // hombre 175cm normal: ideal ≈ 68.75
    const evals = evaluate(makeRecord({ weight: 68.75 }), makeClient())
    expect(getStatus(evals, 'weight').status).toBe('normal')
  })

  it('peso 8% sobre el ideal → normal', () => {
    // ideal 68.75 + 8% = 74.25
    const evals = evaluate(makeRecord({ weight: 74.25 }), makeClient())
    expect(getStatus(evals, 'weight').status).toBe('normal')
  })

  it('peso 15% sobre el ideal → warning', () => {
    // ideal 68.75 × 1.15 = 79.06
    const evals = evaluate(makeRecord({ weight: 79.06 }), makeClient())
    expect(getStatus(evals, 'weight').status).toBe('warning')
  })

  it('peso 25% sobre el ideal → alert', () => {
    // ideal 68.75 × 1.25 = 85.94
    const evals = evaluate(makeRecord({ weight: 85.94 }), makeClient())
    expect(getStatus(evals, 'weight').status).toBe('alert')
  })

  it('peso 15% bajo el ideal → warning (simetría)', () => {
    // ideal 68.75 × 0.85 = 58.44
    const evals = evaluate(makeRecord({ weight: 58.44 }), makeClient())
    expect(getStatus(evals, 'weight').status).toBe('warning')
  })

  it('contextura gruesa eleva el ideal → mismo peso puede cambiar status', () => {
    // 75kg, contextura gruesa: ideal = 68.75 × 1.05 = 72.19, diff = 3.7% → normal
    const evals = evaluate(
      makeRecord({ weight: 75 }),
      makeClient({ wristContexture: 'thick' }),
    )
    expect(getStatus(evals, 'weight').status).toBe('normal')

    // 75kg, contextura delgada: ideal = 68.75 × 0.95 = 65.31, diff = 14.8% → warning
    const evals2 = evaluate(
      makeRecord({ weight: 75 }),
      makeClient({ wristContexture: 'thin' }),
    )
    expect(getStatus(evals2, 'weight').status).toBe('warning')
  })
})

describe('evaluate - calorías vs TMB', () => {
  it('calorías exactamente en TMB → normal', () => {
    // hombre 35 años, 75kg, 175cm: TMB ≈ 1673.75
    const evals = evaluate(
      makeRecord({ weight: 75, calories: 1674 }),
      makeClient(),
    )
    expect(getStatus(evals, 'calories').status).toBe('normal')
  })

  it('calorías dentro de TMB + 300 → normal', () => {
    const evals = evaluate(
      makeRecord({ weight: 75, calories: 1900 }),
      makeClient(),
    )
    expect(getStatus(evals, 'calories').status).toBe('normal')
  })

  it('calorías dentro de TMB - 300 → normal', () => {
    const evals = evaluate(
      makeRecord({ weight: 75, calories: 1450 }),
      makeClient(),
    )
    expect(getStatus(evals, 'calories').status).toBe('normal')
  })

  it('calorías TMB + 500 → warning', () => {
    const evals = evaluate(
      makeRecord({ weight: 75, calories: 2200 }),
      makeClient(),
    )
    expect(getStatus(evals, 'calories').status).toBe('warning')
  })

  it('calorías TMB - 500 → warning', () => {
    const evals = evaluate(
      makeRecord({ weight: 75, calories: 1100 }),
      makeClient(),
    )
    expect(getStatus(evals, 'calories').status).toBe('warning')
  })
})

describe('evaluate - edad biológica', () => {
  it('bioAge igual a edad cronológica → normal', () => {
    const evals = evaluate(
      makeRecord({ bioAge: 35 }),
      makeClient({ age: 35 }),
    )
    expect(getStatus(evals, 'bioAge').status).toBe('normal')
  })

  it('bioAge edad - 5 (límite inferior) → normal', () => {
    const evals = evaluate(
      makeRecord({ bioAge: 30 }),
      makeClient({ age: 35 }),
    )
    expect(getStatus(evals, 'bioAge').status).toBe('normal')
  })

  it('bioAge edad + 5 (techo) → normal', () => {
    const evals = evaluate(
      makeRecord({ bioAge: 40 }),
      makeClient({ age: 35 }),
    )
    expect(getStatus(evals, 'bioAge').status).toBe('normal')
  })

  it('bioAge menor a edad - 5 (mejor que cronológica) → normal', () => {
    const evals = evaluate(
      makeRecord({ bioAge: 25 }),
      makeClient({ age: 35 }),
    )
    expect(getStatus(evals, 'bioAge').status).toBe('normal')
  })

  it('bioAge mayor a edad + 5 → warning', () => {
    const evals = evaluate(
      makeRecord({ bioAge: 45 }),
      makeClient({ age: 35 }),
    )
    expect(getStatus(evals, 'bioAge').status).toBe('warning')
  })

  it('no provisto (0) → provided=false', () => {
    const evals = evaluate(makeRecord({ bioAge: 0 }), makeClient())
    expect(getStatus(evals, 'bioAge').provided).toBe(false)
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

  it('idealRange siempre presente para métricas requeridas', () => {
    const evals = evaluate(makeRecord(), makeClient())
    for (const e of evals) {
      if (e.provided) {
        expect(e.idealRange).not.toBeNull()
        expect(e.idealRange!.length).toBeGreaterThan(0)
      }
    }
  })

  it('métricas no provistas tienen provided=false y value=null', () => {
    const evals = evaluate(
      makeRecord({ bodyFatPct: 0, muscleMassPct: 0, bioAge: 0 }),
      makeClient(),
    )
    expect(getStatus(evals, 'bodyFatPct').provided).toBe(false)
    expect(getStatus(evals, 'bodyFatPct').value).toBeNull()
    expect(getStatus(evals, 'muscleMassPct').provided).toBe(false)
    expect(getStatus(evals, 'muscleMassPct').value).toBeNull()
    expect(getStatus(evals, 'bioAge').provided).toBe(false)
    expect(getStatus(evals, 'bioAge').value).toBeNull()
  })

  it('messageKey sigue el formato results.status.{status}', () => {
    const evals = evaluate(makeRecord(), makeClient())
    for (const e of evals) {
      expect(e.messageKey).toMatch(/^results\.status\.(normal|warning|alert)$/)
    }
  })
})