import { formatJobSiteAddress } from '@/lib/formatJobSiteAddress'

describe('formatJobSiteAddress', () => {
  it('joins all four parts with the standard comma layout', () => {
    expect(formatJobSiteAddress('123 Main St', 'New York', 'NY', '10001'))
      .toBe('123 Main St, New York, NY 10001')
  })

  it('omits state and zip cleanly when both are missing', () => {
    expect(formatJobSiteAddress('123 Main St', 'New York', '', ''))
      .toBe('123 Main St, New York')
  })

  it('omits zip cleanly when only zip is missing', () => {
    expect(formatJobSiteAddress('123 Main St', 'New York', 'NY', ''))
      .toBe('123 Main St, New York, NY')
  })

  it('treats null/undefined the same as empty string', () => {
    expect(formatJobSiteAddress('123 Main St', 'New York', null, undefined))
      .toBe('123 Main St, New York')
  })

  it('returns an empty string when every part is missing', () => {
    expect(formatJobSiteAddress('', '', '', '')).toBe('')
  })
})
