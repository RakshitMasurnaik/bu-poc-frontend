"use client"
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import LogoutButton from './LogoutButton'
import { fetcher } from '@/lib/api'
import { FiPieChart, FiDatabase, FiFileText, FiUsers, FiShield } from 'react-icons/fi'

export default function SideNav({ isExpanded }: { isExpanded: boolean }) {
    const pathname = usePathname()
    const [projects, setProjects] = useState<any[]>([])
    const [selectedProjectId, setSelectedProjectId] = useState<string>("")
    const [isCreating, setIsCreating] = useState(false)
    const [newProjectName, setNewProjectName] = useState("")
    const [user, setUser] = useState<any>(null)
    const [isProjectAdmin, setIsProjectAdmin] = useState(false)

    const [organizations, setOrganizations] = useState<any[]>([])
    const [selectedOrgId, setSelectedOrgId] = useState<string>("")

    const isOrgAdmin = user && (user.global_role === 'platform_admin' || user.global_role === 'org_admin')
    const isPlatformAdmin = user && user.global_role === 'platform_admin'

    useEffect(() => {
        if (pathname === '/login' || pathname === '/register' || pathname === '/activate') return;
        loadUserAndProjects()

        const handleStorage = () => loadUserAndProjects()
        window.addEventListener("storage", handleStorage)
        return () => window.removeEventListener("storage", handleStorage)
    }, [pathname])

    useEffect(() => {
        const checkProjectRole = async () => {
            if (!selectedProjectId || !user) {
                setIsProjectAdmin(false)
                return
            }
            if (isOrgAdmin) {
                setIsProjectAdmin(true)
                return
            }
            try {
                const data = await fetcher(`/projects/${selectedProjectId}/members`)
                const me = data.find((m: any) => m.user.id === user.id)
                setIsProjectAdmin(me?.role === 'project_admin')
            } catch (e) {
                setIsProjectAdmin(false)
            }
        }
        checkProjectRole()
    }, [selectedProjectId, user, isOrgAdmin])

    const loadUserAndProjects = async () => {
        try {
            const userData = await fetcher('/auth/me')
            setUser(userData)
            
            let projData: any[] = []
            
            if (userData.global_role === 'platform_admin') {
                const orgs = await fetcher('/organizations/')
                setOrganizations(orgs)
                
                const storedOrg = localStorage.getItem("org_id")
                let initialOrg = orgs.find((o: any) => o.id === storedOrg) ? storedOrg : (orgs.length > 0 ? orgs[0].id : "")
                setSelectedOrgId(initialOrg)
                if (initialOrg) {
                    localStorage.setItem("org_id", initialOrg)
                    const selectedOrg = orgs.find((o: any) => o.id === initialOrg)
                    projData = selectedOrg ? selectedOrg.projects : []
                }
            } else {
                projData = await fetcher('/projects/')
            }
            
            setProjects(projData)
            
            const stored = localStorage.getItem("project_id")
            if (stored && projData.find((p: any) => p.id === stored)) {
                setSelectedProjectId(stored)
            } else if (projData.length > 0 && userData.global_role !== 'platform_admin') {
                const firstId = projData[0].id
                setSelectedProjectId(firstId)
                localStorage.setItem("project_id", firstId)
            } else {
                localStorage.removeItem("project_id")
                setSelectedProjectId("")
            }
        } catch (e) {
            console.error(e)
        }
    }

    const handleOrgSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const id = e.target.value
        setSelectedOrgId(id)
        localStorage.setItem("org_id", id)
        
        const selectedOrg = organizations.find((o: any) => o.id === id)
        const projData = selectedOrg ? selectedOrg.projects : []
        setProjects(projData)
        
        setSelectedProjectId("")
        localStorage.removeItem("project_id")
        
        window.dispatchEvent(new Event("storage"))
        window.location.reload()
    }

    const handleSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const id = e.target.value
        setSelectedProjectId(id)
        localStorage.setItem("project_id", id)
        window.location.reload()
    }

    const handleCreateProject = async () => {
        if (!newProjectName) return;
        try {
            // For platform admin, creation might need org_id context, but backend uses current_user.organization_id.
            // Wait, platform admin cannot create projects in their own org (None). They should probably not create projects directly here, or we need to pass org_id to the backend.
            // For now, let's keep it simple. If backend uses current_user.organization_id, platform admin creation might fail or create under None.
            const data = await fetcher('/projects/', {
                method: 'POST',
                body: JSON.stringify({ name: newProjectName })
            })
            setProjects([...projects, data])
            setSelectedProjectId(data.id)
            localStorage.setItem("project_id", data.id)
            setIsCreating(false)
            setNewProjectName("")
            window.location.reload()
        } catch(e) {
            alert("Failed to create project")
        }
    }

    if (pathname === '/login' || pathname === '/register' || pathname === '/activate') {
        return null
    }

    return (
        <aside className={`${isExpanded ? 'w-64' : 'w-20'} h-screen bg-neutral-950 border-r border-neutral-800 flex flex-col p-4 fixed left-0 top-0 transition-all duration-300 z-30 overflow-hidden`}>
            <div className="mb-8 flex flex-col h-full">
                <h1 className={`text-xl font-bold tracking-tight text-white mb-6 whitespace-nowrap transition-opacity ${isExpanded ? 'opacity-100' : 'opacity-0'}`}>
                    Data Platform
                </h1>
                
                <div className={`flex flex-col space-y-4 mb-6 ${!isExpanded ? 'hidden' : ''}`}>
                    {!isPlatformAdmin && (
                        <div className="flex flex-col space-y-2">
                            <span className="text-xs text-neutral-400 uppercase tracking-wider font-semibold">Active Project</span>
                            {isCreating ? (
                                <div className="flex flex-col space-y-2">
                                    <input 
                                        autoFocus
                                        value={newProjectName} 
                                        onChange={e => setNewProjectName(e.target.value)} 
                                        className="bg-neutral-900 border border-neutral-700 rounded px-2 py-2 text-sm text-white w-full" 
                                        placeholder="Project Name..." 
                                    />
                                    <div className="flex space-x-2">
                                        <button onClick={handleCreateProject} className="text-emerald-400 text-sm hover:underline">Save</button>
                                        <button onClick={() => setIsCreating(false)} className="text-red-400 text-sm hover:underline">Cancel</button>
                                    </div>
                                </div>
                            ) : (
                                <select 
                                    value={selectedProjectId} 
                                    onChange={handleSelect}
                                    className="bg-neutral-900 border border-neutral-700 text-white text-sm rounded focus:ring-emerald-500 focus:border-emerald-500 block p-2 w-full"
                                >
                                    {projects.length === 0 && <option value="">No projects</option>}
                                    {projects.length > 0 && <option value="">-- Select Project --</option>}
                                    {projects.map((p: any) => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            )}
                            {!isCreating && isOrgAdmin && (
                                <button onClick={() => setIsCreating(true)} className="text-emerald-400 text-sm text-left hover:underline mt-1">+ New Project</button>
                            )}
                        </div>
                    )}
                </div>

                <nav className="flex-1 space-y-2 overflow-y-auto pr-1">
                    {selectedProjectId ? (
                        <>
                            <Link href="/" className={`flex items-center p-2 rounded transition-colors ${pathname === '/' ? 'bg-neutral-800 text-emerald-400' : 'text-neutral-300 hover:bg-neutral-900 hover:text-white'}`}>
                                <span className="w-6 flex justify-center"><FiPieChart size={20} /></span>
                                <span className={`ml-3 whitespace-nowrap transition-opacity ${isExpanded ? 'opacity-100' : 'opacity-0 hidden'}`}>Dashboard</span>
                            </Link>
                            <Link href="/connections" className={`flex items-center p-2 rounded transition-colors ${pathname === '/connections' ? 'bg-neutral-800 text-emerald-400' : 'text-neutral-300 hover:bg-neutral-900 hover:text-white'}`}>
                                <span className="w-6 flex justify-center"><FiDatabase size={20} /></span>
                                <span className={`ml-3 whitespace-nowrap transition-opacity ${isExpanded ? 'opacity-100' : 'opacity-0 hidden'}`}>Connections</span>
                            </Link>
                            <Link href="/schemas" className={`flex items-center p-2 rounded transition-colors ${pathname === '/schemas' ? 'bg-neutral-800 text-emerald-400' : 'text-neutral-300 hover:bg-neutral-900 hover:text-white'}`}>
                                <span className="w-6 flex justify-center"><FiFileText size={20} /></span>
                                <span className={`ml-3 whitespace-nowrap transition-opacity ${isExpanded ? 'opacity-100' : 'opacity-0 hidden'}`}>Schemas</span>
                            </Link>
                        </>
                    ) : (
                        !isPlatformAdmin && (
                            <div className={`p-3 text-sm text-neutral-500 bg-neutral-900/50 rounded border border-neutral-800 border-dashed ${!isExpanded ? 'hidden' : ''}`}>
                                Create or select a project to view resources.
                            </div>
                        )
                    )}

                    {isPlatformAdmin && (
                        <div className={`pt-4 pb-1 transition-opacity ${isExpanded ? 'opacity-100' : 'opacity-0 hidden'}`}>
                            <span className="text-xs text-neutral-400 uppercase tracking-wider font-semibold ml-2 mb-2 block">Organization Management</span>
                            <Link href="/organizations" className={`flex items-center p-2 rounded transition-colors mb-2 ${pathname === '/organizations' ? 'bg-neutral-800 text-emerald-400' : 'text-neutral-300 hover:bg-neutral-900 hover:text-white'}`}>
                                <span className="w-6 flex justify-center"><FiDatabase size={20} /></span>
                                <span className={`ml-3 whitespace-nowrap transition-opacity ${isExpanded ? 'opacity-100' : 'opacity-0 hidden'}`}>All Organizations</span>
                            </Link>

                        </div>
                    )}
                    
                    {(isOrgAdmin || isProjectAdmin) && (
                        <div className={`pt-4 pb-1 transition-opacity ${isExpanded ? 'opacity-100' : 'opacity-0 hidden'}`}>
                            <span className="text-xs text-neutral-400 uppercase tracking-wider font-semibold ml-2">Administration</span>
                        </div>
                    )}
                    
                    {/* Organization Member Invite tab */}
                    {isOrgAdmin && !selectedProjectId && (!isPlatformAdmin || selectedOrgId) && (
                        <Link href="/members" className={`flex items-center p-2 rounded transition-colors ${pathname === '/members' ? 'bg-neutral-800 text-emerald-400' : 'text-neutral-300 hover:bg-neutral-900 hover:text-white'}`}>
                            <span className="w-6 flex justify-center"><FiUsers size={20} /></span>
                            <span className={`ml-3 whitespace-nowrap transition-opacity ${isExpanded ? 'opacity-100' : 'opacity-0 hidden'}`}>
                                {isPlatformAdmin ? "Organization Member Invite" : "Org Members"}
                            </span>
                        </Link>
                    )}

                    {/* Project Add Member tab */}
                    {isProjectAdmin && selectedProjectId && (
                        <Link href={`/projects/${selectedProjectId}`} className={`flex items-center p-2 rounded transition-colors ${pathname.startsWith('/projects/') ? 'bg-neutral-800 text-emerald-400' : 'text-neutral-300 hover:bg-neutral-900 hover:text-white'}`}>
                            <span className="w-6 flex justify-center"><FiShield size={20} /></span>
                            <span className={`ml-3 whitespace-nowrap transition-opacity ${isExpanded ? 'opacity-100' : 'opacity-0 hidden'}`}>
                                {isPlatformAdmin ? "Project Add Member" : "Project Members"}
                            </span>
                        </Link>
                    )}
                </nav>

                <div className={`pt-4 border-t border-neutral-800 ${!isExpanded ? 'hidden' : ''}`}>
                    <LogoutButton />
                </div>
            </div>
        </aside>
    )
}
