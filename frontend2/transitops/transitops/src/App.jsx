import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Login from './components/Login.jsx'
import FleetPage from './pages/FleetPage.jsx'
import Dashboard from './pages/Dashboard.jsx'
import SafetyPage from './pages/SafetyPage.jsx'
import AnalyticsPage from './pages/AnalyticsPage.jsx'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/fleet" element={<FleetPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/safety" element={<SafetyPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
