// components/forms/ImportToBomButton.tsx
'use client'

import { formatJobSiteAddress } from '@/lib/formatJobSiteAddress'

const DEFAULT_BOM_ESTIMATOR_URL = 'https://americloud-das-pricing-calculator.vercel.app'

export default function ImportToBomButton({
  client,
  project,
  street,
  city,
  state,
  zipCode,
  projectOverview,
}: {
  client: string
  project: string
  street: string
  city: string
  state: string
  zipCode: string
  projectOverview: string
}) {
  const bomEstimatorUrl = (
    process.env.NEXT_PUBLIC_BOM_ESTIMATOR_URL ?? DEFAULT_BOM_ESTIMATOR_URL
  ).replace(/\/+$/, '')
  const params = new URLSearchParams({
    client,
    project,
    jobSiteAddress: formatJobSiteAddress(street, city, state, zipCode),
    projectOverview,
  })
  const href = `${bomEstimatorUrl}/import?${params.toString()}`

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Import To DAS Estimator (opens in a new tab)"
      className="inline-flex shrink-0 items-center justify-center border border-[#1E3A5F] text-[#94A3B8] hover:text-white hover:border-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm uppercase tracking-widest"
    >
      Import To DAS Estimator
    </a>
  )
}
