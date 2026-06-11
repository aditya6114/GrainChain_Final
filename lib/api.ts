// Centralized API client for the Express backend.
// Every frontend component calls functions from here — never raw fetch().
// This gives us one place to handle auth tokens, errors, and base URL.

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

// ── Token management ────────────────────────────────────────
// JWT is stored in localStorage. These helpers keep it consistent.

export function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('grainchain_token')
}

export function setToken(token: string) {
  localStorage.setItem('grainchain_token', token)
}

export function clearToken() {
  localStorage.removeItem('grainchain_token')
  localStorage.removeItem('grainchain_user')
}

export function getUser(): { id: string; email: string; name: string; role: string } | null {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem('grainchain_user')
  return raw ? JSON.parse(raw) : null
}

export function setUser(user: { id: string; email: string; name: string; role: string }) {
  localStorage.setItem('grainchain_user', JSON.stringify(user))
}

// ── Core fetch wrapper ──────────────────────────────────────

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken()

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  const data = await res.json()

  if (!res.ok) {
    throw new Error(data.error?.message || data.message || 'Something went wrong')
  }

  return data
}

// ── Auth API ────────────────────────────────────────────────

export const authApi = {
  async register(input: { email: string; password: string; name: string; role: string }) {
    const data = await apiFetch<{
      success: boolean
      data: { user: any; access_token: string; refresh_token: string }
    }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(input),
    })
    setToken(data.data.access_token)
    setUser(data.data.user)
    return data.data
  },

  async login(input: { email: string; password: string }) {
    const data = await apiFetch<{
      success: boolean
      data: { user: any; access_token: string; refresh_token: string }
    }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(input),
    })
    setToken(data.data.access_token)
    setUser(data.data.user)
    return data.data
  },

  logout() {
    clearToken()
  },
}

// ── Donations API ───────────────────────────────────────────

export const donationsApi = {
  async create(input: {
    title: string
    description?: string
    food_type: string
    quantity: number
    quantity_unit: string
    expiry_time: string
    lat: number
    lng: number
    location_text: string
    image_url?: string
  }) {
    const data = await apiFetch<{ success: boolean; data: any }>('/api/donations', {
      method: 'POST',
      body: JSON.stringify(input),
    })
    return data.data
  },

  async getNearby(lat: number, lng: number, radiusKm: number = 5) {
    const data = await apiFetch<{ success: boolean; data: any[] }>(
      `/api/donations?lat=${lat}&lng=${lng}&radius_km=${radiusKm}`,
    )
    return data.data
  },

  async getById(id: string) {
    const data = await apiFetch<{ success: boolean; data: any }>(`/api/donations/${id}`)
    return data.data
  },
}

// ── Claims API ──────────────────────────────────────────────

export const claimsApi = {
  async create(donationId: string) {
    const data = await apiFetch<{ success: boolean; data: any }>('/api/claims', {
      method: 'POST',
      body: JSON.stringify({ donation_id: donationId }),
    })
    return data.data
  },

  async getMyClaims() {
    const data = await apiFetch<{ success: boolean; data: any[] }>('/api/claims/my')
    return data.data
  },

  async getClaimsForDonation(donationId: string) {
    const data = await apiFetch<{ success: boolean; data: any[] }>(
      `/api/claims/donation/${donationId}`,
    )
    return data.data
  },

  async confirm(claimId: string) {
    const data = await apiFetch<{ success: boolean; data: any }>(
      `/api/claims/${claimId}/confirm`,
      { method: 'PATCH' },
    )
    return data.data
  },

  async cancel(claimId: string) {
    const data = await apiFetch<{ success: boolean; data: any }>(
      `/api/claims/${claimId}/cancel`,
      { method: 'PATCH' },
    )
    return data.data
  },
}

// ── Uploads API ─────────────────────────────────────────────

export const uploadsApi = {
  // Step 1: Ask backend for a presigned upload URL.
  // donationId is optional — for donation photos we upload BEFORE the
  // donation exists, then pass the resulting fileUrl as image_url on create.
  async requestUploadUrl(fileName: string, contentType: string, donationId?: string) {
    const data = await apiFetch<{
      uploadUrl: string    // PUT the file here (direct to R2)
      fileUrl: string      // permanent public URL after upload
      key: string          // R2 object key
    }>('/api/uploads/request', {
      method: 'POST',
      body: JSON.stringify({ fileName, contentType, ...(donationId ? { donationId } : {}) }),
    })
    return data
  },

  // Step 2: Upload the file directly to R2 using the presigned URL
  // This does NOT go through our Express server — it goes straight to Cloudflare
  async uploadFile(uploadUrl: string, file: File) {
    const res = await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: { 'Content-Type': file.type },
    })
    if (!res.ok) throw new Error('Upload failed')
  },
}

// ── Volunteer API ───────────────────────────────────────────

export const volunteerApi = {
  async getAvailableTasks() {
    const data = await apiFetch<{ success: boolean; data: any[] }>('/api/volunteer/tasks')
    return data.data
  },

  async getMyTasks() {
    const data = await apiFetch<{ success: boolean; data: any[] }>('/api/volunteer/tasks/my')
    return data.data
  },

  async pickup(taskId: string) {
    const data = await apiFetch<{ success: boolean; data: any }>(
      `/api/volunteer/tasks/${taskId}/pickup`,
      { method: 'PATCH' },
    )
    return data.data
  },

  async deliver(taskId: string) {
    const data = await apiFetch<{ success: boolean; data: any }>(
      `/api/volunteer/tasks/${taskId}/deliver`,
      { method: 'PATCH' },
    )
    return data.data
  },
}
