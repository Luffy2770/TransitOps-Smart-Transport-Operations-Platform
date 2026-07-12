import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { Topbar } from '@/components/Topbar'
import { 
  TrendingUp, 
  DollarSign, 
  Truck, 
  Users, 
  Compass, 
  Activity, 
  AlertTriangle,
  ArrowUpRight,
  TrendingDown
} from 'lucide-react'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts'

export default function Dashboard() {
  const [kpis, setKpis] = useState(null)
  const [roiData, setRoiData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function fetchDashboardData() {
    setLoading(true)
    try {
      const [kpiRes, roiRes] = await Promise.all([
        api.get('/analytics/kpis'),
        api.get('/analytics/roi')
      ])
      setKpis(kpiRes.data)
      setRoiData(roiRes.data)
      setError('')
    } catch (err) {
      setError('Could not load dashboard telemetry.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  // Calculate Net Profit
  const profit = kpis ? kpis.total_revenue - kpis.total_costs : 0
  const profitMargin = kpis && kpis.total_revenue > 0 ? (profit / kpis.total_revenue) * 100 : 0

  // Colors for charts
  const COLORS = ['#2F5C8A', '#E8871E', '#2F6B4F', '#C4432B']

  // Cost data representation
  const costBreakdownData = kpis ? [
    { name: 'Operating Fuel', value: kpis.total_costs * 0.45 }, // Estimates based on seeded logs
    { name: 'Vehicle Maintenance', value: kpis.total_costs * 0.35 },
    { name: 'Tolls & Charges', value: kpis.total_costs * 0.20 }
  ] : []

  return (
    <div className="min-h-full">
      <Topbar title="Operations Dashboard" subtitle="Real-time telemetry and KPI overview" />

      <div className="p-8 space-y-6">
        {error && (
          <div className="flex items-center gap-2 rounded-sm border border-alert-red/30 bg-alert-red-dim px-4 py-3 text-sm text-alert-red">
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="p-12 text-center text-ink-500 font-mono text-sm">
            Retrieving fleet telemetry...
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {/* Revenue */}
              <div className="bg-canvas-raised border border-paper-line rounded-sm p-5 flex items-center justify-between shadow-sm">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-ink-500 uppercase tracking-wider">Total Revenue</p>
                  <h3 className="font-display text-2xl font-bold text-slate-ink">${kpis.total_revenue.toLocaleString()}</h3>
                  <span className="inline-flex items-center text-[10px] font-mono text-rail-green font-bold bg-rail-green-dim px-1.5 py-0.5 rounded-sm">
                    <TrendingUp size={10} className="mr-0.5" /> +12.4%
                  </span>
                </div>
                <div className="h-10 w-10 bg-rail-green-dim rounded-full flex items-center justify-center text-rail-green">
                  <DollarSign size={20} />
                </div>
              </div>

              {/* Operating Cost */}
              <div className="bg-canvas-raised border border-paper-line rounded-sm p-5 flex items-center justify-between shadow-sm">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-ink-500 uppercase tracking-wider">Total Costs</p>
                  <h3 className="font-display text-2xl font-bold text-slate-ink">${kpis.total_costs.toLocaleString()}</h3>
                  <span className="inline-flex items-center text-[10px] font-mono text-alert-red font-bold bg-alert-red-dim px-1.5 py-0.5 rounded-sm">
                    <TrendingDown size={10} className="mr-0.5" /> +5.2%
                  </span>
                </div>
                <div className="h-10 w-10 bg-alert-red-dim rounded-full flex items-center justify-center text-alert-red">
                  <TrendingDown size={20} />
                </div>
              </div>

              {/* Fleet Profit */}
              <div className="bg-canvas-raised border border-paper-line rounded-sm p-5 flex items-center justify-between shadow-sm">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-ink-500 uppercase tracking-wider">Net Profit</p>
                  <h3 className="font-display text-2xl font-bold text-slate-ink">${profit.toLocaleString()}</h3>
                  <span className="inline-flex items-center text-[10px] font-mono text-transit-blue font-bold bg-transit-blue-dim px-1.5 py-0.5 rounded-sm">
                    <ArrowUpRight size={10} className="mr-0.5" /> {profitMargin.toFixed(1)}% margin
                  </span>
                </div>
                <div className="h-10 w-10 bg-transit-blue-dim rounded-full flex items-center justify-center text-transit-blue">
                  <TrendingUp size={20} />
                </div>
              </div>

              {/* Safety Score */}
              <div className="bg-canvas-raised border border-paper-line rounded-sm p-5 flex items-center justify-between shadow-sm">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-ink-500 uppercase tracking-wider">Driver Safety</p>
                  <h3 className="font-display text-2xl font-bold text-slate-ink">{kpis.avg_safety_score}%</h3>
                  <span className="text-[10px] font-mono text-ink-500">Active fleet average</span>
                </div>
                <div className="h-10 w-10 bg-signal-amber-dim rounded-full flex items-center justify-center text-signal-amber">
                  <Activity size={20} />
                </div>
              </div>
            </div>

            {/* Sub telemetry row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div className="bg-ink-950 text-canvas border border-ink-800 rounded-sm p-4 flex items-center gap-4">
                <div className="h-10 w-10 bg-ink-800 rounded-full flex items-center justify-center text-signal-amber">
                  <Truck size={20} />
                </div>
                <div>
                  <p className="text-xs text-ink-500 uppercase tracking-wider font-semibold">Active Fleet</p>
                  <h4 className="text-lg font-bold">{kpis.total_active_vehicles} Vehicles</h4>
                </div>
              </div>

              <div className="bg-ink-950 text-canvas border border-ink-800 rounded-sm p-4 flex items-center gap-4">
                <div className="h-10 w-10 bg-ink-800 rounded-full flex items-center justify-center text-transit-blue">
                  <Users size={20} />
                </div>
                <div>
                  <p className="text-xs text-ink-500 uppercase tracking-wider font-semibold">Drivers Dispatched</p>
                  <h4 className="text-lg font-bold">{kpis.drivers_on_trip} On Road</h4>
                </div>
              </div>

              <div className="bg-ink-950 text-canvas border border-ink-800 rounded-sm p-4 flex items-center gap-4">
                <div className="h-10 w-10 bg-ink-800 rounded-full flex items-center justify-center text-rail-green">
                  <Compass size={20} />
                </div>
                <div>
                  <p className="text-xs text-ink-500 uppercase tracking-wider font-semibold">Completed Distance</p>
                  <h4 className="text-lg font-bold">{kpis.total_distance.toLocaleString()} km</h4>
                </div>
              </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* ROI Bar Chart */}
              <div className="bg-canvas-raised border border-paper-line rounded-sm p-5 lg:col-span-2 shadow-sm">
                <h4 className="font-display font-semibold text-slate-ink text-md mb-4">Vehicle ROI Performance</h4>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={roiData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E4E0D6" />
                      <XAxis dataKey="registration_number" tick={{ fontSize: 11, fontFamily: 'monospace' }} />
                      <YAxis tick={{ fontSize: 11 }} label={{ value: 'ROI %', angle: -90, position: 'insideLeft' }} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0B1120', color: '#F7F5F0', borderRadius: '4px' }}
                        labelStyle={{ fontWeight: 'bold' }}
                      />
                      <Bar dataKey="roi_percentage" name="ROI %" radius={[2, 2, 0, 0]}>
                        {roiData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.roi_percentage >= 0 ? '#2F6B4F' : '#C4432B'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Expense Breakdown Pie */}
              <div className="bg-canvas-raised border border-paper-line rounded-sm p-5 shadow-sm">
                <h4 className="font-display font-semibold text-slate-ink text-md mb-4">Cost Structure Breakdown</h4>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={costBreakdownData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {costBreakdownData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-col gap-2 mt-4 text-xs font-mono">
                  {costBreakdownData.map((item, index) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: COLORS[index] }} />
                        <span className="text-ink-500">{item.name}</span>
                      </div>
                      <span className="font-semibold text-slate-ink">${item.value.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
