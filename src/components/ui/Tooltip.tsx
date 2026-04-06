import { ReactNode, useState } from 'react'

interface TooltipProps {
  children: ReactNode
  content: string
}

export default function Tooltip({ children, content }: TooltipProps) {
  const [visible, setVisible] = useState(false)

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && (
        <div className="absolute bottom-full left-1/2 z-50 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-md bg-primary px-2 py-1 text-xs text-white shadow-lg">
          {content}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-primary" />
        </div>
      )}
    </div>
  )
}
