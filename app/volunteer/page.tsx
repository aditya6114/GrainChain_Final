import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import VolunteerSignup from "@/components/volunteer/volunteer-signup"
import TaskListings from "@/components/volunteer/task-listings"
import TaskProgress from "@/components/volunteer/task-progress"
// import Leaderboard from "@/components/volunteer/leaderboard"

export default function VolunteerPage() {
  return (
    <div className="container py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Volunteer Portal</h1>
        <p className="text-muted-foreground">
          Join our volunteer network to help transport food from donors to recipients.
        </p>
      </div>

      <Tabs defaultValue="signup" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="signup">Sign Up</TabsTrigger>
          <TabsTrigger value="tasks">Available Tasks</TabsTrigger>
          <TabsTrigger value="progress">Task Progress</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
        </TabsList>

        <TabsContent value="signup" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Volunteer Registration</CardTitle>
              <CardDescription>Sign up to become a volunteer and help deliver food to those in need.</CardDescription>
            </CardHeader>
            <CardContent>
              <VolunteerSignup />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Available Tasks</CardTitle>
              <CardDescription>Browse and claim food pickup and delivery tasks in your area.</CardDescription>
            </CardHeader>
            <CardContent>
              <TaskListings />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="progress" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Task Progress</CardTitle>
              <CardDescription>Track your assigned, ongoing, and completed tasks.</CardDescription>
            </CardHeader>
            <CardContent>
              <TaskProgress />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leaderboard" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Volunteer Leaderboard</CardTitle>
              <CardDescription>See top volunteers and your contribution rankings.</CardDescription>
            </CardHeader>
            <CardContent>
              {/* <Leaderboard /> */}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
