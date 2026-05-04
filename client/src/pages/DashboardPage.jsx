import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useOrg } from '../context/OrgContext'
import Spinner from '../components/Spinner'

export default function DashboardPage() {
  const { activeOrg } = useOrg()
  const navigate      = useNavigate()

  useEffect(() => {
    if (activeOrg?._id) {
      navigate(`/org/${activeOrg._id}`, { replace: true })
    } else {
      navigate('/organizations', { replace: true })
    }
  }, [activeOrg, navigate])

  return (
    <div className="flex flex-1 items-center justify-center py-32">
      <Spinner />
    </div>
  )
}
