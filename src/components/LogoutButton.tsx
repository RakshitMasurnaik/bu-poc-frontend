"use client"
import React from 'react'

export default function LogoutButton() {
    return (
        <button 
            onClick={() => {
                localStorage.removeItem("token");
                window.location.href = '/login';
            }}
            className="w-full text-left block p-3 text-sm text-red-400 font-medium hover:bg-neutral-800 transition-colors rounded-b-md"
        >
            Logout
        </button>
    )
}
