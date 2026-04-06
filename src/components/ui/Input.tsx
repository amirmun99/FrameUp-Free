import { InputHTMLAttributes, forwardRef } from 'react'
import { cn } from '../../lib/utils'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-xs font-medium text-text-secondary">{label}</label>
        )}
        <input
          ref={ref}
          className={cn(
            'h-9 rounded-lg border border-border bg-white px-3 text-sm text-primary placeholder:text-text-tertiary',
            'focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary/20',
            'transition-colors duration-120',
            error && 'border-danger focus:ring-danger/10',
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-danger">{error}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'
export default Input
