'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function ReservationDetail({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const [reservation, setReservation] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [timeLeft, setTimeLeft] = useState('')
  const [confirming, setConfirming] = useState(false)
  const [releasing, setReleasing] = useState(false)
  const [id, setId] = useState('')

  useEffect(() => {
    params.then((p) => setId(p.id))
  }, [params])

  useEffect(() => {
    if (!id) return

    fetch('/api/reservations')
      .then((r) => r.json())
      .then((data) => {
        const found = data.find((r: any) => r.id === id)
        if (found) setReservation(found)
      })
      .catch(() => setError('Failed to load reservation'))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (!reservation || reservation.status !== 'pending') return

    const tick = () => {
      const diff = new Date(reservation.expires_at).getTime() - new Date().getTime()
      if (diff <= 0) {
        setTimeLeft('EXPIRED')
      } else {
        const mins = Math.floor(diff / 60000)
        const secs = Math.floor((diff % 60000) / 1000)
        setTimeLeft(`${mins}:${secs.toString().padStart(2, '0')}`)
      }
    }

    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [reservation])

  const handleConfirm = async () => {
    if (!reservation) return
    setConfirming(true)
    setError('')

    try {
      const res = await fetch(`/api/reservations/${reservation.id}/confirm`, {
        method: 'POST',
      })
      const updated = await res.json()
      if (!res.ok) {
        throw new Error(updated.error || 'Failed')
      }
      setReservation(updated)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to confirm')
    } finally {
      setConfirming(false)
    }
  }

  const handleRelease = async () => {
    if (!reservation) return
    setReleasing(true)
    setError('')

    try {
      const res = await fetch(`/api/reservations/${reservation.id}/release`, {
        method: 'POST',
      })
      const updated = await res.json()
      if (!res.ok) {
        throw new Error(updated.error || 'Failed')
      }
      setReservation(updated)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to release')
    } finally {
      setReleasing(false)
    }
  }

  if (loading) {
    return <div style={{ padding: '20px' }}>Loading...</div>
  }

  if (!reservation) {
    return (
      <div style={{ padding: '20px' }}>
        <Link href="/">← Back</Link>
        <p style={{ color: 'red' }}>Not found</p>
      </div>
    )
  }

  const bgColor = {
    pending: '#fffaf0',
    confirmed: '#f0fdf4',
    released: '#f9fafb',
  }[reservation.status] || '#fff'

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <Link href="/">← Back</Link>

      <div style={{ border: '1px solid #ddd', padding: '20px', marginTop: '20px', backgroundColor: bgColor }}>
        <h1>Reservation {reservation.id.slice(0, 8)}</h1>

        <div style={{ marginTop: '20px' }}>
          <p>
            <strong>Product:</strong> {reservation.products?.name} ({reservation.products?.sku})
          </p>
          <p>
            <strong>Warehouse:</strong> {reservation.warehouses?.name}
            {reservation.warehouses?.location && ` - ${reservation.warehouses.location}`}
          </p>
          <p>
            <strong>Quantity:</strong> {reservation.quantity}
          </p>
          <p>
            <strong>Status:</strong> {reservation.status}
          </p>

          {reservation.status === 'pending' && (
            <p>
              <strong>Time left:</strong> <span style={{ fontFamily: 'monospace' }}>
                {timeLeft === 'EXPIRED' ? <span style={{ color: 'red' }}>EXPIRED</span> : timeLeft}
              </span>
            </p>
          )}

          <p style={{ color: '#666', fontSize: '0.9em' }}>
            Created: {new Date(reservation.created_at).toLocaleString()}
          </p>
          {reservation.confirmed_at && (
            <p style={{ color: '#666', fontSize: '0.9em' }}>
              Confirmed: {new Date(reservation.confirmed_at).toLocaleString()}
            </p>
          )}
          {reservation.released_at && (
            <p style={{ color: '#666', fontSize: '0.9em' }}>
              Released: {new Date(reservation.released_at).toLocaleString()}
            </p>
          )}
        </div>

        {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}

        {reservation.status === 'pending' && (
          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button
              onClick={handleConfirm}
              disabled={confirming}
              style={{
                flex: 1,
                padding: '10px',
                background: confirming ? '#ccc' : '#28a745',
                color: 'white',
                border: 'none',
                cursor: confirming ? 'default' : 'pointer',
              }}
            >
              {confirming ? 'Confirming...' : 'Confirm'}
            </button>
            <button
              onClick={handleRelease}
              disabled={releasing}
              style={{
                flex: 1,
                padding: '10px',
                background: releasing ? '#ccc' : '#dc3545',
                color: 'white',
                border: 'none',
                cursor: releasing ? 'default' : 'pointer',
              }}
            >
              {releasing ? 'Releasing...' : 'Release'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
