import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { Topbar } from '@/components/Topbar'
import { StatusBadge } from '@/components/StatusBadge'
import { 
  Search, 
  Plus, 
  X, 
  AlertTriangle, 
  CheckCircle,
  Play,
  Check,
  Ban,
  DollarSign,
  Navigation,
  Scale
} from 'lucide-react'

export default function Trips() {
  const { user } = useAuth()
  const isAuthorized = user?.role === 'Fleet Manager' || user?.role === 'Dispatcher'
  const isManager = user?.role === 'Fleet Manager'

  const [trips, setTrips] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [drivers, setDrivers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  // Modals State
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isCompleteOpen, setIsCompleteOpen] = useState(false)
  const [completingTrip, setCompletingTrip] = useState(null)

  // Create Form State
  const [createData, setCreateData] = useState({
    trip_code: '',
    vehicle_id: '',
    driver_id: '',
    source: '',
    destination: '',
    cargo_weight: '',
    planned_distance: '',
    revenue: ''
  })
  const [createError, setCreateError] = useState('')

  // Complete Form State
  const [completeData, setCompleteData] = useState({
    actual_distance: '',
    fuel_used: '',
    revenue: '',
    toll: '0',
    other: '0'
  })
  const [completeError, setCompleteError] = useState('')

  // Fetch all dependencies
  async function fetchData() {
    setLoading(true)
    try {
      const [tripsRes, vehiclesRes, driversRes] = await Promise.all([
        api.get('/trips'),
        api.get('/vehicles'),
        api.get('/drivers')
      ])
      setTrips(tripsRes.data)
      setVehicles(vehiclesRes.data)
      setDrivers(driversRes.data)
      setError('')
    } catch (err) {
      setError('Failed to fetch manifest logs.')
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

  // Get vehicle name or registration
  function getVehicleLabel(vId) {
    const v = vehicles.find(x => x.id === vId)
    return v ? `${v.registration_number} (${v.name})` : `ID ${vId}`
  }

  // Get driver name
  function getDriverLabel(dId) {
    const d = drivers.find(x => x.id === dId)
    return d ? d.name : `ID ${dId}`
  }

  // Filters
  const filteredTrips = trips.filter(t => {
    const term = searchTerm.toLowerCase()
    const matchesSearch = 
      t.trip_code.toLowerCase().includes(term) ||
      t.source.toLowerCase().includes(term) ||
      t.destination.toLowerCase().includes(term)
    
    const matchesStatus = statusFilter ? t.status === statusFilter : true
    return matchesSearch && matchesStatus
  })

  // Create Handlers
  function openCreateModal() {
    setCreateData({
      trip_code: `TRIP-${Math.floor(100 + Math.random() * 900)}`,
      vehicle_id: '',
      driver_id: '',
      source: '',
      destination: '',
      cargo_weight: '',
      planned_distance: '',
      revenue: ''
    })
    setCreateError('')
    setIsCreateOpen(true)
  }

  async function handleCreateSubmit(e) {
    e.preventDefault()
    setCreateError('')

    const payload = {
      trip_code: createData.trip_code,
      vehicle_id: parseInt(createData.vehicle_id),
      driver_id: parseInt(createData.driver_id),
      source: createData.source,
      destination: createData.destination,
      cargo_weight: parseFloat(createData.cargo_weight),
      planned_distance: parseFloat(createData.planned_distance),
      revenue: parseFloat(createData.revenue)
    }

    try {
      await api.post('/trips', payload)
      setSuccessMsg(`Trip '${payload.trip_code}' created as Draft.`)
      setIsCreateOpen(false)
      fetchData()
    } catch (err) {
      const detail = err.response?.data?.detail
      setCreateError(typeof detail === 'string' ? detail : 'Failed to create trip assignment.')
    }
  }

  // Dispatch Handler
  async function handleDispatch(trip) {
    try {
      await api.patch(`/trips/${trip.id}`, { status: 'Dispatched' })
      setSuccessMsg(`Trip '${trip.trip_code}' successfully dispatched! Vehicle and Driver are now On Trip.`)
      fetchData()
    } catch (err) {
      setError('Failed to dispatch trip.')
      console.error(err)
    }
  }

  // Complete Handlers
  function openCompleteModal(trip) {
    setCompletingTrip(trip)
    setCompleteData({
      actual_distance: trip.planned_distance.toString(),
      fuel_used: '',
      revenue: trip.revenue.toString(),
      toll: '0',
      other: '0'
    })
    setCompleteError('')
    setIsCompleteOpen(true)
  }

  async function handleCompleteSubmit(e) {
    e.preventDefault()
    setCompleteError('')

    try {
      // 1. Update trip to completed
      await api.patch(`/trips/${completingTrip.id}`, {
        status: 'Completed',
        actual_distance: parseFloat(completeData.actual_distance),
        fuel_used: parseFloat(completeData.fuel_used),
        revenue: parseFloat(completeData.revenue)
      })

      // 2. Log expenses (only Fleet Managers allowed per RBAC, otherwise bypass)
      if (isManager) {
        await api.post('/expenses', {
          trip_id: completingTrip.id,
          vehicle_id: completingTrip.vehicle_id,
          toll: parseFloat(completeData.toll),
          other: parseFloat(completeData.other)
        })
      }

      setSuccessMsg(`Trip '${completingTrip.trip_code}' marked as Completed. Vehicle and Driver status returned to Available.`)
      setIsCompleteOpen(false)
      fetchData()
    } catch (err) {
      const detail = err.response?.data?.detail
      setCompleteError(typeof detail === 'string' ? detail : 'Failed to complete trip assignment.')
    }
  }

  // Cancel Handler
  async function handleCancel(trip) {
    try {
      await api.patch(`/trips/${trip.id}`, { status: 'Cancelled' })
      setSuccessMsg(`Trip '${trip.trip_code}' has been cancelled.`)
      fetchData()
    } catch (err) {
      setError('Failed to cancel trip.')
      console.error(err)
    }
  }

  // Filter available drivers & vehicles for dropdowns
  const availableVehicles = vehicles.filter(v => v.status === 'Available')
  const availableDrivers = drivers.filter(d => d.status === 'Available')

  return (
    <div className="min-h-full">
      <Topbar title="Trips Registry" subtitle="Manage trip dispatching, routing, and operational status" />

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
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-canvas-raised border border-paper-line rounded-sm p-4">
          <div className="flex flex-wrap gap-3 items-center w-full md:w-auto">
            {/* Search */}
            <div className="relative flex-1 md:w-64 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" size={16} />
              <input
                type="text"
                placeholder="Search trip code, route..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full rounded-sm border border-paper-line bg-canvas-raised pl-9 pr-3 py-2 text-sm outline-none transition-colors focus:border-signal-amber focus:ring-1 focus:ring-signal-amber/20"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="rounded-sm border border-paper-line bg-canvas-raised px-3 py-2 text-sm text-slate-ink outline-none transition-colors focus:border-signal-amber"
            >
              <option value="">All Statuses</option>
              <option value="Draft">Draft</option>
              <option value="Dispatched">Dispatched</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          {isAuthorized && (
            <button
              onClick={openCreateModal}
              className="flex w-full md:w-auto items-center justify-center gap-1.5 rounded-sm bg-ink-950 hover:bg-ink-800 text-canvas px-4 py-2.5 text-sm font-semibold tracking-wide transition-colors cursor-pointer"
            >
              <Plus size={16} />
              Create Trip
            </button>
          )}
        </div>

        {/* Trips Table */}
        <div className="bg-canvas-raised border border-paper-line rounded-sm overflow-hidden">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-12 text-center text-ink-500 font-mono text-sm">
                Loading trip manifest logs...
              </div>
            ) : filteredTrips.length === 0 ? (
              <div className="p-12 text-center text-ink-500 font-mono text-sm">
                No trips found in registry.
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-ink-950 text-canvas font-display border-b border-paper-line text-xs uppercase tracking-wider">
                    <th className="px-6 py-4 font-semibold">Trip Code</th>
                    <th className="px-6 py-4 font-semibold">Vehicle</th>
                    <th className="px-6 py-4 font-semibold">Driver</th>
                    <th className="px-6 py-4 font-semibold">Route</th>
                    <th className="px-6 py-4 font-semibold">Cargo (kg)</th>
                    <th className="px-6 py-4 font-semibold">Planned Dist.</th>
                    <th className="px-6 py-4 font-semibold">Revenue</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                    {isAuthorized && <th className="px-6 py-4 font-semibold text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-paper-line font-medium text-slate-ink">
                  {filteredTrips.map(trip => (
                    <tr key={trip.id} className="hover:bg-canvas transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-ink-900">{trip.trip_code}</td>
                      <td className="px-6 py-4">{getVehicleLabel(trip.vehicle_id)}</td>
                      <td className="px-6 py-4 font-bold">{getDriverLabel(trip.driver_id)}</td>
                      <td className="px-6 py-4 font-mono text-xs">
                        {trip.source} &rarr; {trip.destination}
                      </td>
                      <td className="px-6 py-4 tabular-nums">{trip.cargo_weight.toLocaleString()} kg</td>
                      <td className="px-6 py-4 tabular-nums">{trip.planned_distance.toLocaleString()} km</td>
                      <td className="px-6 py-4 tabular-nums">${trip.revenue.toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <StatusBadge status={trip.status} />
                      </td>
                      {isAuthorized && (
                        <td className="px-6 py-4 text-right">
                          <div className="inline-flex gap-2">
                            {trip.status === 'Draft' && (
                              <>
                                <button
                                  onClick={() => handleDispatch(trip)}
                                  className="flex items-center gap-1 px-2.5 py-1 text-xs bg-transit-blue hover:bg-transit-blue/90 text-canvas rounded-sm transition-colors"
                                  title="Dispatch Trip"
                                >
                                  <Play size={12} />
                                  Dispatch
                                </button>
                                <button
                                  onClick={() => handleCancel(trip)}
                                  className="p-1 hover:bg-canvas rounded-sm text-ink-500 hover:text-alert-red transition-colors"
                                  title="Cancel Trip"
                                >
                                  <Ban size={14} />
                                </button>
                              </>
                            )}

                            {trip.status === 'Dispatched' && (
                              <>
                                <button
                                  onClick={() => openCompleteModal(trip)}
                                  className="flex items-center gap-1 px-2.5 py-1 text-xs bg-rail-green hover:bg-rail-green/90 text-canvas rounded-sm transition-colors"
                                  title="Complete Trip"
                                >
                                  <Check size={12} />
                                  Complete
                                </button>
                                <button
                                  onClick={() => handleCancel(trip)}
                                  className="p-1 hover:bg-canvas rounded-sm text-ink-500 hover:text-alert-red transition-colors"
                                  title="Cancel Trip"
                                >
                                  <Ban size={14} />
                                </button>
                              </>
                            )}
                          </div>
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

      {/* Create Trip Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/60 p-4">
          <div className="w-full max-w-md bg-canvas-raised rounded-sm border border-paper-line shadow-xl overflow-hidden animate-zoom-in">
            <div className="flex items-center justify-between bg-ink-950 text-canvas px-6 py-4 border-b border-paper-line">
              <h3 className="font-display font-semibold">Create New Trip Assignment</h3>
              <button onClick={() => setIsCreateOpen(false)} className="hover:text-signal-amber transition-colors">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
              {createError && (
                <div className="flex items-start gap-2 rounded-sm border border-alert-red/30 bg-alert-red-dim px-3 py-2 text-xs text-alert-red">
                  <AlertTriangle size={15} className="mt-0.5 flex-shrink-0" />
                  <span>{createError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-ink-500 mb-1">Trip Code</label>
                  <input
                    type="text"
                    required
                    value={createData.trip_code}
                    onChange={e => setCreateData({ ...createData, trip_code: e.target.value })}
                    className="w-full rounded-sm border border-paper-line bg-canvas px-3 py-2 text-sm outline-none focus:border-signal-amber focus:ring-1 focus:ring-signal-amber/20 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink-500 mb-1">Target Revenue ($)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="e.g. 5000"
                    value={createData.revenue}
                    onChange={e => setCreateData({ ...createData, revenue: e.target.value })}
                    className="w-full rounded-sm border border-paper-line bg-canvas px-3 py-2 text-sm outline-none focus:border-signal-amber"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-ink-500 mb-1">Assign Vehicle</label>
                  <select
                    required
                    value={createData.vehicle_id}
                    onChange={e => setCreateData({ ...createData, vehicle_id: e.target.value })}
                    className="w-full rounded-sm border border-paper-line bg-canvas px-3 py-2 text-sm outline-none focus:border-signal-amber"
                  >
                    <option value="">Select Vehicle</option>
                    {availableVehicles.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.registration_number} ({v.name})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink-500 mb-1">Assign Driver</label>
                  <select
                    required
                    value={createData.driver_id}
                    onChange={e => setCreateData({ ...createData, driver_id: e.target.value })}
                    className="w-full rounded-sm border border-paper-line bg-canvas px-3 py-2 text-sm outline-none focus:border-signal-amber"
                  >
                    <option value="">Select Driver</option>
                    {availableDrivers.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-ink-500 mb-1">Source City</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mumbai"
                    value={createData.source}
                    onChange={e => setCreateData({ ...createData, source: e.target.value })}
                    className="w-full rounded-sm border border-paper-line bg-canvas px-3 py-2 text-sm outline-none focus:border-signal-amber"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink-500 mb-1">Destination City</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Pune"
                    value={createData.destination}
                    onChange={e => setCreateData({ ...createData, destination: e.target.value })}
                    className="w-full rounded-sm border border-paper-line bg-canvas px-3 py-2 text-sm outline-none focus:border-signal-amber"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-ink-500 mb-1">Cargo Weight (kg)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="e.g. 5000"
                    value={createData.cargo_weight}
                    onChange={e => setCreateData({ ...createData, cargo_weight: e.target.value })}
                    className="w-full rounded-sm border border-paper-line bg-canvas px-3 py-2 text-sm outline-none focus:border-signal-amber"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink-500 mb-1">Planned Distance (km)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="e.g. 150"
                    value={createData.planned_distance}
                    onChange={e => setCreateData({ ...createData, planned_distance: e.target.value })}
                    className="w-full rounded-sm border border-paper-line bg-canvas px-3 py-2 text-sm outline-none focus:border-signal-amber"
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-paper-line mt-6">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 border border-paper-line hover:bg-canvas rounded-sm text-sm text-ink-500 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-ink-950 hover:bg-ink-800 text-canvas rounded-sm text-sm font-semibold tracking-wide transition-colors"
                >
                  Create Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Complete Trip Modal */}
      {isCompleteOpen && completingTrip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/60 p-4">
          <div className="w-full max-w-md bg-canvas-raised rounded-sm border border-paper-line shadow-xl overflow-hidden animate-zoom-in">
            <div className="flex items-center justify-between bg-ink-950 text-canvas px-6 py-4 border-b border-paper-line">
              <h3 className="font-display font-semibold">Complete Trip: {completingTrip.trip_code}</h3>
              <button onClick={() => setIsCompleteOpen(false)} className="hover:text-signal-amber transition-colors">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCompleteSubmit} className="p-6 space-y-4">
              {completeError && (
                <div className="flex items-start gap-2 rounded-sm border border-alert-red/30 bg-alert-red-dim px-3 py-2 text-xs text-alert-red">
                  <AlertTriangle size={15} className="mt-0.5 flex-shrink-0" />
                  <span>{completeError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-ink-500 mb-1">Actual Distance (km)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={completeData.actual_distance}
                    onChange={e => setCompleteData({ ...completeData, actual_distance: e.target.value })}
                    className="w-full rounded-sm border border-paper-line bg-canvas px-3 py-2 text-sm outline-none focus:border-signal-amber"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink-500 mb-1">Fuel Used (Liters)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="e.g. 24.5"
                    value={completeData.fuel_used}
                    onChange={e => setCompleteData({ ...completeData, fuel_used: e.target.value })}
                    className="w-full rounded-sm border border-paper-line bg-canvas px-3 py-2 text-sm outline-none focus:border-signal-amber"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-500 mb-1">Final Revenue ($)</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={completeData.revenue}
                  onChange={e => setCompleteData({ ...completeData, revenue: e.target.value })}
                  className="w-full rounded-sm border border-paper-line bg-canvas px-3 py-2 text-sm outline-none focus:border-signal-amber"
                />
              </div>

              {isManager ? (
                <div className="grid grid-cols-2 gap-4 border-t border-paper-line pt-4 mt-2">
                  <div className="col-span-2">
                    <p className="text-[10px] uppercase tracking-wider text-ink-500 font-bold mb-2">Trip Expense Logging</p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-ink-500 mb-1">Toll Expenses ($)</label>
                    <input
                      type="number"
                      min="0"
                      value={completeData.toll}
                      onChange={e => setCompleteData({ ...completeData, toll: e.target.value })}
                      className="w-full rounded-sm border border-paper-line bg-canvas px-3 py-2 text-sm outline-none focus:border-signal-amber"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-ink-500 mb-1">Other Incidentals ($)</label>
                    <input
                      type="number"
                      min="0"
                      value={completeData.other}
                      onChange={e => setCompleteData({ ...completeData, other: e.target.value })}
                      className="w-full rounded-sm border border-paper-line bg-canvas px-3 py-2 text-sm outline-none focus:border-signal-amber"
                    />
                  </div>
                </div>
              ) : (
                <p className="text-xs text-ink-500 bg-canvas p-2.5 border border-paper-line rounded-sm">
                  * Note: Toll and incidental expenses must be logged by a Fleet Manager.
                </p>
              )}

              <div className="flex gap-3 justify-end pt-4 border-t border-paper-line mt-6">
                <button
                  type="button"
                  onClick={() => setIsCompleteOpen(false)}
                  className="px-4 py-2 border border-paper-line hover:bg-canvas rounded-sm text-sm text-ink-500 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rail-green hover:bg-rail-green/90 text-canvas rounded-sm text-sm font-semibold tracking-wide transition-colors"
                >
                  Complete Trip
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
