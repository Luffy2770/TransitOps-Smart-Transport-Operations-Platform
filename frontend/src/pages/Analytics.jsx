import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { Topbar } from '@/components/Topbar'
import { AlertTriangle, TrendingUp, DollarSign, Calculator, ShieldCheck, Download, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts'

export default function Analytics() {
  const [roiData, setRoiData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [sortBy, setSortBy] = useState('roi_percentage')
  const [sortOrder, setSortOrder] = useState('desc')

  function handleSort(field) {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('desc')
    }
  }

  function SortIcon({ field }) {
    if (sortBy !== field) return <ArrowUpDown size={13} className="opacity-40" />
    return sortOrder === 'asc' ? <ArrowUp size={13} /> : <ArrowDown size={13} />
  }

  const sortedRoiData = [...roiData].sort((a, b) => {
    if (!sortBy) return 0
    let aVal = a[sortBy]
    let bVal = b[sortBy]

    if (typeof aVal === 'string') {
      return sortOrder === 'asc' 
        ? aVal.localeCompare(bVal) 
        : bVal.localeCompare(aVal)
    }

    return sortOrder === 'asc' ? aVal - bVal : bVal - aVal
  })

  async function fetchAnalytics() {
    setLoading(true)
    try {
      const res = await api.get('/analytics/roi')
      setRoiData(res.data)
      setError('')
    } catch (err) {
      setError('Could not retrieve analytics data.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalytics()
  }, [])

  function exportToCSV() {
    if (!roiData || roiData.length === 0) return

    const headers = [
      'Registration Number',
      'Name',
      'Acquisition Cost ($)',
      'Total Revenue ($)',
      'Maintenance Cost ($)',
      'Fuel Cost ($)',
      'ROI (%)'
    ]

    const rows = roiData.map(item => [
      item.registration_number,
      item.name,
      item.acquisition_cost,
      item.total_revenue,
      item.total_maintenance_cost,
      item.total_fuel_cost,
      item.roi_percentage
    ])

    const csvContent = 
      'data:text/csv;charset=utf-8,' + 
      [headers.join(','), ...rows.map(e => e.join(','))].join('\n')

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `transitops_fleet_roi_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="min-h-full">
      <Topbar title="Fleet Analytics" subtitle="Investment returns and cost efficiency analysis" />

      <div className="p-8 space-y-6">
        {error && (
          <div className="flex items-center gap-2 rounded-sm border border-alert-red/30 bg-alert-red-dim px-4 py-3 text-sm text-alert-red">
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Spec Formula Banner */}
        <div className="bg-ink-950 text-canvas border border-ink-800 rounded-sm p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-signal-amber font-display font-semibold text-sm tracking-wider uppercase">
              <Calculator size={16} />
              <span>Investment Return Formula</span>
            </div>
            <h3 className="text-xl font-bold font-display">Vehicle ROI Calculation</h3>
            <p className="text-xs text-ink-500 max-w-xl">
              As defined by operations requirements, the vehicle return rate is computed using:
              <br />
              <code className="text-canvas bg-ink-900 px-1 py-0.5 rounded-sm font-mono mt-1 inline-block text-[11px]">
                ROI % = (Revenue - (Maintenance Costs + Fuel Costs)) / Acquisition Cost * 100
              </code>
            </p>
          </div>
          <div className="bg-ink-900 border border-ink-800 rounded-sm p-4 text-center font-mono flex flex-col items-center gap-3 min-w-[150px]">
            <div>
              <p className="text-[10px] text-ink-500 uppercase tracking-widest">Active Formula</p>
              <p className="text-lg font-bold text-rail-green">100% Compliant</p>
            </div>
            <button 
              onClick={exportToCSV}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-ink-950 hover:bg-ink-800 text-canvas text-xs font-semibold rounded-sm transition-colors cursor-pointer border border-ink-850"
            >
              <Download size={12} />
              Export ROI CSV
            </button>
          </div>
        </div>

        {/* Main Telemetry */}
        {loading ? (
          <div className="p-12 text-center text-ink-500 font-mono text-sm">
            Evaluating investment returns...
          </div>
        ) : (
          <>
            {/* ROI Stacked Bar Chart */}
            <div className="bg-canvas-raised border border-paper-line rounded-sm p-5 shadow-sm">
              <h4 className="font-display font-semibold text-slate-ink text-md mb-6">Financial Comparison per Vehicle</h4>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sortedRoiData} margin={{ top: 20, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-paper-line)" />
                    <XAxis dataKey="registration_number" tick={{ fontSize: 11, fontFamily: 'monospace' }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0B1120', color: '#F7F5F0', borderRadius: '4px' }}
                      labelStyle={{ fontWeight: 'bold' }}
                    />
                    <Legend />
                    <Bar dataKey="total_revenue" name="Total Revenue ($)" fill="var(--color-transit-blue)" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="total_maintenance_cost" name="Maintenance ($)" fill="var(--color-signal-amber)" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="total_fuel_cost" name="Fuel ($)" fill="var(--color-alert-red)" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Detailed ROI Listing */}
            <div className="bg-canvas-raised border border-paper-line rounded-sm overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-ink-950 text-canvas font-display border-b border-paper-line text-xs uppercase tracking-wider">
                      <th 
                        className="px-6 py-4 font-semibold cursor-pointer select-none"
                        onClick={() => handleSort('registration_number')}
                      >
                        <span className="inline-flex items-center gap-1">
                          Vehicle <SortIcon field="registration_number" />
                        </span>
                      </th>
                      <th 
                        className="px-6 py-4 font-semibold cursor-pointer select-none"
                        onClick={() => handleSort('acquisition_cost')}
                      >
                        <span className="inline-flex items-center gap-1">
                          Acquisition Cost <SortIcon field="acquisition_cost" />
                        </span>
                      </th>
                      <th 
                        className="px-6 py-4 font-semibold cursor-pointer select-none"
                        onClick={() => handleSort('total_revenue')}
                      >
                        <span className="inline-flex items-center gap-1">
                          Revenue <SortIcon field="total_revenue" />
                        </span>
                      </th>
                      <th 
                        className="px-6 py-4 font-semibold cursor-pointer select-none"
                        onClick={() => handleSort('total_maintenance_cost')}
                      >
                        <span className="inline-flex items-center gap-1">
                          Maintenance <SortIcon field="total_maintenance_cost" />
                        </span>
                      </th>
                      <th 
                        className="px-6 py-4 font-semibold cursor-pointer select-none"
                        onClick={() => handleSort('total_fuel_cost')}
                      >
                        <span className="inline-flex items-center gap-1">
                          Fuel Costs <SortIcon field="total_fuel_cost" />
                        </span>
                      </th>
                      <th 
                        className="px-6 py-4 font-semibold cursor-pointer select-none text-right"
                        onClick={() => handleSort('roi_percentage')}
                      >
                        <span className="inline-flex items-center gap-1 justify-end w-full">
                          Calculated ROI <SortIcon field="roi_percentage" />
                        </span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-paper-line font-medium text-slate-ink">
                    {sortedRoiData.map(item => (
                      <tr key={item.vehicle_id} className="hover:bg-canvas transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-mono font-bold text-ink-900">{item.registration_number}</p>
                          <p className="text-xs text-ink-500">{item.name}</p>
                        </td>
                        <td className="px-6 py-4 tabular-nums">${item.acquisition_cost.toLocaleString()}</td>
                        <td className="px-6 py-4 tabular-nums text-rail-green">${item.total_revenue.toLocaleString()}</td>
                        <td className="px-6 py-4 tabular-nums text-signal-amber">${item.total_maintenance_cost.toLocaleString()}</td>
                        <td className="px-6 py-4 tabular-nums text-alert-red">${item.total_fuel_cost.toLocaleString()}</td>
                        <td className="px-6 py-4 text-right">
                          <span className={`font-mono font-bold text-sm px-2.5 py-1 rounded-sm ${item.roi_percentage >= 0 ? 'text-rail-green bg-rail-green-dim' : 'text-alert-red bg-alert-red-dim'}`}>
                            {item.roi_percentage >= 0 ? '+' : ''}{item.roi_percentage}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
