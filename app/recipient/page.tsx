import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import AvailableFoodListings from "@/components/recipient/available-food-listings"
import RequestForm from "@/components/recipient/request-form"
import RequestStatus from "@/components/recipient/request-status"
import FeedbackSystem from "@/components/recipient/feedback-system"

export default function RecipientDashboard() {
  return (
    <div className="container py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Recipient Dashboard</h1>
        <p className="text-muted-foreground">
          Browse available food donations, make requests, and track your deliveries.
        </p>
      </div>

      <Tabs defaultValue="available" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="available">Available Food</TabsTrigger>
          <TabsTrigger value="request">Request Food</TabsTrigger>
          <TabsTrigger value="status">Request Status</TabsTrigger>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
        </TabsList>

        <TabsContent value="available" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Available Food Donations</CardTitle>
              <CardDescription>Browse food donations available in your area.</CardDescription>
            </CardHeader>
            <CardContent>
              <AvailableFoodListings />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="request" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Request Food</CardTitle>
              <CardDescription>Request specific food donations or register for auto-matching.</CardDescription>
            </CardHeader>
            <CardContent>
              <RequestForm />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="status" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Request Status</CardTitle>
              <CardDescription>Track the status of your food requests.</CardDescription>
            </CardHeader>
            <CardContent>
              <RequestStatus />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="feedback" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Feedback System</CardTitle>
              <CardDescription>Rate and provide feedback on food donations you've received.</CardDescription>
            </CardHeader>
            <CardContent>
              <FeedbackSystem />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
