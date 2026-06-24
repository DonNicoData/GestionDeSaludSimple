export type Gender = 'F' | 'M'

export type WristContexture = 'thin' | 'normal' | 'thick'

export type MetricStatus = 'normal' | 'warning' | 'alert'

export type Language = 'es' | 'en'

export interface Client {
  id?: number
  name: string
  birthDate: string
  age: number
  gender: Gender
  heightCm: number
  wristContexture: WristContexture
  createdAt: Date
}

export interface Record {
  id?: number
  clientId: number
  date: Date
  weight: number
  bmi: number
  bodyFatPct: number
  muscleMassPct: number
  calories: number
  bioAge: number
  visceralFat: number
  notes?: string
}
