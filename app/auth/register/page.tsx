"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { authApi } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!role) { setError("Please select a role"); return }
    setError("")
    setLoading(true)
    try {
      const data = await authApi.register({ email, password, name, role })
      const userRole = data.user?.role || role
      if (userRole === "donor") router.push("/donor")
      else if (userRole === "recipient") router.push("/recipient")
      else if (userRole === "volunteer") router.push("/volunteer")
      else router.push("/")
    } catch (err: any) {
      setError(err.message || "Registration failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-5 bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-[#1E3D2F]">Create Account</CardTitle>
          <CardDescription>Join GrainChain and make a difference</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 6 characters" />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger><SelectValue placeholder="Select your role" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="donor">Donor</SelectItem>
                  <SelectItem value="recipient">Recipient</SelectItem>
                  <SelectItem value="volunteer">Volunteer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" disabled={loading} className="w-full bg-[#1E3D2F] hover:bg-[#2a5740] text-white">
              {loading ? "Creating account..." : "Register"}
            </Button>
          </form>
          <p className="text-sm text-center mt-4 text-muted-foreground">
            Already have an account?{" "}
            <Link href="/auth/login" className="text-[#C8603A] hover:underline font-medium">Sign in</Link>
          </p>
        </CardContent>
      </Card>
      <Link href="/" className="text-sm text-muted-foreground hover:text-[#1E3D2F] hover:underline">← Back to home</Link>
    </div>
  )
}
