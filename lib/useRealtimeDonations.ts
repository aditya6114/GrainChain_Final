"use client"

// Live donation feed via Supabase Realtime.
//
// How this works end-to-end:
//   1. The backend inserts a donation row (via the Express API).
//   2. Postgres writes that change to its WAL (write-ahead log).
//   3. Supabase Realtime tails the WAL and pushes the row over a WebSocket
//      to every browser subscribed to this channel.
//   4. This hook receives the payload and hands it to your callback.
//
// Note the path: the write still goes through Express (auth, validation,
// business rules) — only the *notification* bypasses it. We get realtime
// without exposing writes to the browser.
//
// RLS applies to Realtime too: subscribers only receive rows they're
// allowed to SELECT, so 'available' donations broadcast to everyone
// but private rows don't leak.

import { useEffect, useRef } from 'react'
import { supabase } from './supabaseClient'

export interface RealtimeDonationHandlers {
  // Fired when a new donation row is inserted
  onInsert?: (donation: any) => void
  // Fired when a donation changes (e.g. status flips to 'claimed')
  onUpdate?: (donation: any) => void
}

export function useRealtimeDonations(handlers: RealtimeDonationHandlers) {
  // Keep the latest handlers in a ref so the subscription effect runs ONCE.
  // Without this, every parent re-render would create new callback references,
  // tearing down and re-creating the WebSocket subscription each time.
  const handlersRef = useRef(handlers)
  handlersRef.current = handlers

  useEffect(() => {
    const channel = supabase
      .channel('donations-feed')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'donations' },
        (payload) => handlersRef.current.onInsert?.(payload.new),
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'donations' },
        (payload) => handlersRef.current.onUpdate?.(payload.new),
      )
      .subscribe()

    // Cleanup on unmount — closes the WebSocket channel
    return () => {
      supabase.removeChannel(channel)
    }
  }, [])
}

// Haversine distance between two coords in km.
// Used by consumers to decide if a live donation is within their search radius —
// the realtime feed broadcasts ALL new donations, filtering is client-side.
export function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371 // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}
