import { createClient } from '@/lib/supabase/server'
import { acquireLock, releaseLock } from '@/lib/redis'
import { NextResponse } from 'next/server'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data: reservation, error: fetchError } = await supabase
      .from('reservations')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !reservation) {
      return NextResponse.json(
        { error: 'Reservation not found' },
        { status: 404 }
      )
    }

    if (reservation.status !== 'pending') {
      return NextResponse.json(
        { error: 'Only pending reservations can be released' },
        { status: 400 }
      )
    }

    const lockKey = `${reservation.product_id}:${reservation.warehouse_id}`
    const locked = await acquireLock(lockKey, 5000)

    if (!locked) {
      return NextResponse.json(
        { error: 'Resource temporarily unavailable' },
        { status: 409 }
      )
    }

    try {
      const { data: inventory, error: inventoryError } = await supabase
        .from('inventory')
        .select('*')
        .eq('product_id', reservation.product_id)
        .eq('warehouse_id', reservation.warehouse_id)
        .single()

      if (inventoryError || !inventory) {
        await releaseLock(lockKey)
        return NextResponse.json(
          { error: 'Inventory not found' },
          { status: 404 }
        )
      }

      const { error: updateReservationError } = await supabase
        .from('reservations')
        .update({
          status: 'released',
          released_at: new Date().toISOString(),
        })
        .eq('id', id)

      if (updateReservationError) {
        await releaseLock(lockKey)
        return NextResponse.json(
          { error: updateReservationError.message },
          { status: 500 }
        )
      }

      const { error: updateInventoryError } = await supabase
        .from('inventory')
        .update({
          quantity_available: inventory.quantity_available + reservation.quantity,
          quantity_reserved: inventory.quantity_reserved - reservation.quantity,
          updated_at: new Date().toISOString(),
        })
        .eq('id', inventory.id)

      if (updateInventoryError) {
        await releaseLock(lockKey)
        return NextResponse.json(
          { error: updateInventoryError.message },
          { status: 500 }
        )
      }

      await releaseLock(lockKey)

      const { data: updated } = await supabase
        .from('reservations')
        .select('*, products(name, sku), warehouses(name, location)')
        .eq('id', id)
        .single()

      return NextResponse.json(updated)
    } catch (err) {
      await releaseLock(lockKey)
      throw err
    }
  } catch (err) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
