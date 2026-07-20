import { lazy, Suspense, useEffect, useState } from 'react'
import { Landing } from './landing/Landing'

// Code-split the playground so its heavy example datasets stay out of the
// landing bundle and only load when the visitor opens the playground.
const Test = lazy(() => import('./Test').then((m) => ({ default: m.Test })))

type View = 'landing' | 'playground'

const viewFromHash = (): View => (window.location.hash === '#playground' ? 'playground' : 'landing')

export const App = () => {
  const [view, setView] = useState<View>(viewFromHash)

  useEffect(() => {
    const onHashChange = () => setView(viewFromHash())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  const go = (next: View) => {
    window.location.hash = next === 'playground' ? 'playground' : ''
    setView(next)
    window.scrollTo(0, 0)
  }

  if (view === 'playground') {
    return (
      <Suspense
        fallback={
          <div
            style={{
              minHeight: '100vh',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#070b16',
              color: '#9aa7c7',
              fontFamily: 'Inter, system-ui, sans-serif',
            }}
          >
            Loading playground…
          </div>
        }
      >
        <Test onBack={() => go('landing')} />
      </Suspense>
    )
  }

  return <Landing onLaunchPlayground={() => go('playground')} />
}
