"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { getUser, authApi, donationsApi, claimsApi } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"

const urgencyColor: Record<string, string> = {
  critical: "bg-red-600 text-white",
  high: "bg-orange-500 text-white",
  medium: "bg-yellow-500 text-black",
  low: "bg-green-600 text-white",
}

export default function RecipientPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)

  // Browse state
  const [lat, setLat] = useState("12.97")
  const [lng, setLng] = useState("80.22")
  const [radius, setRadius] = useState("5")
  const [donations, setDonations] = useState<any[]>([])
  const [browseErr, setBrowseErr] = useState("")
  const [browseLoading, setBrowseLoading] = useState(false)
  const [claimMsg, setClaimMsg] = useState("")

  // My claims state
  const [myClaims, setMyClaims] = useState<any[]>([])
  const [claimsErr, setClaimsErr] = useState("")
  const [claimsLoading, setClaimsLoading] = useState(false)

  useEffect(() => {
    const u = getUser()
    if (!u || u.role !== "recipient") { router.push("/auth/login"); return }
    setUser(u)
  }, [router])

  async function handleSearch() {
    setBrowseErr("")
    setClaimMsg("")
    setBrowseLoading(true)
    try {
      const data = await donationsApi.getNearby(Number(lat), Number(lng), Number(radius))
      setDonations(data)
    } catch (err: any) {
      setBrowseErr(err.message || "Search failed")
    } finally {
      setBrowseLoading(false)
    }
  }

  async function handleClaim(donationId: string) {
    setClaimMsg("")
    setBrowseErr("")
    try {
      await claimsApi.create(donationId)
      setClaimMsg("Claim submitted successfully!")
    } catch (err: any) {
      setBrowseErr(err.message || "Claim failed")
    }
  }

  async function loadMyClaims() {
    setClaimsErr("")
    setClaimsLoading(true)
    try {
      const data = await claimsApi.getMyClaims()
      setMyClaims(data)
    } catch (err: any) {
      setClaimsErr(err.message || "Failed to load claims")
    } finally {
      setClaimsLoading(false)
    }
  }

  async function handleCancelClaim(claimId: string) {
    try {
      await claimsApi.cancel(claimId)
      loadMyClaims()
    } catch (err: any) {
      setClaimsErr(err.message)
    }
  }

  function handleLogout() {
    authApi.logout()
    router.push("/auth/login")
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-background">
      <nav className="bg-[#1E3D2F] text-white px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-xl font-bold">GrainChain</span>
          <span className="text-sm opacity-80">Recipient Dashboard</span>
        </div>
        <Button variant="outline" size="sm" className="text-white border-white hover:bg-white/10" onClick={handleLogout}>Logout</Button>
      </nav>

      <div className="max-w-3xl mx-auto p-6">
        <Tabs defaultValue="browse" onValueChange={(v) => { if (v === "myclaims") loadMyClaims() }}>
          <TabsList className="mb-4">
            <TabsTrigger value="browse">Browse Donations</TabsTrigger>
            <TabsTrigger value="myclaims">My Claims</TabsTrigger>
          </TabsList>

          <TabsContent value="browse">
            <Card className="mb-4">
              <CardContent className="pt-6">
                <div className="grid grid-cols-3 gap-3 mb-3">
                  <div className="space-y-1">
                    <Label htmlFor="lat">Latitude</Label>
                    <Input id="lat" type="number" step="any" value={lat} onChange={(e) => setLat(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="lng">Longitude</Label>
                    <Input id="lng" type="number" step="any" value={lng} onChange={(e) => setLng(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="radius">Radius (km)</Label>
                    <Input id="radius" type="number" min="1" max="50" value={radius} onChange={(e) => setRadius(e.target.value)} />
                  </div>
                </div>
                <Button onClick={handleSearch} disabled={browseLoading} className="w-full bg-[#1E3D2F] hover:bg-[#2a5740] text-white">
                  {browseLoading ? "Searching..." : "Search Nearby"}
                </Button>
              </CardContent>
            </Card>

            {claimMsg && <p className="text-sm text-green-700 font-medium mb-3">{claimMsg}</p>}
            {browseErr && <p className="text-sm text-red-600 mb-3">{browseErr}</p>}

            <div className="space-y-3">
              {donations.map((d: any) => (
                <Card key={d.id}>
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <h3 className="font-semibold text-lg">{d.title}</h3>
                        <p className="text-sm text-muted-foreground">{d.food_type} — {d.quantity} {d.quantity_unit}</p>
                        {d.location_text && <p className="text-sm text-muted-foreground">{d.location_text}</p>}
                        {d.ai_summary && <p className="text-sm italic mt-1">{d.ai_summary}</p>}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {d.urgency && (
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${urgencyColor[d.urgency] || "bg-gray-200"}`}>
                            {d.urgency}
                          </span>
                        )}
                        <Button size="sm" className="bg-[#C8603A] hover:bg-[#b0502e] text-white" onClick={() => handleClaim(d.id)}>Claim</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {donations.length === 0 && !browseLoading && !browseErr && (
                <p className="text-center text-muted-foreground py-8">Search for nearby donations to see results.</p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="myclaims">
            {claimsLoading && <p className="text-sm text-muted-foreground">Loading claims...</p>}
            {claimsErr && <p className="text-sm text-red-600 mb-3">{claimsErr}</p>}
            <div className="space-y-3">
              {myClaims.map((c: any) => (
                <Card key={c.id}>
                  <CardContent className="pt-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium">Claim {c.id?.slice(0, 8)}...</p>
                      <p className="text-sm text-muted-foreground">Donation: {c.donation_id?.slice(0, 8)}...</p>
                      <Badge variant={c.status === "confirmed" ? "default" : c.status === "pending" ? "secondary" : "outline"} className="mt-1">
                        {c.status}
                      </Badge>
                    </div>
                    {c.status === "pending" && (
                      <Button size="sm" variant="outline" onClick={() => handleCancelClaim(c.id)}>Cancel</Button>
                    )}
                  </CardContent>
                </Card>
              ))}
              {myClaims.length === 0 && !claimsLoading && !claimsErr && (
                <p className="text-center text-muted-foreground py-8">No claims yet.</p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
