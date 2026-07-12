import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { Topbar } from '@/components/Topbar'
import { AlertTriangle, TrendingUp, DollarSign, Calculator, ShieldCheck, Download, ArrowUpDown, ArrowUp, ArrowDown, FileText } from 'lucide-react'
import { jsPDF } from 'jspdf'
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

    if (sortBy === 'registration_number') {
      aVal = a.registration_number
      bVal = b.registration_number
    }

    if (typeof aVal === 'string') {
      return sortOrder === 'asc' 
        ? aVal.localeCompare(bVal) 
        : bVal.localeCompare(aVal)
    }

    return sortOrder === 'asc' ? aVal - bVal : bVal - aVal
  })

  async function fetchROIData() {
    setLoading(true)
    try {
      const res = await api.get('/analytics/roi')
      setRoiData(res.data)
      setError('')
    } catch (err) {
      setError('Could not evaluate vehicle investments.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchROIData()
  }, [])

  // Helper for vehicle lookups
  function getVehicleLabel(reg) {
    return reg || '—'
  }

  // Export to CSV Function
  function exportToCSV() {
    const headers = ['Vehicle,Acquisition Cost,Total Revenue,Maintenance Costs,Fuel Costs,Net Return,ROI %\n']
    const rows = sortedRoiData.map(d => {
      const netReturn = d.total_revenue - (d.total_maintenance_cost + d.total_fuel_cost)
      return `${d.registration_number},${d.acquisition_cost},${d.total_revenue},${d.total_maintenance_cost},${d.total_fuel_cost},${netReturn},${d.roi_percentage.toFixed(2)}%\n`
    })

    const blob = new Blob([...headers, ...rows], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `TransitOps_ROI_Report_${new Date().toISOString().slice(0,10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Direct PDF Export using jsPDF
  function exportToPDF() {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    })

    // Header Panel
    doc.setFillColor(11, 17, 32) // deep navy #0B1120
    doc.rect(0, 0, 210, 38, 'F')
    
    doc.setTextColor(247, 245, 240) // canvas #F7F5F0
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(20)
    doc.text('TransitOps Smart Platform', 15, 15)
    
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.text('Fleet Financial Analytics & Return on Investment (ROI) Report', 15, 22)
    doc.text(`Generated On: ${new Date().toLocaleString()}`, 15, 28)

    // Table Header Background
    doc.setFillColor(42, 53, 72) // slate-700
    doc.rect(15, 48, 180, 8, 'F')
    
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.text('Vehicle', 18, 53)
    doc.text('Acq. Cost', 50, 53)
    doc.text('Revenue', 80, 53)
    doc.text('Maintenance', 110, 53)
    doc.text('Fuel Costs', 140, 53)
    doc.text('ROI %', 175, 53)

    // Render Data Rows
    let y = 62
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(28, 34, 48) // slate-ink
    
    sortedRoiData.forEach((row, i) => {
      // Row background shading (Zebra striping)
      if (i % 2 === 0) {
        doc.setFillColor(245, 243, 238)
        doc.rect(15, y - 5, 180, 7, 'F')
      }
      
      doc.text(row.registration_number || '—', 18, y)
      doc.text(`$${row.acquisition_cost.toLocaleString()}`, 50, y)
      doc.text(`$${row.total_revenue.toLocaleString()}`, 80, y)
      doc.text(`$${row.total_maintenance_cost.toLocaleString()}`, 110, y)
      doc.text(`$${row.total_fuel_cost.toLocaleString()}`, 140, y)
      
      const roiVal = row.roi_percentage
      const roiText = `${roiVal.toFixed(1)}%`
      
      if (roiVal >= 0) {
        doc.setTextColor(47, 107, 79) // rail green
      } else {
        doc.setTextColor(196, 67, 43) // alert red
      }
      doc.text(roiText, 175, y)
      doc.setTextColor(28, 34, 48) // Reset to standard body text
      
      y += 7
      
      // Prevent page overflow by adding a new page automatically
      if (y > 272) {
        doc.addPage()
        y = 22
        
        // Re-render table header on new page
        doc.setFillColor(42, 53, 72)
        doc.rect(15, y - 5, 180, 8, 'F')
        doc.setTextColor(255, 255, 255)
        doc.setFont('helvetica', 'bold')
        doc.text('Vehicle', 18, y)
        doc.text('Acq. Cost', 50, y)
        doc.text('Revenue', 80, y)
        doc.text('Maintenance', 110, y)
        doc.text('Fuel Costs', 140, y)
        doc.text('ROI %', 175, y)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(28, 34, 48)
        y += 9
      }
    })

    // Footer divider and statement
    doc.setStrokeColor(228, 224, 214)
    doc.line(15, 282, 195, 282)
    
    doc.setFontSize(7.5)
    doc.setTextColor(90, 106, 130)
    doc.text('TransitOps Operations Control Center - Confidential Generated Telemetry Report', 15, 287)

    doc.save(`TransitOps_ROI_Report_${new Date().toISOString().slice(0, 10)}.pdf`)
  }

  return (
    <div className="min-h-full">
      <Topbar title="Financial Analytics" subtitle="Evaluation of return on investment (ROI)" />

      <div className="p-8 space-y-6">
        {error && (
          <div className="flex items-center gap-2 rounded-sm border border-alert-red/30 bg-alert-red-dim px-4 py-3 text-sm text-alert-red">
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Evaluation Banner */}
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
          <div className="bg-ink-900 border border-ink-800 rounded-sm p-4 text-center font-mono flex flex-col items-center gap-3 min-w-[170px]">
            <div>
              <p className="text-[10px] text-ink-500 uppercase tracking-widest">Active Formula</p>
              <p className="text-lg font-bold text-rail-green">100% Compliant</p>
            </div>
            <div className="flex flex-col gap-2 w-full">
              <button 
                onClick={exportToCSV}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-ink-950 hover:bg-ink-800 text-canvas text-xs font-semibold rounded-sm transition-colors cursor-pointer border border-ink-850"
              >
                <Download size={12} />
                Export ROI CSV
              </button>
              <button 
                onClick={exportToPDF}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-signal-amber hover:bg-signal-amber/90 text-ink-950 text-xs font-bold rounded-sm transition-colors cursor-pointer"
              >
                <FileText size={12} />
                Export PDF Report
              </button>
            </div>
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
