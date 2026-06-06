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
      const msg = err && err.code === 1
        ? 'Lokalizacja zablokowana — zezwól w ustawieniach przeglądarki (kłódka przy adresie)'
        : err && err.code === 2
        ? 'Nie udało się ustalić pozycji — sprawdź czy lokalizacja w telefonie jest włączona'
        : err && err.code === 3
        ? 'Przekroczono czas — spróbuj ponownie'
        : (err && err.message) || 'Brak dostępu do lokalizacji'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return { location, error, loading, requestLocation }
}
