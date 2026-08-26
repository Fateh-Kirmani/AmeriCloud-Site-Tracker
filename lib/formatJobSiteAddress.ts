// lib/formatJobSiteAddress.ts
export function formatJobSiteAddress(
  street: string | null | undefined,
  city: string | null | undefined,
  state: string | null | undefined,
  zipCode: string | null | undefined
): string {
  const line1 = street?.trim() || ''
  const stateZip = [state?.trim(), zipCode?.trim()].filter(Boolean).join(' ')
  const line2 = [city?.trim(), stateZip].filter(Boolean).join(', ')
  return [line1, line2].filter(Boolean).join(', ')
}
