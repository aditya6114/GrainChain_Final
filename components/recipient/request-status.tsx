"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Clock, MapPin, User, Phone, Calendar } from "lucide-react"
import { cn } from "@/lib/utils"

// Mock data for active requests
const activeRequests = [
  {
    id: 1,
    foodName: "Pasta with Vegetables",
    quantity: "10 servings",
    donor: "Restaurant City",
    status: "Confirmed",
    deliveryTime: "Today, 5:00 PM",
    address: "123 Main St, Anytown",
    volunteer: {
      name: "John Smith",
      phone: "(555) 123-4567",
    },
  },
  {
    id: 2,
    foodName: "Fruit Platters",
    quantity: "5 servings",
    donor: "Green Grocer",
    status: "In Transit",
    deliveryTime: "Today, 6:30 PM",
    address: "123 Main St, Anytown",
    volunteer: {
      name: "Sarah Johnson",
      phone: "(555) 987-6543",
    },
  },
  {
    id: 3,
    foodName: "Sandwiches",
    quantity: "15 servings",
    donor: "Cafe Express",
    status: "Pending",
    deliveryTime: "Tomorrow, 12:00 PM",
    address: "123 Main St, Anytown",
  },
]

// Mock data for past requests
const pastRequests = [
  {
    id: 1,
    foodName: "Soup and Bread",
    quantity: "20 servings",
    donor: "Community Kitchen",
    status: "Delivered",
    deliveryDate: "Yesterday, 3:00 PM",
    address: "123 Main St, Anytown",
  },
  {
    id: 2,
    foodName: "Rice and Curry",
    quantity: "25 servings",
    donor: "Spice House",
    status: "Delivered",
    deliveryDate: "3 days ago",
    address: "123 Main St, Anytown",
  },
  {
    id: 3,
    foodName: "Baked Goods",
    quantity: "30 items",
    donor: "Sweet Bakery",
    status: "Cancelled",
    deliveryDate: "Last week",
    address: "123 Main St, Anytown",
  },
]

export default function RequestStatus() {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="active">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="active">Active Requests</TabsTrigger>
          <TabsTrigger value="past">Past Requests</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4 mt-6">
          {activeRequests.length > 0 ? (
            activeRequests.map((request) => (
              <Card key={request.id}>
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">{request.foodName}</h3>
                        <Badge
                          variant="outline"
                          className={cn(
                            request.status === "Pending"
                              ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                              : request.status === "Confirmed"
                                ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                                : "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
                          )}
                        >
                          {request.status}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground">
                        {request.quantity} from {request.donor}
                      </p>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4 mr-1" />
                        {request.address}
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Clock className="h-4 w-4 mr-1" />
                        Expected: {request.deliveryTime}
                      </div>

                      {request.volunteer && (
                        <div className="mt-4 p-3 bg-muted rounded-md">
                          <h4 className="font-medium mb-2">Volunteer Information</h4>
                          <div className="flex items-center text-sm">
                            <User className="h-4 w-4 mr-1 text-primary" />
                            {request.volunteer.name}
                          </div>
                          <div className="flex items-center text-sm">
                            <Phone className="h-4 w-4 mr-1 text-primary" />
                            {request.volunteer.phone}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-row md:flex-col gap-2 mt-4 md:mt-0">
                      {request.status === "Pending" && (
                        <Button variant="outline" size="sm" className="w-full">
                          Cancel Request
                        </Button>
                      )}
                      {request.status === "In Transit" && (
                        <Button size="sm" className="w-full">
                          Track Delivery
                        </Button>
                      )}
                      <Button variant="outline" size="sm" className="w-full">
                        Contact {request.volunteer ? "Volunteer" : "Donor"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No active requests at the moment.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="past" className="space-y-4 mt-6">
          {pastRequests.length > 0 ? (
            pastRequests.map((request) => (
              <Card key={request.id}>
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">{request.foodName}</h3>
                        <Badge
                          variant="outline"
                          className={cn(
                            request.status === "Delivered"
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                              : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
                          )}
                        >
                          {request.status}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground">
                        {request.quantity} from {request.donor}
                      </p>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4 mr-1" />
                        {request.address}
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4 mr-1" />
                        {request.deliveryDate}
                      </div>
                    </div>

                    <div className="flex flex-row md:flex-col gap-2 mt-4 md:mt-0">
                      {request.status === "Delivered" && (
                        <Button size="sm" className="w-full">
                          Leave Feedback
                        </Button>
                      )}
                      <Button variant="outline" size="sm" className="w-full">
                        Request Again
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No past requests found.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
