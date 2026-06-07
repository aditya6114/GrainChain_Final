"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

// The landing page is a standalone HTML file at /landing.html (served from public/).
// We redirect to it immediately so it loads as the homepage.
export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    window.location.href = "/landing.html"
  }, [])

  return null
}
