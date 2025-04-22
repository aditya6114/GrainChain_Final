"use client"

import { useState } from "react"
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

// Mock data for available food listings
const foodListings = [
  {
    id: 1,
    name: "Pasta with Vegetables",
    description: "Freshly made pasta with seasonal vegetables",
    quantity: "15 servings",
    donor: "Restaurant City",
    distance: "1.2 miles",
    expiryTime: "Today, 8:00 PM",
    image: "/placeholder.svg?height=200&width=300",
    priority: "urgent",
  },
  {
    id: 2,
    name: "Sandwiches",
    description: "Assorted vegetarian and meat sandwiches",
    quantity: "20 servings",
    donor: "Cafe Express",
    distance: "2.5 miles",
    expiryTime: "Tomorrow, 12:00 PM",
    image: "/placeholder.svg?height=200&width=300",
    priority: "medium",
  },
  {
    id: 3,
    name: "Fruit Platters",
    description: "Fresh fruit platters with a variety of seasonal fruits",
    quantity: "10 servings",
    donor: "Green Grocer",
    distance: "3.8 miles",
    expiryTime: "Today, 10:00 PM",
    image: "/placeholder.svg?height=200&width=300",
    priority: "available",
  },
  {
    id: 4,
    name: "Soup and Bread",
    description: "Homemade vegetable soup with fresh bread",
    quantity: "25 servings",
    donor: "Community Kitchen",
    distance: "1.5 miles",
    expiryTime: "Today, 7:00 PM",
    image: "/placeholder.svg?height=200&width=300",
    priority: "urgent",
  },
  {
    id: 5,
    name: "Rice and Curry",
    description: "Vegetarian rice and curry dishes",
    quantity: "30 servings",
    donor: "Spice House",
    distance: "4.2 miles",
    expiryTime: "Tomorrow, 2:00 PM",
    image: "/placeholder.svg?height=200&width=300",
    priority: "medium",
  },
  {
    id: 6,
    name: "Baked Goods",
    description: "Assorted breads, pastries, and cookies",
    quantity: "40 items",
    donor: "Sweet Bakery",
    distance: "2.1 miles",
    expiryTime: "Today, 9:00 PM",
    image: "/placeholder.svg?height=200&width=300",
    priority: "available",
  },
]

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

  const handleFilterChange = (key: string, value: boolean) => {
    setFilters({ ...filters, [key]: value })
  }

  // Filter food listings based on search term, distance, and priority
  const filteredListings = foodListings.filter((listing) => {
    const matchesSearch =
      listing.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      listing.description.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesDistance = Number.parseFloat(listing.distance.split(" ")[0]) <= maxDistance[0]

    const matchesPriority =
      (listing.priority === "urgent" && filters.urgent) ||
      (listing.priority === "medium" && filters.medium) ||
      (listing.priority === "available" && filters.available)

    return matchesSearch && matchesDistance && matchesPriority
  })

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
        {filteredListings.length > 0 ? (
          filteredListings.map((listing) => (
            <Card key={listing.id} className={cn("overflow-hidden", listing.priority)}>
              <div className="aspect-video relative">
                <img
                  src={listing.image || "/placeholder.svg"}
                  alt={listing.name}
                  className="object-cover w-full h-full"
                />
                <Badge
                  className={cn(
                    "absolute top-2 right-2",
                    listing.priority === "urgent"
                      ? "bg-red-500"
                      : listing.priority === "medium"
                        ? "bg-yellow-500"
                        : "bg-green-500",
                  )}
                >
                  {listing.priority === "urgent" ? "Urgent" : listing.priority === "medium" ? "Medium" : "Available"}
                </Badge>
              </div>
              <CardContent className="p-4">
                <h3 className="text-lg font-semibold mb-1">{listing.name}</h3>
                <p className="text-sm text-muted-foreground mb-2">{listing.description}</p>
                <div className="text-sm space-y-1 mb-4">
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-1 text-primary" />
                    <span>{listing.distance} away</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-1 text-primary" />
                    <span>Expires: {listing.expiryTime}</span>
                  </div>
                  <div>Quantity: {listing.quantity}</div>
                  <div>Donor: {listing.donor}</div>
                </div>
                <Button className="w-full">Request This Food</Button>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <p className="text-muted-foreground">
              No food donations match your search criteria. Try adjusting your filters.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
