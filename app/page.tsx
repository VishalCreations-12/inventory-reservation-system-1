'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function Home() {
  const [products, setProducts] = useState<any[]>([])
  const [warehouses, setWarehouses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedProduct, setSelectedProduct] = useState('')
  const [selectedWarehouse, setSelectedWarehouse] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [duration, setDuration] = useState('15')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch('/api/products').then(r => r.json()),
      fetch('/api/warehouses').then(r => r.json()),
    ])
      .then(([p, w]) => {
        setProducts(p)
        setWarehouses(w)
      })
      .catch(() => setError('Failed to load data'))
      .finally(() => setLoading(false))
  }, [])

  const handleReserve = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    setError('')

    try {
      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: selectedProduct,
          warehouse_id: selectedWarehouse,
          quantity: parseInt(quantity),
          duration_minutes: parseInt(duration),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create reservation')
      }

      window.location.href = `/reservation/${data.id}`
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create reservation')
      setCreating(false)
    }
  }

  if (loading) {
    return <div style={{ padding: '20px' }}>Loading...</div>
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h1>Reservations</h1>
        <Link href="/reservations">View all</Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
        <div>
          <h2>Products</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <th style={{ textAlign: 'left', padding: '10px' }}>Name</th>
                <th style={{ textAlign: 'left', padding: '10px' }}>SKU</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr
                  key={p.id}
                  onClick={() => setSelectedProduct(p.id)}
                  style={{
                    borderBottom: '1px solid #ddd',
                    cursor: 'pointer',
                    backgroundColor: selectedProduct === p.id ? '#f0f0f0' : 'transparent',
                  }}
                >
                  <td style={{ padding: '10px' }}>{p.name}</td>
                  <td style={{ padding: '10px', color: '#666' }}>{p.sku}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div>
          <h2>Create Reservation</h2>
          <form onSubmit={handleReserve}>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Warehouse</label>
              <select
                value={selectedWarehouse}
                onChange={(e) => setSelectedWarehouse(e.target.value)}
                style={{ width: '100%', padding: '8px', border: '1px solid #ddd' }}
                required
              >
                <option value="">Select a warehouse</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Quantity</label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                style={{ width: '100%', padding: '8px', border: '1px solid #ddd' }}
                required
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Duration (minutes)</label>
              <input
                type="number"
                min="5"
                max="1440"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                style={{ width: '100%', padding: '8px', border: '1px solid #ddd' }}
                required
              />
            </div>

            {error && <p style={{ color: 'red', marginBottom: '10px' }}>{error}</p>}

            <button
              type="submit"
              disabled={!selectedProduct || !selectedWarehouse || creating}
              style={{
                width: '100%',
                padding: '10px',
                background: selectedProduct && selectedWarehouse && !creating ? '#007bff' : '#ccc',
                color: 'white',
                border: 'none',
                cursor: selectedProduct && selectedWarehouse && !creating ? 'pointer' : 'default',
              }}
            >
              {creating ? 'Creating...' : 'Reserve'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
