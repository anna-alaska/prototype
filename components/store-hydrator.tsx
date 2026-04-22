'use client'

import { useEffect } from 'react'
import { useProjectStore } from '@/lib/store'

export function StoreHydrator() {
  useEffect(() => {
    void useProjectStore.persist.rehydrate()
  }, [])

  return null
}
