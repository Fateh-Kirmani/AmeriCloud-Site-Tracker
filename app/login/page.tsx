'use client'
import { signIn } from 'next-auth/react'
import Image from 'next/image'

function MicrosoftLogo() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 21 21" aria-hidden="true">
      <rect x="1" y="1" width="9" height="9" fill="#f25022" />
      <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
      <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
      <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
    </svg>
  )
}

export default function LoginPage() {
  return (
    <div className="fixed inset-0 z-[100] bg-[#0B1929] flex items-center justify-center px-4">
      <div className="bg-[#112240] border border-[#1E3A5F] rounded-2xl p-10 w-full max-w-md shadow-2xl text-center space-y-8">
        <div className="space-y-4">
          <Image
            src="/americloud_telecom_solutions_logo.jpg"
            alt="AmeriCloud Telecom Solutions"
            width={180}
            height={45}
            style={{ height: '45px', width: 'auto', margin: '0 auto' }}
            priority
          />
          <div>
            <h1 className="text-white font-bold text-2xl">AmeriCloud Project Tracker</h1>
            <p className="text-[#94A3B8] text-sm mt-1">Sign in with your AmeriCloud account to continue</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => signIn('microsoft', { callbackUrl: '/' })}
          className="w-full flex items-center justify-center gap-3 bg-[#1E3A5F] hover:bg-[#2A4F7A] text-white font-semibold py-3.5 rounded-xl transition-colors text-sm"
        >
          <MicrosoftLogo />
          Sign in with Microsoft
        </button>

        <p className="text-[#94A3B8] text-xs">
          Access restricted to @americloudtelecom.com accounts
        </p>
      </div>
    </div>
  )
}
