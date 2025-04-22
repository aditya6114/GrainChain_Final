"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Clock, Car, Truck, Bike, Navigation, RotateCw } from "lucide-react"

// Mock data for pickup and delivery locations
const routes = [
  {
    id: 1,
    donor: "Restaurant City",
    recipient: "Community Food Bank",
    pickupAddress: "123 Main St, Anytown",
    deliveryAddress: "789 Community Ave, Anytown",
    distance: "3.5 miles",
    estimatedTime: "15 min",
    status: "Available",
  },
  {
    id: 2,
    donor: "Cafe Express",
    recipient: "Hope Shelter",
    pickupAddress: "456 Oak Ave, Anytown",
    deliveryAddress: "101 Hope St, Anytown",
    distance: "5.2 miles",
    estimatedTime: "22 min",
    status: "Assigned",
  },
  {
    id: 3,
    donor: "Green Grocer",
    recipient: "Family Support Center",
    pickupAddress: "789 Pine Rd, Anytown",
    deliveryAddress: "202 Support Ln, Anytown",
    distance: "4.8 miles",
    estimatedTime: "20 min",
    status: "Available",
  },
]

export default function RouteOptimization() {
  const [transportType, setTransportType] = useState("car")
  const [startLocation, setStartLocation] = useState("")

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="start-location">Your Starting Location</Label>
            <div className="flex gap-2 mt-1">
              <Input
                id="start-location"
                placeholder="Enter your address"
                value={startLocation}
                onChange={(e) => setStartLocation(e.target.value)}
              />
              <Button variant="outline" size="icon">
                <Navigation className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div>
            <Label>Transportation Type</Label>
            <RadioGroup value={transportType} onValueChange={setTransportType} className="mt-2">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="car" id="car" />
                <Label htmlFor="car" className="flex items-center">
                  <Car className="h-4 w-4 mr-2" />
                  Car
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="bike" id="bike" />
                <Label htmlFor="bike" className="flex items-center">
                  <Bike className="h-4 w-4 mr-2" />
                  Bike
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="truck" id="truck" />
                <Label htmlFor="truck" className="flex items-center">
                  <Truck className="h-4 w-4 mr-2" />
                  Truck
                </Label>
              </div>
            </RadioGroup>
          </div>

          <Button className="w-full gap-2">
            <RotateCw className="h-4 w-4" />
            Optimize Routes
          </Button>

          <div className="p-4 bg-muted rounded-md">
            <h3 className="font-semibold mb-2">Route Summary</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Total Distance:</span>
                <span>13.5 miles</span>
              </div>
              <div className="flex justify-between">
                <span>Estimated Time:</span>
                <span>57 minutes</span>
              </div>
              <div className="flex justify-between">
                <span>Pickups:</span>
                <span>3</span>
              </div>
              <div className="flex justify-between">
                <span>Deliveries:</span>
                <span>3</span>
              </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-2">
          <div className="aspect-[4/3] bg-muted rounded-md flex items-center justify-center">
            <p className="text-muted-foreground">Route map will be displayed here</p>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            The optimized route is shown in blue. Click on a marker for details.
          </p>
        </div>
      </div>

      <h3 className="text-lg font-semibold mt-6">Optimized Route Plan</h3>
      <div className="space-y-4">
        {routes.map((route, index) => (
          <Card key={route.id}>
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className="flex flex-col items-center">
                  <div className="bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </div>
                  {index < routes.length - 1 && <div className="w-0.5 h-full bg-muted-foreground/20 my-1"></div>}
                </div>

                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold">Pickup: {route.donor}</h4>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4 mr-1" />
                        {route.pickupAddress}
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={
                        route.status === "Available"
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                      }
                    >
                      {route.status}
                    </Badge>
                  </div>

                  <div className="my-2 border-t border-dashed pt-2">
                    <h4 className="font-semibold">Deliver to: {route.recipient}</h4>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4 mr-1" />
                      {route.deliveryAddress}
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-2 text-sm">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      <span>{route.estimatedTime}</span>
                    </div>
                    <div className="flex items-center">
                      <Car className="h-4 w-4 mr-1" />
                      <span>{route.distance}</span>
                    </div>
                  </div>

                  <div className="flex justify-end mt-2">
                    <Button variant="outline" size="sm">
                      Claim Route
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
