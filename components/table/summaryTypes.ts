export type ValueType = 'currency' | 'number' | 'percent'

export type FieldSource = 'experience' | 'financial' | 'fee'

export interface AvailableField {
  id: string
  label: string
  source: FieldSource
  description?: string
  valueType: ValueType
}
