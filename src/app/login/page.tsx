"use client"
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
    const [isLogin, setIsLogin] = useState(true)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [fullName, setFullName] = useState('')
    const [orgName, setOrgName] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            if (!isLogin) {
                // Register
                const regRes = await fetch("https://bu-poc-backend.onrender.com/api/auth/register", {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email,
                        password,
                        full_name: fullName,
                        organization_name: orgName
                    })
                })
                
                if (!regRes.ok) {
                    const data = await regRes.json()
                    throw new Error(data.detail || "Registration failed")
                }
            }

            // Login (always happens after register or directly if login)
            const params = new URLSearchParams()
            params.append('username', email)
            params.append('password', password)
            
            const loginRes = await fetch("https://bu-poc-backend.onrender.com/api/auth/token", {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: params
            })
            
            if (!loginRes.ok) {
                const data = await loginRes.json()
                throw new Error(data.detail || "Login failed")
            }
            
            const data = await loginRes.json()
            if (data.access_token) {
                localStorage.setItem("token", data.access_token)
                router.push('/')
            }
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-neutral-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans text-neutral-200">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center items-center w-12 h-12 rounded-full bg-emerald-900/30 border border-emerald-500/30 text-emerald-400 mx-auto font-bold text-xl">
                    DB
                </div>
                <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-white">
                    {isLogin ? 'Sign in to your account' : 'Create a new account'}
                </h2>
                <p className="mt-2 text-center text-sm text-neutral-400">
                    Or{' '}
                    <button 
                        onClick={() => { setIsLogin(!isLogin); setError('') }} 
                        className="font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
                    >
                        {isLogin ? 'register for a new organization' : 'sign in to your existing account'}
                    </button>
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-neutral-900 py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-neutral-800">
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        {error && (
                            <div className="bg-red-900/30 border border-red-500/50 text-red-300 px-4 py-3 rounded-md text-sm">
                                {error}
                            </div>
                        )}

                        {!isLogin && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-neutral-300 mb-1">Full Name</label>
                                    <input
                                        required
                                        type="text"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        className="block w-full rounded-md border-0 py-2 px-3 bg-neutral-950 text-white shadow-sm ring-1 ring-inset ring-neutral-800 focus:ring-2 focus:ring-inset focus:ring-emerald-500 sm:text-sm sm:leading-6"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-neutral-300 mb-1">Organization Name</label>
                                    <input
                                        required
                                        type="text"
                                        value={orgName}
                                        onChange={(e) => setOrgName(e.target.value)}
                                        className="block w-full rounded-md border-0 py-2 px-3 bg-neutral-950 text-white shadow-sm ring-1 ring-inset ring-neutral-800 focus:ring-2 focus:ring-inset focus:ring-emerald-500 sm:text-sm sm:leading-6"
                                    />
                                </div>
                            </>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-neutral-300 mb-1">Email address</label>
                            <input
                                required
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="block w-full rounded-md border-0 py-2 px-3 bg-neutral-950 text-white shadow-sm ring-1 ring-inset ring-neutral-800 focus:ring-2 focus:ring-inset focus:ring-emerald-500 sm:text-sm sm:leading-6"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-neutral-300 mb-1">Password</label>
                            <input
                                required
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="block w-full rounded-md border-0 py-2 px-3 bg-neutral-950 text-white shadow-sm ring-1 ring-inset ring-neutral-800 focus:ring-2 focus:ring-inset focus:ring-emerald-500 sm:text-sm sm:leading-6"
                            />
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex w-full justify-center rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 transition-colors disabled:opacity-50"
                            >
                                {loading ? 'Processing...' : isLogin ? 'Sign in' : 'Create Account'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}
