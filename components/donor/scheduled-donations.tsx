"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, MapPin, MoreHorizontal } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Card, CardContent } from "@/components/ui/card"

// Mock data for scheduled donations
const donations = [
  {
    id: 1,
    foodName: "Pasta with Vegetables",
    quantity: "15 servings",
    recipient: "Community Food Bank",
    pickupTime: "Today, 3:00 PM",
    status: "Pending",
    address: "123 Main St, Anytown",
  },
  {
    id: 2,
    foodName: "Sandwiches",
    quantity: "20 servings",
    recipient: "Hope Shelter",
    pickupTime: "Tomorrow, 10:00 AM",
    status: "Confirmed",
    address: "456 Oak Ave, Anytown",
  },
  {
    id: 3,
    foodName: "Fruit Platters",
    quantity: "10 servings",
    recipient: "Family Support Center",
    pickupTime: "Today, 5:30 PM",
    status: "In Transit",
    address: "789 Pine Rd, Anytown",
  },
  {
    id: 4,
    foodName: "Soup and Bread",
    quantity: "25 servings",
    recipient: "Senior Center",
    pickupTime: "Yesterday, 2:00 PM",
    status: "Delivered",
    address: "101 Elm St, Anytown",
  },
]

export default function ScheduledDonations() {
  return (
    <div className="space-y-6">
      {donations.map((donation) => (
        <Card key={donation.id}>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">{donation.foodName}</h3>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild className="md:hidden">
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Reschedule</DropdownMenuItem>
                      <DropdownMenuItem>Cancel</DropdownMenuItem>
                      <DropdownMenuItem>Contact Recipient</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <p className="text-muted-foreground">{donation.quantity}</p>
                <div className="flex items-center text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 mr-1" />
                  {donation.address}
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Clock className="h-4 w-4 mr-1" />
                  {donation.pickupTime}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Badge
                    variant="outline"
                    className={
                      donation.status === "Pending"
                        ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                        : donation.status === "Confirmed"
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                          : donation.status === "In Transit"
                            ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                            : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                    }
                  >
                    {donation.status}
                  </Badge>
                  <span className="text-sm">Recipient: {donation.recipient}</span>
                </div>
              </div>

              <div className="hidden md:flex flex-col gap-2 mt-4 md:mt-0">
                <Button variant="outline" size="sm">
                  Reschedule
                </Button>
                <Button variant="outline" size="sm">
                  Cancel
                </Button>
                <Button variant="outline" size="sm">
                  Contact Recipient
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
