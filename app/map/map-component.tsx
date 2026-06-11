"use client"

import { useEffect, useMemo } from "react"
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { claimsApi } from "@/lib/api"
import type { Donation } from "./page"

const URGENCY_COLORS: Record<string, string> = {
  critical: "#DC2626",
  high: "#EA580C",
  medium: "#D97706",
  low: "#16A34A",
}

// ── Pin-style markers ─────────────────────────────────────────
// Leaflet's default Marker icons break under bundlers like webpack/Next.js
// (the PNG paths resolve wrong), so instead of patching asset paths we use
// L.divIcon with an inline SVG. Bonus: we can color each pin by urgency
// without shipping one image per color.
//
// iconAnchor [14, 38] = the pin's TIP (bottom-center of a 28x38 SVG) sits
// exactly on the donation's coordinates — not the image's top-left corner.
function pinIcon(urgency: string) {
  const color = URGENCY_COLORS[urgency] || "#6B7280"
  return L.divIcon({
    className: "", // suppress Leaflet's default white-square styling
    html: `
      <svg width="28" height="38" viewBox="0 0 28 38" xmlns="http://www.w3.org/2000/svg">
        <path d="M14 0C6.27 0 0 6.27 0 14c0 10.5 14 24 14 24s14-13.5 14-24C28 6.27 21.73 0 14 0z"
              fill="${color}" stroke="white" stroke-width="1.5"/>
        <circle cx="14" cy="14" r="5.5" fill="white"/>
      </svg>`,
    iconSize: [28, 38],
    iconAnchor: [14, 38],
    popupAnchor: [0, -34],
  })
}

// Sub-component to re-center the map when lat/lng props change
function RecenterMap({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap()
  useEffect(() => {
    map.setView([lat, lng], map.getZoom())
  }, [lat, lng, map])
  return null
}

interface Props {
  lat: number
  lng: number
  donations: Donation[]
  user: { id: string; role: string } | null
}

export default function MapComponentInner({ lat, lng, donations, user }: Props) {
  // Build one icon per urgency level instead of one per marker —
  // 200 donations share 4 icon objects rather than creating 200.
  const icons = useMemo(
    () => ({
      critical: pinIcon("critical"),
      high: pinIcon("high"),
      medium: pinIcon("medium"),
      low: pinIcon("low"),
    }),
    [],
  )

  const handleClaim = async (donationId: string) => {
    try {
      await claimsApi.create(donationId)
      alert("Donation claimed successfully!")
    } catch (err: any) {
      alert("Failed to claim: " + (err.message || "Unknown error"))
    }
  }

  return (
    <div className="relative w-full h-full">
      <MapContainer
        center={[lat, lng]}
        zoom={12}
        className="w-full h-full"
        style={{ minHeight: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <RecenterMap lat={lat} lng={lng} />

        {donations.map((d) => (
          <Marker
            key={d.id}
            position={[d.lat, d.lng]}
            icon={icons[d.urgency] || icons.medium}
          >
            <Popup maxWidth={280}>
              <div className="text-sm leading-relaxed">
                {d.image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={d.image_url}
                    alt={d.title}
                    className="w-full h-32 object-cover rounded-md mb-2"
                  />
                )}
                <p className="font-bold text-base mb-1">{d.title}</p>
                <p>
                  {d.food_type} &mdash; {d.quantity} {d.quantity_unit}
                </p>
                <span
                  className="inline-block mt-1 mb-1 px-2 py-0.5 rounded-full text-white text-xs font-semibold"
                  style={{ backgroundColor: URGENCY_COLORS[d.urgency] }}
                >
                  {d.urgency}
                </span>
                {d.ai_summary && (
                  <p className="text-gray-600 italic mt-1">{d.ai_summary}</p>
                )}
                {d.location_text && (
                  <p className="text-gray-500 mt-1">{d.location_text}</p>
                )}
                {user?.role === "recipient" && (
                  <button
                    onClick={() => handleClaim(d.id)}
                    className="mt-2 w-full px-3 py-1.5 rounded text-white text-sm font-medium hover:opacity-90 transition"
                    style={{ backgroundColor: "#1E3D2F" }}
                  >
                    Claim this donation
                  </button>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Legend */}
      <div
        className="absolute bottom-4 right-4 z-[1000] rounded-lg shadow-lg p-3 text-xs"
        style={{ backgroundColor: "rgba(255,255,255,0.95)" }}
      >
        <p className="font-bold mb-1.5">Urgency</p>
        {(["critical", "high", "medium", "low"] as const).map((level) => (
          <div key={level} className="flex items-center gap-2 mb-1">
            <span
              className="inline-block w-3 h-3 rounded-full"
              style={{ backgroundColor: URGENCY_COLORS[level] }}
            />
            <span className="capitalize">{level}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
