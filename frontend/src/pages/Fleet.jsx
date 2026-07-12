import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { Topbar } from '@/components/Topbar'
import { StatusBadge } from '@/components/StatusBadge'
import { 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  X, 
  Truck, 
  AlertTriangle, 
  CheckCircle,
  FileText,
  DollarSign
} from 'lucide-react'

export default function Fleet() {
  const { user } = useAuth()
  const isManager = user?.role === 'Fleet Manager'

  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  // Form State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState(null)
  const [formData, setFormData] = useState({
    registration_number: '',
    name: '',
    type: 'Truck',
    capacity_kg: '',
    acquisition_cost: '',
    odometer: '',
    status: 'Available'
  })
  const [formError, setFormError] = useState('')

  // Delete Confirmation State
  const [deleteTarget, setDeleteTarget] = useState(null)

  // Fetch Vehicles
  async function fetchVehicles() {
    setLoading(true)
    try {
      // Build query string
      const params = new URLSearchParams()
      if (typeFilter) params.append('type', typeFilter)
      if (statusFilter) params.append('status', statusFilter)

      const res = await api.get(`/vehicles?${params.toString()}`)
      setVehicles(res.data)
      setError('')
    } catch (err) {
      setError('Failed to fetch vehicle fleet registry data.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchVehicles()
  }, [typeFilter, statusFilter])

  // Clear success notification after 4s
  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(''), 4000)
      return () => clearTimeout(timer)
    }
  }, [successMsg])

  const filteredVehicles = vehicles.filter(v => {
    const term = searchTerm.toLowerCase()
    return (
      v.registration_number.toLowerCase().includes(term) ||
      v.name.toLowerCase().includes(term) ||
      v.type.toLowerCase().includes(term)
    )
  })

  // Handlers
  function openAddModal() {
    setEditingVehicle(null)
    setFormData({
      registration_number: '',
      name: '',
      type: 'Truck',
      capacity_kg: '',
      acquisition_cost: '',
      odometer: '',
      status: 'Available'
    })
    setFormError('')
    setIsModalOpen(true)
  }

  function openEditModal(vehicle) {
    setEditingVehicle(vehicle)
    setFormData({
      registration_number: vehicle.registration_number,
      name: vehicle.name,
      type: vehicle.type,
      capacity_kg: vehicle.capacity_kg,
      acquisition_cost: vehicle.acquisition_cost,
      odometer: vehicle.odometer,
      status: vehicle.status
    })
    setFormError('')
    setIsModalOpen(true)
  }

  async function handleFormSubmit(e) {
    e.preventDefault()
    setFormError('')

    const payload = {
      registration_number: formData.registration_number,
      name: formData.name,
      type: formData.type,
      capacity_kg: parseFloat(formData.capacity_kg),
      acquisition_cost: parseFloat(formData.acquisition_cost),
      odometer: parseFloat(formData.odometer)
    }

    try {
      if (editingVehicle) {
        // Edit vehicle
        const res = await api.patch(`/vehicles/${editingVehicle.id}`, {
          ...payload,
          status: formData.status
        })
        setSuccessMsg(`Vehicle '${res.data.registration_number}' updated successfully.`)
      } else {
        // Create vehicle
        const res = await api.post('/vehicles', payload)
        setSuccessMsg(`Vehicle '${res.data.registration_number}' added to fleet.`)
      }
      setIsModalOpen(false)
      fetchVehicles()
    } catch (err) {
      const detail = err.response?.data?.detail
      setFormError(
        typeof detail === 'string' 
          ? detail 
          : 'Could not save vehicle. Please check inputs and try again.'
      )
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return
    try {
      await api.delete(`/vehicles/${deleteTarget.id}`)
      setSuccessMsg(`Vehicle '${deleteTarget.registration_number}' successfully retired from fleet.`)
      setDeleteTarget(null)
      fetchVehicles()
    } catch (err) {
      setError('Failed to delete/retire vehicle.')
      console.error(err)
    }
  }

  return (
    <div className="min-h-full">
      <Topbar title="Fleet Registry" subtitle="Manage and monitor company vehicles" />

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
                placeholder="Search registration or name..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full rounded-sm border border-paper-line bg-canvas-raised pl-9 pr-3 py-2 text-sm outline-none transition-colors focus:border-signal-amber focus:ring-1 focus:ring-signal-amber/20"
              />
            </div>

            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              className="rounded-sm border border-paper-line bg-canvas-raised px-3 py-2 text-sm text-slate-ink outline-none transition-colors focus:border-signal-amber"
            >
              <option value="">All Vehicle Types</option>
              <option value="Truck">Truck</option>
              <option value="Van">Van</option>
              <option value="Mini">Mini</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="rounded-sm border border-paper-line bg-canvas-raised px-3 py-2 text-sm text-slate-ink outline-none transition-colors focus:border-signal-amber"
            >
              <option value="">All Statuses</option>
              <option value="Available">Available</option>
              <option value="On Trip">On Trip</option>
              <option value="In Shop">In Shop</option>
              <option value="Retired">Retired</option>
            </select>
          </div>

          {isManager && (
            <button
              onClick={openAddModal}
              className="flex w-full md:w-auto items-center justify-center gap-1.5 rounded-sm bg-ink-950 hover:bg-ink-800 text-canvas px-4 py-2.5 text-sm font-semibold tracking-wide transition-colors cursor-pointer"
            >
              <Plus size={16} />
              Add Vehicle
            </button>
          )}
        </div>

        {/* Vehicles Table */}
        <div className="bg-canvas-raised border border-paper-line rounded-sm overflow-hidden">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-12 text-center text-ink-500 font-mono text-sm">
                Loading vehicle registry...
              </div>
            ) : filteredVehicles.length === 0 ? (
              <div className="p-12 text-center text-ink-500 font-mono text-sm">
                No vehicles found matching criteria.
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-ink-950 text-canvas font-display border-b border-paper-line text-xs uppercase tracking-wider">
                    <th className="px-6 py-4 font-semibold">Reg. Number</th>
                    <th className="px-6 py-4 font-semibold">Model / Name</th>
                    <th className="px-6 py-4 font-semibold">Type</th>
                    <th className="px-6 py-4 font-semibold">Capacity (kg)</th>
                    <th className="px-6 py-4 font-semibold">Odometer (km)</th>
                    <th className="px-6 py-4 font-semibold">Acq. Cost</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                    {isManager && <th className="px-6 py-4 font-semibold text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-paper-line font-medium text-slate-ink">
                  {filteredVehicles.map(vehicle => (
                    <tr key={vehicle.id} className="hover:bg-canvas transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-ink-900">{vehicle.registration_number}</td>
                      <td className="px-6 py-4">{vehicle.name}</td>
                      <td className="px-6 py-4 font-mono text-xs">{vehicle.type}</td>
                      <td className="px-6 py-4 tabular-nums">{vehicle.capacity_kg.toLocaleString()}</td>
                      <td className="px-6 py-4 tabular-nums">{vehicle.odometer.toLocaleString()} km</td>
                      <td className="px-6 py-4 tabular-nums">${vehicle.acquisition_cost.toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <StatusBadge status={vehicle.status} />
                      </td>
                      {isManager && (
                        <td className="px-6 py-4 text-right">
                          <div className="inline-flex gap-2">
                            <button
                              onClick={() => openEditModal(vehicle)}
                              className="p-1.5 hover:bg-canvas rounded-sm text-ink-500 hover:text-signal-amber transition-colors"
                              title="Edit Vehicle"
                            >
                              <Edit2 size={15} />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(vehicle)}
                              className="p-1.5 hover:bg-canvas rounded-sm text-ink-500 hover:text-alert-red transition-colors"
                              title="Retire/Delete Vehicle"
                            >
                              <Trash2 size={15} />
                            </button>
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

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/60 p-4">
          <div className="w-full max-w-md bg-canvas-raised rounded-sm border border-paper-line shadow-xl overflow-hidden animate-zoom-in">
            {/* Modal Header */}
            <div className="flex items-center justify-between bg-ink-950 text-canvas px-6 py-4 border-b border-paper-line">
              <h3 className="font-display font-semibold">
                {editingVehicle ? `Edit Vehicle: ${editingVehicle.registration_number}` : 'Add New Vehicle'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="hover:text-signal-amber transition-colors">
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="flex items-start gap-2 rounded-sm border border-alert-red/30 bg-alert-red-dim px-3 py-2 text-xs text-alert-red">
                  <AlertTriangle size={15} className="mt-0.5 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-ink-500 mb-1">Reg. Number</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. MH-12-PQ-1234"
                    value={formData.registration_number}
                    onChange={e => setFormData({ ...formData, registration_number: e.target.value })}
                    className="w-full rounded-sm border border-paper-line bg-canvas px-3 py-2 text-sm outline-none focus:border-signal-amber focus:ring-1 focus:ring-signal-amber/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink-500 mb-1">Vehicle Type</label>
                  <select
                    value={formData.type}
                    onChange={e => setFormData({ ...formData, type: e.target.value })}
                    className="w-full rounded-sm border border-paper-line bg-canvas px-3 py-2 text-sm outline-none focus:border-signal-amber"
                  >
                    <option value="Truck">Truck</option>
                    <option value="Van">Van</option>
                    <option value="Mini">Mini</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-500 mb-1">Model / Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tata Ultra T.7"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-sm border border-paper-line bg-canvas px-3 py-2 text-sm outline-none focus:border-signal-amber focus:ring-1 focus:ring-signal-amber/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-ink-500 mb-1">Capacity (kg)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="e.g. 7300"
                    value={formData.capacity_kg}
                    onChange={e => setFormData({ ...formData, capacity_kg: e.target.value })}
                    className="w-full rounded-sm border border-paper-line bg-canvas px-3 py-2 text-sm outline-none focus:border-signal-amber"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink-500 mb-1">Acq. Cost ($)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="e.g. 45000"
                    value={formData.acquisition_cost}
                    onChange={e => setFormData({ ...formData, acquisition_cost: e.target.value })}
                    className="w-full rounded-sm border border-paper-line bg-canvas px-3 py-2 text-sm outline-none focus:border-signal-amber"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-ink-500 mb-1">Odometer (km)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="e.g. 15200"
                    value={formData.odometer}
                    onChange={e => setFormData({ ...formData, odometer: e.target.value })}
                    className="w-full rounded-sm border border-paper-line bg-canvas px-3 py-2 text-sm outline-none focus:border-signal-amber"
                  />
                </div>
                {editingVehicle && (
                  <div>
                    <label className="block text-xs font-semibold text-ink-500 mb-1">Status</label>
                    <select
                      value={formData.status}
                      onChange={e => setFormData({ ...formData, status: e.target.value })}
                      className="w-full rounded-sm border border-paper-line bg-canvas px-3 py-2 text-sm outline-none focus:border-signal-amber"
                    >
                      <option value="Available">Available</option>
                      <option value="On Trip">On Trip</option>
                      <option value="In Shop">In Shop</option>
                      <option value="Retired">Retired</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
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
                  {editingVehicle ? 'Save Changes' : 'Create Vehicle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/60 p-4">
          <div className="w-full max-w-sm bg-canvas-raised rounded-sm border border-paper-line shadow-xl p-6 space-y-4 animate-zoom-in">
            <div className="flex items-center gap-3 text-alert-red">
              <AlertTriangle size={24} />
              <h3 className="font-display font-semibold text-lg">Retire Vehicle?</h3>
            </div>
            <p className="text-sm text-ink-500 leading-relaxed">
              Are you sure you want to retire vehicle <strong>{deleteTarget.registration_number}</strong> ({deleteTarget.name})? 
              This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end pt-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 border border-paper-line hover:bg-canvas rounded-sm text-sm text-ink-500 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-alert-red hover:bg-alert-red/90 text-canvas rounded-sm text-sm font-semibold tracking-wide transition-colors"
              >
                Retire Vehicle
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
