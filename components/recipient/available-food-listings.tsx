"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { MapPin, Clock, Filter } from "lucide-react"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { fetchDonations } from '@/lib/datafetching'

export default function AvailableFoodListings() {
  const [searchTerm, setSearchTerm] = useState("")
  const [maxDistance, setMaxDistance] = useState([5])
  const [filters, setFilters] = useState({
    urgent: true,
    medium: true,
    available: true,
    vegetarian: false,
    vegan: false,
    glutenFree: false,
  })
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
        setError(err.message || 'Failed to fetch donations')
      } finally {
        setLoading(false)
      }
    }
    loadDonations()
  }, [])

  // Filter donations based on search term
  const filteredDonations = donations.filter((donation) => {
    const matchesSearch =
      donation.food_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (donation.description || "").toLowerCase().includes(searchTerm.toLowerCase())
    // You can add more filters here if needed
    return matchesSearch
  })

  if (loading) return <div>Loading available food...</div>
  if (error) return <div className="text-red-500">{error}</div>

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Input
            placeholder="Search food donations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </div>
        </div>

        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Filters
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Filter Food Listings</SheetTitle>
              <SheetDescription>Adjust filters to find food that matches your needs.</SheetDescription>
            </SheetHeader>
            <div className="py-6 space-y-6">
              <div className="space-y-2">
                <Label>Maximum Distance ({maxDistance[0]} miles)</Label>
                <Slider defaultValue={[5]} max={10} step={0.5} value={maxDistance} onValueChange={setMaxDistance} />
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="urgent"
                      checked={filters.urgent}
                      onCheckedChange={(checked) => handleFilterChange("urgent", checked as boolean)}
                    />
                    <Label htmlFor="urgent" className="flex items-center">
                      <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                      Urgent (Expiring Soon)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="medium"
                      checked={filters.medium}
                      onCheckedChange={(checked) => handleFilterChange("medium", checked as boolean)}
                    />
                    <Label htmlFor="medium" className="flex items-center">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                      Medium Priority
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="available"
                      checked={filters.available}
                      onCheckedChange={(checked) => handleFilterChange("available", checked as boolean)}
                    />
                    <Label htmlFor="available" className="flex items-center">
                      <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                      Available
                    </Label>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Dietary Preferences</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="vegetarian"
                      checked={filters.vegetarian}
                      onCheckedChange={(checked) => handleFilterChange("vegetarian", checked as boolean)}
                    />
                    <Label htmlFor="vegetarian">Vegetarian</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="vegan"
                      checked={filters.vegan}
                      onCheckedChange={(checked) => handleFilterChange("vegan", checked as boolean)}
                    />
                    <Label htmlFor="vegan">Vegan</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="glutenFree"
                      checked={filters.glutenFree}
                      onCheckedChange={(checked) => handleFilterChange("glutenFree", checked as boolean)}
                    />
                    <Label htmlFor="glutenFree">Gluten-Free</Label>
                  </div>
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDonations.length > 0 ? (
          filteredDonations.map((donation) => (
            <Card key={donation.id} className="overflow-hidden">
              <div className="aspect-video relative">
                <img
                  src={donation.image || "/placeholder.svg"}
                  alt={donation.food_name}
                  className="object-cover w-full h-full"
                />
                <Badge className="absolute top-2 right-2 bg-green-500">Available</Badge>
              </div>
              <CardContent className="p-4">
                <h3 className="text-lg font-semibold mb-1">{donation.food_name}</h3>
                <p className="text-muted-foreground mb-2">{donation.description || "No description provided"}</p>
                <div className="flex items-center text-sm text-muted-foreground mb-1">
                  <span className="font-medium">Quantity:</span>&nbsp;{donation.quantity} {donation.unit}
                </div>
                <div className="flex items-center text-sm text-muted-foreground mb-1">
                  <span className="font-medium">Category:</span>&nbsp;{donation.category}
                </div>
                <div className="flex items-center text-sm text-muted-foreground mb-1">
                  <Clock className="h-4 w-4 mr-1" />
                  <span>Expires: {donation.expiry_date}</span>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center text-muted-foreground">No available food listings found.</div>
        )}
      </div>
    </div>
  )

  function handleFilterChange(key: string, value: boolean) {
    setFilters({ ...filters, [key]: value })
  }
}
