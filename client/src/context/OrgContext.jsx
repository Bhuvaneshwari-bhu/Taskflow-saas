import { createContext, useContext, useState } from 'react'

const OrgContext = createContext(null)

const STORAGE_KEY = 'activeOrg'

export function OrgProvider({ children }) {
  const [activeOrg, setActiveOrgState] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) } catch { return null }
  })

  function setActiveOrg(org) {
    if (org) {
      // Store only the fields needed for navigation and display
      const slim = { _id: org._id, name: org.name }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(slim))
      setActiveOrgState(slim)
    } else {
      localStorage.removeItem(STORAGE_KEY)
      setActiveOrgState(null)
    }
  }

  return (
    <OrgContext.Provider value={{ activeOrg, setActiveOrg }}>
      {children}
    </OrgContext.Provider>
  )
}

export function useOrg() {
  return useContext(OrgContext)
}
