'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Legacy route — redirects to the Rennen tab in "Mein Bereich".
 * Kept for backwards-compatibility with bookmarks / shared links.
 */
export default function RennenRedirect() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/mein-bereich#rennen')
  }, [router])
  return null
}
