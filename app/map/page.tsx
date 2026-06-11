"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import dynamic from "next/dynamic"
import Link from "next/link"
import { donationsApi, getUser, clearToken } from "@/lib/api"
import { useRealtimeDonations, distanceKm } from "@/lib/useRealtimeDonations"

const MapComponent = dynamic(() => import("./map-component"), { ssr: false })

// Types
export interface Donation {
  id: string
  title: string
  food_type: string
  quantity: number
  quantity_unit: string
  urgency: "low" | "medium" | "high" | "critical"
  ai_summary: string | null
  lat: number
  lng: number
  location_text: string
  image_url: string | null
  status: string
  expiry_time: string
}

export default function MapPage() {
  const [user, setUser] = useState<ReturnType<typeof getUser>>(null)
  const [lat, setLat] = useState(12.97)
  const [lng, setLng] = useState(80.22)
  const [radius, setRadius] = useState(10)
  const [donations, setDonations] = useState<Donation[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [controlsOpen, setControlsOpen] = useState(false)
  const [liveMsg, setLiveMsg] = useState<string | null>(null)

  // The realtime callbacks below live inside a subscription that's created
  // once, so they can't read lat/lng/radius from state directly (they'd see
  // stale values from the first render). A ref always holds the current
  // search params without re-creating the WebSocket subscription.
  const searchRef = useRef({ lat, lng, radius })
  searchRef.current = { lat, lng, radius }

  // ── Live feed ───────────────────────────────────────────────
  // New donations appear on the map the moment a donor creates them —
  // no refresh, no polling. Supabase Realtime pushes the row over WebSocket.
  useRealtimeDonations({
    onInsert: (d) => {
      // Only show donations that are claimable and within the current search area
      if (d.status !== "available" || d.lat == null || d.lng == null) return
      const { lat: cLat, lng: cLng, radius: cRadius } = searchRef.current
      if (distanceKm(cLat, cLng, d.lat, d.lng) > cRadius) return

      setDonations((prev) =>
        prev.some((x) => x.id === d.id) ? prev : [...prev, d as Donation],
      )
      setLiveMsg(`New donation nearby: ${d.title}`)
      setTimeout(() => setLiveMsg(null), 5000)
    },
    onUpdate: (d) => {
      // A donation that got claimed/expired should vanish from the map;
      // one that's still available gets refreshed in place (e.g. AI
      // enrichment just filled in urgency + summary)
      setDonations((prev) =>
        d.status !== "available"
          ? prev.filter((x) => x.id !== d.id)
          : prev.map((x) => (x.id === d.id ? ({ ...x, ...d } as Donation) : x)),
      )
    },
  })

  // Fetch donations for the current lat/lng/radius
  const fetchDonations = useCallback(async (fetchLat: number, fetchLng: number, fetchRadius: number) => {
    setLoading(true)
    setError(null)
    try {
      const data = await donationsApi.getNearby(fetchLat, fetchLng, fetchRadius)
      setDonations(data as Donation[])
    } catch (err: any) {
      setError(err.message || "Failed to fetch donations")
    } finally {
      setLoading(false)
    }
  }, [])

  // On mount: set user, try geolocation, then auto-fetch donations
  useEffect(() => {
    setUser(getUser())

    // Try to get the user's real location, fall back to default Chennai coords
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const userLat = parseFloat(pos.coords.latitude.toFixed(4))
          const userLng = parseFloat(pos.coords.longitude.toFixed(4))
          setLat(userLat)
          setLng(userLng)
          fetchDonations(userLat, userLng, radius)
        },
        () => {
          // Geolocation denied/unavailable — use default coords
          fetchDonations(lat, lng, radius)
        }
      )
    } else {
      fetchDonations(lat, lng, radius)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSearch = useCallback(async () => {
    fetchDonations(lat, lng, radius)
  }, [fetchDonations, lat, lng, radius])

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser")
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const newLat = parseFloat(pos.coords.latitude.toFixed(4))
        const newLng = parseFloat(pos.coords.longitude.toFixed(4))
        setLat(newLat)
        setLng(newLng)
        fetchDonations(newLat, newLng, radius)
      },
      () => setError("Unable to retrieve your location")
    )
  }

  const handleLogout = () => {
    clearToken()
    setUser(null)
  }

  const dashboardLink =
    user?.role === "donor"
      ? "/donor"
      : user?.role === "recipient"
        ? "/recipient"
        : user?.role === "volunteer"
          ? "/volunteer"
          : "/"

  return (
    <div className="flex flex-col h-screen">
      {/* Nav bar */}
      <nav
        className="flex items-center justify-between px-4 py-3 text-white shrink-0"
        style={{ backgroundColor: "#1E3D2F" }}
      >
        <Link href="/" className="text-xl font-bold tracking-tight">
          GrainChain
        </Link>
        <div className="flex items-center gap-3 text-sm">
          <Link href="/" className="hover:underline">
            Back to Home
          </Link>
          {user && (
            <>
              <Link href={dashboardLink} className="hover:underline">
                Dashboard
              </Link>
              <button
                onClick={handleLogout}
                className="px-3 py-1 rounded bg-white/20 hover:bg-white/30 transition"
              >
                Logout
              </button>
            </>
          )}
        </div>
      </nav>

      <div className="flex flex-1 min-h-0 relative">
        {/* Mobile toggle */}
        <button
          onClick={() => setControlsOpen(!controlsOpen)}
          className="md:hidden absolute top-2 left-2 z-[1000] px-3 py-2 rounded-md text-sm font-medium shadow-lg"
          style={{ backgroundColor: "#1E3D2F", color: "white" }}
        >
          {controlsOpen ? "Hide Controls" : "Search"}
        </button>

        {/* Controls panel */}
        <div
          className={`${
            controlsOpen ? "translate-x-0" : "-translate-x-full"
          } md:translate-x-0 absolute md:relative z-[999] w-72 p-4 flex flex-col gap-4 overflow-y-auto transition-transform duration-200 shrink-0`}
          style={{ backgroundColor: "#F5F0E8", height: "100%" }}
        >
          <div className="flex items-center justify-between mt-10 md:mt-0">
            <h2 className="font-bold text-lg">Find Donations</h2>
            <span className="flex items-center gap-1.5 text-xs font-medium text-green-700">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-600" />
              </span>
              Live
            </span>
          </div>

          {liveMsg && (
            <p className="text-sm text-green-800 bg-green-100 border border-green-300 p-2 rounded animate-pulse">
              {liveMsg}
            </p>
          )}

          <button
            onClick={handleUseMyLocation}
            className="w-full px-3 py-2 rounded-md text-sm font-medium text-white transition hover:opacity-90"
            style={{ backgroundColor: "#1E3D2F" }}
          >
            Use My Location
          </button>

          <label className="flex flex-col gap-1 text-sm">
            Latitude
            <input
              type="number"
              step="0.0001"
              value={lat}
              onChange={(e) => setLat(parseFloat(e.target.value) || 0)}
              className="border rounded px-2 py-1.5"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            Longitude
            <input
              type="number"
              step="0.0001"
              value={lng}
              onChange={(e) => setLng(parseFloat(e.target.value) || 0)}
              className="border rounded px-2 py-1.5"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            Radius: {radius} km
            <input
              type="range"
              min={1}
              max={50}
              value={radius}
              onChange={(e) => setRadius(parseInt(e.target.value))}
              className="w-full"
            />
          </label>

          <button
            onClick={handleSearch}
            disabled={loading}
            className="w-full px-3 py-2 rounded-md text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: "#1E3D2F" }}
          >
            {loading ? "Searching..." : "Search"}
          </button>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>
          )}

          {donations.length > 0 && (
            <p className="text-sm text-gray-600">
              Found {donations.length} donation{donations.length !== 1 ? "s" : ""}
            </p>
          )}
        </div>

        {/* Map */}
        <div className="flex-1 min-h-0">
          <MapComponent
            lat={lat}
            lng={lng}
            donations={donations}
            user={user}
          />
        </div>
      </div>
    </div>
  )
}
