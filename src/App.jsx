import { AppProvider } from './state/appContext'
import Dashboard from './components/layout/Dashboard'

function App() {
  return (
    <AppProvider>
      <Dashboard />
    </AppProvider>
  )
}

export default App