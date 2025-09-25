import { validateCsvHeaders, validateExperienceHeaders, HIGH_COST_TEMPLATE_HEADERS } from '../templates'

describe('validateExperienceHeaders', () => {
  it('accepts dynamic date headers', () => {
    const headers = ['Category', '1/1/2025', '2/1/2025', '3/1/2025']
    const result = validateExperienceHeaders(headers)
    expect(result.ok).toBe(true)
    expect(result.monthHeaders).toEqual(['1/1/2025', '2/1/2025', '3/1/2025'])
  })

  it('flags invalid date formats', () => {
    const headers = ['Category', 'Jan-2025']
    const result = validateExperienceHeaders(headers)
    expect(result.ok).toBe(false)
    expect(result.unexpected).toContain('Jan-2025')
  })

  it('flags dates not on first day of month', () => {
    const headers = ['Category', '1/15/2025']
    const result = validateExperienceHeaders(headers)
    expect(result.ok).toBe(false)
    expect(result.unexpected).toContain('1/15/2025 (must be 1st day of month)')
  })

  it('requires category column first', () => {
    const headers = ['1/1/2025', 'Category', '2/1/2025']
    const result = validateExperienceHeaders(headers)
    expect(result.ok).toBe(false)
    expect(result.outOfOrder).toContain('Category')
    expect(result.monthHeaders).toEqual(['1/1/2025', '2/1/2025'])
  })

  it('flags duplicate dates', () => {
    const headers = ['Category', '1/1/2025', '1/1/2025']
    const result = validateExperienceHeaders(headers)
    expect(result.ok).toBe(false)
    expect(result.unexpected).toContain('Duplicate: 1/1/2025')
  })

  it('accepts double-digit months', () => {
    const headers = ['Category', '10/1/2025', '11/1/2025', '12/1/2025']
    const result = validateExperienceHeaders(headers)
    expect(result.ok).toBe(true)
    expect(result.monthHeaders).toEqual(['10/1/2025', '11/1/2025', '12/1/2025'])
  })
})

describe('validateCsvHeaders (exact match)', () => {
  it('accepts exact high-cost headers', () => {
    const result = validateCsvHeaders([...HIGH_COST_TEMPLATE_HEADERS], HIGH_COST_TEMPLATE_HEADERS)
    expect(result.ok).toBe(true)
  })

  it('flags missing high-cost headers', () => {
    const headers = [...HIGH_COST_TEMPLATE_HEADERS]
    headers.pop()
    const result = validateCsvHeaders(headers, HIGH_COST_TEMPLATE_HEADERS)
    expect(result.ok).toBe(false)
    expect(result.missing.length).toBeGreaterThan(0)
  })
})
