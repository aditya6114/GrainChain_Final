import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import FoodMap from "@/components/map/food-map"
import HeatmapView from "@/components/map/heatmap-view"
import RouteOptimization from "@/components/map/route-optimization"

export default function MapPage() {
  return (
    <div className="container py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Food Redistribution Map</h1>
        <p className="text-muted-foreground">Visualize food donations, scarcity zones, and optimize delivery routes.</p>
      </div>

      <Tabs defaultValue="live" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="live">Live Donations</TabsTrigger>
          <TabsTrigger value="heatmap">Scarcity Heatmap</TabsTrigger>
          <TabsTrigger value="routes">Route Optimization</TabsTrigger>
        </TabsList>

        <TabsContent value="live" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Live Food Donation Map</CardTitle>
              <CardDescription>View all active food donations and their locations.</CardDescription>
            </CardHeader>
            <CardContent>
              <FoodMap />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="heatmap" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Food Scarcity Heatmap</CardTitle>
              <CardDescription>Visualize areas with high food need and donation activity.</CardDescription>
            </CardHeader>
            <CardContent>
              <HeatmapView />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="routes" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Route Optimization</CardTitle>
              <CardDescription>Find the most efficient routes for food pickup and delivery.</CardDescription>
            </CardHeader>
            <CardContent>
              <RouteOptimization />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
