interface FormCardProps {
  title: string
  children: React.ReactNode
  className?: string
}

export default function FormCard({ title, children, className = '' }: FormCardProps) {
  return (
    <div className={`bg-[#112240] border border-[#1E3A5F] rounded-lg shadow-xl overflow-hidden ${className}`}>
      <div className="flex items-stretch">
        <div className="w-1 flex-shrink-0 bg-[#C8102E]" />
        <h2 className="text-white font-semibold text-xs uppercase tracking-widest px-5 py-4">
          {title}
        </h2>
      </div>
      <div className="h-px bg-[#1E3A5F]" />
      <div className="px-6 py-5">
        {children}
      </div>
    </div>
  )
}
