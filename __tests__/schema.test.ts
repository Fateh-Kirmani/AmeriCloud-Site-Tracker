import { projectSchema } from '@/types/project'

const validBase = {
  site_name: 'Test Site',
  address: '123 Main St',
  americloud_site_id: 'AC-001',
  client: 'AT&T',
}

describe('projectSchema', () => {
  it('accepts valid required-only data', () => {
    expect(projectSchema.safeParse(validBase).success).toBe(true)
  })

  it('rejects empty site_name', () => {
    expect(projectSchema.safeParse({ ...validBase, site_name: '' }).success).toBe(false)
  })

  it('rejects empty address', () => {
    expect(projectSchema.safeParse({ ...validBase, address: '' }).success).toBe(false)
  })

  it('rejects empty americloud_site_id', () => {
    expect(projectSchema.safeParse({ ...validBase, americloud_site_id: '' }).success).toBe(false)
  })

  it('rejects empty client', () => {
    expect(projectSchema.safeParse({ ...validBase, client: '' }).success).toBe(false)
  })

  it('rejects invalid pm_email', () => {
    expect(projectSchema.safeParse({ ...validBase, pm_email: 'not-an-email' }).success).toBe(false)
  })

  it('accepts empty string pm_email (field is optional)', () => {
    expect(projectSchema.safeParse({ ...validBase, pm_email: '' }).success).toBe(true)
  })

  it('rejects invalid rf_engineer_email', () => {
    expect(projectSchema.safeParse({ ...validBase, rf_engineer_email: 'bad' }).success).toBe(false)
  })

  it('accepts a fully populated payload', () => {
    const result = projectSchema.safeParse({
      ...validBase,
      client_site_id: 'CLI-001',
      pm_name: 'Jane Doe',
      pm_email: 'jane@example.com',
      pm_phone: '555-0100',
      rf_engineer_name: 'Bob Smith',
      rf_engineer_email: 'bob@example.com',
      rf_engineer_phone: '555-0200',
      americloud_pm: 'John Smith',
      americloud_rf: 'Robert Chen',
      project_scope: 'Full tower build',
      project_template: 'Standard Cell Tower',
    })
    expect(result.success).toBe(true)
  })
})
