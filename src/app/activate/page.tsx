"use client"

import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { FiCheckCircle, FiAlertCircle } from "react-icons/fi"

function ActivateForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const token = searchParams.get("token")

    const [fullName, setFullName] = useState("")
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [success, setSuccess] = useState(false)

    if (!token) {
        return (
            <div className="flex flex-col items-center justify-center space-y-4">
                <FiAlertCircle size={48} className="text-red-500" />
                <h2 className="text-xl font-semibold text-white">Invalid Activation Link</h2>
                <p className="text-neutral-400">The activation token is missing from the URL.</p>
            </div>
        )
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")

        if (password !== confirmPassword) {
            setError("Passwords do not match")
            return
        }

        if (password.length < 8) {
            setError("Password must be at least 8 characters long")
            return
        }

        setLoading(true)
        try {
            const res = await fetch("http://localhost:8000/api/auth/activate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    token,
                    full_name: fullName,
                    password
                })
            })

            const data = await res.json()
            if (!res.ok) {
                throw new Error(data.detail || "Activation failed")
            }

            setSuccess(true)
            setTimeout(() => {
                router.push("/login")
            }, 3000)

        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    if (success) {
        return (
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
                <FiCheckCircle size={48} className="text-emerald-500" />
                <h2 className="text-2xl font-bold text-white">Account Activated!</h2>
                <p className="text-neutral-400">Your account has been successfully created.</p>
                <p className="text-sm text-neutral-500">Redirecting to login in a few seconds...</p>
            </div>
        )
    }

    return (
        <div className="w-full max-w-md space-y-8">
            <div className="text-center">
                <h2 className="text-3xl font-bold tracking-tight text-white">Activate Account</h2>
                <p className="mt-2 text-sm text-neutral-400">
                    Welcome to the organization! Please set up your profile.
                </p>
            </div>
            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                {error && (
                    <div className="p-3 text-sm text-red-500 bg-red-950/30 border border-red-900 rounded-md">
                        {error}
                    </div>
                )}
                <div className="space-y-4 rounded-md shadow-sm">
                    <div>
                        <label className="block text-sm font-medium text-neutral-300">Full Name</label>
                        <input
                            type="text"
                            required
                            className="mt-1 block w-full rounded-md border-neutral-700 bg-neutral-900 px-3 py-2 text-white focus:border-emerald-500 focus:outline-none focus:ring-emerald-500 sm:text-sm"
                            placeholder="John Doe"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-neutral-300">Password</label>
                        <input
                            type="password"
                            required
                            className="mt-1 block w-full rounded-md border-neutral-700 bg-neutral-900 px-3 py-2 text-white focus:border-emerald-500 focus:outline-none focus:ring-emerald-500 sm:text-sm"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-neutral-300">Confirm Password</label>
                        <input
                            type="password"
                            required
                            className="mt-1 block w-full rounded-md border-neutral-700 bg-neutral-900 px-3 py-2 text-white focus:border-emerald-500 focus:outline-none focus:ring-emerald-500 sm:text-sm"
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                    </div>
                </div>

                <div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="group relative flex w-full justify-center rounded-md border border-transparent bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:bg-emerald-800 disabled:cursor-not-allowed"
                    >
                        {loading ? "Activating..." : "Activate Account"}
                    </button>
                </div>
            </form>
        </div>
    )
}

export default function ActivatePage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-black py-12 px-4 sm:px-6 lg:px-8">
            <Suspense fallback={<div className="text-white">Loading...</div>}>
                <ActivateForm />
            </Suspense>
        </div>
    )
}
