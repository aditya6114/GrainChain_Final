import Link from "next/link"
import { Facebook, Instagram, Twitter } from "lucide-react"

export default function Footer() {
  return (
    <footer className="bg-background border-t">
      <div className="mx-auto max-w-7xl px-6 py-12 md:flex md:items-center md:justify-between lg:px-8">
        <div className="space-y-8 md:max-w-md">
          <div>
            <Link href="/" className="text-2xl font-bold text-primary">
              FoodChain
            </Link>
            <p className="mt-2 text-sm text-muted-foreground">
              Connecting surplus food to those in need. Join us in reducing food waste and fighting hunger.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Contact Us</h3>
            <p className="text-sm text-muted-foreground">123 Food Street, Hunger City, FC 12345</p>
            <p className="text-sm text-muted-foreground">Email: info@foodchain.org</p>
            <p className="text-sm text-muted-foreground">Phone: (123) 456-7890</p>
          </div>
        </div>

        <div className="mt-8 md:mt-0">
          <div className="grid grid-cols-2 gap-8 md:gap-16">
            <div>
              <h3 className="text-sm font-semibold">Platform</h3>
              <ul role="list" className="mt-4 space-y-2">
                <li>
                  <Link href="/donor" className="text-sm text-muted-foreground hover:text-primary">
                    For Donors
                  </Link>
                </li>
                <li>
                  <Link href="/recipient" className="text-sm text-muted-foreground hover:text-primary">
                    For Recipients
                  </Link>
                </li>
                <li>
                  <Link href="/volunteer" className="text-sm text-muted-foreground hover:text-primary">
                    For Volunteers
                  </Link>
                </li>
                <li>
                  <Link href="/map" className="text-sm text-muted-foreground hover:text-primary">
                    Food Map
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold">Company</h3>
              <ul role="list" className="mt-4 space-y-2">
                <li>
                  <Link href="/about" className="text-sm text-muted-foreground hover:text-primary">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href="/guidelines" className="text-sm text-muted-foreground hover:text-primary">
                    Guidelines
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="text-sm text-muted-foreground hover:text-primary">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="text-sm text-muted-foreground hover:text-primary">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl border-t border-border px-6 py-6 md:flex md:items-center md:justify-between lg:px-8">
        <div className="flex justify-center space-x-6 md:order-2">
          <Link href="#" className="text-muted-foreground hover:text-primary">
            <span className="sr-only">Facebook</span>
            <Facebook className="h-5 w-5" />
          </Link>
          <Link href="#" className="text-muted-foreground hover:text-primary">
            <span className="sr-only">Instagram</span>
            <Instagram className="h-5 w-5" />
          </Link>
          <Link href="#" className="text-muted-foreground hover:text-primary">
            <span className="sr-only">Twitter</span>
            <Twitter className="h-5 w-5" />
          </Link>
        </div>
        <div className="mt-4 md:order-1 md:mt-0">
          <p className="text-center text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} FoodChain. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
