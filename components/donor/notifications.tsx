"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Bell, Check, Clock, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

// Mock data for notifications
const initialNotifications = [
  {
    id: 1,
    type: "request",
    title: "New Recipient Request",
    message: "Community Food Bank has requested your pasta donation.",
    time: "10 minutes ago",
    read: false,
    actionable: true,
  },
  {
    id: 2,
    type: "confirmation",
    title: "Pickup Confirmed",
    message: "Your sandwich donation will be picked up tomorrow at 10:00 AM.",
    time: "1 hour ago",
    read: false,
    actionable: false,
  },
  {
    id: 3,
    type: "update",
    title: "Donation Delivered",
    message: "Your fruit platter donation has been delivered to Family Support Center.",
    time: "Yesterday",
    read: true,
    actionable: false,
  },
  {
    id: 4,
    type: "alert",
    title: "Pickup Delayed",
    message: "The pickup for your soup donation has been delayed by 30 minutes.",
    time: "2 days ago",
    read: true,
    actionable: false,
  },
]

export default function Notifications() {
  const [notifications, setNotifications] = useState(initialNotifications)

  const markAsRead = (id: number) => {
    setNotifications(
      notifications.map((notification) => (notification.id === id ? { ...notification, read: true } : notification)),
    )
  }

  const markAllAsRead = () => {
    setNotifications(notifications.map((notification) => ({ ...notification, read: true })))
  }

  const getIcon = (type: string) => {
    switch (type) {
      case "request":
        return <Bell className="h-5 w-5 text-blue-500" />
      case "confirmation":
        return <Check className="h-5 w-5 text-green-500" />
      case "update":
        return <Clock className="h-5 w-5 text-purple-500" />
      case "alert":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      default:
        return <Bell className="h-5 w-5" />
    }
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">Notifications</h3>
          {unreadCount > 0 && <Badge variant="secondary">{unreadCount} unread</Badge>}
        </div>
        {unreadCount > 0 && (
          <Button variant="ghost" size="sm" onClick={markAllAsRead}>
            Mark all as read
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {notifications.length > 0 ? (
          notifications.map((notification) => (
            <Card
              key={notification.id}
              className={cn("transition-colors", !notification.read && "bg-muted/50 border-l-4 border-primary")}
            >
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <div className="mt-1">{getIcon(notification.type)}</div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h4 className="font-semibold">{notification.title}</h4>
                      <span className="text-xs text-muted-foreground">{notification.time}</span>
                    </div>
                    <p className="text-sm mt-1">{notification.message}</p>
                    <div className="flex justify-end mt-2 gap-2">
                      {notification.actionable && (
                        <>
                          <Button size="sm" variant="outline">
                            Decline
                          </Button>
                          <Button size="sm">Accept</Button>
                        </>
                      )}
                      {!notification.read && (
                        <Button size="sm" variant="ghost" onClick={() => markAsRead(notification.id)}>
                          Mark as read
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No notifications at the moment.</p>
          </div>
        )}
      </div>
    </div>
  )
}
