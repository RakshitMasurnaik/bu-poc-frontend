"use client"
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { FiMenu, FiSearch, FiUser } from 'react-icons/fi'
import LogoutButton from './LogoutButton'

export default function Header({ toggleSidebar, isSidebarExpanded }: { toggleSidebar: () => void, isSidebarExpanded: boolean }) {
    const [time, setTime] = useState<Date | null>(null)

    useEffect(() => {
        setTime(new Date())
        const timer = setInterval(() => setTime(new Date()), 1000)
        return () => clearInterval(timer)
    }, [])

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
