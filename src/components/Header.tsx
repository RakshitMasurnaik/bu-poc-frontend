"use client"
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { FiMenu, FiSearch, FiUser } from 'react-icons/fi'
import LogoutButton from './LogoutButton'
import { fetcher } from '@/lib/api'

export default function Header({ toggleSidebar, isSidebarExpanded }: { toggleSidebar: () => void, isSidebarExpanded: boolean }) {
    const [time, setTime] = useState<Date | null>(null)
    const [organizations, setOrganizations] = useState<any[]>([])
    const [selectedOrgId, setSelectedOrgId] = useState<string>("")

    useEffect(() => {
        setTime(new Date())
        const timer = setInterval(() => setTime(new Date()), 1000)
        return () => clearInterval(timer)
    }, [])

    useEffect(() => {
        const loadOrganizations = async () => {
            try {
                const data = await fetcher('/organizations/')
                setOrganizations(data)
                const savedOrgId = localStorage.getItem('org_id')
                if (savedOrgId && data.find((o: any) => o.id === savedOrgId)) {
                    setSelectedOrgId(savedOrgId)
                } else if (data.length > 0) {
                    setSelectedOrgId(data[0].id)
                    localStorage.setItem('org_id', data[0].id)
                    window.dispatchEvent(new Event('storage'))
                }
            } catch (error) {
                console.error("Failed to load organizations for header:", error)
            }
        }
        
        loadOrganizations()
        window.addEventListener("storage", loadOrganizations)
        return () => window.removeEventListener("storage", loadOrganizations)
    }, [])

    const handleOrgChange = (orgId: string) => {
        setSelectedOrgId(orgId)
        localStorage.setItem('org_id', orgId)
        localStorage.removeItem('project_id')
        window.dispatchEvent(new Event('storage'))
        if (window.location.pathname.startsWith('/projects/')) {
            window.location.href = '/'
        }
    }

    return (
        <header className="h-16 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between px-4 sticky top-0 z-20">
            <div className="flex items-center space-x-4">
                <button 
                    onClick={toggleSidebar} 
                    className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-md transition-colors"
                >
                    <FiMenu size={20} />
                </button>
                {/* Global Search */}
                <div className="relative hidden md:block w-64">
                    <FiSearch className="absolute left-2.5 top-2.5 text-neutral-500" size={16} />
                    <input 
                        type="text" 
                        placeholder="Search globally..." 
                        className="w-full bg-neutral-900 border border-neutral-800 text-sm text-neutral-200 rounded-full pl-9 pr-4 py-2 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                    />
                </div>
                
                {/* Organization Switcher */}
                {organizations.length > 1 && (
                    <div className="relative ml-4">
                        <select
                            value={selectedOrgId}
                            onChange={(e) => handleOrgChange(e.target.value)}
                            className="bg-neutral-900 border border-neutral-800 text-sm text-neutral-200 rounded-md px-3 py-1.5 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all cursor-pointer appearance-none"
                            style={{ paddingRight: '2rem' }}
                        >
                            {organizations.map(org => (
                                <option key={org.id} value={org.id}>
                                    {org.name}
                                </option>
                            ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-neutral-500">
                            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                        </div>
                    </div>
                )}
            </div>

            <div className="flex items-center space-x-6">
                {/* Real-time Clock */}
                {time && (
                    <div className="flex space-x-4 text-xs text-neutral-400 font-mono">
                        <div className="flex flex-col items-end">
                            <span className="text-white">{time.toLocaleTimeString('en-US', { timeZone: 'America/New_York', hour: '2-digit', minute:'2-digit' })}</span>
                            <span>EST</span>
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="text-white">{time.toLocaleTimeString('en-US', { timeZone: 'Europe/London', hour: '2-digit', minute:'2-digit' })}</span>
                            <span>GMT</span>
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="text-white">{time.toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute:'2-digit' })}</span>
                            <span>IST</span>
                        </div>
                    </div>
                )}

                {/* Profile Icon */}
                <div className="relative group cursor-pointer">
                    <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center border border-neutral-700 hover:border-emerald-500 transition-colors">
                        <FiUser size={16} className="text-neutral-300" />
                    </div>
                    {/* Dropdown wrapper with padding to bridge the hover gap */}
                    <div className="absolute right-0 pt-2 w-48 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity z-50">
                        <div className="bg-neutral-900 border border-neutral-800 rounded-md shadow-xl flex flex-col overflow-hidden">
                            <Link href="/profile" className="block p-3 hover:bg-neutral-800 transition-colors">
                                <p className="text-sm text-white font-medium">My Profile</p>
                                <p className="text-xs text-neutral-500">View settings</p>
                            </Link>
                            <div className="border-t border-neutral-800 bg-neutral-900">
                                <LogoutButton />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    )
}
