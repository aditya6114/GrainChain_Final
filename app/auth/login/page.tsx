"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { authApi } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const data = await authApi.login({ email, password })
      const role = data.user?.role
      if (role === "donor") router.push("/donor")
      else if (role === "recipient") router.push("/recipient")
      else if (role === "volunteer") router.push("/volunteer")
      else router.push("/")
    } catch (err: any) {
      setError(err.message || "Login failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-5 bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-[#1E3D2F]">Welcome Back</CardTitle>
          <CardDescription>Sign in to your GrainChain account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Your password" />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" disabled={loading} className="w-full bg-[#1E3D2F] hover:bg-[#2a5740] text-white">
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
          <p className="text-sm text-center mt-4 text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/auth/register" className="text-[#C8603A] hover:underline font-medium">Register</Link>
          </p>
        </CardContent>
      </Card>
      <Link href="/" className="text-sm text-muted-foreground hover:text-[#1E3D2F] hover:underline">← Back to home</Link>
    </div>
  )
}
