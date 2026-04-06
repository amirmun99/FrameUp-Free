import { create } from 'zustand'

interface AppState {
  isLoading: boolean
  hasCompletedOnboarding: boolean
  completeOnboarding: () => void
  skipOnboarding: () => void
  skipAuth: () => void
}

export const useAppStore = create<AppState>(() => ({
  isLoading: false, // No async session restore — always false immediately
  hasCompletedOnboarding: !!localStorage.getItem('frameup:onboarding_complete'),

  completeOnboarding: () => {
    useAppStore.setState({ hasCompletedOnboarding: true })
    localStorage.setItem('frameup:onboarding_complete', 'true')
  },

  skipOnboarding: () => {
    useAppStore.setState({ hasCompletedOnboarding: true })
    localStorage.setItem('frameup:onboarding_complete', 'true')
  },

  skipAuth: () => {
    useAppStore.setState({ hasCompletedOnboarding: true })
    localStorage.setItem('frameup:onboarding_complete', 'true')
  }
}))
