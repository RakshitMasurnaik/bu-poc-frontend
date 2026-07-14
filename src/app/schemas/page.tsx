"use client"
import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { fetcher } from "@/lib/api"

export default function SchemasPage() {
  // Logical Schema State
  const [name, setName] = useState("")
  const [fields, setFields] = useState([{ name: "", type: "String" }])
  
  // Mapping State
  const [connections, setConnections] = useState<any[]>([])
  const [selectedConnection, setSelectedConnection] = useState("")
  
  const [dbSchema, setDbSchema] = useState<any>({})
  const [targetName, setTargetName] = useState("")
  const [dataPreview, setDataPreview] = useState<any[]>([])
  
  const [fieldMappings, setFieldMappings] = useState<any>({})
  
  // Existing Schemas
  const [savedSchemas, setSavedSchemas] = useState<any[]>([])
  
  const loadConnections = async () => {
    const projectId = localStorage.getItem("project_id");
    if (!projectId) return;
    try {
        const conns = await fetcher("/connections/")
        setConnections(conns)
    } catch (e) { console.error(e) }
  }

  const loadSavedSchemas = async () => {
    const projectId = localStorage.getItem("project_id");
    if (!projectId) return;
    try {
        const schemas = await fetcher("/schemas/")
        setSavedSchemas(schemas)
    } catch (e) { console.error(e) }
  }

  useEffect(() => {
    loadConnections()
    loadSavedSchemas()
  }, [])

  // Fetch DB Schema when connection changes
  useEffect(() => {
      if (selectedConnection) {
          fetcher(`/connections/${selectedConnection}/schema`).then((data) => {
              setDbSchema(data.schema || {})
              setTargetName("")
              setDataPreview([])
              setFieldMappings({})
          }).catch(console.error)
      } else {
          setDbSchema({})
          setTargetName("")
          setDataPreview([])
          setFieldMappings({})
      }
  }, [selectedConnection])

  // Fetch live preview when target changes
  useEffect(() => {
      if (selectedConnection && targetName) {
          fetcher(`/connections/${selectedConnection}/query`, {
              method: "POST",
              body: JSON.stringify({ collection: targetName, query: `SELECT * FROM ${targetName}` }) // handles both mongo and sql via backend logic
          }).then((res) => {
              setDataPreview(res.data || [])
          }).catch(console.error)
      } else {
          setDataPreview([])
      }
  }, [selectedConnection, targetName])

  const addField = () => setFields([...fields, { name: "", type: "String" }])
  const updateField = (index: number, key: string, value: string) => {
      const newFields = [...fields];
      newFields[index] = { ...newFields[index], [key]: value };
      setFields(newFields);
  }

  const handleCreateAndMap = async () => {
      if (!localStorage.getItem("project_id")) return alert("Please create or select a project first.");
      if (!name) return alert("Please enter a schema name.")
      if (!selectedConnection) return alert("Please select a connection.")
      if (!targetName) return alert("Please select a target table/collection.")
      
      try {
          // 1. Create Logical Schema
          const createdSchema = await fetcher("/schemas/", {
              method: "POST",
              body: JSON.stringify({ name, fields })
          })

          // 2. Map Schema to Database Target
          const mappingsArray = Object.entries(fieldMappings).map(([logical, physical]) => ({
              logical_field: logical,
              physical_column: physical
          }))

          await fetcher(`/schemas/${createdSchema.id}/map`, {
              method: "POST",
              body: JSON.stringify({
                  connection_id: selectedConnection,
                  physical_target_name: targetName,
                  field_mappings: mappingsArray
              })
          })

          alert("Schema successfully created and mapped!")
          
          // Reset UI
          setName("")
          setFields([{ name: "", type: "String" }])
          setSelectedConnection("")
          loadSavedSchemas()
      } catch (e: any) {
          alert(`Error: ${e.message}`)
      }
  }

  const handleValidate = async (schemaId: string) => {
      try {
          const res = await fetcher(`/schemas/${schemaId}/validate`, { method: "POST" })
          alert(`Validation Complete!\n\nScore: ${res.compliance_score.toFixed(2)}%\nRecords Tested: ${res.total_records_tested}\nCompliant: ${res.compliant_records}\nErrors: ${res.errors.length}`)
      } catch (e: any) {
          alert(`Validation Failed: ${e.message}`)
      }
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-50 p-6 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="py-4 border-b border-neutral-800">
          <h1 className="text-2xl font-bold tracking-tight text-white">Business Schemas</h1>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
          {/* Builder Section */}
          <div className="space-y-6">
              <Card className="bg-neutral-900 border-neutral-800 text-neutral-50">
                <CardHeader><CardTitle>1. Logical Definition</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div>
                      <Label>Schema Name</Label>
                      <Input value={name} onChange={e => setName(e.target.value)} className="bg-neutral-800 border-neutral-700 mt-1" placeholder="e.g. User Profile Flow" />
                  </div>
                  
                  <div className="pt-4 border-t border-neutral-800">
                      <h3 className="font-semibold mb-3">Logical Fields</h3>
                      {fields.map((f, i) => (
                          <div key={i} className="flex gap-2 mb-2">
                              <Input placeholder="Logical Field Name" value={f.name} onChange={e => updateField(i, "name", e.target.value)} className="bg-neutral-800 border-neutral-700 flex-1" />
                              <select value={f.type} onChange={e => updateField(i, "type", e.target.value)} className="bg-neutral-800 border border-neutral-700 rounded-md p-2 text-sm w-32">
                                  <option>String</option>
                                  <option>Email</option>
                                  <option>Phone</option>
                                  <option>Currency</option>
                                  <option>Integer</option>
                              </select>
                          </div>
                      ))}
                      <Button variant="outline" size="sm" onClick={addField} className="mt-2 text-white border-neutral-700 bg-transparent hover:bg-neutral-800">+ Add Field</Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-neutral-900 border-neutral-800 text-neutral-50">
                <CardHeader><CardTitle>2. Database Mapping</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div>
                      <Label>Select Connection</Label>
                      <select value={selectedConnection} onChange={e => setSelectedConnection(e.target.value)} className="w-full bg-neutral-800 border border-neutral-700 rounded-md p-2 mt-1">
                          <option value="">-- Choose Connection --</option>
                          {connections.map((c: any) => <option key={c.id} value={c.id}>{c.name} ({c.db_type})</option>)}
                      </select>
                  </div>

                  {selectedConnection && Object.keys(dbSchema).length > 0 && (
                      <div>
                          <Label>Target Database Table / Collection</Label>
                          <select value={targetName} onChange={e => setTargetName(e.target.value)} className="w-full bg-neutral-800 border border-neutral-700 rounded-md p-2 mt-1">
                              <option value="">-- Choose Target --</option>
                              {Object.keys(dbSchema).map(tbl => <option key={tbl} value={tbl}>{tbl}</option>)}
                          </select>
                      </div>
                  )}

                  {targetName && dataPreview.length > 0 && (
                      <div className="pt-2">
                          <Label className="text-emerald-400">Live Data Preview</Label>
                          <div className="mt-2 border border-neutral-800 rounded-md overflow-x-auto max-h-48 bg-neutral-950">
                              <table className="w-full text-xs text-left">
                                  <thead className="bg-neutral-900 border-b border-neutral-800">
                                      <tr>
                                          {Object.keys(dataPreview[0]).slice(0, 5).map(k => (
                                              <th key={k} className="p-2 text-neutral-400 font-medium whitespace-nowrap">{k}</th>
                                          ))}
                                          {Object.keys(dataPreview[0]).length > 5 && <th className="p-2 text-neutral-500 italic">...</th>}
                                      </tr>
                                  </thead>
                                  <tbody>
                                      {dataPreview.slice(0, 5).map((row: any, i) => (
                                          <tr key={i} className="border-b border-neutral-800/50 hover:bg-neutral-900/50">
                                              {Object.keys(dataPreview[0]).slice(0, 5).map(k => (
                                                  <td key={k} className="p-2 whitespace-nowrap overflow-hidden text-ellipsis max-w-[150px]" title={String(row[k])}>
                                                      {String(row[k])}
                                                  </td>
                                              ))}
                                              {Object.keys(dataPreview[0]).length > 5 && <td className="p-2"></td>}
                                          </tr>
                                      ))}
                                  </tbody>
                              </table>
                          </div>
                      </div>
                  )}

                  {targetName && dbSchema[targetName] && (
                      <div className="pt-4 border-t border-neutral-800">
                          <h3 className="font-semibold mb-3">Map Columns</h3>
                          {fields.filter(f => f.name).map((f, i) => (
                              <div key={i} className="flex justify-between items-center mb-2">
                                  <span className="text-sm font-medium w-1/3">{f.name}</span>
                                  <span className="text-neutral-500 mx-2">→</span>
                                  <select 
                                      value={fieldMappings[f.name] || ""} 
                                      onChange={e => setFieldMappings({ ...fieldMappings, [f.name]: e.target.value })}
                                      className="w-full bg-neutral-800 border border-neutral-700 rounded-md p-2 text-sm"
                                  >
                                      <option value="">-- Select Column --</option>
                                      {dbSchema[targetName].map((col: any) => (
                                          <option key={col.name} value={col.name}>{col.name} ({col.type})</option>
                                      ))}
                                  </select>
                              </div>
                          ))}
                      </div>
                  )}

                  <Button onClick={handleCreateAndMap} className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700 text-white">Save & Map Schema</Button>
                </CardContent>
              </Card>
          </div>

          {/* List Section */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Active Business Schemas</h2>
            {savedSchemas.length === 0 ? (
                <p className="text-neutral-500">No schemas created yet.</p>
            ) : (
                savedSchemas.map((s: any) => (
                    <Card key={s.id} className="bg-neutral-900 border-neutral-800 text-neutral-50">
                        <CardContent className="p-4 flex justify-between items-center">
                            <div>
                                <h3 className="font-semibold text-lg">{s.name}</h3>
                                {s.physical_target_name ? (
                                    <p className="text-sm text-neutral-400">Mapped to: <span className="text-emerald-400">{s.physical_target_name}</span></p>
                                ) : (
                                    <p className="text-sm text-yellow-500">Unmapped</p>
                                )}
                            </div>
                            <Button 
                                variant="outline" 
                                className="border-neutral-700 bg-transparent text-white hover:bg-neutral-800"
                                onClick={() => handleValidate(s.id)}
                            >
                                Validate Data
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
