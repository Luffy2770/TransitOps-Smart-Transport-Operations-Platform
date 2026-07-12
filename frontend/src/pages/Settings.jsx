import { useState } from 'react'
import { api } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { Topbar } from '@/components/Topbar'
import { 
  Shield, 
  User, 
  Lock, 
  AlertTriangle, 
  CheckCircle
} from 'lucide-react'

export default function Settings() {
  const { user } = useAuth()

  // Change Password Form
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)

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

  return (
    <div className="min-h-full">
      <Topbar title="System Settings" subtitle="Configure profile settings and credentials" />

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
      </div>
    </div>
  )
}
