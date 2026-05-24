import { createClient } from '@/lib/supabase/server'
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
        { error: 'Reservation cannot be confirmed' },
        { status: 400 }
      )
    }

    if (new Date(reservation.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'Reservation has expired' },
        { status: 410 }
      )
    }

    const { error: updateError } = await supabase
      .from('reservations')
      .update({
        status: 'confirmed',
        confirmed_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      )
    }

    const { data: updated } = await supabase
      .from('reservations')
      .select('*, products(name, sku), warehouses(name, location)')
      .eq('id', id)
      .single()

    return NextResponse.json(updated)
  } catch (err) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
