"use client"

import { useState, useEffect } from "react"
import { fetcher } from "@/lib/api"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { FiUserPlus, FiUser, FiCheck } from 'react-icons/fi'

type MemberResponse = {
    id: string
    full_name: string
    email: string
    global_role: string
}

export default function MembersPage() {
    const [members, setMembers] = useState<MemberResponse[]>([])
    const [projectMembers, setProjectMembers] = useState<any[]>([])
    const [inviteEmail, setInviteEmail] = useState("")
    const [inviting, setInviting] = useState(false)
    const [inviteStatus, setInviteStatus] = useState<string | null>(null)
    const [currentUser, setCurrentUser] = useState<any>(null)
    const [activeProjectId, setActiveProjectId] = useState<string | null>(null)

    useEffect(() => {
        loadData()
        
        const handleStorage = () => loadMembers()
        window.addEventListener("storage", handleStorage)
        return () => window.removeEventListener("storage", handleStorage)
    }, [])

    const loadData = async () => {
        try {
            const user = await fetcher("/auth/me")
            setCurrentUser(user)
            await loadMembers()
        } catch (error) {
            console.error("Failed to load members", error)
        }
    }

    const loadMembers = async () => {
        try {
            const orgId = localStorage.getItem("org_id")
            const url = orgId ? `/organizations/members?org_id=${orgId}` : "/organizations/members"
            const data = await fetcher(url)
            setMembers(data)

            const projectId = localStorage.getItem("project_id")
            setActiveProjectId(projectId)
            if (projectId) {
                try {
                    const projData = await fetcher(`/projects/${projectId}/members`)
                    setProjectMembers(projData)
                } catch (e) {
                    console.error("Failed to load project members", e)
                }
            }
        } catch (error: any) {
            console.error(error.message || "Failed to load members")
        }
    }

    const handleUpdateRole = async (userId: string, newRole: string, currentGlobalRole: string) => {
        try {
            if (newRole === 'org_admin' || newRole === 'user') {
                await fetcher(`/organizations/members/${userId}/role`, {
                    method: 'PUT',
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ role: newRole })
                })
            } else {
                const projectId = localStorage.getItem("project_id")
                if (!projectId) {
                    alert("Please select an active project from the sidebar first to assign project roles.")
                    return
                }
                
                if (currentGlobalRole === 'org_admin') {
                    await fetcher(`/organizations/members/${userId}/role`, {
                        method: 'PUT',
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ role: 'user' })
                    })
                }

                try {
                    await fetcher(`/projects/${projectId}/members/${userId}`, {
                        method: 'PUT',
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ role: newRole })
                    })
                } catch (e: any) {
                    await fetcher(`/projects/${projectId}/members`, {
                        method: 'POST',
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ user_id: userId, role: newRole })
                    })
                }
            }
            loadMembers()
        } catch (error: any) {
            alert(error.message || "Failed to update role")
        }
    }

    const getDisplayRole = (m: MemberResponse) => {
        if (m.global_role === 'org_admin' || m.global_role === 'platform_admin') return m.global_role;
        const projMember = projectMembers.find(pm => pm.user.id === m.id);
        if (projMember) return projMember.role; 
        return 'user';
    }

    const handleRemoveMember = async (userId: string) => {
        if (!confirm("Are you sure you want to remove this member from the organization?")) return
        try {
            await fetcher(`/organizations/members/${userId}`, { method: "DELETE" })
            loadMembers()
        } catch (error: any) {
            alert(error.message || "Failed to remove member")
        }
    }

    const isOrgAdmin = currentUser?.global_role === 'org_admin' || currentUser?.global_role === 'platform_admin'
    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault()
        setInviting(true)
        setInviteStatus(null)

        try {
            const orgId = localStorage.getItem("org_id")
            await fetcher("/auth/invite", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: inviteEmail, org_id: orgId })
            })
            setInviteStatus("success")
            setInviteEmail("")
        } catch (error: any) {
            setInviteStatus(error.message || "Failed to send invite")
        } finally {
            setInviting(false)
        }
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <header className="flex justify-between items-center py-4 border-b border-neutral-800">
                <h1 className="text-2xl font-bold tracking-tight text-white">Organization Members</h1>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="md:col-span-2 bg-neutral-900 border-neutral-800 text-neutral-50 shadow-xl">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center space-x-2">
                            <FiUser className="text-emerald-500" />
                            <span>Active Members ({members.length})</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left text-neutral-400">
                                <thead className="text-xs uppercase bg-neutral-800/50 text-neutral-300">
                                    <tr>
                                        <th className="px-4 py-3 rounded-tl-lg">Name</th>
                                        <th className="px-4 py-3">Email</th>
                                        <th className="px-4 py-3">Role</th>
                                        <th className="px-4 py-3 rounded-tr-lg text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {members.map(m => (
                                        <tr key={m.id} className="border-b border-neutral-800 hover:bg-neutral-800/30 transition-colors">
                                            <td className="px-4 py-3 font-medium text-white">{m.full_name}</td>
                                            <td className="px-4 py-3">{m.email}</td>
                                            <td className="px-4 py-3">
                                                {isOrgAdmin && m.id !== currentUser?.id && m.global_role !== 'platform_admin' ? (
                                                    <select
                                                        value={getDisplayRole(m)}
                                                        onChange={(e) => handleUpdateRole(m.id, e.target.value, m.global_role)}
                                                        className="bg-neutral-950 border border-neutral-700 text-white text-xs rounded focus:ring-emerald-500 focus:border-emerald-500 p-1"
                                                    >
                                                        {getDisplayRole(m) === 'user' && (
                                                            <option value="user" disabled className="hidden">User</option>
                                                        )}
                                                        {activeProjectId && (
                                                            <>
                                                                <option value="project_member">Project Member</option>
                                                                <option value="project_admin">Project Admin</option>
                                                            </>
                                                        )}
                                                        <option value="org_admin">Org Admin</option>
                                                    </select>
                                                ) : (
                                                    <span className="px-2 py-1 bg-neutral-800 text-neutral-300 rounded text-xs">
                                                        {getDisplayRole(m).replace('_', ' ').toUpperCase()}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                {isOrgAdmin && m.id !== currentUser?.id && m.global_role !== 'platform_admin' && (
                                                    <button 
                                                        onClick={() => handleRemoveMember(m.id)}
                                                        className="text-red-500 hover:text-red-400 text-xs font-semibold"
                                                    >
                                                        Remove
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-neutral-900 border-neutral-800 text-neutral-50 shadow-xl h-fit">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center space-x-2">
                            <FiUserPlus className="text-emerald-500" />
                            <span>Invite Member</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleInvite} className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-neutral-400 mb-1">Email Address</label>
                                <input 
                                    type="email" 
                                    value={inviteEmail}
                                    onChange={e => setInviteEmail(e.target.value)}
                                    placeholder="colleague@company.com" 
                                    required
                                    className="w-full bg-neutral-950 border border-neutral-800 text-sm text-neutral-200 rounded-md px-3 py-2 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                                />
                            </div>
                            <button 
                                type="submit" 
                                disabled={inviting || !inviteEmail}
                                className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold py-2 rounded-md transition-colors flex justify-center items-center"
                            >
                                {inviting ? "Sending Invite..." : "Send Invitation"}
                            </button>
                            
                            {inviteStatus === "success" && (
                                <div className="p-3 bg-emerald-950/30 border border-emerald-900/50 rounded-md flex items-start space-x-2">
                                    <FiCheck className="text-emerald-500 mt-0.5" />
                                    <span className="text-emerald-400 text-xs leading-relaxed">
                                        Invitation sent successfully! Check the backend console to copy the activation link (MOCK EMAIL).
                                    </span>
                                </div>
                            )}
                            
                            {inviteStatus && inviteStatus !== "success" && (
                                <div className="p-3 bg-red-950/30 border border-red-900/50 rounded-md">
                                    <span className="text-red-400 text-xs leading-relaxed">
                                        {inviteStatus}
                                    </span>
                                </div>
                            )}
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
