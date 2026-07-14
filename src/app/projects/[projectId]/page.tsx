"use client"

import { useState, useEffect, use } from "react"
import { fetcher } from "@/lib/api"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { FiUsers, FiUserPlus, FiTrash2, FiShield, FiDatabase, FiX } from 'react-icons/fi'

export default function ProjectDetailsPage({ params }: { params: Promise<{ projectId: string }> }) {
    const { projectId } = use(params)
    
    const [project, setProject] = useState<any>(null)
    const [members, setMembers] = useState<any[]>([])
    const [orgUsers, setOrgUsers] = useState<any[]>([])
    
    const [showAddModal, setShowAddModal] = useState(false)
    const [selectedUserId, setSelectedUserId] = useState("")
    const [selectedRole, setSelectedRole] = useState("project_member")
    const [currentUser, setCurrentUser] = useState<any>(null)

    useEffect(() => {
        loadData()
    }, [projectId])

    const loadData = async () => {
        try {
            const currentProject = await fetcher(`/projects/${projectId}`)
            setProject(currentProject)

            const me = await fetcher("/auth/me")
            setCurrentUser(me)

            if (currentProject) {
                // Fetch members
                const membersData = await fetcher(`/projects/${projectId}/members`)
                setMembers(membersData)

                // Fetch org users
                const orgId = localStorage.getItem("org_id") || currentProject.organization_id
                if (orgId) {
                    const orgUsersData = await fetcher(`/organizations/${orgId}/users`)
                    setOrgUsers(orgUsersData)
                }
            }
        } catch (error) {
            console.error("Failed to load project details", error)
        }
    }

    const handleAddMember = async () => {
        if (!selectedUserId) return
        try {
            await fetcher(`/projects/${projectId}/members`, {
                method: 'POST',
                body: JSON.stringify({ user_id: selectedUserId, role: selectedRole })
            })
            setShowAddModal(false)
            setSelectedUserId("")
            setSelectedRole("project_member")
            loadData() // Refresh members
        } catch (error: any) {
            alert(error.message || "Failed to add member")
        }
    }

    const handleUpdateRole = async (userId: string, newRole: string, currentGlobalRole: string) => {
        try {
            if (newRole === 'org_admin') {
                // Promote to org admin globally
                await fetcher(`/organizations/members/${userId}/role`, {
                    method: 'PUT',
                    body: JSON.stringify({ role: 'org_admin' })
                })
            } else {
                // If they were org admin previously, demote them to user
                if (currentGlobalRole === 'org_admin') {
                    await fetcher(`/organizations/members/${userId}/role`, {
                        method: 'PUT',
                        body: JSON.stringify({ role: 'user' })
                    })
                }
                // Update project role
                await fetcher(`/projects/${projectId}/members/${userId}`, {
                    method: 'PUT',
                    body: JSON.stringify({ role: newRole })
                })
            }
            loadData() // Refresh members
        } catch (error: any) {
            alert(error.message || "Failed to update role")
        }
    }

    const handleRemoveMember = async (userId: string) => {
        if (!confirm("Are you sure you want to remove this member?")) return
        try {
            await fetcher(`/projects/${projectId}/members/${userId}`, {
                method: 'DELETE'
            })
            loadData() // Refresh members
        } catch (error: any) {
            alert(error.message || "Failed to remove member")
        }
    }

    // Filter out users who are already members
    const eligibleUsers = orgUsers.filter(ou => !members.some(m => m.user.id === ou.id))

    const isPlatformAdmin = currentUser?.global_role === 'platform_admin'
    const isOrgAdmin = currentUser?.global_role === 'org_admin'
    const currentMemberRole = members.find(m => m.user.id === currentUser?.id)?.role
    const isProjectAdmin = isPlatformAdmin || isOrgAdmin || currentMemberRole === 'project_admin'
    const canManageOrgRoles = isPlatformAdmin || isOrgAdmin

    const canModifyMember = (member: any) => {
        // Users cannot modify their own role
        if (member.user.id === currentUser?.id) return false
        
        if (canManageOrgRoles) return true
        if (!isProjectAdmin) return false
        // project admin can only modify project_members
        if (member.user.global_role === 'org_admin' || member.user.global_role === 'platform_admin') return false
        if (member.role === 'project_admin') return false
        return true
    }

    if (!project) {
        return <div className="p-8 text-neutral-400">Loading project details...</div>
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <header className="flex justify-between items-center py-4 border-b border-neutral-800">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-white flex items-center">
                        <FiDatabase className="mr-3 text-emerald-500" />
                        {project.name}
                    </h1>
                    <p className="text-neutral-400 mt-1 text-sm">Manage project access and members.</p>
                </div>
            </header>

            <Card className="bg-neutral-900 border-neutral-800 text-neutral-50 shadow-xl">
                <CardHeader className="border-b border-neutral-800 bg-neutral-950/50 pb-4 flex flex-row items-center justify-between">
                    <CardTitle className="text-lg flex items-center space-x-2">
                        <FiUsers className="text-emerald-500" />
                        <span>Project Members</span>
                    </CardTitle>
                    {isProjectAdmin && (
                        <button 
                            onClick={() => setShowAddModal(true)}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-2"
                        >
                            <FiUserPlus />
                            <span>Add Member</span>
                        </button>
                    )}
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-neutral-950/30 text-neutral-400">
                                <tr>
                                    <th className="px-6 py-4 font-semibold">User</th>
                                    <th className="px-6 py-4 font-semibold">Email</th>
                                    <th className="px-6 py-4 font-semibold">Role</th>
                                    <th className="px-6 py-4 font-semibold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-800">
                                {members.map((member) => (
                                    <tr key={member.id} className="hover:bg-neutral-800/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-white">{member.user.full_name || 'N/A'}</div>
                                            {member.user.global_role === 'platform_admin' && (
                                                <span className="inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium bg-purple-900/50 text-purple-400 border border-purple-800">Platform Admin</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-neutral-400">{member.user.email}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center space-x-2">
                                                <FiShield className={member.role === 'project_admin' || member.user.global_role === 'org_admin' ? 'text-blue-400' : 'text-neutral-500'} />
                                                {canModifyMember(member) ? (
                                                    <select
                                                        value={member.user.global_role === 'org_admin' ? 'org_admin' : member.role}
                                                        onChange={(e) => handleUpdateRole(member.user.id, e.target.value, member.user.global_role)}
                                                        className="bg-transparent border border-neutral-700 text-white text-sm rounded focus:ring-emerald-500 focus:border-emerald-500 p-1"
                                                    >
                                                        <option value="project_member" className="bg-neutral-900">Project Member</option>
                                                        <option value="project_admin" className="bg-neutral-900">Project Admin</option>
                                                        {(canManageOrgRoles || member.user.global_role === 'org_admin') && (
                                                            <option value="org_admin" className="bg-neutral-900" disabled={!canManageOrgRoles}>Org Admin</option>
                                                        )}
                                                    </select>
                                                ) : (
                                                    <span className="text-white text-sm">
                                                        {member.user.global_role === 'org_admin' ? 'Org Admin' : (member.role === 'project_admin' ? 'Project Admin' : 'Project Member')}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {canModifyMember(member) && member.user.id !== currentUser?.id && (
                                                <button 
                                                    onClick={() => handleRemoveMember(member.user.id)}
                                                    className="text-red-400 hover:text-red-300 transition-colors p-2 rounded-full hover:bg-red-400/10"
                                                    title="Remove Member"
                                                >
                                                    <FiTrash2 size={18} />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {members.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-8 text-center text-neutral-500">
                                            No members found. Add someone to get started.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Add Member Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
                    <div className="bg-neutral-900 border border-neutral-800 rounded-lg shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
                        <div className="flex justify-between items-center p-4 border-b border-neutral-800 bg-neutral-950/50">
                            <h2 className="text-lg font-semibold text-white">Add Project Member</h2>
                            <button onClick={() => setShowAddModal(false)} className="text-neutral-400 hover:text-white transition-colors">
                                <FiX size={20} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-neutral-300 mb-1">Select User</label>
                                <select 
                                    value={selectedUserId}
                                    onChange={(e) => setSelectedUserId(e.target.value)}
                                    className="w-full bg-neutral-950 border border-neutral-700 rounded-md p-2 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                                >
                                    <option value="" disabled>Choose an organization member...</option>
                                    {eligibleUsers.map(u => (
                                        <option key={u.id} value={u.id}>{u.full_name || u.email} ({u.email})</option>
                                    ))}
                                </select>
                                {eligibleUsers.length === 0 && (
                                    <p className="text-xs text-amber-500 mt-1">All organization users are already in this project.</p>
                                )}
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-neutral-300 mb-1">Project Role</label>
                                <select 
                                    value={selectedRole}
                                    onChange={(e) => setSelectedRole(e.target.value)}
                                    className="w-full bg-neutral-950 border border-neutral-700 rounded-md p-2 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                                >
                                    <option value="project_member">Project Member - Can view/edit resources</option>
                                    <option value="project_admin">Project Admin - Can manage members and resources</option>
                                </select>
                            </div>
                        </div>
                        <div className="p-4 border-t border-neutral-800 bg-neutral-950/50 flex justify-end space-x-3">
                            <button onClick={() => setShowAddModal(false)} className="px-4 py-2 text-sm text-neutral-300 hover:text-white transition-colors">
                                Cancel
                            </button>
                            <button 
                                onClick={handleAddMember}
                                disabled={!selectedUserId}
                                className="px-4 py-2 text-sm font-medium bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-md transition-colors"
                            >
                                Add Member
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
