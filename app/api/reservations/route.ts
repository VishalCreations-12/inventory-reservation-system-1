import { createClient } from '@/lib/supabase/server'
import { acquireLock, releaseLock } from '@/lib/redis'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { product_id, warehouse_id, quantity, duration_minutes } = body

    if (!product_id || !warehouse_id || !quantity || !duration_minutes) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const lockKey = `${product_id}:${warehouse_id}`
    const locked = await acquireLock(lockKey, 5000)

    if (!locked) {
      return NextResponse.json(
        { error: 'Resource temporarily unavailable' },
        { status: 409 }
      )
    }

    try {
      const supabase = await createClient()

      const { data: inventory, error: inventoryError } = await supabase
        .from('inventory')
        .select('*')
        .eq('product_id', product_id)
        .eq('warehouse_id', warehouse_id)
        .single()

      if (inventoryError || !inventory) {
        await releaseLock(lockKey)
        return NextResponse.json(
          { error: inventoryError?.message || 'Inventory not found' },
          { status: 404 }
        )
      }

      if (inventory.quantity_available < quantity) {
        await releaseLock(lockKey)
        return NextResponse.json(
          { error: 'Insufficient inventory' },
          { status: 409 }
        )
      }

      const expires_at = new Date(
        Date.now() + duration_minutes * 60 * 1000
      ).toISOString()

      const { data: reservation, error: reservationError } = await supabase
        .from('reservations')
        .insert({
          product_id,
          warehouse_id,
          quantity,
          expires_at,
          status: 'pending',
        })
        .select()
        .single()

      if (reservationError) {
        await releaseLock(lockKey)
        return NextResponse.json(
          { error: reservationError.message },
          { status: 500 }
        )
      }

      const { error: updateError } = await supabase
        .from('inventory')
        .update({
          quantity_available: inventory.quantity_available - quantity,
          quantity_reserved: inventory.quantity_reserved + quantity,
          updated_at: new Date().toISOString(),
        })
        .eq('id', inventory.id)

      if (updateError) {
        await releaseLock(lockKey)
        return NextResponse.json(
          { error: updateError.message },
          { status: 500 }
        )
      }

      await releaseLock(lockKey)

      return NextResponse.json(reservation, { status: 201 })
    } catch (err) {
      await releaseLock(lockKey)
      throw err
    }
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const status = url.searchParams.get('status')

    const supabase = await createClient()

    let query = supabase
      .from('reservations')
      .select('*, products(name, sku), warehouses(name, location)')

    if (status) {
      query = query.eq('status', status)
    }

    const { data: reservations, error } = await query.order('created_at', {
      ascending: false,
    })

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(reservations)
  } catch (err) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
