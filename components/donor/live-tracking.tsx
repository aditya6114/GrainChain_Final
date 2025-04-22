"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MapPin, Clock, User, Phone } from "lucide-react"

// Mock data for donations in transit
const activeDeliveries = [
  {
    id: 1,
    foodName: "Fruit Platters",
    recipient: "Family Support Center",
    status: "In Transit",
    estimatedArrival: "5:45 PM",
    currentLocation: "2.3 miles away",
    volunteer: {
      name: "John Smith",
      phone: "(555) 123-4567",
      vehicle: "Blue Honda Civic",
    },
  },
]

// Mock data for upcoming pickups
const upcomingPickups = [
  {
    id: 1,
    foodName: "Sandwiches",
    recipient: "Hope Shelter",
    status: "Confirmed",
    pickupTime: "Tomorrow, 10:00 AM",
    volunteer: {
      name: "Sarah Johnson",
      phone: "(555) 987-6543",
      vehicle: "Red Toyota Prius",
    },
  },
]

export default function LiveTracking() {
  const [selectedTab, setSelectedTab] = useState("active")

  return (
    <div className="space-y-6">
      <Tabs defaultValue="active" onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="active">Active Deliveries</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming Pickups</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {activeDeliveries.length > 0 ? (
            activeDeliveries.map((delivery) => (
              <Card key={delivery.id}>
                <CardContent className="p-6">
                  <div className="flex flex-col space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-semibold">{delivery.foodName}</h3>
                        <p className="text-muted-foreground">Recipient: {delivery.recipient}</p>
                      </div>
                      <Badge
                        variant="outline"
                        className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                      >
                        {delivery.status}
                      </Badge>
                    </div>

                    <div className="bg-muted p-4 rounded-md">
                      <div className="flex items-center mb-2">
                        <MapPin className="h-4 w-4 mr-2 text-primary" />
                        <span>Current Location: {delivery.currentLocation}</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2 text-primary" />
                        <span>Estimated Arrival: {delivery.estimatedArrival}</span>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <h4 className="font-medium mb-2">Volunteer Information</h4>
                      <div className="flex items-center mb-2">
                        <User className="h-4 w-4 mr-2 text-primary" />
                        <span>{delivery.volunteer.name}</span>
                      </div>
                      <div className="flex items-center mb-2">
                        <Phone className="h-4 w-4 mr-2 text-primary" />
                        <span>{delivery.volunteer.phone}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">Vehicle: {delivery.volunteer.vehicle}</p>
                    </div>

                    <div className="flex justify-end">
                      <Button variant="outline" size="sm">
                        Contact Volunteer
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No active deliveries at the moment.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="upcoming" className="space-y-4">
          {upcomingPickups.length > 0 ? (
            upcomingPickups.map((pickup) => (
              <Card key={pickup.id}>
                <CardContent className="p-6">
                  <div className="flex flex-col space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-semibold">{pickup.foodName}</h3>
                        <p className="text-muted-foreground">Recipient: {pickup.recipient}</p>
                      </div>
                      <Badge
                        variant="outline"
                        className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                      >
                        {pickup.status}
                      </Badge>
                    </div>

                    <div className="bg-muted p-4 rounded-md">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2 text-primary" />
                        <span>Pickup Time: {pickup.pickupTime}</span>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <h4 className="font-medium mb-2">Volunteer Information</h4>
                      <div className="flex items-center mb-2">
                        <User className="h-4 w-4 mr-2 text-primary" />
                        <span>{pickup.volunteer.name}</span>
                      </div>
                      <div className="flex items-center mb-2">
                        <Phone className="h-4 w-4 mr-2 text-primary" />
                        <span>{pickup.volunteer.phone}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">Vehicle: {pickup.volunteer.vehicle}</p>
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm">
                        Reschedule
                      </Button>
                      <Button variant="outline" size="sm">
                        Contact Volunteer
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No upcoming pickups scheduled.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <div className="mt-6 p-6 border rounded-md bg-muted">
        <h3 className="text-lg font-semibold mb-4">Live Map View</h3>
        <div className="aspect-video bg-card rounded-md flex items-center justify-center">
          <p className="text-muted-foreground">Interactive map will be displayed here</p>
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          Note: Live tracking is only available for active deliveries.
        </p>
      </div>
    </div>
  )
}
