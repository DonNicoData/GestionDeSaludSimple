import { describe, it, expect } from 'vitest'
import { validateField, validateMetricField } from '../validation'

describe('requiredNumberField — separador decimal (punto o coma)', () => {
  it('acepta punto como decimal (22.5)', () => {
    expect(validateMetricField('bmi', '22.5')).toBeNull()
  })

  it('acepta coma como decimal (22,5)', () => {
    expect(validateMetricField('bmi', '22,5')).toBeNull()
  })

  it('acepta coma al inicio mientras se tipea (,5)', () => {
    // ',5' se normaliza a '.5' → 0.5, fuera del rango BMI 10-60.
    // Lo importante: llega al check de rango (no es 'invalidNumber'),
    // lo que prueba que la coma fue aceptada como separador decimal.
    expect(validateMetricField('bmi', ',5')).toBe('bmiOutOfRange')
  })

  it('acepta coma al final mientras se tipea (22,)', () => {
    expect(validateMetricField('bmi', '22,')).toBeNull()
  })

  it('rechaza dos separadores mezclados (22,5.3)', () => {
    expect(validateMetricField('bmi', '22,5.3')).toBe('invalidNumber')
  })

  it('rechaza texto no numérico', () => {
    expect(validateMetricField('bmi', 'abc')).toBe('invalidNumber')
  })

  it('mantiene validación de rango (150 fuera de 10-60)', () => {
    expect(validateMetricField('bmi', '150')).toBe('bmiOutOfRange')
  })

  it('acepta coma en heightCm (180,5)', () => {
    expect(validateField('heightCm', '180,5')).toBeNull()
  })

  it('acepta coma en weight (75,3)', () => {
    expect(validateMetricField('weight', '75,3')).toBeNull()
  })

  it('acepta coma en bodyFatPct (18,7)', () => {
    expect(validateMetricField('bodyFatPct', '18,7')).toBeNull()
  })
})