"use client"
import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { fetcher } from "@/lib/api"

export default function ConnectionsPage() {
  const [connections, setConnections] = useState<any[]>([])
  const [name, setName] = useState("")
  const [dbType, setDbType] = useState("postgres")
  const [connStr, setConnStr] = useState("")
  
  useEffect(() => {
      const projectId = localStorage.getItem("project_id")
      if (!projectId) return;
      
      // For POC, simulate fetching or handle auth bypass
      fetcher("/connections/").then(setConnections).catch(console.error)
  }, [])

  const handleAdd = async (e: React.FormEvent) => {
      e.preventDefault()
      if (!localStorage.getItem("project_id")) {
          alert("Please create or select a project first.");
          return;
      }
      try {
          const newConn = await fetcher("/connections/", {
              method: "POST",
              body: JSON.stringify({
                  name,
                  db_type: dbType,
                  connection_string: connStr
              })
          })
          setConnections([...connections, newConn])
          setName("")
          setConnStr("")
      } catch (err: any) {
          alert(err.message)
      }
  }

  const handleTest = async (id: string) => {
      try {
          const res = await fetcher(`/connections/${id}/test`, { method: "POST" });
          if (res.success) {
              alert("Connection successful!");
          }
      } catch (err: any) {
          alert(`Connection failed: ${err.message}`);
      }
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-50 p-6 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="py-4 border-b border-neutral-800">
          <h1 className="text-2xl font-bold tracking-tight text-white">Database Connections</h1>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
          <Card className="bg-neutral-900 border-neutral-800 text-neutral-50">
            <CardHeader><CardTitle>Add Connection</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleAdd} className="space-y-4">
                  <div>
                      <Label>Connection Name</Label>
                      <Input value={name} onChange={e => setName(e.target.value)} className="bg-neutral-800 border-neutral-700 mt-1" required />
                  </div>
                  <div>
                      <Label>Database Type</Label>
                      <select value={dbType} onChange={e => setDbType(e.target.value)} className="w-full bg-neutral-800 border border-neutral-700 rounded-md p-2 mt-1">
                          <option value="postgres">PostgreSQL</option>
                          <option value="mysql">MySQL</option>
                          <option value="sqlite">SQLite</option>
                          <option value="mongodb">MongoDB</option>
                      </select>
                  </div>
                  <div>
                      <Label>Connection String</Label>
                      <Input value={connStr} onChange={e => setConnStr(e.target.value)} className="bg-neutral-800 border-neutral-700 mt-1" required placeholder="postgres://user:pass@localhost:5432/db" />
                  </div>
                  <Button type="submit" className="w-full">Save Connection</Button>
              </form>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Active Connections</h2>
            {connections.length === 0 ? (
                <p className="text-neutral-500">No connections configured yet.</p>
            ) : (
                connections.map(c => (
                    <Card key={c.id} className="bg-neutral-900 border-neutral-800 text-neutral-50">
                        <CardContent className="p-4 flex justify-between items-center">
                            <div>
                                <h3 className="font-semibold">{c.name}</h3>
                                <p className="text-sm text-neutral-400 uppercase">{c.db_type}</p>
                            </div>
                            <Button 
                                variant="outline" 
                                className="border-neutral-700 bg-transparent text-white hover:bg-neutral-800"
                                onClick={() => handleTest(c.id)}
                            >
                                Test
                            </Button>
                        </CardContent>
                    </Card>
                ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
