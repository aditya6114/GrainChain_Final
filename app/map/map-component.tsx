"use client"

import { useEffect } from "react"
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import { claimsApi } from "@/lib/api"
import type { Donation } from "./page"

const URGENCY_COLORS: Record<string, string> = {
  critical: "#DC2626",
  high: "#EA580C",
  medium: "#D97706",
  low: "#16A34A",
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
          <CircleMarker
            key={d.id}
            center={[d.lat, d.lng]}
            radius={10}
            pathOptions={{
              color: URGENCY_COLORS[d.urgency] || "#6B7280",
              fillColor: URGENCY_COLORS[d.urgency] || "#6B7280",
              fillOpacity: 0.7,
              weight: 2,
            }}
          >
            <Popup maxWidth={280}>
              <div className="text-sm leading-relaxed">
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
          </CircleMarker>
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
