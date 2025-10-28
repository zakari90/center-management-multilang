"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function ResponsiveTest() {
  return (
    <div className="space-y-6 p-4">
      <h2 className="text-2xl font-bold">Responsive Design Test</h2>
      
      {/* Grid Test */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Mobile First</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">1</p>
            <p className="text-xs text-muted-foreground">Column on mobile</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Small Screens</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">2</p>
            <p className="text-xs text-muted-foreground">Columns on sm+</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Large Screens</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">4</p>
            <p className="text-xs text-muted-foreground">Columns on lg+</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Responsive</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">✓</p>
            <p className="text-xs text-muted-foreground">Working well</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Button Test */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Button className="btn-mobile">Mobile Button</Button>
        <Button variant="outline" className="btn-mobile">Secondary</Button>
        <Button variant="secondary" className="btn-mobile">Tertiary</Button>
      </div>
      
      {/* Badge Test */}
      <div className="flex flex-wrap gap-2">
        <Badge>Default</Badge>
        <Badge variant="secondary">Secondary</Badge>
        <Badge variant="outline">Outline</Badge>
        <Badge variant="destructive">Destructive</Badge>
      </div>
      
      {/* Table Test */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-50">
              <th className="border border-gray-300 p-2 text-left">Name</th>
              <th className="border border-gray-300 p-2 text-left hidden sm:table-cell">Email</th>
              <th className="border border-gray-300 p-2 text-left">Role</th>
              <th className="border border-gray-300 p-2 text-left hidden lg:table-cell">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-gray-300 p-2">John Doe</td>
              <td className="border border-gray-300 p-2 hidden sm:table-cell">john@example.com</td>
              <td className="border border-gray-300 p-2">Admin</td>
              <td className="border border-gray-300 p-2 hidden lg:table-cell">Active</td>
            </tr>
            <tr>
              <td className="border border-gray-300 p-2">Jane Smith</td>
              <td className="border border-gray-300 p-2 hidden sm:table-cell">jane@example.com</td>
              <td className="border border-gray-300 p-2">Manager</td>
              <td className="border border-gray-300 p-2 hidden lg:table-cell">Active</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
