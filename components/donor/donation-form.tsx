"use client"

import type React from "react"

import { useState } from "react"
import { Calendar } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function DonationForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false)
      // Reset form or show success message
      setImagePreview(null)
      alert("Donation listed successfully!")
    }, 1500)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>List Food Donation</CardTitle>
        <CardDescription>
          Provide details about the food you want to donate. All fields marked with * are required.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-6">
            <div className="grid gap-3">
              <Label htmlFor="food-name">Food Name *</Label>
              <Input id="food-name" placeholder="e.g., Vegetable Curry, Sandwiches" required />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="grid gap-3">
                <Label htmlFor="quantity">Quantity *</Label>
                <div className="flex">
                  <Input id="quantity" type="number" min="1" placeholder="e.g., 10" required />
                  <Select defaultValue="servings">
                    <SelectTrigger className="w-[120px] ml-2">
                      <SelectValue placeholder="Unit" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="servings">Servings</SelectItem>
                      <SelectItem value="kg">Kilograms</SelectItem>
                      <SelectItem value="boxes">Boxes</SelectItem>
                      <SelectItem value="items">Items</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid gap-3">
                <Label htmlFor="expiry-date">Expiry Date *</Label>
                <div className="relative">
                  <Input id="expiry-date" type="date" required />
                  <Calendar className="absolute right-3 top-2.5 h-5 w-5 text-muted-foreground" />
                </div>
              </div>
            </div>
            
            <div className="grid gap-3">
              <Label>Food Category *</Label>
              <RadioGroup defaultValue="perishable" className="flex flex-col space-y-1">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="perishable" id="perishable" />
                  <Label htmlFor="perishable" className="font-normal">Perishable</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="non-perishable" id="non-perishable" />
                  <Label htmlFor="non-perishable" className="font-normal">Non-Perishable</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="grid gap-3">
              <Label htmlFor="image-upload">Upload Image</Label>
              <Input id="image-upload" type="file" accept="image/*" onChange={handleImageChange} />
              {imagePreview && (
                <div className="mt-2">
                  <img src={imagePreview} alt="Preview" className="h-32 w-32 object-cover rounded-md" />
                </div>
              )}
            </div>
          </div>

          <button
            type="submit"
            className={`mt-4 px-4 py-2 text-white bg-blue-500 rounded-md ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""}`}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Submitting..." : "Submit"}
          </button>
        </form>
      </CardContent>
    </Card>
  )
}