"use client"

import type React from "react"
import { useState, useRef } from "react"
import { Calendar } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createDonation } from '@/lib/datafetching'

// Simple UUID v4 generator
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export default function DonationForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  // Form state
  const [foodName, setFoodName] = useState("")
  const [description, setDescription] = useState("")
  const [quantity, setQuantity] = useState("")
  const [unit, setUnit] = useState("servings")
  const [expiryDate, setExpiryDate] = useState("")
  const [category, setCategory] = useState("perishable")

  // Location autocomplete state
  const [location, setLocation] = useState("")
  const [locationSuggestions, setLocationSuggestions] = useState<any[]>([])
  const [selectedLocation, setSelectedLocation] = useState<{ display_name: string, lat: string, lon: string } | null>(null)
  const [locationLoading, setLocationLoading] = useState(false)
  const locationTimeout = useRef<NodeJS.Timeout | null>(null)

  // Generate a random UUID for donor_id for now
  const donorId = generateUUID()

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // Location autocomplete handler
  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocation(e.target.value)
    setSelectedLocation(null)
    if (locationTimeout.current) clearTimeout(locationTimeout.current)
    const value = e.target.value
    if (value.length < 3) {
      setLocationSuggestions([])
      return
    }
    setLocationLoading(true)
    locationTimeout.current = setTimeout(async () => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(value)}`)
        const data = await res.json()
        setLocationSuggestions(data)
      } catch {
        setLocationSuggestions([])
      } finally {
        setLocationLoading(false)
      }
    }, 400)
  }

  const handleLocationSelect = (suggestion: any) => {
    setLocation(suggestion.display_name)
    setSelectedLocation(suggestion)
    setLocationSuggestions([])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await createDonation({
        donor_id: donorId,
        food_name: foodName,
        description: description || undefined,
        quantity: Number(quantity),
        unit: unit,
        category: category,
        expiry_date: expiryDate, // YYYY-MM-DD
        image: imagePreview || undefined, // For now, store base64 preview if needed
        location: selectedLocation ? selectedLocation.display_name : location,
        latitude: selectedLocation ? parseFloat(selectedLocation.lat) : undefined,
        longitude: selectedLocation ? parseFloat(selectedLocation.lon) : undefined,
      })
      // Reset form or show success message
      setFoodName("")
      setDescription("")
      setQuantity("")
      setUnit("servings")
      setExpiryDate("")
      setCategory("perishable")
      setImagePreview(null)
      setLocation("")
      setSelectedLocation(null)
      setLocationSuggestions([])
      alert("Donation listed successfully!")
    } catch (error: any) {
      alert("Failed to list donation: " + error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>List Food Donation</CardTitle>
        <CardDescription>
          Provide details about the food you want to donate. All fields marked with * are required.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} autoComplete="off">
          <div className="grid gap-6">
            <div className="grid gap-3">
              <Label htmlFor="food-name">Food Name *</Label>
              <Input id="food-name" value={foodName} onChange={e => setFoodName(e.target.value)} placeholder="e.g., Vegetable Curry, Sandwiches" required />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="description">Description</Label>
              <Input id="description" value={description} onChange={e => setDescription(e.target.value)} placeholder="Short description (optional)" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="grid gap-3">
                <Label htmlFor="quantity">Quantity *</Label>
                <div className="flex">
                  <Input id="quantity" type="number" min="1" value={quantity} onChange={e => setQuantity(e.target.value)} placeholder="e.g., 10" required />
                  <Select value={unit} onValueChange={setUnit}>
                    <SelectTrigger className="w-[120px] ml-2">
                      <SelectValue placeholder="Unit" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="servings">Servings</SelectItem>
                      <SelectItem value="kg">Kilograms</SelectItem>
                      <SelectItem value="boxes">Boxes</SelectItem>
                      <SelectItem value="items">Items</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-3">
                <Label htmlFor="expiry-date">Expiry Date *</Label>
                <div className="relative">
                  <Input id="expiry-date" type="date" value={expiryDate} onChange={e => setExpiryDate(e.target.value)} required />
                  <Calendar className="absolute right-3 top-2.5 h-5 w-5 text-muted-foreground" />
                </div>
              </div>
            </div>
            <div className="grid gap-3">
              <Label>Category *</Label>
              <RadioGroup value={category} onValueChange={setCategory} className="flex flex-col space-y-1">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="perishable" id="perishable" />
                  <Label htmlFor="perishable" className="font-normal">Perishable</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="non-perishable" id="non-perishable" />
                  <Label htmlFor="non-perishable" className="font-normal">Non-Perishable</Label>
                </div>
              </RadioGroup>
            </div>
            <div className="grid gap-3">
              <Label htmlFor="location">Location *</Label>
              <Input
                id="location"
                value={location}
                onChange={handleLocationChange}
                placeholder="Enter address or place name"
                autoComplete="off"
                required
              />
              {locationLoading && <div className="text-xs text-muted-foreground">Loading suggestions...</div>}
              {locationSuggestions.length > 0 && (
                <div className="border rounded-md bg-white shadow-md max-h-48 overflow-y-auto z-10 relative">
                  {locationSuggestions.map((suggestion: any) => (
                    <div
                      key={suggestion.place_id}
                      className="px-3 py-2 hover:bg-blue-100 cursor-pointer text-sm"
                      onClick={() => handleLocationSelect(suggestion)}
                    >
                      {suggestion.display_name}
                    </div>
                  ))}
                </div>
              )}
              {selectedLocation && (
                <div className="text-xs text-muted-foreground mt-1">
                  <span>Selected: {selectedLocation.display_name}</span><br />
                  <span>Lat: {selectedLocation.lat}, Lon: {selectedLocation.lon}</span>
                </div>
              )}
            </div>
            <div className="grid gap-3">
              <Label htmlFor="image-upload">Upload Image</Label>
              <Input id="image-upload" type="file" accept="image/*" onChange={handleImageChange} />
              {imagePreview && (
                <div className="mt-2">
                  <img src={imagePreview} alt="Preview" className="h-32 w-32 object-cover rounded-md" />
                </div>
              )}
            </div>
          </div>
          <button
            type="submit"
            className={`mt-4 px-4 py-2 text-white bg-blue-500 rounded-md ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""}`}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Submitting..." : "Submit"}
          </button>
        </form>
      </CardContent>
    </Card>
  )
}