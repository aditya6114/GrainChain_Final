"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { getUser, authApi, donationsApi, claimsApi, uploadsApi } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

export default function DonorPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)

  // Create donation form state
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [foodType, setFoodType] = useState("")
  const [quantity, setQuantity] = useState("")
  const [quantityUnit, setQuantityUnit] = useState("")
  const [expiryTime, setExpiryTime] = useState("")
  const [locationText, setLocationText] = useState("")
  const [lat, setLat] = useState("12.97")
  const [lng, setLng] = useState("80.22")
  const [createMsg, setCreateMsg] = useState("")
  const [createErr, setCreateErr] = useState("")
  const [creating, setCreating] = useState(false)

  // Photo upload state
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploadStep, setUploadStep] = useState("")  // progress text shown during submit
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Claims lookup state
  const [donationId, setDonationId] = useState("")
  const [claims, setClaims] = useState<any[]>([])
  const [claimsErr, setClaimsErr] = useState("")
  const [claimsLoading, setClaimsLoading] = useState(false)

  useEffect(() => {
    const u = getUser()
    if (!u || u.role !== "donor") { router.push("/auth/login"); return }
    setUser(u)
  }, [router])

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) { setImageFile(null); setImagePreview(null); return }
    if (file.size > 5 * 1024 * 1024) {
      setCreateErr("Image must be under 5MB")
      e.target.value = ""
      return
    }
    setCreateErr("")
    setImageFile(file)
    // Object URL is a lightweight in-browser pointer to the file —
    // cheaper than base64-encoding the whole image for preview
    setImagePreview(URL.createObjectURL(file))
  }

  async function handleCreateDonation(e: React.FormEvent) {
    e.preventDefault()
    setCreateMsg("")
    setCreateErr("")
    setCreating(true)
    try {
      // If a photo was selected, upload it BEFORE creating the donation:
      //   1. Ask our backend for a presigned R2 URL (auth-checked)
      //   2. PUT the file directly to Cloudflare R2 — bypasses our server,
      //      so a 5MB photo never consumes backend bandwidth/memory
      //   3. Attach the permanent public URL to the donation record
      let imageUrl: string | undefined
      if (imageFile) {
        setUploadStep("Uploading photo...")
        const { uploadUrl, fileUrl } = await uploadsApi.requestUploadUrl(imageFile.name, imageFile.type)
        await uploadsApi.uploadFile(uploadUrl, imageFile)
        imageUrl = fileUrl
      }

      setUploadStep("Creating donation...")
      await donationsApi.create({
        title,
        description: description || undefined,
        food_type: foodType,
        quantity: Number(quantity),
        quantity_unit: quantityUnit,
        expiry_time: new Date(expiryTime).toISOString(),
        lat: Number(lat),
        lng: Number(lng),
        location_text: locationText,
        image_url: imageUrl,
      })
      setCreateMsg("Donation created successfully!")
      setTitle(""); setDescription(""); setFoodType(""); setQuantity(""); setQuantityUnit(""); setExpiryTime(""); setLocationText("")
      setImageFile(null); setImagePreview(null)
      if (fileInputRef.current) fileInputRef.current.value = ""
    } catch (err: any) {
      setCreateErr(err.message || "Failed to create donation")
    } finally {
      setCreating(false)
      setUploadStep("")
    }
  }

  async function handleLookupClaims() {
    if (!donationId.trim()) return
    setClaimsErr("")
    setClaimsLoading(true)
    try {
      const data = await claimsApi.getClaimsForDonation(donationId.trim())
      setClaims(data)
    } catch (err: any) {
      setClaimsErr(err.message || "Failed to fetch claims")
      setClaims([])
    } finally {
      setClaimsLoading(false)
    }
  }

  async function handleConfirmClaim(claimId: string) {
    try {
      await claimsApi.confirm(claimId)
      handleLookupClaims()
    } catch (err: any) {
      setClaimsErr(err.message)
    }
  }

  async function handleCancelClaim(claimId: string) {
    try {
      await claimsApi.cancel(claimId)
      handleLookupClaims()
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
      {/* Nav */}
      <nav className="bg-[#1E3D2F] text-white px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-xl font-bold">GrainChain</span>
          <span className="text-sm opacity-80">Donor Dashboard</span>
        </div>
        <Button variant="outline" size="sm" className="text-white border-white hover:bg-white/10" onClick={handleLogout}>Logout</Button>
      </nav>

      <div className="max-w-3xl mx-auto p-6">
        <Tabs defaultValue="create">
          <TabsList className="mb-4">
            <TabsTrigger value="create">Create Donation</TabsTrigger>
            <TabsTrigger value="my">My Donations</TabsTrigger>
          </TabsList>

          <TabsContent value="create">
            <Card>
              <CardHeader><CardTitle>New Donation</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={handleCreateDonation} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input id="title" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Leftover rice from event" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="desc">Description (optional)</Label>
                    <Input id="desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Additional details" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Food Type</Label>
                      <Select value={foodType} onValueChange={setFoodType}>
                        <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cooked meals">Cooked Meals</SelectItem>
                          <SelectItem value="packaged goods">Packaged Goods</SelectItem>
                          <SelectItem value="produce">Produce</SelectItem>
                          <SelectItem value="baked goods">Baked Goods</SelectItem>
                          <SelectItem value="beverages">Beverages</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Quantity Unit</Label>
                      <Select value={quantityUnit} onValueChange={setQuantityUnit}>
                        <SelectTrigger><SelectValue placeholder="Unit" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="servings">Servings</SelectItem>
                          <SelectItem value="kg">Kg</SelectItem>
                          <SelectItem value="boxes">Boxes</SelectItem>
                          <SelectItem value="items">Items</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="qty">Quantity</Label>
                      <Input id="qty" type="number" min="1" required value={quantity} onChange={(e) => setQuantity(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="expiry">Expiry Time</Label>
                      <Input id="expiry" type="datetime-local" required value={expiryTime} onChange={(e) => setExpiryTime(e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="loc">Location</Label>
                    <Input id="loc" required value={locationText} onChange={(e) => setLocationText(e.target.value)} placeholder="e.g. VIT Chennai Main Gate" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="photo">Photo (optional)</Label>
                    <Input id="photo" ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/heic" onChange={handleImageSelect} />
                    {imagePreview && (
                      <div className="flex items-center gap-3 mt-1">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={imagePreview} alt="Preview" className="h-24 w-24 object-cover rounded-md border" />
                        <Button type="button" variant="outline" size="sm" onClick={() => {
                          setImageFile(null); setImagePreview(null)
                          if (fileInputRef.current) fileInputRef.current.value = ""
                        }}>Remove</Button>
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="lat">Latitude</Label>
                      <Input id="lat" type="number" step="any" required value={lat} onChange={(e) => setLat(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lng">Longitude</Label>
                      <Input id="lng" type="number" step="any" required value={lng} onChange={(e) => setLng(e.target.value)} />
                    </div>
                  </div>
                  {createMsg && <p className="text-sm text-green-700 font-medium">{createMsg}</p>}
                  {createErr && <p className="text-sm text-red-600">{createErr}</p>}
                  <Button type="submit" disabled={creating} className="w-full bg-[#1E3D2F] hover:bg-[#2a5740] text-white">
                    {creating ? (uploadStep || "Creating...") : "Create Donation"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="my">
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground">View your donations in the map page. A dedicated &quot;My Donations&quot; list is coming soon.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Claims section */}
        <Card className="mt-6">
          <CardHeader><CardTitle>Claims on Your Donations</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input placeholder="Enter donation ID" value={donationId} onChange={(e) => setDonationId(e.target.value)} />
              <Button onClick={handleLookupClaims} disabled={claimsLoading} className="bg-[#C8603A] hover:bg-[#b0502e] text-white shrink-0">
                {claimsLoading ? "Loading..." : "View Claims"}
              </Button>
            </div>
            {claimsErr && <p className="text-sm text-red-600">{claimsErr}</p>}
            {claims.length > 0 && (
              <div className="space-y-3">
                {claims.map((c: any) => (
                  <div key={c.id} className="flex items-center justify-between border rounded-lg p-3">
                    <div>
                      <p className="text-sm font-medium">Claim {c.id?.slice(0, 8)}...</p>
                      <p className="text-xs text-muted-foreground">Status: <Badge variant={c.status === "confirmed" ? "default" : c.status === "pending" ? "secondary" : "outline"}>{c.status}</Badge></p>
                    </div>
                    {c.status === "pending" && (
                      <div className="flex gap-2">
                        <Button size="sm" className="bg-[#1E3D2F] hover:bg-[#2a5740] text-white" onClick={() => handleConfirmClaim(c.id)}>Confirm</Button>
                        <Button size="sm" variant="outline" onClick={() => handleCancelClaim(c.id)}>Cancel</Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            {claims.length === 0 && donationId && !claimsLoading && !claimsErr && (
              <p className="text-sm text-muted-foreground">No claims found for this donation.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
