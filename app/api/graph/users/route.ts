import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.accessToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const q = new URL(request.url).searchParams.get('q')?.trim() ?? ''
  if (q.length < 2) return NextResponse.json([])

  try {
    const search = encodeURIComponent(q)
    const url =
      `https://graph.microsoft.com/v1.0/users` +
      `?$search="displayName:${search}" OR "userPrincipalName:${search}"` +
      `&$select=displayName,mail,userPrincipalName` +
      `&$top=10&$count=true`

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        ConsistencyLevel: 'eventual',
      },
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      console.error('[GET /api/graph/users] Graph error:', err)
      return NextResponse.json({ error: 'Graph API error' }, { status: res.status })
    }

    const data = await res.json()
    const users = (data.value ?? []).filter((u: { mail?: string; userPrincipalName?: string }) => {
      const email = (u.mail ?? u.userPrincipalName ?? '').toLowerCase()
      return email.endsWith('@americloudtelecom.com')
    })

    return NextResponse.json(users)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
