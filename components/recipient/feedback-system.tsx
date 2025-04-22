"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "lucide-react"
import { cn } from "@/lib/utils"

// Mock data for completed deliveries
const completedDeliveries = [
  {
    id: 1,
    foodName: "Soup and Bread",
    quantity: "20 servings",
    donor: "Community Kitchen",
    deliveryDate: "Yesterday, 3:00 PM",
    feedbackSubmitted: false,
  },
  {
    id: 2,
    foodName: "Rice and Curry",
    quantity: "25 servings",
    donor: "Spice House",
    deliveryDate: "3 days ago",
    feedbackSubmitted: true,
    rating: 5,
    feedback: "The food was excellent and arrived in perfect condition. Thank you!",
  },
  {
    id: 3,
    foodName: "Baked Goods",
    quantity: "30 items",
    donor: "Sweet Bakery",
    deliveryDate: "Last week",
    feedbackSubmitted: true,
    rating: 4,
    feedback: "Great quality baked goods. Some items were slightly crushed during delivery.",
  },
]

export default function FeedbackSystem() {
  const [activeDelivery, setActiveDelivery] = useState<number | null>(null)
  const [rating, setRating] = useState<number>(0)
  const [feedback, setFeedback] = useState<string>("")

  const handleSubmit = (id: number) => {
    // In a real app, this would submit to the backend
    console.log(`Submitting feedback for delivery ${id}:`, { rating, feedback })
    setActiveDelivery(null)
    setRating(0)
    setFeedback("")
  }

  return (
    <div className="space-y-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">Recent Deliveries</h3>
        <p className="text-muted-foreground">
          Please provide feedback on your recent food deliveries. Your feedback helps improve our service.
        </p>
      </div>

      <div className="space-y-4">
        {completedDeliveries.map((delivery) => (
          <Card key={delivery.id}>
            <CardContent className="p-6">
              <div className="flex flex-col space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold">{delivery.foodName}</h3>
                    <p className="text-muted-foreground">
                      {delivery.quantity} from {delivery.donor}
                    </p>
                    <div className="flex items-center text-sm text-muted-foreground mt-1">
                      <Calendar className="h-4 w-4 mr-1" />
                      {delivery.deliveryDate}
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      delivery.feedbackSubmitted
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                        : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
                    )}
                  >
                    {delivery.feedbackSubmitted ? "Feedback Submitted" : "Feedback Needed"}
                  </Badge>
                </div>

                {delivery.feedbackSubmitted ? (
                  <div className="bg-muted p-4 rounded-md">
                    <div className="flex items-center mb-2">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <svg
                            key={star}
                            className={cn(
                              "w-5 h-5",
                              star <= (delivery.rating || 0)
                                ? "text-yellow-500 fill-yellow-500"
                                : "text-gray-300 fill-gray-300",
                            )}
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                          >
                            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                          </svg>
                        ))}
                      </div>
                      <span className="ml-2 font-medium">{delivery.rating}/5</span>
                    </div>
                    <p className="text-sm italic">"{delivery.feedback}"</p>
                  </div>
                ) : activeDelivery === delivery.id ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Rate your experience (1-5 stars)</label>
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setRating(star)}
                            className="focus:outline-none"
                          >
                            <svg
                              className={cn(
                                "w-8 h-8",
                                star <= rating ? "text-yellow-500 fill-yellow-500" : "text-gray-300 fill-gray-300",
                              )}
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                            >
                              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                            </svg>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Your Feedback</label>
                      <Textarea
                        placeholder="Please share your experience with this food donation..."
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        className="h-24"
                      />
                    </div>

                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" onClick={() => setActiveDelivery(null)}>
                        Cancel
                      </Button>
                      <Button onClick={() => handleSubmit(delivery.id)} disabled={rating === 0}>
                        Submit Feedback
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button onClick={() => setActiveDelivery(delivery.id)} className="w-full sm:w-auto">
                    Provide Feedback
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
