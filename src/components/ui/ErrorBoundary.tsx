import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  message: string
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, message: '' }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message ?? 'Unknown error' }
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-white px-8 text-center">
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-text-tertiary">
          <circle cx="20" cy="20" r="17" />
          <path d="M20 13v8M20 27v.5" strokeLinecap="round" />
        </svg>
        <div>
          <h2 className="mb-1 text-sm font-medium text-primary">Something went wrong</h2>
          <p className="text-xs text-text-secondary">
            Frameup ran into an unexpected error. Your work is saved.
          </p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity"
        >
          Reload app
        </button>
        {import.meta.env.DEV && (
          <pre className="mt-2 max-w-lg overflow-auto rounded bg-surface p-3 text-left text-xs text-text-tertiary">
            {this.state.message}
          </pre>
        )}
      </div>
    )
  }
}
