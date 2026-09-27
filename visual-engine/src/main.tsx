import { createRoot } from 'react-dom/client'
import './assets/fonts.css'
import './assets/base.css'
import { RenderPage } from './harness/RenderPage'

function App() {
  return <RenderPage />
}

createRoot(document.getElementById('root')!).render(<App />)
