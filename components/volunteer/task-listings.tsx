"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MapPin, Clock, Search, Filter, Navigation } from "lucide-react"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

// Mock data for pickup tasks
const pickupTasks = [
  {
    id: 1,
    donor: "Restaurant City",
    foodType: "Pasta with Vegetables",
    quantity: "15 servings",
    pickupAddress: "123 Main St, Anytown",
    deliveryAddress: "789 Community Ave, Anytown",
    pickupTime: "Today, 3:00 PM",
    distance: "1.2 miles",
    estimatedTime: "15 min",
    urgency: "high",
  },
  {
    id: 2,
    donor: "Cafe Express",
    foodType: "Sandwiches",
    quantity: "20 servings",
    pickupAddress: "456 Oak Ave, Anytown",
    deliveryAddress: "101 Hope St, Anytown",
    pickupTime: "Today, 4:30 PM",
    distance: "2.5 miles",
    estimatedTime: "22 min",
    urgency: "medium",
  },
  {
    id: 3,
    donor: "Green Grocer",
    foodType: "Fruit Platters",
    quantity: "10 servings",
    pickupAddress: "789 Pine Rd, Anytown",
    deliveryAddress: "202 Support Ln, Anytown",
    pickupTime: "Tomorrow, 10:00 AM",
    distance: "3.8 miles",
    estimatedTime: "30 min",
    urgency: "low",
  },
]

// Mock data for delivery tasks
const deliveryTasks = [
  {
    id: 1,
    recipient: "Community Food Bank",
    foodType: "Soup and Bread",
    quantity: "25 servings",
    pickupAddress: "101 Elm St, Anytown",
    deliveryAddress: "789 Community Ave, Anytown",
    deliveryTime: "Today, 5:00 PM",
    distance: "1.5 miles",
    estimatedTime: "18 min",
    urgency: "high",
  },
  {
    id: 2,
    recipient: "Hope Shelter",
    foodType: "Rice and Curry",
    quantity: "30 servings",
    pickupAddress: "202 Maple Dr, Anytown",
    deliveryAddress: "101 Hope St, Anytown",
    deliveryTime: "Today, 6:30 PM",
    distance: "4.2 miles",
    estimatedTime: "35 min",
    urgency: "medium",
  },
]

export default function TaskListings() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filters, setFilters] = useState({
    high: true,
    medium: true,
    low: true,
  })

  const handleFilterChange = (key: string, value: boolean) => {
    setFilters({ ...filters, [key]: value })
  }

  // Filter tasks based on search term and urgency
  const filteredPickupTasks = pickupTasks.filter((task) => {
    const matchesSearch =
      task.donor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.foodType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.pickupAddress.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesUrgency =
      (task.urgency === "high" && filters.high) ||
      (task.urgency === "medium" && filters.medium) ||
      (task.urgency === "low" && filters.low)

    return matchesSearch && matchesUrgency
  })

  const filteredDeliveryTasks = deliveryTasks.filter((task) => {
    const matchesSearch =
      task.recipient.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.foodType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.deliveryAddress.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesUrgency =
      (task.urgency === "high" && filters.high) ||
      (task.urgency === "medium" && filters.medium) ||
      (task.urgency === "low" && filters.low)

    return matchesSearch && matchesUrgency
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Input
            placeholder="Search tasks by location, food type, etc."
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
              <SheetTitle>Filter Tasks</SheetTitle>
              <SheetDescription>Customize which tasks you see.</SheetDescription>
            </SheetHeader>
            <div className="py-6 space-y-6">
              <div className="space-y-2">
                <Label>Urgency</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="high"
                      checked={filters.high}
                      onCheckedChange={(checked) => handleFilterChange("high", checked as boolean)}
                    />
                    <Label htmlFor="high" className="flex items-center">
                      <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                      High Urgency
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
                      Medium Urgency
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="low"
                      checked={filters.low}
                      onCheckedChange={(checked) => handleFilterChange("low", checked as boolean)}
                    />
                    <Label htmlFor="low" className="flex items-center">
                      <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                      Low Urgency
                    </Label>
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
                    <Checkbox id="beyond-10" />
                    <Label htmlFor="beyond-10">Beyond 10 miles</Label>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Time</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="today" defaultChecked />
                    <Label htmlFor="today">Today</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="tomorrow" defaultChecked />
                    <Label htmlFor="tomorrow">Tomorrow</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="this-week" />
                    <Label htmlFor="this-week">This Week</Label>
                  </div>
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        <Button className="gap-2">
          <Navigation className="h-4 w-4" />
          Near Me
        </Button>
      </div>

      <Tabs defaultValue="pickup">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pickup">Pickup Tasks</TabsTrigger>
          <TabsTrigger value="delivery">Delivery Tasks</TabsTrigger>
        </TabsList>

        <TabsContent value="pickup" className="space-y-4 mt-6">
          {filteredPickupTasks.length > 0 ? (
            filteredPickupTasks.map((task) => (
              <Card key={task.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div
                    className={cn(
                      "h-2",
                      task.urgency === "high"
                        ? "bg-red-500"
                        : task.urgency === "medium"
                          ? "bg-yellow-500"
                          : "bg-green-500",
                    )}
                  />
                  <div className="p-6">
                    <div className="flex flex-col md:flex-row justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold">{task.foodType}</h3>
                          <Badge
                            className={cn(
                              "md:hidden",
                              task.urgency === "high"
                                ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                                : task.urgency === "medium"
                                  ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                                  : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
                            )}
                          >
                            {task.urgency === "high"
                              ? "High Urgency"
                              : task.urgency === "medium"
                                ? "Medium Urgency"
                                : "Low Urgency"}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground">
                          {task.quantity} from {task.donor}
                        </p>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4 mr-1" />
                          Pickup: {task.pickupAddress}
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4 mr-1" />
                          Deliver to: {task.deliveryAddress}
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Clock className="h-4 w-4 mr-1" />
                          Pickup at: {task.pickupTime}
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <span>{task.distance}</span>
                          <span>~{task.estimatedTime}</span>
                        </div>
                      </div>

                      <div className="flex flex-row md:flex-col gap-2 mt-4 md:mt-0 md:ml-4">
                        <Badge
                          className={cn(
                            "hidden md:inline-flex",
                            task.urgency === "high"
                              ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                              : task.urgency === "medium"
                                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                                : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
                          )}
                        >
                          {task.urgency === "high"
                            ? "High Urgency"
                            : task.urgency === "medium"
                              ? "Medium Urgency"
                              : "Low Urgency"}
                        </Badge>
                        <Button className="whitespace-nowrap">Claim Task</Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                No pickup tasks match your search criteria. Try adjusting your filters.
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="delivery" className="space-y-4 mt-6">
          {filteredDeliveryTasks.length > 0 ? (
            filteredDeliveryTasks.map((task) => (
              <Card key={task.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div
                    className={cn(
                      "h-2",
                      task.urgency === "high"
                        ? "bg-red-500"
                        : task.urgency === "medium"
                          ? "bg-yellow-500"
                          : "bg-green-500",
                    )}
                  />
                  <div className="p-6">
                    <div className="flex flex-col md:flex-row justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold">{task.foodType}</h3>
                          <Badge
                            className={cn(
                              "md:hidden",
                              task.urgency === "high"
                                ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                                : task.urgency === "medium"
                                  ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                                  : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
                            )}
                          >
                            {task.urgency === "high"
                              ? "High Urgency"
                              : task.urgency === "medium"
                                ? "Medium Urgency"
                                : "Low Urgency"}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground">
                          {task.quantity} for {task.recipient}
                        </p>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4 mr-1" />
                          Pickup: {task.pickupAddress}
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4 mr-1" />
                          Deliver to: {task.deliveryAddress}
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Clock className="h-4 w-4 mr-1" />
                          Deliver by: {task.deliveryTime}
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <span>{task.distance}</span>
                          <span>~{task.estimatedTime}</span>
                        </div>
                      </div>

                      <div className="flex flex-row md:flex-col gap-2 mt-4 md:mt-0 md:ml-4">
                        <Badge
                          className={cn(
                            "hidden md:inline-flex",
                            task.urgency === "high"
                              ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                              : task.urgency === "medium"
                                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                                : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
                          )}
                        >
                          {task.urgency === "high"
                            ? "High Urgency"
                            : task.urgency === "medium"
                              ? "Medium Urgency"
                              : "Low Urgency"}
                        </Badge>
                        <Button className="whitespace-nowrap">Claim Task</Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                No delivery tasks match your search criteria. Try adjusting your filters.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
