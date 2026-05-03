import Navbar from '../components/Navbar'

/**
 * Shared shell for all authenticated pages.
 * Renders the sticky top Navbar then stretches children to fill the viewport.
 */
export default function AppLayout({ children }) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      {children}
    </div>
  )
}
