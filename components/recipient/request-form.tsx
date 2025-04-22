"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"

export default function RequestForm() {
  const [requestType, setRequestType] = useState("specific")
  const [urgencyLevel, setUrgencyLevel] = useState([2])

  return (
    <div>
      <Tabs defaultValue="specific" onValueChange={setRequestType}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="specific">Request Specific Food</TabsTrigger>
          <TabsTrigger value="auto">Auto-Matching</TabsTrigger>
        </TabsList>

        <TabsContent value="specific" className="space-y-6 mt-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="food-id">Food Listing ID</Label>
              <Input id="food-id" placeholder="Enter the ID of the food listing" />
              <p className="text-sm text-muted-foreground mt-1">You can find the ID on the food listing card.</p>
            </div>

            <div>
              <Label htmlFor="quantity">Quantity Needed</Label>
              <Input id="quantity" type="number" min="1" placeholder="Enter the number of servings needed" />
            </div>

            <div>
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea id="notes" placeholder="Any special instructions or requirements" className="h-24" />
            </div>

            <div>
              <Label>Pickup or Delivery?</Label>
              <RadioGroup defaultValue="delivery" className="mt-2">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="pickup" id="pickup" />
                  <Label htmlFor="pickup">I can pick up</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="delivery" id="delivery" />
                  <Label htmlFor="delivery">I need delivery</Label>
                </div>
              </RadioGroup>
            </div>

            <Button className="w-full">Submit Request</Button>
          </div>
        </TabsContent>

        <TabsContent value="auto" className="space-y-6 mt-6">
          <Card>
            <CardContent className="pt-6">
              <p className="mb-4">
                Auto-matching will automatically match you with food donations based on your preferences and needs.
              </p>

              <div className="space-y-6">
                <div>
                  <Label htmlFor="organization">Organization Name</Label>
                  <Input id="organization" placeholder="Enter your organization name" />
                </div>

                <div>
                  <Label htmlFor="people">Number of People to Feed</Label>
                  <Input id="people" type="number" min="1" placeholder="How many people need food?" />
                </div>

                <div className="space-y-2">
                  <Label>Urgency Level ({urgencyLevel[0]}/5)</Label>
                  <Slider defaultValue={[2]} max={5} step={1} value={urgencyLevel} onValueChange={setUrgencyLevel} />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Low</span>
                    <span>Medium</span>
                    <span>High</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Dietary Restrictions</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="vegetarian" />
                      <Label htmlFor="vegetarian">Vegetarian</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="vegan" />
                      <Label htmlFor="vegan">Vegan</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="gluten-free" />
                      <Label htmlFor="gluten-free">Gluten-Free</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="nut-free" />
                      <Label htmlFor="nut-free">Nut-Free</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="dairy-free" />
                      <Label htmlFor="dairy-free">Dairy-Free</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="halal" />
                      <Label htmlFor="halal">Halal</Label>
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input id="location" placeholder="Enter your address" />
                </div>

                <div>
                  <Label htmlFor="max-distance">Maximum Distance (miles)</Label>
                  <Input id="max-distance" type="number" min="1" max="50" defaultValue="10" />
                </div>

                <div>
                  <Label>Pickup or Delivery?</Label>
                  <RadioGroup defaultValue="delivery" className="mt-2">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="pickup" id="auto-pickup" />
                      <Label htmlFor="auto-pickup">I can pick up</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="delivery" id="auto-delivery" />
                      <Label htmlFor="auto-delivery">I need delivery</Label>
                    </div>
                  </RadioGroup>
                </div>

                <Button className="w-full">Register for Auto-Matching</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
