# Inventory Reservation System

Simple inventory reservation system built with Next.js and Supabase.

The project focuses on handling temporary inventory reservations where products can be reserved, confirmed, or released before expiry.

## Stack

* Next.js (App Router)
* TypeScript
* Supabase
* Tailwind CSS

## Features

* View inventory across warehouses
* Create temporary reservations
* Confirm reservations
* Release reservations
* Reservation expiry handling
* Inventory tracking per warehouse

## Pages

### `/`

* Inventory dashboard
* Reservation form
* Product and warehouse availability

### `/reservations`

* View all reservations
* Filter reservations by status

### `/reservation/[id]`

* Reservation details
* Countdown timer
* Confirm and release actions

## API Routes

### `GET /api/products`

Returns product list.

### `GET /api/warehouses`

Returns warehouse list.

### `GET /api/reservations`

Returns reservations with optional filtering.

### `POST /api/reservations`

Creates a reservation if enough inventory is available.

Possible responses:

* `201` Reservation created
* `400` Invalid request
* `404` Inventory record not found
* `409` Insufficient inventory

### `PUT /api/reservations/[id]`

Handles reservation confirmation and release actions.

## Reservation Flow

1. User selects product, warehouse, and quantity
2. Inventory availability is checked
3. Reservation is created temporarily
4. Reserved inventory count is updated
5. Reservation can later be confirmed or released
6. Expired reservations cannot be confirmed

## Notes

* Reservation expiry is validated during confirmation
* Inventory values are updated during reservation and release operations
* The current implementation focuses on simplicity and demo usability
* Additional concurrency protection and authentication can be added for production usage

## Running Locally

Install dependencies:

```bash
pnpm install
```

Start development server:

```bash
pnpm dev
```

Production build:

```bash
pnpm build
pnpm start
```

## Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

## Deployment

The app can be deployed directly on Vercel with the required Supabase environment variables configured.

## Live Demo

https://v0-inventory-reservation-system-gamma.vercel.app/
