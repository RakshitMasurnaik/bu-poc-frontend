"use client"

import { useState, useEffect } from "react"
import { fetcher } from "@/lib/api"
import { FiDatabase, FiBox, FiFolder, FiUsers, FiUser, FiEye, FiUserPlus, FiCheck } from 'react-icons/fi'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export default function OrganizationsPage() {
    const [organizations, setOrganizations] = useState<any[]>([])
    const [selectedOrgId, setSelectedOrgId] = useState<string>("")
    const [orgUsers, setOrgUsers] = useState<any[]>([])
    
    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [activeTab, setActiveTab] = useState<"details" | "invite">("details")
    
    // Invite State
    const [inviteEmail, setInviteEmail] = useState("")
    const [inviting, setInviting] = useState(false)
    const [inviteStatus, setInviteStatus] = useState<string | null>(null)

    useEffect(() => {
        loadOrganizations()
        
        const handleStorage = () => loadOrganizations()
        window.addEventListener("storage", handleStorage)
        return () => window.removeEventListener("storage", handleStorage)
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

    const loadOrgUsers = async (orgId: string) => {
        if (!orgId) return
        try {
            const data = await fetcher(`/organizations/members?org_id=${orgId}`)
            setOrgUsers(data)
        } catch (error) {
            console.error("Failed to load org users", error)
        }
    }

    const openOrgModal = (orgId: string) => {
        setSelectedOrgId(orgId)
        localStorage.setItem("org_id", orgId)
        localStorage.removeItem("project_id")
        window.dispatchEvent(new Event("storage"))
        
        loadOrgUsers(orgId)
        setActiveTab("details")
        setInviteStatus(null)
        setInviteEmail("")
        setIsModalOpen(true)
    }

    const selectedOrg = organizations.find(o => o.id === selectedOrgId)

    const handleSelectProject = (orgId: string, projectId: string) => {
        localStorage.setItem("org_id", orgId)
        localStorage.setItem("project_id", projectId)
        window.dispatchEvent(new Event("storage"))
        window.location.href = `/projects/${projectId}` // Redirect to Project Details
    }

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault()
        setInviting(true)
        setInviteStatus(null)

        try {
            await fetcher("/auth/invite", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: inviteEmail, org_id: selectedOrgId })
            })
            setInviteStatus("success")
            setInviteEmail("")
            // Reload users after invite if backend added them (if auto-accepted)
            loadOrgUsers(selectedOrgId)
        } catch (error: any) {
            setInviteStatus(error.message || "Failed to send invite")
        } finally {
            setInviting(false)
        }
    }

    return (
        <div className="max-w-7xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
            <header className="flex justify-between items-center py-4 border-b border-neutral-800 shrink-0 mb-6">
                <h1 className="text-2xl font-bold tracking-tight text-white">All Organizations</h1>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto custom-scrollbar pb-10">
                {organizations.map(org => (
                    <div 
                        key={org.id} 
                        className="flex flex-col p-5 bg-neutral-900 border border-neutral-800 rounded-lg hover:border-neutral-700 transition-colors shadow-lg"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center space-x-3 overflow-hidden">
                                <div className="h-10 w-10 bg-neutral-800 rounded-md flex items-center justify-center text-emerald-500">
                                    <FiBox size={20} />
                                </div>
                                <h2 className="text-lg font-semibold text-white truncate max-w-[150px]">{org.name}</h2>
                            </div>
                            <button
                                onClick={() => openOrgModal(org.id)}
                                className="p-2 text-neutral-400 hover:text-emerald-400 hover:bg-emerald-900/20 rounded-md transition-colors"
                                title="View Details"
                            >
                                <FiEye size={20} />
                            </button>
                        </div>
                        <div className="mt-auto flex justify-between items-center text-xs text-neutral-500 font-mono">
                            <span>Projects: {org.projects?.length || 0}</span>
                            <span className="truncate max-w-[120px]" title={org.id}>ID: {org.id.split('-')[0]}...</span>
                        </div>
                    </div>
                ))}
                {organizations.length === 0 && (
                    <div className="col-span-full text-center text-neutral-500 p-10 bg-neutral-900/50 rounded-lg border border-neutral-800 border-dashed">
                        No organizations found.
                    </div>
                )}
            </div>

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-4xl bg-neutral-950 border-neutral-800 p-0 overflow-hidden flex flex-col h-[80vh]">
                    <DialogHeader className="p-6 border-b border-neutral-800 shrink-0 bg-neutral-900/50">
                        <DialogTitle className="text-xl font-bold text-white flex items-center space-x-3">
                            <div className="h-8 w-8 bg-neutral-800 rounded-md flex items-center justify-center text-emerald-500">
                                <FiBox size={16} />
                            </div>
                            <span>{selectedOrg?.name || 'Organization Details'}</span>
                        </DialogTitle>
                    </DialogHeader>

                    {/* Tabs Header */}
                    <div className="flex border-b border-neutral-800 shrink-0 bg-neutral-900/30 px-6 pt-2">
                        <button
                            onClick={() => setActiveTab("details")}
                            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'details' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-neutral-400 hover:text-neutral-200'}`}
                        >
                            Details & Projects
                        </button>
                        <button
                            onClick={() => setActiveTab("invite")}
                            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'invite' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-neutral-400 hover:text-neutral-200'}`}
                        >
                            Invite Members
                        </button>
                    </div>

                    {/* Tabs Content */}
                    <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-neutral-950">
                        {activeTab === 'details' && (
                            <div className="space-y-8">
                                <div>
                                    <h3 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider mb-4 flex items-center space-x-2">
                                        <FiFolder className="text-emerald-500" />
                                        <span>Projects in {selectedOrg?.name}</span>
                                    </h3>
                                    {selectedOrg ? (
                                        selectedOrg.projects && selectedOrg.projects.length > 0 ? (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {selectedOrg.projects.map((project: any) => (
                                                    <button 
                                                        key={project.id} 
                                                        onClick={() => {
                                                            setIsModalOpen(false);
                                                            handleSelectProject(selectedOrg.id, project.id);
                                                        }}
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
                                            <div className="flex flex-col items-center justify-center p-8 bg-neutral-900/30 rounded-lg border border-neutral-800 border-dashed text-neutral-500 space-y-3">
                                                <p>No projects in this organization yet.</p>
                                            </div>
                                        )
                                    ) : null}
                                </div>

                                <div>
                                    <h3 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider mb-4 flex items-center space-x-2">
                                        <FiUsers className="text-blue-500" />
                                        <span>Current Members</span>
                                    </h3>
                                    {orgUsers.length > 0 ? (
                                        <div className="grid grid-cols-1 gap-3">
                                            {orgUsers.map((user: any) => (
                                                <div key={user.id} className="p-3 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center space-x-4">
                                                    <div className="h-10 w-10 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-400 shrink-0">
                                                        <FiUser size={18} />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-semibold text-white truncate">{user.full_name}</p>
                                                        <p className="text-xs text-neutral-400 truncate">{user.email}</p>
                                                    </div>
                                                    <div className="shrink-0">
                                                        <span className="inline-block px-2 py-1 bg-neutral-800 text-neutral-300 rounded text-[10px] uppercase font-bold tracking-wider">
                                                            {user.global_role.replace('_', ' ')}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center p-8 bg-neutral-900/30 rounded-lg border border-neutral-800 border-dashed text-neutral-500 space-y-3">
                                            <p>No members found.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'invite' && (
                            <div className="max-w-lg mx-auto mt-6">
                                <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6 shadow-xl">
                                    <div className="flex items-center space-x-3 mb-6">
                                        <div className="h-10 w-10 bg-emerald-900/20 text-emerald-500 rounded-full flex items-center justify-center">
                                            <FiUserPlus size={20} />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold text-white">Invite to {selectedOrg?.name}</h3>
                                            <p className="text-xs text-neutral-400">Send an email invitation to join this organization.</p>
                                        </div>
                                    </div>

                                    <form onSubmit={handleInvite} className="space-y-5">
                                        <div>
                                            <label className="block text-xs font-medium text-neutral-400 mb-1.5">Email Address</label>
                                            <input 
                                                type="email" 
                                                value={inviteEmail}
                                                onChange={e => setInviteEmail(e.target.value)}
                                                placeholder="colleague@company.com" 
                                                required
                                                className="w-full bg-neutral-950 border border-neutral-800 text-sm text-neutral-200 rounded-md px-4 py-2.5 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                                            />
                                        </div>
                                        <button 
                                            type="submit" 
                                            disabled={inviting || !inviteEmail}
                                            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold py-2.5 rounded-md transition-colors flex justify-center items-center"
                                        >
                                            {inviting ? "Sending Invite..." : "Send Invitation"}
                                        </button>
                                        
                                        {inviteStatus === "success" && (
                                            <div className="p-4 bg-emerald-950/30 border border-emerald-900/50 rounded-md flex items-start space-x-3">
                                                <FiCheck className="text-emerald-500 mt-0.5 shrink-0" />
                                                <span className="text-emerald-400 text-xs leading-relaxed">
                                                    Invitation sent successfully! Check the backend console to copy the activation link (MOCK EMAIL).
                                                </span>
                                            </div>
                                        )}
                                        
                                        {inviteStatus && inviteStatus !== "success" && (
                                            <div className="p-4 bg-red-950/30 border border-red-900/50 rounded-md">
                                                <span className="text-red-400 text-xs leading-relaxed">
                                                    {inviteStatus}
                                                </span>
                                            </div>
                                        )}
                                    </form>
                                </div>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
