import { validateCsvHeaders, EXPERIENCE_TEMPLATE_HEADERS } from '../templates'

describe('validateCsvHeaders', () => {
  it('accepts matching headers', () => {
    const result = validateCsvHeaders([...EXPERIENCE_TEMPLATE_HEADERS], EXPERIENCE_TEMPLATE_HEADERS)
    expect(result.ok).toBe(true)
    expect(result.missing).toHaveLength(0)
    expect(result.unexpected).toHaveLength(0)
    expect(result.outOfOrder).toHaveLength(0)
  })

  it('flags missing headers', () => {
    const headers = [...EXPERIENCE_TEMPLATE_HEADERS]
    headers.splice(3, 1)
    const result = validateCsvHeaders(headers, EXPERIENCE_TEMPLATE_HEADERS)
    expect(result.ok).toBe(false)
    expect(result.missing).toContain('Apr-2024')
  })

  it('flags unexpected headers', () => {
    const headers = [...EXPERIENCE_TEMPLATE_HEADERS, 'ExtraColumn']
    const result = validateCsvHeaders(headers, EXPERIENCE_TEMPLATE_HEADERS)
    expect(result.ok).toBe(false)
    expect(result.unexpected).toContain('ExtraColumn')
  })

  it('flags out of order headers', () => {
    const headers = [...EXPERIENCE_TEMPLATE_HEADERS]
    const [first, second] = headers.slice(1, 3)
    headers[1] = second
    headers[2] = first
    const result = validateCsvHeaders(headers, EXPERIENCE_TEMPLATE_HEADERS)
    expect(result.ok).toBe(false)
    expect(result.outOfOrder).toEqual(expect.arrayContaining([first, second]))
  })
})
