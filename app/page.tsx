'use client'

import dynamic from 'next/dynamic'

const NordcupMap = dynamic(() => import('@/components/NordcupMap'), { ssr: false })

export default function HomePage() {
  return <NordcupMap />
}
