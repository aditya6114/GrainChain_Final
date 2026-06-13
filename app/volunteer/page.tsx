"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { getUser, authApi, volunteerApi } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"

export default function VolunteerPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)

  const [available, setAvailable] = useState<any[]>([])
  const [myTasks, setMyTasks] = useState<any[]>([])
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const u = getUser()
    if (!u || u.role !== "volunteer") { router.push("/auth/login"); return }
    setUser(u)
    loadAvailable()
  }, [router])

  async function loadAvailable() {
    setError("")
    setLoading(true)
    try {
      const data = await volunteerApi.getAvailableTasks()
      setAvailable(data)
    } catch (err: any) {
      setError(err.message || "Failed to load tasks")
    } finally {
      setLoading(false)
    }
  }

  async function loadMyTasks() {
    setError("")
    setLoading(true)
    try {
      const data = await volunteerApi.getMyTasks()
      setMyTasks(data)
    } catch (err: any) {
      setError(err.message || "Failed to load tasks")
    } finally {
      setLoading(false)
    }
  }

  async function handlePickup(taskId: string) {
    try {
      await volunteerApi.pickup(taskId)
      loadAvailable()
    } catch (err: any) {
      setError(err.message)
    }
  }

  async function handleDeliver(taskId: string) {
    try {
      await volunteerApi.deliver(taskId)
      loadMyTasks()
    } catch (err: any) {
      setError(err.message)
    }
  }

  function handleLogout() {
    authApi.logout()
    router.push("/auth/login")
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-background">
      <nav className="bg-[#1E3D2F] text-white px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-xl font-bold hover:opacity-80">GrainChain</Link>
          <span className="text-sm opacity-80">Volunteer Dashboard</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/" className="text-sm hover:underline">Home</Link>
          <Button variant="outline" size="sm" className="text-white border-white hover:bg-white/10" onClick={handleLogout}>Logout</Button>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto p-6">
        {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

        <Tabs defaultValue="available" onValueChange={(v) => { if (v === "mytasks") loadMyTasks() }}>
          <TabsList className="mb-4">
            <TabsTrigger value="available">Available Tasks</TabsTrigger>
            <TabsTrigger value="mytasks">My Tasks</TabsTrigger>
          </TabsList>

          <TabsContent value="available">
            {loading && <p className="text-sm text-muted-foreground">Loading...</p>}
            <div className="space-y-3">
              {available.map((t: any) => (
                <Card key={t.id}>
                  <CardContent className="pt-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium">Task {t.id?.slice(0, 8)}...</p>
                      <p className="text-sm text-muted-foreground">Claim: {t.claim_id?.slice(0, 8)}...</p>
                      <p className="text-xs text-muted-foreground">Created: {new Date(t.created_at).toLocaleString()}</p>
                      <Badge variant="secondary" className="mt-1">{t.status}</Badge>
                    </div>
                    <Button size="sm" className="bg-[#C8603A] hover:bg-[#b0502e] text-white" onClick={() => handlePickup(t.id)}>Pick Up</Button>
                  </CardContent>
                </Card>
              ))}
              {available.length === 0 && !loading && (
                <p className="text-center text-muted-foreground py-8">No available tasks right now.</p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="mytasks">
            {loading && <p className="text-sm text-muted-foreground">Loading...</p>}
            <div className="space-y-3">
              {myTasks.map((t: any) => (
                <Card key={t.id}>
                  <CardContent className="pt-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium">Task {t.id?.slice(0, 8)}...</p>
                      <Badge variant={t.status === "delivered" ? "default" : "secondary"} className="mt-1">{t.status}</Badge>
                      {t.delivered_at && (
                        <p className="text-xs text-muted-foreground mt-1">Delivered: {new Date(t.delivered_at).toLocaleString()}</p>
                      )}
                    </div>
                    {t.status === "in_progress" && (
                      <Button size="sm" className="bg-[#1E3D2F] hover:bg-[#2a5740] text-white" onClick={() => handleDeliver(t.id)}>Mark Delivered</Button>
                    )}
                  </CardContent>
                </Card>
              ))}
              {myTasks.length === 0 && !loading && (
                <p className="text-center text-muted-foreground py-8">No tasks assigned yet.</p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
