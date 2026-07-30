'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { projectSchema, ProjectFormData, STATUS_VALUES } from '@/types/project'
import FormCard from '@/components/FormCard'
import Toast from '@/components/Toast'
import ClientSelect from '@/components/forms/ClientSelect'
import { generateProjectCode } from '@/lib/clients'

const AMERICLOUD_PMS = ['John Smith', 'Sarah Johnson', 'Mike Davis']
const AMERICLOUD_RFS = ['Robert Chen', 'Lisa Park', 'David Wilson']

function inputClass(hasError: boolean) {
  return `w-full bg-[#0B1929] border ${
    hasError ? 'border-[#F87171]' : 'border-[#1E3A5F]'
  } rounded-md px-3 py-2.5 text-white text-sm placeholder-[#8899AA] focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-transparent transition-colors`
}

function Field({
  label,
  error,
  required,
  hint,
  children,
}: {
  label: string
  error?: string
  required?: boolean
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="flex flex-col gap-1.5">
        <span className="text-[#94A3B8] text-xs uppercase tracking-wider font-medium">
          {label}
          {required && <span className="text-[#C8102E] ml-1">*</span>}
        </span>
        {children}
      </label>
      {hint && <p className="text-[#94A3B8] text-xs">{hint}</p>}
      {error && <p className="text-[#F87171] text-xs mt-0.5">{error}</p>}
    </div>
  )
}

export default function NewProjectForm({ templates = [] }: { templates?: { id: string; name: string }[] }) {
  const router = useRouter()
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ProjectFormData>({ resolver: zodResolver(projectSchema), defaultValues: { status: 'Active' } })

  const clientValue = watch('client')
  useEffect(() => {
    setValue('americloud_site_id', clientValue ? generateProjectCode(clientValue) : '')
  }, [clientValue]) // eslint-disable-line react-hooks/exhaustive-deps

  const onSubmit = async (data: ProjectFormData) => {
    setIsSubmitting(true)
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error()
      const created = await res.json()
      router.push(`/projects/${created.id}/edit`)
    } catch {
      setToast({ message: 'Something went wrong. Please try again.', type: 'error' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      {toast && <Toast {...toast} onDismiss={() => setToast(null)} />}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

        {/* Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <FormCard title="Site Information">
            <div className="space-y-4">
              <Field label="Project Name" required error={errors.site_name?.message}>
                <input
                  {...register('site_name')}
                  className={inputClass(!!errors.site_name)}
                  placeholder="Enter site name"
                />
              </Field>
              <Field label="Address" required error={errors.address?.message}>
                <input
                  {...register('address')}
                  className={inputClass(!!errors.address)}
                  placeholder="Enter address"
                />
              </Field>
              <Field label="Project Code">
                <input
                  {...register('americloud_site_id')}
                  readOnly
                  className={inputClass(false) + ' cursor-not-allowed opacity-80'}
                  placeholder="Auto-generated on client selection"
                />
              </Field>
            </div>
          </FormCard>

          <FormCard title="Client & IDs">
            <div className="space-y-4">
              <Field label="Client" required error={errors.client?.message}>
                <Controller
                  name="client"
                  control={control}
                  render={({ field }) => (
                    <ClientSelect
                      value={field.value ?? ''}
                      onChange={field.onChange}
                      error={errors.client?.message}
                    />
                  )}
                />
              </Field>
              <Field label="Client Site ID" error={errors.client_site_id?.message}>
                <input
                  {...register('client_site_id')}
                  className={inputClass(!!errors.client_site_id)}
                  placeholder="Enter client site ID"
                />
              </Field>
            </div>
          </FormCard>
        </div>

        {/* Row 2: Client Contact (full width) */}
        <FormCard title="Client Contact">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-white font-semibold text-sm mb-3">PM Information</h3>
              <div className="border-t border-[#1E3A5F] pt-4 space-y-4">
                <Field label="Name">
                  <input
                    {...register('pm_name')}
                    className={inputClass(false)}
                    placeholder="PM full name"
                  />
                </Field>
                <Field label="Email" error={errors.pm_email?.message}>
                  <input
                    {...register('pm_email')}
                    type="email"
                    className={inputClass(!!errors.pm_email)}
                    placeholder="pm@client.com"
                  />
                </Field>
                <Field label="Phone">
                  <input
                    {...register('pm_phone')}
                    type="tel"
                    className={inputClass(false)}
                    placeholder="(555) 000-0000"
                  />
                </Field>
              </div>
            </div>
            <div>
              <h3 className="text-white font-semibold text-sm mb-3">RF Engineer Information</h3>
              <div className="border-t border-[#1E3A5F] pt-4 space-y-4">
                <Field label="Name">
                  <input
                    {...register('rf_engineer_name')}
                    className={inputClass(false)}
                    placeholder="RF Engineer full name"
                  />
                </Field>
                <Field label="Email" error={errors.rf_engineer_email?.message}>
                  <input
                    {...register('rf_engineer_email')}
                    type="email"
                    className={inputClass(!!errors.rf_engineer_email)}
                    placeholder="rf@client.com"
                  />
                </Field>
                <Field label="Phone">
                  <input
                    {...register('rf_engineer_phone')}
                    type="tel"
                    className={inputClass(false)}
                    placeholder="(555) 000-0000"
                  />
                </Field>
              </div>
            </div>
          </div>
        </FormCard>

        {/* Row 3 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <FormCard title="AmeriCloud Team">
            <div className="space-y-4">
              <Field label="AmeriCloud PM">
                <select {...register('americloud_pm')} className={inputClass(false)}>
                  <option value="">Select PM...</option>
                  {AMERICLOUD_PMS.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </Field>
              <Field label="AmeriCloud RF Engineer">
                <select {...register('americloud_rf')} className={inputClass(false)}>
                  <option value="">Select RF Engineer...</option>
                  {AMERICLOUD_RFS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </Field>
            </div>
          </FormCard>

          <FormCard title="Project Details">
            <div className="space-y-4">
              <Field label="Status">
                <select {...register('status')} className={inputClass(false)}>
                  {STATUS_VALUES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </Field>
              <Field label="Project Template" hint="Classifies the project type — does not auto-populate milestones.">
                <select {...register('project_template')} className={inputClass(false)}>
                  <option value="">No Template</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.name}>{t.name}</option>
                  ))}
                </select>
              </Field>
              <Field label="Project Scope">
                <textarea
                  {...register('project_scope')}
                  className={`${inputClass(false)} resize-none`}
                  rows={4}
                  placeholder="Describe the project scope..."
                />
              </Field>
            </div>
          </FormCard>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-[#C8102E] hover:bg-[#A50E25] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-lg transition-colors text-sm uppercase tracking-widest shadow-lg"
        >
          {isSubmitting ? 'Creating Project...' : 'Create Project'}
        </button>
      </form>
    </>
  )
}
