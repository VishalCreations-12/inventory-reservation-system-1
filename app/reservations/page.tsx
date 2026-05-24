'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function Reservations() {
  const [reservations, setReservations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/reservations')
        const data = await res.json()
        setReservations(data)
      } catch (err) {
        setError('Failed to load')
      } finally {
        setLoading(false)
      }
    }

    load()
    const interval = setInterval(load, 5000)
    return () => clearInterval(interval)
  }, [])

  const filtered = filter === 'all' ? reservations : reservations.filter(r => r.status === filter)

  if (loading) {
    return <div style={{ padding: '20px' }}>Loading...</div>
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h1>All Reservations</h1>
        <Link href="/">Create new</Link>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        {['all', 'pending', 'confirmed', 'released'].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            style={{
              padding: '8px 16px',
              background: filter === s ? '#007bff' : '#f0f0f0',
              color: filter === s ? 'white' : 'black',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #ddd' }}>
            <th style={{ textAlign: 'left', padding: '10px' }}>Product</th>
            <th style={{ textAlign: 'left', padding: '10px' }}>Warehouse</th>
            <th style={{ textAlign: 'left', padding: '10px' }}>Qty</th>
            <th style={{ textAlign: 'left', padding: '10px' }}>Status</th>
            <th style={{ textAlign: 'left', padding: '10px' }}>Created</th>
            <th style={{ textAlign: 'left', padding: '10px' }}>Action</th>
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 ? (
            <tr>
              <td colSpan={6} style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                No reservations
              </td>
            </tr>
          ) : (
            filtered.map((r) => (
              <tr key={r.id} style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '10px' }}>
                  <div>
                    <strong>{r.products?.name}</strong>
                    <div style={{ fontSize: '0.9em', color: '#666' }}>{r.products?.sku}</div>
                  </div>
                </td>
                <td style={{ padding: '10px' }}>{r.warehouses?.name}</td>
                <td style={{ padding: '10px' }}>{r.quantity}</td>
                <td style={{ padding: '10px' }}>{r.status}</td>
                <td style={{ padding: '10px', color: '#666', fontSize: '0.9em' }}>
                  {new Date(r.created_at).toLocaleDateString()}
                </td>
                <td style={{ padding: '10px' }}>
                  <Link href={`/reservation/${r.id}`}>View</Link>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
