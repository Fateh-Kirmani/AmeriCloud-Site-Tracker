import NewProjectForm from '@/components/forms/NewProjectForm'

export default function Home() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">New Project</h1>
        <p className="text-[#94A3B8] mt-1 text-sm">
          Fill out the details below to create a new site project.
        </p>
      </div>
      <NewProjectForm />
    </div>
  )
}
