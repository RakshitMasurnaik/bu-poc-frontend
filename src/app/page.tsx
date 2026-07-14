"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { fetcher } from "@/lib/api"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function Home() {
  const [connections, setConnections] = useState([])
  const [schemas, setSchemas] = useState([])
  const [chartData, setChartData] = useState<any[]>([])

  useEffect(() => {
    const projectId = localStorage.getItem("project_id");
    if (!projectId) return;

    fetcher("/connections/").then(setConnections).catch(console.error)
    fetcher("/schemas/").then(setSchemas).catch(console.error)
    fetcher("/schemas/validation-history").then((data) => {
        if (!data || data.length === 0) return;
        const formatted = data.map((run: any) => {
            const d = new Date(run.created_at);
            return {
                name: `${d.getMonth()+1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`,
                compliance: parseFloat(run.compliance_score)
            }
        })
        setChartData(formatted)
    }).catch(console.error)
  }, [])

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-50 p-6 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <header className="flex justify-between items-center py-4 border-b border-neutral-800">
          <h1 className="text-2xl font-bold tracking-tight text-white">Dashboard</h1>
          <nav className="flex gap-4">
            <Link href="/connections"><Button className="bg-white text-black hover:bg-neutral-200">Connect Database</Button></Link>
          </nav>
        </header>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pt-4">
          
          {/* Main Chart/Map Area (Span 3 cols) */}
          <Card className="col-span-1 md:col-span-3 bg-neutral-900 border-neutral-800 text-neutral-50 shadow-xl overflow-hidden">
            <CardHeader className="bg-neutral-900 z-10 relative pb-2 border-b border-neutral-800">
              <CardTitle>Validation Compliance Over Time</CardTitle>
            </CardHeader>
            <CardContent className="h-72 p-0 bg-neutral-950 relative">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData.length > 0 ? chartData : [{name: 'No Data', compliance: 0}]} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorCompliance" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                        <XAxis dataKey="name" stroke="#525252" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#525252" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} tickFormatter={(val) => `${val}%`} />
                        <Tooltip 
                            contentStyle={{ backgroundColor: '#171717', borderColor: '#262626', color: '#fff', borderRadius: '8px' }}
                            itemStyle={{ color: '#10b981' }}
                        />
                        <Area type="monotone" dataKey="compliance" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorCompliance)" />
                    </AreaChart>
                </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Side Stats */}
          <div className="col-span-1 md:col-span-1 flex flex-col gap-6">
            <Card className="bg-neutral-900 border-neutral-800 text-neutral-50 shadow-lg flex-1">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-neutral-400 uppercase tracking-wider">Total Connections</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-5xl font-bold text-white bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">{connections.length}</div>
              </CardContent>
            </Card>
            <Card className="bg-neutral-900 border-neutral-800 text-neutral-50 shadow-lg flex-1">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-neutral-400 uppercase tracking-wider">Active Schemas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-5xl font-bold text-white bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">{schemas.length}</div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Connections */}
          <Card className="col-span-1 md:col-span-2 bg-neutral-900 border-neutral-800 text-neutral-50 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent Connections</CardTitle>
              <Link href="/connections"><Button variant="ghost" size="sm" className="text-xs">View All</Button></Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {connections.length === 0 ? (
                    <p className="text-neutral-500 text-sm">No connections added yet.</p>
                ) : (
                    connections.slice(0, 3).map((c: any) => (
                      <div key={c.id} className="group flex justify-between items-center p-4 rounded-xl bg-neutral-800/30 border border-neutral-700/50 hover:bg-neutral-800/80 transition-all duration-300">
                        <div className="flex items-center gap-4">
                          <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                          <div className="flex flex-col">
                            <span className="font-semibold text-white">{c.name}</span>
                            <span className="text-xs text-neutral-500 uppercase">{c.db_type}</span>
                          </div>
                        </div>
                        <Link href="/connections">
                          <Button variant="outline" size="sm" className="border-neutral-700 bg-transparent text-white hover:bg-white hover:text-black transition-colors">Test</Button>
                        </Link>
                      </div>
                    ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="col-span-1 md:col-span-2 bg-neutral-900 border-neutral-800 text-neutral-50 shadow-lg">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <Link href="/schemas" className="contents">
                  <Button variant="secondary" className="h-32 flex flex-col justify-center items-center gap-3 bg-neutral-800/50 hover:bg-neutral-700 text-white border border-neutral-700 rounded-xl transition-all hover:scale-[1.02]">
                    <span className="text-3xl font-light">+</span>
                    <span className="font-medium">New Schema</span>
                  </Button>
              </Link>
              <Link href="/schemas" className="contents">
                  <Button variant="secondary" className="h-32 flex flex-col justify-center items-center gap-3 bg-neutral-800/50 hover:bg-neutral-700 text-white border border-neutral-700 rounded-xl transition-all hover:scale-[1.02]">
                    <span className="text-3xl font-light">↻</span>
                    <span className="font-medium">Run Validation</span>
                  </Button>
              </Link>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  )
}
