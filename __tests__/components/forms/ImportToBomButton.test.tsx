import { render, screen } from '@testing-library/react'
import ImportToBomButton from '@/components/forms/ImportToBomButton'

describe('ImportToBomButton', () => {
  const props = {
    client: 'AT&T',
    project: 'Test Site',
    street: '123 Main St',
    city: 'New York',
    state: 'NY',
    zipCode: '10001',
    projectOverview: 'Install new DAS equipment.',
  }

  it('links to the BOM Estimator /import route with the four fields encoded', () => {
    render(<ImportToBomButton {...props} />)
    const link = screen.getByRole('link', { name: /import to bom estimator/i })
    const url = new URL(link.getAttribute('href')!)

    expect(url.origin + url.pathname).toBe('https://americloud-das-pricing-calculator.vercel.app/import')
    expect(url.searchParams.get('client')).toBe('AT&T')
    expect(url.searchParams.get('project')).toBe('Test Site')
    expect(url.searchParams.get('jobSiteAddress')).toBe('123 Main St, New York, NY 10001')
    expect(url.searchParams.get('projectOverview')).toBe('Install new DAS equipment.')
  })

  it('opens in a new tab safely', () => {
    render(<ImportToBomButton {...props} />)
    const link = screen.getByRole('link', { name: /import to bom estimator/i })
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'))
  })

  it('omits missing state/zip from the encoded address without crashing', () => {
    render(<ImportToBomButton {...props} state="" zipCode="" />)
    const link = screen.getByRole('link', { name: /import to bom estimator/i })
    const url = new URL(link.getAttribute('href')!)
    expect(url.searchParams.get('jobSiteAddress')).toBe('123 Main St, New York')
  })
})
