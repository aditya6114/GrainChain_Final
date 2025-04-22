import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Heart, Truck, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src="/placeholder.svg?height=1080&width=1920"
            alt="Food donation"
            fill
            className="object-cover brightness-50"
            priority
          />
        </div>
        <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">Connecting Surplus Food to Those in Need</h1>
          <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-3xl mx-auto">
            Join our mission to reduce food waste and fight hunger in communities around the world.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/donor">
              <Button size="lg" className="w-full sm:w-auto">
                Donate Food
              </Button>
            </Link>
            <Link href="/recipient">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto bg-background/20 hover:bg-background/30 text-white border-white/30"
              >
                Request Food
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 md:py-24 bg-muted/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How FoodChain Works</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Our platform makes it easy to donate surplus food and connect with those who need it most.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="bg-background border-2 border-primary/10">
              <CardContent className="pt-6">
                <div className="rounded-full bg-primary/10 p-3 w-12 h-12 flex items-center justify-center mb-4">
                  <Heart className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">1. List Your Donation</h3>
                <p className="text-muted-foreground">
                  Restaurants, event organizers, and households can easily list their surplus food with details about
                  quantity and expiry.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-background border-2 border-primary/10">
              <CardContent className="pt-6">
                <div className="rounded-full bg-primary/10 p-3 w-12 h-12 flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">2. AI-Powered Matching</h3>
                <p className="text-muted-foreground">
                  Our intelligent system matches donations with nearby recipients based on need, location, and food
                  type.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-background border-2 border-primary/10">
              <CardContent className="pt-6">
                <div className="rounded-full bg-primary/10 p-3 w-12 h-12 flex items-center justify-center mb-4">
                  <Truck className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">3. Pickup & Delivery</h3>
                <p className="text-muted-foreground">
                  Volunteers help transport food from donors to recipients, with real-time tracking for complete
                  transparency.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Impact Metrics */}
      <section className="py-16 md:py-24 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Our Impact</h2>
            <p className="text-lg text-primary-foreground/80 max-w-2xl mx-auto">
              Together, we're making a difference in communities worldwide.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 text-center">
            <div>
              <p className="text-5xl font-bold mb-2">250K+</p>
              <p className="text-xl">Meals Donated</p>
            </div>
            <div>
              <p className="text-5xl font-bold mb-2">5,000+</p>
              <p className="text-xl">Active Donors</p>
            </div>
            <div>
              <p className="text-5xl font-bold mb-2">120K+</p>
              <p className="text-xl">CO₂ Emissions Saved</p>
            </div>
          </div>
        </div>
      </section>

      {/* Success Stories */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Success Stories</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Hear from the people who have experienced the impact of FoodChain.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center mb-4">
                  <div className="rounded-full bg-muted w-12 h-12 mr-4"></div>
                  <div>
                    <h3 className="font-semibold">Sarah Johnson</h3>
                    <p className="text-sm text-muted-foreground">Restaurant Owner</p>
                  </div>
                </div>
                <p className="text-muted-foreground">
                  "FoodChain has transformed how we handle surplus food. Instead of throwing away perfectly good meals
                  at the end of the day, we can now ensure they reach people who need them. The platform is incredibly
                  easy to use, and the volunteers are amazing."
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center mb-4">
                  <div className="rounded-full bg-muted w-12 h-12 mr-4"></div>
                  <div>
                    <h3 className="font-semibold">Michael Rodriguez</h3>
                    <p className="text-sm text-muted-foreground">Food Bank Coordinator</p>
                  </div>
                </div>
                <p className="text-muted-foreground">
                  "The real-time notifications and tracking system have revolutionized our operations. We can now
                  respond quickly to available donations and serve more people in our community. FoodChain has become an
                  essential tool in our fight against hunger."
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-12">
            <Link href="/about">
              <Button variant="outline" className="group">
                Read More Stories
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-muted">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Join the FoodChain Movement</h2>
            <p className="text-lg text-muted-foreground mb-8">
              Whether you're a restaurant with surplus food, an organization helping those in need, or an individual
              wanting to volunteer, there's a place for you in our community.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/auth/register">
                <Button size="lg" className="w-full sm:w-auto">
                  Sign Up Now
                </Button>
              </Link>
              <Link href="/volunteer">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  Become a Volunteer
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
