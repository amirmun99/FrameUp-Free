import { useState } from 'react'
import Button from '../components/ui/Button'

const tourSteps = [
  { title: 'Paste a URL or upload a screenshot', description: 'Capture any website or upload your own image to get started.' },
  { title: 'Pick a device frame', description: 'Wrap your screenshot in a beautiful device mockup like iPhone 17.' },
  { title: 'Export ready for the App Store', description: 'Download your polished mockup as a high-resolution PNG.' }
]

interface OnboardingProps {
  onComplete: () => void
}

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [tourStep, setTourStep] = useState(0)

  const current = tourSteps[tourStep]
  const isLast = tourStep === tourSteps.length - 1

  return (
    <div className="flex h-[calc(100vh-36px)] items-center justify-center bg-white">
      <div className="w-full max-w-md px-8 text-center">
        <div className="mb-8 flex justify-center gap-2">
          {tourSteps.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 w-8 rounded-full transition-colors ${i <= tourStep ? 'bg-primary' : 'bg-border'}`}
            />
          ))}
        </div>
        <div className="mb-2 text-5xl">{['1️⃣', '2️⃣', '3️⃣'][tourStep]}</div>
        <h2 className="mb-2 text-xl font-medium text-primary">{current.title}</h2>
        <p className="mb-8 text-sm text-text-secondary">{current.description}</p>
        <Button
          onClick={() => {
            if (isLast) onComplete()
            else setTourStep(tourStep + 1)
          }}
          size="lg"
          className="w-full"
        >
          {isLast ? 'Get started' : 'Next'}
        </Button>
        {isLast ? (
          <p className="mt-3 text-xs text-text-tertiary">
            Free & open source —{' '}
            <button
              type="button"
              onClick={() => window.frameup.shell.openExternal('https://github.com/amirmun99/FrameUp-Free')}
              className="underline hover:text-primary transition-colors"
            >
              View on GitHub
            </button>
          </p>
        ) : (
          <button onClick={onComplete} className="mt-3 text-xs text-text-tertiary hover:text-primary transition-colors">
            Skip tour
          </button>
        )}
      </div>
    </div>
  )
}
