"use client"

import { useState, useEffect } from "react"
import { fetcher } from "@/lib/api"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { FiDatabase, FiBox, FiFolder, FiChevronRight, FiUsers, FiUser } from 'react-icons/fi'

export default function OrganizationsPage() {
    const [organizations, setOrganizations] = useState<any[]>([])
    const [selectedOrgId, setSelectedOrgId] = useState<string>("")
    const [orgUsers, setOrgUsers] = useState<any[]>([])

    useEffect(() => {
        loadOrganizations()
    }, [])

    const loadOrganizations = async () => {
        try {
            const data = await fetcher("/organizations/")
            setOrganizations(data)
            const savedOrgId = localStorage.getItem("org_id")
            if (savedOrgId && data.find((o: any) => o.id === savedOrgId)) {
                setSelectedOrgId(savedOrgId)
            } else if (data.length > 0) {
                setSelectedOrgId(data[0].id)
                localStorage.setItem("org_id", data[0].id)
                localStorage.removeItem("project_id")
                window.dispatchEvent(new Event("storage"))
            }
        } catch (error) {
            console.error("Failed to load organizations", error)
        }
    }

    useEffect(() => {
        if (!selectedOrgId) return
        fetcher(`/organizations/${selectedOrgId}/users`)
            .then(setOrgUsers)
            .catch(e => console.error("Failed to load org users", e))
    }, [selectedOrgId])

    const selectedOrg = organizations.find(o => o.id === selectedOrgId)

    const handleSelectProject = (orgId: string, projectId: string) => {
        localStorage.setItem("org_id", orgId)
        localStorage.setItem("project_id", projectId)
        window.dispatchEvent(new Event("storage"))
        window.location.href = `/projects/${projectId}` // Redirect to Project Details
    }

    return (
        <div className="max-w-7xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
            <header className="flex justify-between items-center py-4 border-b border-neutral-800 shrink-0">
                <h1 className="text-2xl font-bold tracking-tight text-white">Organization Management</h1>
            </header>

            <div className="flex-1 overflow-hidden pt-6 flex space-x-6">
                {/* Left Column: Organizations */}
                <div className="w-1/3 flex flex-col border border-neutral-800 rounded-lg overflow-hidden bg-neutral-900/50">
                    <div className="p-4 border-b border-neutral-800 bg-neutral-900 font-semibold text-neutral-300">
                        Organizations
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                        {organizations.map(org => (
                            <button
                                key={org.id}
                                onClick={() => {
                                    setSelectedOrgId(org.id)
                                    localStorage.setItem("org_id", org.id)
                                    localStorage.removeItem("project_id")
                                    window.dispatchEvent(new Event("storage"))
                                }}
                                className={`w-full text-left p-3 rounded-md flex items-center justify-between transition-colors ${selectedOrgId === org.id ? 'bg-emerald-900/30 border border-emerald-800 text-emerald-400' : 'text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200'}`}
                            >
                                <div className="flex items-center space-x-3 overflow-hidden">
                                    <FiBox className="flex-shrink-0" />
                                    <span className="truncate font-medium">{org.name}</span>
                                </div>
                                {selectedOrgId === org.id && <FiChevronRight className="flex-shrink-0" />}
                            </button>
                        ))}
                        {organizations.length === 0 && (
                            <div className="text-center text-sm text-neutral-600 p-4">No organizations found.</div>
                        )}
                    </div>
                </div>

                {/* Right Column: Projects */}
                <div className="w-2/3 flex flex-col border border-neutral-800 rounded-lg overflow-hidden bg-neutral-950">
                    <div className="p-4 border-b border-neutral-800 bg-neutral-900 font-semibold text-neutral-300 flex justify-between items-center">
                        <span>Projects in {selectedOrg?.name || '...'}</span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-8">
                        <div>
                            <h2 className="text-lg font-semibold text-white flex items-center space-x-2 mb-4">
                                <FiFolder className="text-emerald-500" />
                                <span>Projects</span>
                            </h2>
                            {selectedOrg ? (
                                selectedOrg.projects && selectedOrg.projects.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {selectedOrg.projects.map((project: any) => (
                                            <button 
                                                key={project.id} 
                                                onClick={() => handleSelectProject(selectedOrg.id, project.id)}
                                                className="p-5 rounded-lg bg-neutral-900 border border-neutral-800 hover:border-emerald-600 hover:bg-neutral-800 transition-all text-left group flex flex-col"
                                            >
                                                <div className="flex items-center space-x-3 mb-2">
                                                    <FiDatabase className="text-emerald-500 flex-shrink-0" size={20} />
                                                    <p className="text-base font-semibold text-white group-hover:text-emerald-400 transition-colors">{project.name}</p>
                                                </div>
                                                <p className="text-xs text-neutral-500 font-mono mt-auto">ID: {project.id}</p>
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center p-8 bg-neutral-900/50 rounded-lg border border-neutral-800 border-dashed text-neutral-500 space-y-3">
                                        <p>No projects in this organization yet.</p>
                                    </div>
                                )
                            ) : (
                                <div className="flex flex-col items-center justify-center p-8 bg-neutral-900/50 rounded-lg border border-neutral-800 border-dashed text-neutral-500 space-y-3">
                                    <p>Select an organization to view projects.</p>
                                </div>
                            )}
                        </div>

                        {selectedOrg && (
                            <div>
                                <h2 className="text-lg font-semibold text-white flex items-center space-x-2 mb-4">
                                    <FiUsers className="text-blue-500" />
                                    <span>Members</span>
                                </h2>
                                {orgUsers.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {orgUsers.map((user: any) => (
                                            <div key={user.id} className="p-4 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center space-x-4">
                                                <div className="h-10 w-10 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-400">
                                                    <FiUser size={20} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-white">{user.full_name}</p>
                                                    <p className="text-xs text-neutral-400">{user.email}</p>
                                                    <span className="inline-block mt-1 px-2 py-0.5 bg-neutral-800 text-neutral-300 rounded text-[10px] uppercase font-bold tracking-wider">
                                                        {user.global_role.replace('_', ' ')}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center p-8 bg-neutral-900/50 rounded-lg border border-neutral-800 border-dashed text-neutral-500 space-y-3">
                                        <p>No members found.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
