import { useAuth } from '../context/AuthContext'

function Field({ label, value, mono = false }) {
  return (
    <div>
      <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-sm font-medium text-slate-700 ${mono ? 'font-mono' : ''}`}>
        {value || <span className="text-slate-400">—</span>}
      </p>
    </div>
  )
}

export default function ProfilePage() {
  const { user } = useAuth()

  const initials = (user?.name || user?.email || 'U')
    .split(' ')
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase()

  return (
    <div className="max-w-xl mx-auto px-6 py-8">
      <h1 className="text-xl font-bold text-slate-800 mb-6">Profile</h1>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        {/* Avatar header */}
        <div className="bg-gradient-to-br from-blue-50 to-slate-50 px-6 py-8 border-b border-slate-200 flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-blue-600 text-white text-2xl font-bold flex items-center justify-center shrink-0">
            {initials}
          </div>
          <div>
            <p className="text-lg font-bold text-slate-800">{user?.name || user?.email}</p>
            {user?.name && (
              <p className="text-sm text-slate-500 mt-0.5">{user?.email}</p>
            )}
          </div>
        </div>

        {/* Detail grid */}
        <div className="divide-y divide-slate-100">
          <div className="px-6 py-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Full Name"  value={user?.name}  />
            <Field label="Email"      value={user?.email} />
          </div>
          <div className="px-6 py-4">
            <Field label="User ID" value={user?._id} mono />
          </div>
        </div>
      </div>
    </div>
  )
}
