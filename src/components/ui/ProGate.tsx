import type { ReactNode } from 'react'

interface ProGateProps {
  children: ReactNode
  feature?: string
}

export default function ProGate({ children }: ProGateProps) {
  return <>{children}</>
}
