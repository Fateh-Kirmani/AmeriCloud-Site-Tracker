import { z } from 'zod'

const optionalEmail = z
  .union([z.string().email('Invalid email format'), z.literal('')])
  .optional()

export const STATUS_VALUES = ['Active', 'On Hold', 'Completed', 'Cancelled'] as const
export type ProjectStatus = (typeof STATUS_VALUES)[number]

export const projectSchema = z.object({
  site_name: z.string().trim().min(1, 'Site name is required'),
  address: z.string().trim().min(1, 'Address is required'),
  americloud_site_id: z.string().trim().min(1, 'AmeriCloud Site ID is required'),
  client: z.string().trim().min(1, 'Client is required'),
  client_site_id: z.string().optional(),
  pm_name: z.string().optional(),
  pm_email: optionalEmail,
  pm_phone: z.string().optional(),
  rf_engineer_name: z.string().optional(),
  rf_engineer_email: optionalEmail,
  rf_engineer_phone: z.string().optional(),
  americloud_pm: z.string().optional(),
  americloud_rf: z.string().optional(),
  project_scope: z.string().optional(),
  project_template: z.string().optional(),
  status: z.enum(STATUS_VALUES).default('Active'),
})

export type ProjectFormData = z.infer<typeof projectSchema>

export type Project = {
  id: string
  site_name: string
  address: string
  americloud_site_id: string
  client: string
  client_site_id: string | null
  pm_name: string | null
  pm_email: string | null
  pm_phone: string | null
  rf_engineer_name: string | null
  rf_engineer_email: string | null
  rf_engineer_phone: string | null
  americloud_pm: string | null
  americloud_rf: string | null
  project_scope: string | null
  project_template: string | null
  created_at: string
  status: string
}
