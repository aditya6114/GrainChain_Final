"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Info, Download } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export default function HeatmapView() {
  const [timeframe, setTimeframe] = useState("week")
  const [dataType, setDataType] = useState("need")

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="w-full sm:w-40">
            <Select value={timeframe} onValueChange={setTimeframe}>
              <SelectTrigger>
                <SelectValue placeholder="Timeframe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Last 24 Hours</SelectItem>
                <SelectItem value="week">Last 7 Days</SelectItem>
                <SelectItem value="month">Last 30 Days</SelectItem>
                <SelectItem value="year">Last Year</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="w-full sm:w-40">
            <Select value={dataType} onValueChange={setDataType}>
              <SelectTrigger>
                <SelectValue placeholder="Data Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="need">Food Need</SelectItem>
                <SelectItem value="donation">Donation Activity</SelectItem>
                <SelectItem value="gap">Need-Donation Gap</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Export Data
        </Button>
      </div>

      <div className="aspect-[4/3] bg-muted rounded-md flex items-center justify-center">
        <p className="text-muted-foreground">Heatmap visualization will be displayed here</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <h3 className="font-semibold">High Need Areas</h3>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <Info className="h-4 w-4" />
                      <span className="sr-only">Info</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Areas with the highest food insecurity</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between items-center">
                <span>Downtown</span>
                <Badge variant="outline" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                  Very High
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>Westside</span>
                <Badge variant="outline" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                  High
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>Northend</span>
                <Badge
                  variant="outline"
                  className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                >
                  Medium
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <h3 className="font-semibold">High Donation Areas</h3>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <Info className="h-4 w-4" />
                      <span className="sr-only">Info</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Areas with the most food donations</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between items-center">
                <span>Uptown</span>
                <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  Very High
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>Eastside</span>
                <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  High
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>Midtown</span>
                <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  High
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <h3 className="font-semibold">Largest Gaps</h3>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <Info className="h-4 w-4" />
                      <span className="sr-only">Info</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Areas with the biggest difference between need and donations</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between items-center">
                <span>Downtown</span>
                <Badge variant="outline" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                  Critical
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>Westside</span>
                <Badge variant="outline" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                  Severe
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>Southend</span>
                <Badge
                  variant="outline"
                  className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                >
                  Moderate
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="p-4 bg-muted rounded-md">
        <h3 className="font-semibold mb-2">Insights</h3>
        <ul className="space-y-2 text-sm">
          <li>• Downtown and Westside areas show the highest need for food donations.</li>
          <li>• Uptown and Eastside have the most active donors.</li>
          <li>• The largest gaps between need and donations are in Downtown and Westside.</li>
          <li>• Overall donation activity has increased by 15% compared to the previous period.</li>
        </ul>
      </div>
    </div>
  )
}
