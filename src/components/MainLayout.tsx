"use client"
import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import SideNav from './SideNav'
import Header from './Header'

export default function MainLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const isAuth = pathname === '/login' || pathname === '/register'
    const [hasProject, setHasProject] = useState<boolean>(true) 
    const [isSidebarExpanded, setIsSidebarExpanded] = useState<boolean>(true)

    useEffect(() => {
        if (isAuth) return;
        
        const checkProject = () => {
            const pid = localStorage.getItem("project_id")
            setHasProject(!!pid)
        }
        
        checkProject()
        window.addEventListener("storage", checkProject)
        
        const interval = setInterval(checkProject, 500)
        return () => {
            window.removeEventListener("storage", checkProject)
            clearInterval(interval)
        }
    }, [isAuth])

    if (isAuth) {
        return <>{children}</>
    }

    return (
        <div className="flex min-h-screen">
            <SideNav isExpanded={isSidebarExpanded} />
            <div className={`flex-1 flex flex-col transition-all duration-300 ${isSidebarExpanded ? 'ml-64' : 'ml-20'}`}>
                <Header toggleSidebar={() => setIsSidebarExpanded(!isSidebarExpanded)} isSidebarExpanded={isSidebarExpanded} />
                <main className="flex-1 p-6">
                    {hasProject ? (
                        children
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-neutral-500 space-y-4 pt-20">
                            <div className="text-6xl text-neutral-700">📂</div>
                            <h2 className="text-xl font-semibold text-neutral-300">No Project Selected</h2>
                            <p>Please create or select a project from the sidebar to continue.</p>
                        </div>
                    )}
                </main>
            </div>
        </div>
    )
}
