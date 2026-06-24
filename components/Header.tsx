import Image from 'next/image'

export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#0B1929] border-b border-[#1E3A5F] shadow-lg">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-4">
        <Image
          src="/americloud_telecom_solutions_logo.jpg"
          alt="AmeriCloud Telecom Solutions"
          width={160}
          height={40}
          style={{ height: '40px', width: 'auto' }}
          priority
        />
        <div className="w-px h-8 bg-[#1E3A5F]" />
        <span className="text-white font-semibold text-lg tracking-wide">
          AmeriCloud Site Tracker
        </span>
      </div>
    </header>
  )
}
