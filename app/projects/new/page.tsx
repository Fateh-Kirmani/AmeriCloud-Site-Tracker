import NewProjectForm from '@/components/forms/NewProjectForm'

export default function NewProjectPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">New Project</h1>
        <p className="text-[#94A3B8] mt-1">Fill in the details below to create a new site project.</p>
      </div>
      <NewProjectForm />
    </div>
  )
}
