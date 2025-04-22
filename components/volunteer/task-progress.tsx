"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MapPin, Clock, Check, MoreHorizontal } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

// Mock data for assigned tasks
const assignedTasks = [
  {
    id: 1,
    type: "pickup",
    foodType: "Pasta with Vegetables",
    quantity: "15 servings",
    donor: "Restaurant City",
    recipient: "Community Food Bank",
    pickupAddress: "123 Main St, Anytown",
    deliveryAddress: "789 Community Ave, Anytown",
    pickupTime: "Today, 3:00 PM",
    status: "Assigned",
  },
]

// Mock data for in-progress tasks
const inProgressTasks = [
  {
    id: 1,
    type: "delivery",
    foodType: "Soup and Bread",
    quantity: "25 servings",
    donor: "Community Kitchen",
    recipient: "Hope Shelter",
    pickupAddress: "101 Elm St, Anytown",
    deliveryAddress: "101 Hope St, Anytown",
    deliveryTime: "Today, 5:00 PM",
    status: "In Progress",
    pickedUpAt: "4:15 PM",
  },
]

// Mock data for completed tasks
const completedTasks = [
  {
    id: 1,
    type: "pickup",
    foodType: "Sandwiches",
    quantity: "20 servings",
    donor: "Cafe Express",
    recipient: "Family Support Center",
    pickupAddress: "456 Oak Ave, Anytown",
    deliveryAddress: "202 Support Ln, Anytown",
    completedDate: "Yesterday, 2:30 PM",
    status: "Completed",
  },
  {
    id: 2,
    type: "delivery",
    foodType: "Fruit Platters",
    quantity: "10 servings",
    donor: "Green Grocer",
    recipient: "Senior Center",
    pickupAddress: "789 Pine Rd, Anytown",
    deliveryAddress: "303 Senior Blvd, Anytown",
    completedDate: "2 days ago",
    status: "Completed",
  },
]

export default function TaskProgress() {
  const [activeTab, setActiveTab] = useState("assigned")

  return (
    <div className="space-y-6">
      <Tabs defaultValue="assigned" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="assigned">Assigned</TabsTrigger>
          <TabsTrigger value="in-progress">In Progress</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value="assigned" className="space-y-4 mt-6">
          {assignedTasks.length > 0 ? (
            assignedTasks.map((task) => (
              <Card key={task.id}>
                <CardContent className="p-6">
                  <div className="flex flex-col space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-semibold">{task.foodType}</h3>
                        <p className="text-muted-foreground">
                          {task.quantity} • {task.type === "pickup" ? "Pickup Task" : "Delivery Task"}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                      >
                        {task.status}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <h4 className="font-medium">Pickup Information</h4>
                        <div className="flex items-center text-sm">
                          <MapPin className="h-4 w-4 mr-1 text-primary" />
                          {task.pickupAddress}
                        </div>
                        <div className="flex items-center text-sm">
                          <Clock className="h-4 w-4 mr-1 text-primary" />
                          {task.pickupTime}
                        </div>
                        <p className="text-sm">From: {task.donor}</p>
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-medium">Delivery Information</h4>
                        <div className="flex items-center text-sm">
                          <MapPin className="h-4 w-4 mr-1 text-primary" />
                          {task.deliveryAddress}
                        </div>
                        <p className="text-sm">To: {task.recipient}</p>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm">
                        Get Directions
                      </Button>
                      <Button size="sm">Start Pickup</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No assigned tasks at the moment.</p>
              <Button variant="outline" className="mt-4">
                Browse Available Tasks
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="in-progress" className="space-y-4 mt-6">
          {inProgressTasks.length > 0 ? (
            inProgressTasks.map((task) => (
              <Card key={task.id}>
                <CardContent className="p-6">
                  <div className="flex flex-col space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-semibold">{task.foodType}</h3>
                        <p className="text-muted-foreground">
                          {task.quantity} • {task.type === "pickup" ? "Pickup Task" : "Delivery Task"}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                      >
                        {task.status}
                      </Badge>
                    </div>

                    <div className="bg-muted p-4 rounded-md">
                      <h4 className="font-medium mb-2">Progress</h4>
                      <div className="space-y-2">
                        <div className="flex items-center">
                          <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center mr-2">
                            <Check className="h-4 w-4 text-white" />
                          </div>
                          <span>Picked up at {task.pickedUpAt}</span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center mr-2">
                            <Clock className="h-4 w-4 text-white" />
                          </div>
                          <span>In transit to {task.recipient}</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <h4 className="font-medium">Pickup Information</h4>
                        <div className="flex items-center text-sm">
                          <MapPin className="h-4 w-4 mr-1 text-primary" />
                          {task.pickupAddress}
                        </div>
                        <p className="text-sm">From: {task.donor}</p>
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-medium">Delivery Information</h4>
                        <div className="flex items-center text-sm">
                          <MapPin className="h-4 w-4 mr-1 text-primary" />
                          {task.deliveryAddress}
                        </div>
                        <div className="flex items-center text-sm">
                          <Clock className="h-4 w-4 mr-1 text-primary" />
                          {task.deliveryTime}
                        </div>
                        <p className="text-sm">To: {task.recipient}</p>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm">
                        Report Issue
                      </Button>
                      <Button size="sm">Complete Delivery</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No tasks in progress at the moment.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4 mt-6">
          {completedTasks.length > 0 ? (
            completedTasks.map((task) => (
              <Card key={task.id}>
                <CardContent className="p-6">
                  <div className="flex flex-col space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-semibold">{task.foodType}</h3>
                        <p className="text-muted-foreground">
                          {task.quantity} • {task.type === "pickup" ? "Pickup Task" : "Delivery Task"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                        >
                          {task.status}
                        </Badge>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>View Details</DropdownMenuItem>
                            <DropdownMenuItem>Download Receipt</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <h4 className="font-medium">Task Details</h4>
                        <p className="text-sm">
                          {task.type === "pickup" ? "Picked up from" : "Delivered from"}: {task.donor}
                        </p>
                        <p className="text-sm">
                          {task.type === "pickup" ? "Delivered to" : "Delivered to"}: {task.recipient}
                        </p>
                        <div className="flex items-center text-sm">
                          <Clock className="h-4 w-4 mr-1 text-primary" />
                          Completed: {task.completedDate}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No completed tasks at the moment.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
