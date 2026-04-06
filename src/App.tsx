import { Routes, Route, Navigate } from 'react-router-dom'
import { useAppStore } from './store/useAppStore'
import AppShell from './components/layout/AppShell'
import TitleBar from './components/layout/TitleBar'
import { Toaster } from './components/layout/Toaster'
import Onboarding from './pages/Onboarding'
import Home from './pages/Home'
import Editor from './pages/Editor'
import Capture from './pages/Capture'
import Settings from './pages/Settings'
import Library from './pages/Library'
import DragDropOverlay from './components/capture/DragDropOverlay'

export default function App() {
  const { hasCompletedOnboarding } = useAppStore()

  // Show onboarding if user hasn't completed it (first launch or triggered from settings)
  if (!hasCompletedOnboarding) {
    return (
      <>
        <TitleBar />
        <Onboarding
          onComplete={() => {
            useAppStore.getState().completeOnboarding()
          }}
        />
        <Toaster />
      </>
    )
  }

  return (
    <>
      <TitleBar />
      <AppShell>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/editor" element={<Editor />} />
          <Route path="/capture" element={<Capture />} />
          <Route path="/library" element={<Library />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/upgrade" element={<Navigate to="/" replace />} />
          <Route path="/account" element={<Navigate to="/settings" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppShell>
      <DragDropOverlay />
      <Toaster />
    </>
  )
}
