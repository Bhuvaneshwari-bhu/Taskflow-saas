import { useAuth } from '../context/AuthContext'

/**
 * Returns the current user's role within a project.
 * Compares project.owner (ObjectId string) with user._id from AuthContext.
 */
export default function useRole(project) {
  const { user } = useAuth()

  if (!project || !user) return { role: 'member', isOwner: false }

  // owner may be a populated object or a raw ObjectId string
  const ownerId = project.owner?._id ?? project.owner
  const isOwner = String(ownerId) === String(user._id)

  return { role: isOwner ? 'owner' : 'member', isOwner }
}
