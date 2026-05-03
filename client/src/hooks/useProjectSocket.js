import { useEffect, useRef } from 'react'
import { io } from 'socket.io-client'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000'

/**
 * Connects to the socket server, joins a project room, and registers
 * event handlers. Disconnects automatically on unmount or projectId change.
 *
 * Handlers are read via ref so the effect only re-runs when projectId
 * changes — not on every render.
 */
export default function useProjectSocket(projectId, handlers) {
  const handlersRef = useRef(handlers)

  // Keep ref in sync without re-running the effect
  useEffect(() => {
    handlersRef.current = handlers
  })

  useEffect(() => {
    if (!projectId) return

    const socket = io(SOCKET_URL, { transports: ['websocket'] })

    socket.on('connect', () => {
      socket.emit('join-project', projectId)
    })

    socket.on('task:created',    data => handlersRef.current.onTaskCreated?.(data))
    socket.on('task:updated',    data => handlersRef.current.onTaskUpdated?.(data))
    socket.on('task:deleted',    data => handlersRef.current.onTaskDeleted?.(data))
    socket.on('member:added',    data => handlersRef.current.onMemberAdded?.(data))
    socket.on('comment:created', data => handlersRef.current.onCommentCreated?.(data))

    return () => socket.disconnect()
  }, [projectId])
}
