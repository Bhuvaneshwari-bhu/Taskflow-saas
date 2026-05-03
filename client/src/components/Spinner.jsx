export default function Spinner({ size = 'md' }) {
  const s = size === 'sm' ? 'w-4 h-4' : 'w-8 h-8'
  return (
    <div className={`${s} border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin`} />
  )
}
