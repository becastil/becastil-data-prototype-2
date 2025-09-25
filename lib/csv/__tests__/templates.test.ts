import { validateCsvHeaders, validateExperienceHeaders, HIGH_COST_TEMPLATE_HEADERS } from '../templates'

describe('validateExperienceHeaders', () => {
  it('accepts dynamic month headers', () => {
    const headers = ['Category', 'Jan-2025', 'Feb-2025', 'Mar-2025']
    const result = validateExperienceHeaders(headers)
    expect(result.ok).toBe(true)
    expect(result.monthHeaders).toEqual(['Jan-2025', 'Feb-2025', 'Mar-2025'])
  })

  it('flags invalid month labels', () => {
    const headers = ['Category', 'January-2025']
    const result = validateExperienceHeaders(headers)
    expect(result.ok).toBe(false)
    expect(result.unexpected).toContain('January-2025')
  })

  it('requires category column first', () => {
    const headers = ['Jan-2025', 'Category', 'Feb-2025']
    const result = validateExperienceHeaders(headers)
    expect(result.ok).toBe(false)
    expect(result.outOfOrder).toContain('Category')
    expect(result.monthHeaders).toEqual(['Jan-2025', 'Feb-2025'])
  })

  it('flags duplicate months', () => {
    const headers = ['Category', 'Jan-2025', 'Jan-2025']
    const result = validateExperienceHeaders(headers)
    expect(result.ok).toBe(false)
    expect(result.unexpected).toContain('Duplicate: Jan-2025')
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
