import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { Topbar } from '@/components/Topbar'
import { StatusBadge } from '@/components/StatusBadge'
import { 
  Plus, 
  X, 
  AlertTriangle, 
  CheckCircle,
  Wrench,
  Check,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react'

export default function Maintenance() {
  const { user } = useAuth()
  const isManager = user?.role === 'Fleet Manager'

  const [logs, setLogs] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [sortBy, setSortBy] = useState('status')
  const [sortOrder, setSortOrder] = useState('asc')

  function handleSort(field) {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('asc')
    }
  }

  function SortIcon({ field }) {
    if (sortBy !== field) return <ArrowUpDown size={13} className="opacity-40" />
    return sortOrder === 'asc' ? <ArrowUp size={13} /> : <ArrowDown size={13} />
  }

  const sortedLogs = [...logs].sort((a, b) => {
    if (!sortBy) return 0
    let aVal = a[sortBy]
    let bVal = b[sortBy]

    if (sortBy === 'vehicle_id') {
      aVal = getVehicleLabel(a.vehicle_id)
      bVal = getVehicleLabel(b.vehicle_id)
    }

    if (typeof aVal === 'string') {
      return sortOrder === 'asc' 
        ? aVal.localeCompare(bVal) 
        : bVal.localeCompare(aVal)
    }

    return sortOrder === 'asc' ? aVal - bVal : bVal - aVal
  })

  // Form states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    vehicle_id: '',
    service_type: '',
    cost: '',
    service_date: new Date().toISOString().split('T')[0],
    status: 'Active'
  })
  const [formError, setFormError] = useState('')

  async function fetchData() {
    setLoading(true)
    try {
      const [logsRes, vehiclesRes] = await Promise.all([
        api.get('/maintenance'),
        api.get('/vehicles')
      ])
      setLogs(logsRes.data)
      setVehicles(vehiclesRes.data)
      setError('')
    } catch (err) {
      setError('Failed to fetch maintenance registry logs.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(''), 4000)
      return () => clearTimeout(timer)
    }
  }, [successMsg])

  function getVehicleLabel(vId) {
    const v = vehicles.find(x => x.id === vId)
    return v ? `${v.registration_number} (${v.name})` : `Vehicle ID ${vId}`
  }

  function openAddModal() {
    setFormData({
      vehicle_id: '',
      service_type: '',
      cost: '',
      service_date: new Date().toISOString().split('T')[0],
      status: 'Active'
    })
    setFormError('')
    setIsModalOpen(true)
  }

  async function handleFormSubmit(e) {
    e.preventDefault()
    setFormError('')

    const payload = {
      vehicle_id: parseInt(formData.vehicle_id),
      service_type: formData.service_type,
      cost: parseFloat(formData.cost),
      service_date: formData.service_date
    }

    try {
      await api.post('/maintenance', {
        ...payload,
        status: formData.status
      })
      setSuccessMsg(`Maintenance log recorded for vehicle.`)
      setIsModalOpen(false)
      fetchData()
    } catch (err) {
      const detail = err.response?.data?.detail
      setFormError(typeof detail === 'string' ? detail : 'Failed to save maintenance log.')
    }
  }

  async function handleMarkCompleted(log) {
    try {
      await api.patch(`/maintenance/${log.id}`, { status: 'Completed' })
      setSuccessMsg(`Service completed. Vehicle is now back in service!`)
      fetchData()
    } catch (err) {
      setError('Failed to update maintenance status.')
      console.error(err)
    }
  }

  return (
    <div className="min-h-full">
      <Topbar title="Maintenance Log" subtitle="Monitor vehicle health and service schedules" />

      <div className="p-8 space-y-6">
        {/* Notifications */}
        {error && (
          <div className="flex items-center gap-2 rounded-sm border border-alert-red/30 bg-alert-red-dim px-4 py-3 text-sm text-alert-red animate-fade-in">
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="flex items-center gap-2 rounded-sm border border-rail-green/30 bg-rail-green-dim px-4 py-3 text-sm text-rail-green animate-fade-in">
            <CheckCircle size={18} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Toolbar */}
        <div className="flex justify-between items-center bg-canvas-raised border border-paper-line rounded-sm p-4">
          <span className="text-sm font-mono text-ink-500 font-bold uppercase tracking-wide">
            Service Logs
          </span>
          {isManager && (
            <button
              onClick={openAddModal}
              className="flex items-center justify-center gap-1.5 rounded-sm bg-ink-950 hover:bg-ink-800 text-canvas px-4 py-2.5 text-sm font-semibold tracking-wide transition-colors cursor-pointer"
            >
              <Plus size={16} />
              Schedule Service
            </button>
          )}
        </div>

        {/* Table list */}
        <div className="bg-canvas-raised border border-paper-line rounded-sm overflow-hidden">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-12 text-center text-ink-500 font-mono text-sm">
                Loading maintenance history...
              </div>
            ) : logs.length === 0 ? (
              <div className="p-12 text-center text-ink-500 font-mono text-sm">
                No maintenance records logged.
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-ink-950 text-canvas font-display border-b border-paper-line text-xs uppercase tracking-wider font-semibold">
                    <th 
                      className="px-6 py-4 font-semibold cursor-pointer select-none"
                      onClick={() => handleSort('vehicle_id')}
                    >
                      <span className="inline-flex items-center gap-1">
                        Vehicle <SortIcon field="vehicle_id" />
                      </span>
                    </th>
                    <th 
                      className="px-6 py-4 font-semibold cursor-pointer select-none"
                      onClick={() => handleSort('service_type')}
                    >
                      <span className="inline-flex items-center gap-1">
                        Service Type <SortIcon field="service_type" />
                      </span>
                    </th>
                    <th 
                      className="px-6 py-4 font-semibold cursor-pointer select-none"
                      onClick={() => handleSort('service_date')}
                    >
                      <span className="inline-flex items-center gap-1">
                        Service Date <SortIcon field="service_date" />
                      </span>
                    </th>
                    <th 
                      className="px-6 py-4 font-semibold cursor-pointer select-none"
                      onClick={() => handleSort('cost')}
                    >
                      <span className="inline-flex items-center gap-1">
                        Cost <SortIcon field="cost" />
                      </span>
                    </th>
                    <th 
                      className="px-6 py-4 font-semibold cursor-pointer select-none"
                      onClick={() => handleSort('status')}
                    >
                      <span className="inline-flex items-center gap-1">
                        Status <SortIcon field="status" />
                      </span>
                    </th>
                    {isManager && <th className="px-6 py-4 font-semibold text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-paper-line font-medium text-slate-ink">
                  {sortedLogs.map(log => (
                    <tr key={log.id} className="hover:bg-canvas transition-colors">
                      <td className="px-6 py-4 font-bold text-ink-900">{getVehicleLabel(log.vehicle_id)}</td>
                      <td className="px-6 py-4">{log.service_type}</td>
                      <td className="px-6 py-4 font-mono text-xs">
                        {new Date(log.service_date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                      </td>
                      <td className="px-6 py-4 tabular-nums">${log.cost.toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <StatusBadge status={log.status} />
                      </td>
                      {isManager && (
                        <td className="px-6 py-4 text-right">
                          {log.status === 'Active' && (
                            <button
                              onClick={() => handleMarkCompleted(log)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs bg-rail-green hover:bg-rail-green/90 text-canvas rounded-sm transition-colors"
                              title="Mark Completed"
                            >
                              <Check size={12} />
                              Complete
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Schedule Service Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/60 p-4">
          <div className="w-full max-w-md bg-canvas-raised rounded-sm border border-paper-line shadow-xl overflow-hidden animate-zoom-in">
            <div className="flex items-center justify-between bg-ink-950 text-canvas px-6 py-4 border-b border-paper-line">
              <h3 className="font-display font-semibold">Schedule Vehicle Service</h3>
              <button onClick={() => setIsModalOpen(false)} className="hover:text-signal-amber transition-colors">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="flex items-start gap-2 rounded-sm border border-alert-red/30 bg-alert-red-dim px-3 py-2 text-xs text-alert-red">
                  <AlertTriangle size={15} className="mt-0.5 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-ink-500 mb-1">Select Vehicle</label>
                <select
                  required
                  value={formData.vehicle_id}
                  onChange={e => setFormData({ ...formData, vehicle_id: e.target.value })}
                  className="w-full rounded-sm border border-paper-line bg-canvas px-3 py-2 text-sm outline-none focus:border-signal-amber"
                >
                  <option value="">Choose a vehicle</option>
                  {vehicles.filter(v => v.status !== 'Retired').map(v => (
                    <option key={v.id} value={v.id}>
                      {v.registration_number} ({v.name}) - Current: {v.status}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-500 mb-1">Service Type / Details</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Engine Tuning & Brake Pads Replacement"
                  value={formData.service_type}
                  onChange={e => setFormData({ ...formData, service_type: e.target.value })}
                  className="w-full rounded-sm border border-paper-line bg-canvas px-3 py-2 text-sm outline-none focus:border-signal-amber"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-ink-500 mb-1">Cost ($)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="e.g. 250"
                    value={formData.cost}
                    onChange={e => setFormData({ ...formData, cost: e.target.value })}
                    className="w-full rounded-sm border border-paper-line bg-canvas px-3 py-2 text-sm outline-none focus:border-signal-amber"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink-500 mb-1">Service Date</label>
                  <input
                    type="date"
                    required
                    value={formData.service_date}
                    onChange={e => setFormData({ ...formData, service_date: e.target.value })}
                    className="w-full rounded-sm border border-paper-line bg-canvas px-3 py-2 text-sm outline-none focus:border-signal-amber font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-500 mb-1">Initial Status</label>
                <select
                  value={formData.status}
                  onChange={e => setFormData({ ...formData, status: e.target.value })}
                  className="w-full rounded-sm border border-paper-line bg-canvas px-3 py-2 text-sm outline-none focus:border-signal-amber"
                >
                  <option value="Active">Active (Vehicle sent to shop)</option>
                  <option value="Completed">Completed (Historical log)</option>
                </select>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-paper-line mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-paper-line hover:bg-canvas rounded-sm text-sm text-ink-500 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-ink-950 hover:bg-ink-800 text-canvas rounded-sm text-sm font-semibold tracking-wide transition-colors"
                >
                  Confirm Service
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
