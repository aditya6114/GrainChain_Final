"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent } from "@/components/ui/card"
import { MapPin, Search, Filter, Navigation } from "lucide-react"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"

// Mock data for food donations
const donations = [
  {
    id: 1,
    name: "Restaurant City",
    foodType: "Pasta with Vegetables",
    quantity: "15 servings",
    location: "123 Main St, Anytown",
    coordinates: { lat: 40.7128, lng: -74.006 },
    status: "Available",
  },
  {
    id: 2,
    name: "Cafe Express",
    foodType: "Sandwiches",
    quantity: "20 servings",
    location: "456 Oak Ave, Anytown",
    coordinates: { lat: 40.7148, lng: -74.013 },
    status: "Pending Pickup",
  },
  {
    id: 3,
    name: "Green Grocer",
    foodType: "Fruit Platters",
    quantity: "10 servings",
    location: "789 Pine Rd, Anytown",
    coordinates: { lat: 40.7118, lng: -74.009 },
    status: "In Transit",
  },
]

export default function FoodMap() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filters, setFilters] = useState({
    available: true,
    pending: true,
    inTransit: true,
    delivered: false,
  })

  const handleFilterChange = (key: string, value: boolean) => {
    setFilters({ ...filters, [key]: value })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Input
            placeholder="Search by location or food type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            <Search className="h-4 w-4" />
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
              <SheetTitle>Map Filters</SheetTitle>
              <SheetDescription>Customize what you see on the map.</SheetDescription>
            </SheetHeader>
            <div className="py-6 space-y-6">
              <div className="space-y-2">
                <Label>Donation Status</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="available"
                      checked={filters.available}
                      onCheckedChange={(checked) => handleFilterChange("available", checked as boolean)}
                    />
                    <Label htmlFor="available">Available</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="pending"
                      checked={filters.pending}
                      onCheckedChange={(checked) => handleFilterChange("pending", checked as boolean)}
                    />
                    <Label htmlFor="pending">Pending Pickup</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="inTransit"
                      checked={filters.inTransit}
                      onCheckedChange={(checked) => handleFilterChange("inTransit", checked as boolean)}
                    />
                    <Label htmlFor="inTransit">In Transit</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="delivered"
                      checked={filters.delivered}
                      onCheckedChange={(checked) => handleFilterChange("delivered", checked as boolean)}
                    />
                    <Label htmlFor="delivered">Delivered</Label>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Food Types</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="perishable" defaultChecked />
                    <Label htmlFor="perishable">Perishable</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="non-perishable" defaultChecked />
                    <Label htmlFor="non-perishable">Non-Perishable</Label>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Distance</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="within-5" defaultChecked />
                    <Label htmlFor="within-5">Within 5 miles</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="within-10" defaultChecked />
                    <Label htmlFor="within-10">Within 10 miles</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="beyond-10" defaultChecked />
                    <Label htmlFor="beyond-10">Beyond 10 miles</Label>
                  </div>
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        <Button className="gap-2">
          <Navigation className="h-4 w-4" />
          Use My Location
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <div className="aspect-[4/3] bg-muted rounded-md flex items-center justify-center">
            <p className="text-muted-foreground">Interactive map will be displayed here</p>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Click on a marker to view donation details. Drag to explore the map.
          </p>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Nearby Donations</h3>

          {donations.map((donation) => (
            <Card key={donation.id} className="cursor-pointer hover:bg-muted/50 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold">{donation.name}</h4>
                    <p className="text-sm">{donation.foodType}</p>
                    <p className="text-sm text-muted-foreground">
                      {donation.quantity} • {donation.status}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">{donation.location}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          <Button variant="outline" className="w-full">
            View All Donations
          </Button>
        </div>
      </div>
    </div>
  )
}
