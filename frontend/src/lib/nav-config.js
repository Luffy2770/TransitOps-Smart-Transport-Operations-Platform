import {
  LayoutDashboard,
  Truck,
  Users,
  Route,
  Wrench,
  Fuel,
  BarChart3,
  Settings,
} from 'lucide-react'

// Order matches the plan's sidebar spec. Codes give the dispatch-board
// numbering used in the sidebar (these are real ordered modules, not decoration).
export const NAV_ITEMS = [
  { code: '01', label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { code: '02', label: 'Fleet', path: '/fleet', icon: Truck },
  { code: '03', label: 'Drivers', path: '/drivers', icon: Users },
  { code: '04', label: 'Trips', path: '/trips', icon: Route },
  { code: '05', label: 'Maintenance', path: '/maintenance', icon: Wrench },
  { code: '06', label: 'Fuel', path: '/fuel', icon: Fuel },
  { code: '07', label: 'Analytics', path: '/analytics', icon: BarChart3 },
  { code: '08', label: 'Settings', path: '/settings', icon: Settings },
]
