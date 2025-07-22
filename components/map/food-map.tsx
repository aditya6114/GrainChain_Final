"use client"

import { useEffect, useState } from "react"
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import { fetchDonations } from "@/lib/datafetching"
import { LatLngExpression } from "leaflet"

export default function FoodMap() {
  const [donations, setDonations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadDonations() {
      try {
        setLoading(true)
        setError(null)
        const data = await fetchDonations()
        setDonations(data)
      } catch (err: any) {
        setError(err.message || "Failed to fetch donations")
      } finally {
        setLoading(false)
      }
    }
    loadDonations()
  }, [])

  if (loading) return <div>Loading map...</div>
  if (error) return <div className="text-red-500">{error}</div>

  let defaultCenter: LatLngExpression = [40.7128, -74.006];
  if (donations.length && typeof donations[0].latitude === 'number' && typeof donations[0].longitude === 'number') {
    defaultCenter = [donations[0].latitude, donations[0].longitude];
  }

  return (
    <MapContainer center={defaultCenter as LatLngExpression} zoom={12} style={{ height: "500px", width: "100%" }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {donations.map((donation) => (
        typeof donation.latitude === 'number' && typeof donation.longitude === 'number' && (
          <Marker key={donation.id} position={[donation.latitude, donation.longitude]}>
            <Popup>
              <strong>{donation.food_name || donation.name}</strong>
              <br />
              {donation.description || donation.foodType}
            </Popup>
          </Marker>
        )
      ))}
    </MapContainer>
  )
}
