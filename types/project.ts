import { z } from 'zod'

const optionalEmail = z
  .union([z.string().email('Invalid email format'), z.literal('')])
  .optional()

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
})

export type ProjectFormData = z.infer<typeof projectSchema>
