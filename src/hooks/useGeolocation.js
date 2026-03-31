import { useState, useEffect } from 'react'
import { getUserLocation } from '../lib/geo'

export function useGeolocation() {
  const [location, setLocation] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const requestLocation = async () => {
    setLoading(true)
    setError(null)
    try {
      const loc = await getUserLocation()
      setLocation(loc)
    } catch (err) {
      setError(err.message || 'Brak dostępu do lokalizacji')
    } finally {
      setLoading(false)
    }
  }

  return { location, error, loading, requestLocation }
}
