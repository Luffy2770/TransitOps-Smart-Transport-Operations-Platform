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
  User, 
  AlertTriangle, 
  CheckCircle,
  Calendar,
  Phone,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react'

export default function Drivers() {
  const { user } = useAuth()
  const isManager = user?.role === 'Fleet Manager'

  const [drivers, setDrivers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  // Sort state
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState('desc')

  // Form State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingDriver, setEditingDriver] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    license_number: '',
    license_category: 'LMV',
    contact_number: '',
    license_expiry: '',
    safety_score: '100',
    status: 'Available'
  })
  const [formError, setFormError] = useState('')

  // Delete Confirmation State
  const [deleteTarget, setDeleteTarget] = useState(null)

  // Fetch Drivers
  async function fetchDrivers() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter) params.append('status', statusFilter)
      params.append('sort_by', sortBy)
      params.append('sort_order', sortOrder)

      const res = await api.get(`/drivers?${params.toString()}`)
      setDrivers(res.data)
      setError('')
    } catch (err) {
      setError('Failed to fetch drivers directory data.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDrivers()
  }, [statusFilter, sortBy, sortOrder])

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

  function formatTimestamp(ts) {
    if (!ts) return '—'
    const d = new Date(ts)
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) + ', ' +
      d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
  }

  // Clear success notification after 4s
  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(''), 4000)
      return () => clearTimeout(timer)
    }
  }, [successMsg])

  const filteredDrivers = drivers.filter(d => {
    const term = searchTerm.toLowerCase()
    return (
      d.name.toLowerCase().includes(term) ||
      d.license_number.toLowerCase().includes(term) ||
      d.contact_number.toLowerCase().includes(term)
    )
  })

  // Handlers
  function openAddModal() {
    setEditingDriver(null)
    setFormData({
      name: '',
      license_number: '',
      license_category: 'LMV',
      contact_number: '',
      license_expiry: '',
      safety_score: '100',
      status: 'Available'
    })
    setFormError('')
    setIsModalOpen(true)
  }

  function openEditModal(driver) {
    setEditingDriver(driver)
    setFormData({
      name: driver.name,
      license_number: driver.license_number,
      license_category: driver.license_category,
      contact_number: driver.contact_number,
      license_expiry: driver.license_expiry,
      safety_score: driver.safety_score,
      status: driver.status
    })
    setFormError('')
    setIsModalOpen(true)
  }

  async function handleFormSubmit(e) {
    e.preventDefault()
    setFormError('')

    const payload = {
      name: formData.name,
      license_number: formData.license_number,
      license_category: formData.license_category,
      contact_number: formData.contact_number,
      license_expiry: formData.license_expiry,
      safety_score: parseFloat(formData.safety_score)
    }

    try {
      if (editingDriver) {
        // Edit driver
        const res = await api.patch(`/drivers/${editingDriver.id}`, {
          ...payload,
          status: formData.status
        })
        setSuccessMsg(`Driver '${res.data.name}' profile updated successfully.`)
      } else {
        // Create driver
        const res = await api.post('/drivers', payload)
        setSuccessMsg(`Driver '${res.data.name}' registered successfully.`)
      }
      setIsModalOpen(false)
      fetchDrivers()
    } catch (err) {
      const detail = err.response?.data?.detail
      setFormError(
        typeof detail === 'string' 
          ? detail 
          : 'Could not save driver profile. Check inputs and try again.'
      )
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return
    try {
      await api.delete(`/drivers/${deleteTarget.id}`)
      setSuccessMsg(`Driver '${deleteTarget.name}' successfully deleted.`)
      setDeleteTarget(null)
      fetchDrivers()
    } catch (err) {
      setError('Failed to delete driver profile.')
      console.error(err)
    }
  }

  return (
    <div className="min-h-full">
      <Topbar title="Drivers Directory" subtitle="Manage and monitor company drivers" />

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
                placeholder="Search name, license or phone..."
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
              <option value="Available">Available</option>
              <option value="On Trip">On Trip</option>
              <option value="Off Duty">Off Duty</option>
              <option value="Suspended">Suspended</option>
            </select>
          </div>

          {isManager && (
            <button
              onClick={openAddModal}
              className="flex w-full md:w-auto items-center justify-center gap-1.5 rounded-sm bg-ink-950 hover:bg-ink-800 text-canvas px-4 py-2.5 text-sm font-semibold tracking-wide transition-colors cursor-pointer"
            >
              <Plus size={16} />
              Register Driver
            </button>
          )}
        </div>

        {/* Drivers Table */}
        <div className="bg-canvas-raised border border-paper-line rounded-sm overflow-hidden">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-12 text-center text-ink-500 font-mono text-sm">
                Loading drivers directory...
              </div>
            ) : filteredDrivers.length === 0 ? (
              <div className="p-12 text-center text-ink-500 font-mono text-sm">
                No drivers found matching criteria.
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-ink-950 text-canvas font-display border-b border-paper-line text-xs uppercase tracking-wider">
                    <th className="px-6 py-4 font-semibold cursor-pointer select-none" onClick={() => handleSort('name')}>
                      <span className="inline-flex items-center gap-1">Name <SortIcon field="name" /></span>
                    </th>
                    <th className="px-6 py-4 font-semibold">License Number</th>
                    <th className="px-6 py-4 font-semibold">License Category</th>
                    <th className="px-6 py-4 font-semibold">Contact</th>
                    <th className="px-6 py-4 font-semibold cursor-pointer select-none" onClick={() => handleSort('license_expiry')}>
                      <span className="inline-flex items-center gap-1">Expiry Date <SortIcon field="license_expiry" /></span>
                    </th>
                    <th className="px-6 py-4 font-semibold cursor-pointer select-none" onClick={() => handleSort('safety_score')}>
                      <span className="inline-flex items-center gap-1">Safety Score <SortIcon field="safety_score" /></span>
                    </th>
                    <th className="px-6 py-4 font-semibold cursor-pointer select-none" onClick={() => handleSort('status')}>
                      <span className="inline-flex items-center gap-1">Status <SortIcon field="status" /></span>
                    </th>
                    <th className="px-6 py-4 font-semibold cursor-pointer select-none" onClick={() => handleSort('created_at')}>
                      <span className="inline-flex items-center gap-1">Registered On <SortIcon field="created_at" /></span>
                    </th>
                    {isManager && <th className="px-6 py-4 font-semibold text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-paper-line font-medium text-slate-ink">
                  {filteredDrivers.map(driver => (
                    <tr key={driver.id} className="hover:bg-canvas transition-colors">
                      <td className="px-6 py-4 font-bold text-ink-900">{driver.name}</td>
                      <td className="px-6 py-4 font-mono text-xs">{driver.license_number}</td>
                      <td className="px-6 py-4 font-mono text-xs">{driver.license_category}</td>
                      <td className="px-6 py-4 font-mono text-xs text-ink-500">{driver.contact_number}</td>
                      <td className="px-6 py-4 font-mono text-xs">
                        {new Date(driver.license_expiry).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`font-mono text-xs font-bold ${driver.safety_score >= 90 ? 'text-rail-green' : driver.safety_score >= 80 ? 'text-signal-amber' : 'text-alert-red'}`}>
                          {driver.safety_score}%
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={driver.status} />
                      </td>
                      <td className="px-6 py-4 text-xs text-ink-500 whitespace-nowrap">{formatTimestamp(driver.created_at)}</td>
                      {isManager && (
                        <td className="px-6 py-4 text-right">
                          <div className="inline-flex gap-2">
                            <button
                              onClick={() => openEditModal(driver)}
                              className="p-1.5 hover:bg-canvas rounded-sm text-ink-500 hover:text-signal-amber transition-colors"
                              title="Edit Driver"
                            >
                              <Edit2 size={15} />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(driver)}
                              className="p-1.5 hover:bg-canvas rounded-sm text-ink-500 hover:text-alert-red transition-colors"
                              title="Delete Driver Profile"
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
                {editingDriver ? `Edit Driver: ${editingDriver.name}` : 'Register New Driver'}
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

              <div>
                <label className="block text-xs font-semibold text-ink-500 mb-1">Driver Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-sm border border-paper-line bg-canvas px-3 py-2 text-sm outline-none focus:border-signal-amber focus:ring-1 focus:ring-signal-amber/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-ink-500 mb-1">License Number</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. LIC-JD123"
                    value={formData.license_number}
                    onChange={e => setFormData({ ...formData, license_number: e.target.value })}
                    className="w-full rounded-sm border border-paper-line bg-canvas px-3 py-2 text-sm outline-none focus:border-signal-amber"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink-500 mb-1">License Category</label>
                  <select
                    value={formData.license_category}
                    onChange={e => setFormData({ ...formData, license_category: e.target.value })}
                    className="w-full rounded-sm border border-paper-line bg-canvas px-3 py-2 text-sm outline-none focus:border-signal-amber"
                  >
                    <option value="LMV">LMV (Light)</option>
                    <option value="HMV">HMV (Heavy)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-500 mb-1">Contact Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. +919876543210"
                  value={formData.contact_number}
                  onChange={e => setFormData({ ...formData, contact_number: e.target.value })}
                  className="w-full rounded-sm border border-paper-line bg-canvas px-3 py-2 text-sm outline-none focus:border-signal-amber focus:ring-1 focus:ring-signal-amber/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-ink-500 mb-1">License Expiry</label>
                  <input
                    type="date"
                    required
                    value={formData.license_expiry}
                    onChange={e => setFormData({ ...formData, license_expiry: e.target.value })}
                    className="w-full rounded-sm border border-paper-line bg-canvas px-3 py-2 text-sm outline-none focus:border-signal-amber"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink-500 mb-1">Safety Score (%)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    max="100"
                    placeholder="e.g. 95"
                    value={formData.safety_score}
                    onChange={e => setFormData({ ...formData, safety_score: e.target.value })}
                    className="w-full rounded-sm border border-paper-line bg-canvas px-3 py-2 text-sm outline-none focus:border-signal-amber"
                  />
                </div>
              </div>

              {editingDriver && (
                <div>
                  <label className="block text-xs font-semibold text-ink-500 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value })}
                    className="w-full rounded-sm border border-paper-line bg-canvas px-3 py-2 text-sm outline-none focus:border-signal-amber"
                  >
                    <option value="Available">Available</option>
                    <option value="On Trip">On Trip</option>
                    <option value="Off Duty">Off Duty</option>
                    <option value="Suspended">Suspended</option>
                  </select>
                </div>
              )}

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
                  {editingDriver ? 'Save Changes' : 'Register Driver'}
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
              <h3 className="font-display font-semibold text-lg">Remove Driver Profile?</h3>
            </div>
            <p className="text-sm text-ink-500 leading-relaxed">
              Are you sure you want to delete driver <strong>{deleteTarget.name}</strong> ({deleteTarget.license_number})? 
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
                Delete Driver
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
