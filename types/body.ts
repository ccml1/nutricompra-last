export type Sex = 'male' | 'female'

/** Lo que se envía para estimar el peso por foto (POST /body/estimate-weight). */
export interface WeightEstimateRequest {
  image: string
  sex: Sex
  age: number
  heightCm: number
}

/** Peso aproximado y su rango, ya acotados por el backend a lo posible para la estatura. */
export interface WeightEstimate {
  weightKg: number
  lowKg: number
  highKg: number
}
