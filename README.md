# Inventory Reservation System

A simple inventory reservation system with Redis-based locking to prevent overselling, time-based expiry, and a basic frontend for managing reservations.

## How It Works

When you reserve items, we:
1. Acquire a Redis lock on that (product, warehouse) pair
2. Check if enough stock is available
3. Update inventory and create the reservation
4. Release the lock

If two requests hit at the same time, only one succeeds (409 conflict). The lock times out after 5 seconds to avoid deadlocks.

Reservations have an expiry time. They start as "pending", can be confirmed, or released to return inventory.

## Database

- **products**: Basic product catalog
- **warehouses**: Storage locations  
- **inventory**: Available vs reserved counts per product/warehouse
- **reservations**: Reservation records with status and timestamps

## API

```
POST /api/reservations
  Create a reservation
  Body: { product_id, warehouse_id, quantity, duration_minutes }
  Returns 201 with reservation, 409 if not enough stock, 404 if inventory missing

POST /api/reservations/{id}/confirm
  Confirm a pending reservation
  Returns 410 if expired

POST /api/reservations/{id}/release
  Release a reservation and return inventory
  
GET /api/products
  List all products

GET /api/warehouses
  List all warehouses

GET /api/reservations
  List all reservations, optionally filter by ?status=pending|confirmed|released
```

## Pages

- `/` - Product list and reservation form
- `/reservations` - View all reservations with filters
- `/reservation/{id}` - Details with countdown timer and confirm/release buttons

## Why Redis?

PostgreSQL doesn't have a good distributed lock primitive. Redis SET with NX (if not exists) is simple and works fine for this. If you hit contention on hot items, you'd need to shard by product.

## Why Lazy Cleanup?

Expired reservations just sit there until someone tries to confirm one. We check expiry at that point. Avoids needing a background job.

## Tradeoffs

- **Availability**: Eventually consistent. You might see "10 available" but fail to reserve if others beat you
- **Overselling**: Won't happen. We check stock before decrementing
- **Race conditions**: Handled by the lock. Only one request per (product, warehouse) pair can proceed
- **Lock timeout**: 5 seconds is reasonable but depends on your DB latency. If it's higher, increase it

## Setup

1. Environment vars are auto-set by Supabase integration
2. Make sure `REDIS_URL` is set for locking
3. Database schema is auto-created
4. Sample data included: 5 products × 4 warehouses

## Performance

Each reservation creates 2 database updates (inventory + reservation record). At 100 RPS that's 200 writes/sec, which Supabase handles fine.

Lock contention happens on popular items. If you have a flash sale item, people will get 409s. You could increase lock TTL or pre-allocate a "hot" table for bestsellers.

Expired reservations: At 1M records, scanning pending reservations takes ~500ms. Run cleanup during off-peak hours if needed.

## Testing

- **Concurrent**: Hit the same (product, warehouse) 100 times. Expect 99% success, 1% 409s
- **Expiry**: Make 1-min reservation, wait 61s, try to confirm. Should get 410 gone
- **Inventory**: After a bunch of operations, sum `quantity_available + quantity_reserved` per pair. Should equal original stock
