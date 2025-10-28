import { createRoot } from 'react-dom/client'
import { Test } from './Test'
import { StrictMode } from 'react'



createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Test />
  </StrictMode>
)
