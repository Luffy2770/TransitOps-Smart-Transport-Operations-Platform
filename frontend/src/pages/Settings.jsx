import { useState } from 'react'
import { api } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { Topbar } from '@/components/Topbar'
import { 
  Shield, 
  User, 
  Lock, 
  Database, 
  AlertTriangle, 
  CheckCircle,
  RefreshCw,
  LogOut
} from 'lucide-react'

export default function Settings() {
  const { user, logout } = useAuth()
  const isManager = user?.role === 'Fleet Manager'

  // Change Password Form
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)

  // DB Reset State
  const [resetLoading, setResetLoading] = useState(false)
  const [resetSuccess, setResetSuccess] = useState('')
  const [resetError, setResetError] = useState('')
  const [confirmReset, setConfirmReset] = useState(false)

  async function handlePasswordSubmit(e) {
    e.preventDefault()
    setPasswordError('')
    setPasswordSuccess('')

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.')
      return
    }

    setPasswordLoading(true)
    try {
      await api.post('/auth/change-password', {
        current_password: currentPassword,
        new_password: newPassword
      })
      setPasswordSuccess('Password updated successfully!')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      const detail = err.response?.data?.detail
      setPasswordError(typeof detail === 'string' ? detail : 'Failed to change password.')
    } finally {
      setPasswordLoading(false)
    }
  }

  async function handleResetDatabase() {
    if (!confirmReset) {
      setConfirmReset(true)
      return
    }

    setResetLoading(true)
    setResetError('')
    setResetSuccess('')

    try {
      await api.post('/auth/reset-db')
      setResetSuccess('Database reset and re-seeded successfully!')
      setConfirmReset(false)
      
      // Auto logout to refresh token and database alignment
      setTimeout(() => {
        logout()
      }, 2000)
    } catch (err) {
      const detail = err.response?.data?.detail
      setResetError(typeof detail === 'string' ? detail : 'Failed to reset database.')
      setConfirmReset(false)
    } finally {
      setResetLoading(false)
    }
  }

  return (
    <div className="min-h-full">
      <Topbar title="System Settings" subtitle="Configure profile settings, passwords, and database utilities" />

      <div className="p-8 space-y-8 max-w-4xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* User Profile Card */}
          <div className="bg-canvas-raised border border-paper-line rounded-sm p-6 space-y-4 shadow-sm h-fit">
            <div className="flex items-center gap-2 pb-3 border-b border-paper-line">
              <User className="text-transit-blue" size={18} />
              <h4 className="font-display font-semibold text-slate-ink text-sm">User Profile</h4>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-[10px] uppercase font-bold text-ink-500 tracking-wider">Account Name</p>
                <p className="text-sm font-semibold text-slate-ink">{user?.name || 'Loading...'}</p>
              </div>

              <div>
                <p className="text-[10px] uppercase font-bold text-ink-500 tracking-wider">Email Address</p>
                <p className="text-sm font-mono text-ink-700">{user?.email || 'Loading...'}</p>
              </div>

              <div>
                <p className="text-[10px] uppercase font-bold text-ink-500 tracking-wider mb-1">Access Role</p>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono font-bold rounded-sm bg-ink-950 text-canvas border border-ink-800">
                  <Shield size={12} className="text-signal-amber" />
                  {user?.role || 'User'}
                </span>
              </div>
            </div>
          </div>

          {/* Change Password Panel */}
          <div className="bg-canvas-raised border border-paper-line rounded-sm p-6 shadow-sm md:col-span-2 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-paper-line">
              <Lock className="text-transit-blue" size={18} />
              <h4 className="font-display font-semibold text-slate-ink text-sm">Change Credentials</h4>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              {passwordError && (
                <div className="flex items-center gap-2 rounded-sm border border-alert-red/30 bg-alert-red-dim px-3 py-2 text-xs text-alert-red">
                  <AlertTriangle size={14} className="flex-shrink-0" />
                  <span>{passwordError}</span>
                </div>
              )}

              {passwordSuccess && (
                <div className="flex items-center gap-2 rounded-sm border border-rail-green/30 bg-rail-green-dim px-3 py-2 text-xs text-rail-green">
                  <CheckCircle size={14} className="flex-shrink-0" />
                  <span>{passwordSuccess}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-ink-500 mb-1">Current Password</label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  className="w-full rounded-sm border border-paper-line bg-canvas px-3 py-2 text-sm outline-none focus:border-signal-amber"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-ink-500 mb-1">New Password</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className="w-full rounded-sm border border-paper-line bg-canvas px-3 py-2 text-sm outline-none focus:border-signal-amber"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink-500 mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    className="w-full rounded-sm border border-paper-line bg-canvas px-3 py-2 text-sm outline-none focus:border-signal-amber"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={passwordLoading}
                className="rounded-sm bg-ink-950 hover:bg-ink-800 text-canvas px-4 py-2 text-xs font-semibold tracking-wider uppercase transition-colors cursor-pointer disabled:opacity-50"
              >
                {passwordLoading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>

        </div>

        {/* Database Utilities Panel (Fleet Manager only) */}
        {isManager && (
          <div className="bg-canvas-raised border border-paper-line rounded-sm p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-paper-line">
              <Database className="text-alert-red" size={18} />
              <h4 className="font-display font-semibold text-slate-ink text-sm">System Database Utilities</h4>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-canvas p-4 border border-paper-line rounded-sm">
              <div className="space-y-1">
                <h5 className="text-sm font-semibold text-slate-ink flex items-center gap-1.5">
                  <AlertTriangle className="text-signal-amber" size={16} />
                  Reset & Seed Database
                </h5>
                <p className="text-xs text-ink-500 max-w-xl">
                  Re-initialize the SQLite database back to its factory default state. This will drop all tables, reseed mock roles, users, vehicles, drivers, and initial trips history.
                </p>
              </div>

              <button
                onClick={handleResetDatabase}
                disabled={resetLoading}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-sm text-xs font-mono font-bold border transition-colors cursor-pointer disabled:opacity-50 ${
                  confirmReset 
                    ? 'bg-alert-red hover:bg-alert-red/90 text-canvas border-alert-red' 
                    : 'bg-canvas hover:bg-canvas-raised text-alert-red border-alert-red/30'
                }`}
              >
                {resetLoading ? (
                  <RefreshCw className="animate-spin" size={14} />
                ) : confirmReset ? (
                  'Confirm Factory Reset'
                ) : (
                  'Reset Database'
                )}
              </button>
            </div>

            {resetSuccess && (
              <div className="flex items-center gap-2 rounded-sm border border-rail-green/30 bg-rail-green-dim px-3 py-2 text-xs text-rail-green animate-fade-in">
                <CheckCircle size={14} className="flex-shrink-0" />
                <span>{resetSuccess} Logging out...</span>
              </div>
            )}

            {resetError && (
              <div className="flex items-center gap-2 rounded-sm border border-alert-red/30 bg-alert-red-dim px-3 py-2 text-xs text-alert-red animate-fade-in">
                <AlertTriangle size={14} className="flex-shrink-0" />
                <span>{resetError}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
