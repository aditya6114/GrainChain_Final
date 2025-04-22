"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Car, Truck, Bike, Calendar } from "lucide-react"

export default function VolunteerSignup() {
  const [step, setStep] = useState(1)

  const nextStep = () => {
    setStep(step + 1)
  }

  const prevStep = () => {
    setStep(step - 1)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between mb-6">
        <div className={`flex-1 pb-2 text-center border-b-2 ${step >= 1 ? "border-primary" : "border-muted"}`}>
          <span
            className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${
              step >= 1 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}
          >
            1
          </span>
          <p className={`mt-1 text-sm ${step >= 1 ? "" : "text-muted-foreground"}`}>Personal Info</p>
        </div>
        <div className={`flex-1 pb-2 text-center border-b-2 ${step >= 2 ? "border-primary" : "border-muted"}`}>
          <span
            className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${
              step >= 2 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}
          >
            2
          </span>
          <p className={`mt-1 text-sm ${step >= 2 ? "" : "text-muted-foreground"}`}>Transportation</p>
        </div>
        <div className={`flex-1 pb-2 text-center border-b-2 ${step >= 3 ? "border-primary" : "border-muted"}`}>
          <span
            className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${
              step >= 3 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}
          >
            3
          </span>
          <p className={`mt-1 text-sm ${step >= 3 ? "" : "text-muted-foreground"}`}>Availability</p>
        </div>
      </div>

      {step === 1 && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="first-name">First Name</Label>
              <Input id="first-name" placeholder="Enter your first name" required />
            </div>
            <div>
              <Label htmlFor="last-name">Last Name</Label>
              <Input id="last-name" placeholder="Enter your last name" required />
            </div>
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="Enter your email" required />
          </div>

          <div>
            <Label htmlFor="phone">Phone Number</Label>
            <Input id="phone" type="tel" placeholder="Enter your phone number" required />
          </div>

          <div>
            <Label htmlFor="address">Address</Label>
            <Input id="address" placeholder="Enter your address" required />
          </div>

          <div>
            <Label htmlFor="bio">About You</Label>
            <Textarea
              id="bio"
              placeholder="Tell us a bit about yourself and why you want to volunteer"
              className="h-24"
            />
          </div>

          <Button onClick={nextStep} className="w-full">
            Next: Transportation
          </Button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div>
            <Label>Do you have access to a vehicle?</Label>
            <RadioGroup defaultValue="yes" className="mt-2">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes" id="vehicle-yes" />
                <Label htmlFor="vehicle-yes">Yes</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id="vehicle-no" />
                <Label htmlFor="vehicle-no">No</Label>
              </div>
            </RadioGroup>
          </div>

          <div>
            <Label>Vehicle Type</Label>
            <RadioGroup defaultValue="car" className="mt-2">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="car" id="car" />
                <Label htmlFor="car" className="flex items-center">
                  <Car className="h-4 w-4 mr-2" />
                  Car
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="bike" id="bike" />
                <Label htmlFor="bike" className="flex items-center">
                  <Bike className="h-4 w-4 mr-2" />
                  Bike
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="truck" id="truck" />
                <Label htmlFor="truck" className="flex items-center">
                  <Truck className="h-4 w-4 mr-2" />
                  Truck
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div>
            <Label htmlFor="vehicle-details">Vehicle Details</Label>
            <Input id="vehicle-details" placeholder="e.g., Toyota Prius, Blue" />
            <p className="text-sm text-muted-foreground mt-1">
              This helps recipients identify you during pickups and deliveries.
            </p>
          </div>

          <div>
            <Label htmlFor="max-distance">Maximum Travel Distance (miles)</Label>
            <Input id="max-distance" type="number" min="1" max="50" defaultValue="10" />
          </div>

          <div>
            <Label htmlFor="max-weight">Maximum Weight You Can Carry (lbs)</Label>
            <Input id="max-weight" type="number" min="1" max="200" defaultValue="50" />
          </div>

          <div className="flex justify-between">
            <Button variant="outline" onClick={prevStep}>
              Back
            </Button>
            <Button onClick={nextStep}>Next: Availability</Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <div>
            <Label>Availability</Label>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div className="space-y-2">
                <Label className="text-sm">Days</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="monday" />
                    <Label htmlFor="monday">Monday</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="tuesday" />
                    <Label htmlFor="tuesday">Tuesday</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="wednesday" />
                    <Label htmlFor="wednesday">Wednesday</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="thursday" />
                    <Label htmlFor="thursday">Thursday</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="friday" />
                    <Label htmlFor="friday">Friday</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="saturday" />
                    <Label htmlFor="saturday">Saturday</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="sunday" />
                    <Label htmlFor="sunday">Sunday</Label>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Time Slots</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="morning" />
                    <Label htmlFor="morning">Morning (8AM - 12PM)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="afternoon" />
                    <Label htmlFor="afternoon">Afternoon (12PM - 5PM)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="evening" />
                    <Label htmlFor="evening">Evening (5PM - 9PM)</Label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <Label>How often can you volunteer?</Label>
            <Select defaultValue="weekly">
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="biweekly">Bi-weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="occasionally">Occasionally</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="start-date">When can you start?</Label>
            <div className="flex gap-2 mt-1">
              <Input id="start-date" type="date" defaultValue={new Date().toISOString().split("T")[0]} />
              <Button variant="outline" size="icon">
                <Calendar className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex items-start space-x-2 mt-6">
            <Checkbox id="terms" />
            <div className="grid gap-1.5 leading-none">
              <Label
                htmlFor="terms"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                I agree to the terms and conditions
              </Label>
              <p className="text-sm text-muted-foreground">
                By checking this box, you agree to our{" "}
                <a href="#" className="text-primary hover:underline">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="#" className="text-primary hover:underline">
                  Privacy Policy
                </a>
                .
              </p>
            </div>
          </div>

          <div className="flex justify-between">
            <Button variant="outline" onClick={prevStep}>
              Back
            </Button>
            <Button type="submit">Complete Registration</Button>
          </div>
        </div>
      )}
    </div>
  )
}
