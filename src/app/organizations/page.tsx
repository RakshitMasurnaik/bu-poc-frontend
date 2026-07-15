"use client"

import { useState, useEffect } from "react"
import { fetcher } from "@/lib/api"
import { FiDatabase, FiBox, FiFolder, FiUsers, FiUser, FiEye, FiUserPlus, FiCheck } from 'react-icons/fi'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export default function OrganizationsPage() {
    const [organizations, setOrganizations] = useState<any[]>([])
    const [selectedOrgId, setSelectedOrgId] = useState<string>("")
    const [modalOrgId, setModalOrgId] = useState<string>("")
    const [orgUsers, setOrgUsers] = useState<any[]>([])
    
    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [activeTab, setActiveTab] = useState<"members" | "invite">("members")
    
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

    const handleSelectOrgRow = (orgId: string) => {
        setSelectedOrgId(orgId)
        localStorage.setItem("org_id", orgId)
        localStorage.removeItem("project_id")
        window.dispatchEvent(new Event("storage"))
    }

    const openOrgModal = (e: React.MouseEvent, orgId: string) => {
        e.stopPropagation() // Prevent row click
        setModalOrgId(orgId)
        loadOrgUsers(orgId)
        setActiveTab("members")
        setInviteStatus(null)
        setInviteEmail("")
        setIsModalOpen(true)
    }

    const handleSelectProject = (projectId: string) => {
        localStorage.setItem("project_id", projectId)
        window.dispatchEvent(new Event("storage"))
        window.location.href = `/projects/${projectId}`
    }

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault()
        setInviting(true)
        setInviteStatus(null)

        try {
            await fetcher("/auth/invite", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: inviteEmail, org_id: modalOrgId })
            })
            setInviteStatus("success")
            setInviteEmail("")
            loadOrgUsers(modalOrgId)
        } catch (error: any) {
            setInviteStatus(error.message || "Failed to send invite")
        } finally {
            setInviting(false)
        }
    }

    const selectedOrg = organizations.find(o => o.id === selectedOrgId)
    const modalOrg = organizations.find(o => o.id === modalOrgId)

    return (
        <div className="max-w-full mx-auto h-[calc(100vh-8rem)] flex flex-col">
            <header className="flex justify-between items-center py-4 border-b border-neutral-800 shrink-0 mb-6">
                <h1 className="text-2xl font-bold tracking-tight text-white">All Organizations</h1>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full min-h-0">
                {/* Left Column: Organizations */}
                <div className="flex flex-col bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden flex-1 min-h-0">
                    <div className="p-4 border-b border-neutral-800 bg-neutral-900/50 flex justify-between items-center shrink-0">
                        <h2 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider flex items-center space-x-2">
                            <FiBox size={16} className="text-emerald-500" />
                            <span>Organizations</span>
                        </h2>
                        <span className="text-xs bg-neutral-800 text-neutral-300 px-2 py-0.5 rounded-full">{organizations.length}</span>
                    </div>
                    <div className="overflow-y-auto custom-scrollbar">
                        {organizations.length === 0 ? (
                            <div className="p-8 text-center text-neutral-500">No organizations found.</div>
                        ) : (
                            <div className="divide-y divide-neutral-800">
                                {organizations.map(org => (
                                    <div 
                                        key={org.id}
                                        onClick={() => handleSelectOrgRow(org.id)}
                                        className={`p-4 flex items-center justify-between cursor-pointer transition-colors ${selectedOrgId === org.id ? 'bg-neutral-800/80 border-l-2 border-emerald-500' : 'hover:bg-neutral-800/50 border-l-2 border-transparent'}`}
                                    >
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium text-white">{org.name}</span>
                                            <span className="text-xs text-neutral-500 font-mono mt-0.5">ID: {org.id.split('-')[0]}...</span>
                                        </div>
                                        <div className="flex items-center space-x-3">
                                            <span className="text-xs text-neutral-500">{org.projects?.length || 0} Projects</span>
                                            <button
                                                onClick={(e) => openOrgModal(e, org.id)}
                                                className="p-1.5 text-neutral-400 hover:text-emerald-400 hover:bg-emerald-900/20 rounded-md transition-colors"
                                                title="Organization Settings & Members"
                                            >
                                                <FiEye size={18} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Projects */}
                <div className="flex flex-col bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden flex-1 min-h-0">
                    <div className="p-4 border-b border-neutral-800 bg-neutral-900/50 flex justify-between items-center shrink-0">
                        <h2 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider flex items-center space-x-2">
                            <FiFolder size={16} className="text-blue-500" />
                            <span>Projects in {selectedOrg?.name || '...'}</span>
                        </h2>
                        <span className="text-xs bg-neutral-800 text-neutral-300 px-2 py-0.5 rounded-full">{selectedOrg?.projects?.length || 0}</span>
                    </div>
                    <div className="overflow-y-auto custom-scrollbar">
                        {!selectedOrgId ? (
                            <div className="p-8 text-center text-neutral-500">Select an organization to view projects.</div>
                        ) : selectedOrg?.projects && selectedOrg.projects.length > 0 ? (
                            <div className="divide-y divide-neutral-800">
                                {selectedOrg.projects.map((project: any) => (
                                    <div 
                                        key={project.id}
                                        className="p-4 flex items-center justify-between hover:bg-neutral-800/50 transition-colors"
                                    >
                                        <div className="flex items-center space-x-3">
                                            <div className="h-8 w-8 bg-neutral-800/80 rounded flex items-center justify-center text-neutral-400 shrink-0 border border-neutral-700/50">
                                                <FiDatabase size={14} />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium text-white">{project.name}</span>
                                                <span className="text-xs text-neutral-500 font-mono mt-0.5">ID: {project.id}</span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleSelectProject(project.id)}
                                            className="p-1.5 text-neutral-400 hover:text-emerald-400 hover:bg-emerald-900/20 rounded-md transition-colors flex items-center space-x-1.5"
                                            title="View Project Dashboard"
                                        >
                                            <FiEye size={18} />
                                            <span className="text-xs font-medium pr-1">View</span>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full p-8 text-neutral-500 space-y-2">
                                <div className="h-12 w-12 bg-neutral-800/50 rounded-full flex items-center justify-center text-neutral-600 mb-2">
                                    <FiFolder size={24} />
                                </div>
                                <p className="text-sm">No projects found in this organization.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-3xl bg-neutral-950 border-neutral-800 p-0 overflow-hidden flex flex-col h-[70vh]">
                    <DialogHeader className="p-6 border-b border-neutral-800 shrink-0 bg-neutral-900/50">
                        <DialogTitle className="text-xl font-bold text-white flex items-center space-x-3">
                            <div className="h-8 w-8 bg-neutral-800 rounded-md flex items-center justify-center text-emerald-500">
                                <FiBox size={16} />
                            </div>
                            <span>{modalOrg?.name || 'Organization Details'}</span>
                        </DialogTitle>
                    </DialogHeader>

                    {/* Tabs Header */}
                    <div className="flex border-b border-neutral-800 shrink-0 bg-neutral-900/30 px-6 pt-2">
                        <button
                            onClick={() => setActiveTab("members")}
                            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'members' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-neutral-400 hover:text-neutral-200'}`}
                        >
                            Current Members
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
                        {activeTab === 'members' && (
                            <div>
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
                        )}

                        {activeTab === 'invite' && (
                            <div className="max-w-lg mx-auto mt-6">
                                <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6 shadow-xl">
                                    <div className="flex items-center space-x-3 mb-6">
                                        <div className="h-10 w-10 bg-emerald-900/20 text-emerald-500 rounded-full flex items-center justify-center">
                                            <FiUserPlus size={20} />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold text-white">Invite to {modalOrg?.name}</h3>
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
