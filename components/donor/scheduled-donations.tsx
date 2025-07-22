"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, MapPin, MoreHorizontal } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Card, CardContent } from "@/components/ui/card"
import { fetchDonations } from '@/lib/datafetching'

export default function ScheduledDonations() {
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

  if (loading) return <div>Loading scheduled donations...</div>
  if (error) return <div className="text-red-500">{error}</div>

  return (
    <div className="space-y-6">
      {donations.map((donation) => (
        <Card key={donation.id}>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">{donation.food_name}</h3>
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
                <p className="text-muted-foreground">{donation.quantity} {donation.unit}</p>
                {/* Address and recipient are not in schema, so skip or use description if needed */}
                <div className="flex items-center text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 mr-1" />
                  {donation.description || "No address provided"}
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Clock className="h-4 w-4 mr-1" />
                  {donation.expiry_date}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Badge
                    variant="outline"
                    className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                  >
                    Scheduled
                  </Badge>
                  {/* <span className="text-sm">Recipient: {donation.recipient}</span> */}
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
