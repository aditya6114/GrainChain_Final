import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import DonationForm from "@/components/donor/donation-form"
import ScheduledDonations from "@/components/donor/scheduled-donations"
import LiveTracking from "@/components/donor/live-tracking"
import Notifications from "@/components/donor/notifications"

export default function DonorDashboard() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Donor Dashboard</h1>
        <p className="text-muted-foreground">
          List your surplus food, track donations, and make a difference in your community.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Tabs defaultValue="donate" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="donate">Donate Food</TabsTrigger>
              <TabsTrigger value="scheduled">Scheduled Donations</TabsTrigger>
            </TabsList>
            <TabsContent value="donate">
              <DonationForm />
            </TabsContent>
            <TabsContent value="scheduled">
              <ScheduledDonations />
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-8">
          <LiveTracking />
          <Notifications />
        </div>
      </div>
    </div>
  )
}
