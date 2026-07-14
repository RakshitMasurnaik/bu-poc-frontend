"use client"
import { useState, useEffect } from "react"
import { fetcher } from "@/lib/api"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { FiUser, FiMail, FiCalendar } from 'react-icons/fi'

export default function ProfilePage() {
    const [user, setUser] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetcher("/auth/me")
            .then(data => {
                setUser(data)
                setLoading(false)
            })
            .catch(err => {
                console.error(err)
                setLoading(false)
            })
    }, [])

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64 text-neutral-500">
                Loading profile...
            </div>
        )
    }

    if (!user) {
        return (
            <div className="flex justify-center items-center h-64 text-red-500">
                Failed to load profile. Please try logging in again.
            </div>
        )
    }

    const joinDate = new Date(user.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    })

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <header className="flex justify-between items-center py-4 border-b border-neutral-800">
                <h1 className="text-2xl font-bold tracking-tight text-white">My Profile</h1>
            </header>

            <Card className="bg-neutral-900 border-neutral-800 text-neutral-50 shadow-xl overflow-hidden">
                <div className="h-32 bg-gradient-to-r from-emerald-900/50 to-blue-900/50 w-full relative">
                    <div className="absolute -bottom-12 left-6">
                        <div className="w-24 h-24 bg-neutral-800 rounded-full border-4 border-neutral-900 flex items-center justify-center shadow-lg">
                            <FiUser size={40} className="text-emerald-500" />
                        </div>
                    </div>
                </div>
                <CardContent className="pt-16 pb-8 px-8">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-3xl font-bold text-white mb-1">{user.full_name}</h2>
                            <div className="flex items-center text-neutral-400 space-x-4 mt-4">
                                <div className="flex items-center space-x-2">
                                    <FiMail size={16} />
                                    <span>{user.email}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <FiCalendar size={16} />
                                    <span>Joined {joinDate}</span>
                                </div>
                            </div>
                        </div>
                        <div>
                            <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-xs font-semibold tracking-wide uppercase">
                                Active Member
                            </span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <Card className="bg-neutral-900 border-neutral-800 text-neutral-50 shadow-lg">
                    <CardHeader>
                        <CardTitle className="text-lg">Account Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm text-neutral-300">
                        <div className="flex justify-between py-2 border-b border-neutral-800/50">
                            <span className="text-neutral-500">User ID</span>
                            <span className="font-mono text-xs">{user.id}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-neutral-800/50">
                            <span className="text-neutral-500">Organization ID</span>
                            <span className="font-mono text-xs">{user.organization_id}</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-neutral-900 border-neutral-800 text-neutral-50 shadow-lg">
                    <CardHeader>
                        <CardTitle className="text-lg">Security & Preferences</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-neutral-400 leading-relaxed">
                            To update your password or change your personal information, please contact your organization administrator.
                        </p>
                        <button className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded transition-colors text-sm font-medium border border-neutral-700">
                            Request Password Reset
                        </button>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
