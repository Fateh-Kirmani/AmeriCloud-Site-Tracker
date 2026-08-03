// components/forms/EditProjectForm.tsx
'use client'
import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { projectSchema, ProjectFormData, Project, STATUS_VALUES } from '@/types/project'
import FormCard from '@/components/FormCard'
import Toast from '@/components/Toast'
import MilestonesTab from '@/components/project-tabs/MilestonesTab'
import FilesTab from '@/components/project-tabs/FilesTab'
import ManagerialTeamTab from '@/components/project-tabs/ManagerialTeamTab'
import CrewTab from '@/components/project-tabs/CrewTab'
import ClientSelect from '@/components/forms/ClientSelect'

const TABS = ['General Information', 'Managerial Team', 'Crew', 'Milestones', 'Files'] as const
type Tab = (typeof TABS)[number]

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
  children,
}: {
  label: string
  error?: string
  required?: boolean
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
      {error && <p className="text-[#F87171] text-xs mt-0.5">{error}</p>}
    </div>
  )
}

export default function EditProjectForm({
  project,
  templates = [],
  fullTemplates = [],
}: {
  project: Project
  templates?: { id: string; name: string }[]
  fullTemplates?: { name: string; items: { details: string | null; notes: string | null; sort_order: number }[] }[]
}) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<Tab>('General Information')
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      site_name: project.site_name,
      street: project.street ?? project.address ?? '',
      city: project.city ?? '',
      state: project.state ?? '',
      zip_code: project.zip_code ?? '',
      americloud_site_id: project.americloud_site_id ?? '',
      client: project.client,
      client_site_id: project.client_site_id ?? '',
      pm_name: project.pm_name ?? '',
      pm_email: project.pm_email ?? '',
      pm_phone: project.pm_phone ?? '',
      rf_engineer_name: project.rf_engineer_name ?? '',
      rf_engineer_email: project.rf_engineer_email ?? '',
      rf_engineer_phone: project.rf_engineer_phone ?? '',
      americloud_pm: project.americloud_pm ?? '',
      americloud_rf: project.americloud_rf ?? '',
      project_scope: project.project_scope ?? '',
      project_template: project.project_template ?? '',
      status: (project.status as (typeof STATUS_VALUES)[number]) ?? 'Active',
    },
  })

  const onSubmit = async (data: ProjectFormData) => {
    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error()
      setToast({ message: 'Project updated successfully', type: 'success' })
      setTimeout(() => router.push('/'), 1000)
    } catch {
      setToast({ message: 'Failed to update project', type: 'error' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      {toast && <Toast {...toast} onDismiss={() => setToast(null)} />}

      {/* Tab bar */}
      <div className="border-b border-[#1E3A5F] mb-6" role="tablist">
        <div className="flex gap-0">
          {TABS.map((tab) => (
            <button
              key={tab}
              id={`tab-${tab.toLowerCase().replace(/ /g, '-')}`}
              type="button"
              role="tab"
              aria-selected={activeTab === tab}
              aria-controls={`tabpanel-${tab.toLowerCase().replace(/ /g, '-')}`}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
                activeTab === tab
                  ? 'text-white border-[#C8102E]'
                  : 'text-[#94A3B8] border-transparent hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* General Information tab */}
      {activeTab === 'General Information' && (
        <div
          role="tabpanel"
          id="tabpanel-general-information"
          aria-labelledby="tab-general-information"
        >
          <form onSubmit={handleSubmit(onSubmit)} aria-label="Edit project form" className="space-y-6">
            {/* Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <FormCard title="Site Information">
                <div className="space-y-4">
                  <Field label="Project Name" required error={errors.site_name?.message}>
                    <input {...register('site_name')} className={inputClass(!!errors.site_name)} placeholder="Enter site name" />
                  </Field>
                  <Field label="Street" required error={errors.street?.message}>
                    <input {...register('street')} className={inputClass(!!errors.street)} placeholder="123 Main St" />
                  </Field>
                  <Field label="City" required error={errors.city?.message}>
                    <input {...register('city')} className={inputClass(!!errors.city)} placeholder="New York" />
                  </Field>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="State" error={errors.state?.message}>
                      <input {...register('state')} className={inputClass(!!errors.state)} placeholder="NY" />
                    </Field>
                    <Field label="ZIP Code" error={errors.zip_code?.message}>
                      <input {...register('zip_code')} className={inputClass(!!errors.zip_code)} placeholder="10001" />
                    </Field>
                  </div>
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
                    <input {...register('client_site_id')} className={inputClass(!!errors.client_site_id)} placeholder="Enter client site ID" />
                  </Field>
                </div>
              </FormCard>
            </div>

            {/* Row 2 */}
            <FormCard title="Client Contact">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-white font-semibold text-sm mb-3">PM Information</h3>
                  <div className="border-t border-[#1E3A5F] pt-4 space-y-4">
                    <Field label="Name"><input {...register('pm_name')} className={inputClass(false)} placeholder="PM full name" /></Field>
                    <Field label="Email" error={errors.pm_email?.message}><input {...register('pm_email')} type="email" className={inputClass(!!errors.pm_email)} placeholder="pm@client.com" /></Field>
                    <Field label="Phone"><input {...register('pm_phone')} type="tel" className={inputClass(false)} placeholder="(555) 000-0000" /></Field>
                  </div>
                </div>
                <div>
                  <h3 className="text-white font-semibold text-sm mb-3">RF Engineer Information</h3>
                  <div className="border-t border-[#1E3A5F] pt-4 space-y-4">
                    <Field label="Name"><input {...register('rf_engineer_name')} className={inputClass(false)} placeholder="RF Engineer full name" /></Field>
                    <Field label="Email" error={errors.rf_engineer_email?.message}><input {...register('rf_engineer_email')} type="email" className={inputClass(!!errors.rf_engineer_email)} placeholder="rf@client.com" /></Field>
                    <Field label="Phone"><input {...register('rf_engineer_phone')} type="tel" className={inputClass(false)} placeholder="(555) 000-0000" /></Field>
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
                      {AMERICLOUD_PMS.map((p) => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </Field>
                  <Field label="AmeriCloud RF Engineer">
                    <select {...register('americloud_rf')} className={inputClass(false)}>
                      <option value="">Select RF Engineer...</option>
                      {AMERICLOUD_RFS.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </Field>
                </div>
              </FormCard>
              <FormCard title="Project Details">
                <div className="space-y-4">
                  <Field label="Status">
                    <select {...register('status')} className={inputClass(false)}>
                      {STATUS_VALUES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </Field>
                  <Field label="Project Template">
                    <select {...register('project_template')} className={inputClass(false)}>
                      <option value="">No Template</option>
                      {templates.map((t) => <option key={t.id} value={t.name}>{t.name}</option>)}
                    </select>
                  </Field>
                  <Field label="Project Scope">
                    <textarea {...register('project_scope')} className={`${inputClass(false)} resize-none`} rows={4} placeholder="Describe the project scope..." />
                  </Field>
                </div>
              </FormCard>
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <button type="button" onClick={() => router.push('/')} className="flex-1 border border-[#1E3A5F] text-[#94A3B8] hover:text-white hover:border-white font-semibold py-3.5 rounded-lg transition-colors text-sm uppercase tracking-widest">
                Cancel
              </button>
              <button type="submit" disabled={isSubmitting} className="flex-1 bg-[#C8102E] hover:bg-[#A50E25] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-lg transition-colors text-sm uppercase tracking-widest shadow-lg">
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Managerial Team tab */}
      {activeTab === 'Managerial Team' && (
        <div role="tabpanel" id="tabpanel-managerial-team" aria-labelledby="tab-managerial-team">
          <ManagerialTeamTab projectId={project.id} />
        </div>
      )}

      {/* Crew tab */}
      {activeTab === 'Crew' && (
        <div role="tabpanel" id="tabpanel-crew" aria-labelledby="tab-crew">
          <CrewTab projectId={project.id} />
        </div>
      )}

      {/* Milestones tab */}
      {activeTab === 'Milestones' && (
        <div role="tabpanel" id="tabpanel-milestones" aria-labelledby="tab-milestones">
          <MilestonesTab
            projectId={project.id}
            projectTemplate={project.project_template}
            templates={fullTemplates}
          />
        </div>
      )}

      {/* Files tab */}
      {activeTab === 'Files' && (
        <div role="tabpanel" id="tabpanel-files" aria-labelledby="tab-files">
          <FilesTab projectId={project.id} />
        </div>
      )}
    </>
  )
}
