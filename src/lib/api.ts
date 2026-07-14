export const API_URL = "https://bu-poc-backend.onrender.com/api"

export async function fetcher(endpoint: string, options: RequestInit = {}) {
    let token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
    
    // Redirect to login if no token and not on auth pages
    if (!token && typeof window !== 'undefined') {
        const path = window.location.pathname;
        if (path !== '/login' && path !== '/register') {
            window.location.href = '/login';
            throw new Error("Not authenticated");
        }
    }

    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...options.headers as Record<string, string>,
    };
    
    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }
    
    let projectId = typeof window !== 'undefined' ? localStorage.getItem("project_id") : null;
    if (projectId) {
        headers["X-Project-Id"] = projectId;
    }
    
    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers
    });
    
    if (!response.ok) {
        if (response.status === 401 && typeof window !== 'undefined') {
            localStorage.removeItem("token");
            window.location.href = '/login';
        }
        const error = await response.json().catch(() => ({}));
        throw new Error(error.detail || "API Request Failed");
    }
    
    return response.json();
}
