/**
 * Smart Water Pump Monitoring System (SWPMS) - API Service Client
 * Full integration client connecting all Fastify v5 REST endpoints & SSE Stream
 */

export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('swpms_backend_url')
    if (stored && stored.trim()) {
      return stored.trim().replace(/\/+$/, '')
    }
  }
  const envUrl = import.meta.env.VITE_API_BASE_URL
  if (envUrl && envUrl.trim()) {
    return envUrl.trim().replace(/\/+$/, '')
  }
  if (typeof window !== 'undefined' && window.location.hostname) {
    const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:'
    return `${protocol}//${window.location.hostname}:3000`
  }
  return 'http://localhost:3000'
}

export const API_BASE_URL = getApiBaseUrl()

const TOKEN_KEY = 'swpms_access_token'
const REFRESH_TOKEN_KEY = 'swpms_refresh_token'
const USER_KEY = 'swpms_user'

export interface ApiUser {
  id: string
  email: string
  full_name: string
  role: 'SUPER_ADMIN' | 'OPERATOR' | 'ENGINEER' | 'VIEWER'
  permissions: string[]
  site_id?: string | null
}

export interface ApiResponse<T = any> {
  success: boolean
  data: T
  meta?: {
    page: number
    page_size: number
    total: number
    total_pages: number
  }
  error?: {
    code: string
    message: string
    details?: any
  }
}

// Token management
export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(TOKEN_KEY)
}

export function setStoredToken(token: string) {
  if (typeof window === 'undefined') return
  localStorage.setItem(TOKEN_KEY, token)
}

export function getStoredRefreshToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(REFRESH_TOKEN_KEY)
}

export function setStoredRefreshToken(token: string) {
  if (typeof window === 'undefined') return
  localStorage.setItem(REFRESH_TOKEN_KEY, token)
}

export function removeStoredToken() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

export function getStoredUser(): ApiUser | null {
  if (typeof window === 'undefined') return null
  const user = localStorage.getItem(USER_KEY)
  return user ? JSON.parse(user) : null
}

export function setStoredUser(user: ApiUser) {
  if (typeof window === 'undefined') return
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

// Silent Refresh Coordinator (prevents parallel refresh stampedes)
let activeRefreshPromise: Promise<string | null> | null = null

async function performTokenRefresh(): Promise<string | null> {
  const refreshToken = getStoredRefreshToken()
  if (!refreshToken) {
    removeStoredToken()
    return null
  }

  try {
    const baseUrl = getApiBaseUrl()
    const res = await fetch(`${baseUrl}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    })

    if (!res.ok) {
      removeStoredToken()
      return null
    }

    const json = await res.json()
    if (json?.success && json?.data?.access_token) {
      setStoredToken(json.data.access_token)
      if (json.data.refresh_token) {
        setStoredRefreshToken(json.data.refresh_token)
      }
      if (json.data.user) {
        setStoredUser(json.data.user)
      }
      return json.data.access_token
    }

    removeStoredToken()
    return null
  } catch {
    // If backend is momentarily unreachable, don't destroy tokens immediately
    return null
  }
}

// Generic Fetch Wrapper with Automatic Refresh and Retry
async function request<T = any>(
  endpoint: string,
  options: RequestInit = {},
  isRetry = false
): Promise<ApiResponse<T>> {
  const isAuthEndpoint =
    endpoint.includes('/auth/login') ||
    endpoint.includes('/auth/refresh') ||
    endpoint.includes('/auth/signup') ||
    endpoint.includes('/auth/register')

  const token = getStoredToken()
  const headers = new Headers(options.headers || {})

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const baseUrl = getApiBaseUrl()
  const url = `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    })

    // If 401 Unauthorized occurs, attempt silent token refresh and retry once
    if (response.status === 401) {
      if (!isAuthEndpoint && !isRetry && getStoredRefreshToken()) {
        if (!activeRefreshPromise) {
          activeRefreshPromise = performTokenRefresh().finally(() => {
            activeRefreshPromise = null
          })
        }

        const newToken = await activeRefreshPromise
        if (newToken) {
          const retryHeaders = new Headers(options.headers || {})
          if (!retryHeaders.has('Content-Type') && !(options.body instanceof FormData)) {
            retryHeaders.set('Content-Type', 'application/json')
          }
          retryHeaders.set('Authorization', `Bearer ${newToken}`)
          return request<T>(endpoint, { ...options, headers: retryHeaders }, true)
        }
      }

      if (!isAuthEndpoint) {
        removeStoredToken()
      }
    }

    const json = await response.json().catch(() => ({
      success: false,
      error: { code: 'NETWORK_ERROR', message: `HTTP ${response.status} ${response.statusText}` },
    }))

    if (!response.ok) {
      return {
        success: false,
        data: null as any,
        error: json.error || { code: `HTTP_${response.status}`, message: json.message || 'Request failed' },
      }
    }

    if (json && typeof json === 'object' && 'data' in json && 'success' in json) {
      return json as ApiResponse<T>
    }

    return {
      success: true,
      data: json as T,
    }
  } catch (err: any) {
    return {
      success: false,
      data: null as any,
      error: {
        code: 'CONNECTION_ERROR',
        message: err?.message || 'Tidak dapat terhubung ke server backend.',
      },
    }
  }
}

// API Module Definitions
export const api = {
  // 1. Health Endpoints
  health: {
    getHealth: () => request<{ status: string; timestamp: string; service: string }>('/health'),
    getLive: () => request<{ live: boolean }>('/health/live'),
    getReady: () =>
      request<{ ready: boolean; database: boolean; mqtt: { connected: boolean } }>('/health/ready'),
  },

  // 2. Authentication Endpoints
  auth: {
    login: async (credentials: { email: string; password: string }) => {
      const res = await request<{
        access_token: string
        refresh_token?: string
        token_type: string
        expires_in: string
        user: ApiUser
      }>('/api/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      })
      if (res.success && res.data?.access_token) {
        setStoredToken(res.data.access_token)
        if (res.data.refresh_token) {
          setStoredRefreshToken(res.data.refresh_token)
        }
        setStoredUser(res.data.user)
      }
      return res
    },
    register: async (userData: {
      email: string
      full_name: string
      password: string
      role?: string
      site_id?: string
    }) => {
      const res = await request<{
        access_token: string
        refresh_token?: string
        token_type: string
        expires_in: string
        user: ApiUser
      }>('/api/v1/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      })
      if (res.success && res.data?.access_token) {
        setStoredToken(res.data.access_token)
        if (res.data.refresh_token) {
          setStoredRefreshToken(res.data.refresh_token)
        }
        setStoredUser(res.data.user)
      }
      return res
    },
    signup: async (userData: {
      email: string
      full_name: string
      password: string
      role?: string
      site_id?: string
    }) => {
      const res = await request<{
        access_token: string
        refresh_token?: string
        token_type: string
        expires_in: string
        user: ApiUser
      }>('/api/v1/auth/signup', {
        method: 'POST',
        body: JSON.stringify(userData),
      })
      if (res.success && res.data?.access_token) {
        setStoredToken(res.data.access_token)
        if (res.data.refresh_token) {
          setStoredRefreshToken(res.data.refresh_token)
        }
        setStoredUser(res.data.user)
      }
      return res
    },
    refresh: async (customRefreshToken?: string) => {
      const rt = customRefreshToken || getStoredRefreshToken()
      if (!rt) {
        return {
          success: false,
          data: null as any,
          error: { code: 'AUTH_UNAUTHORIZED', message: 'Tidak ada refresh token.' },
        }
      }
      const res = await request<{
        access_token: string
        refresh_token?: string
        token_type: string
        expires_in: string
        user: ApiUser
      }>('/api/v1/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({ refresh_token: rt }),
      })
      if (res.success && res.data?.access_token) {
        setStoredToken(res.data.access_token)
        if (res.data.refresh_token) {
          setStoredRefreshToken(res.data.refresh_token)
        }
        if (res.data.user) {
          setStoredUser(res.data.user)
        }
      }
      return res
    },
    me: async () => {
      const res = await request<ApiUser>('/api/v1/auth/me')
      if (res.success && res.data) {
        setStoredUser(res.data)
      }
      return res
    },
    logout: async () => {
      const res = await request<{ message: string }>('/api/v1/auth/logout', { method: 'POST' })
      removeStoredToken()
      return res
    },
  },

  // 2b. User Management Endpoints
  users: {
    list: (params?: { role?: string; search?: string; page?: number; page_size?: number }) => {
      const q = new URLSearchParams()
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          if (v !== undefined && v !== null && v !== '') q.append(k, String(v))
        })
      }
      return request<any[]>(`/api/v1/users?${q.toString()}`)
    },
    get: (id: string) => request<any>(`/api/v1/users/${id}`),
    create: (data: {
      email: string
      full_name: string
      password: string
      role: string
      site_id?: string
      phone?: string
    }) => request<any>('/api/v1/users', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) =>
      request<any>(`/api/v1/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) => request<any>(`/api/v1/users/${id}`, { method: 'DELETE' }),
    getRoles: () =>
      request<Array<{ role: string; label: string; permissions: string[] }>>('/api/v1/users/roles'),
  },

  // 3. Dashboard KPI Summary & Historical Telemetry
  dashboard: {
    getSummary: () =>
      request<{
        sites: number
        devices: { total: number; online: number; offline: number; stale: number }
        pumps: {
          total: number
          running: number
          stopped: number
          fault: number
          offline: number
          commanding: number
        }
        alarms: { active: number; critical: number; high: number; medium: number; low: number }
      }>('/api/v1/dashboard/summary'),
    getHistoricalTelemetry: (params?: {
      area_id?: string
      site_id?: string
      timeframe?: '24h' | '7d' | '30d' | '1y' | 'custom'
      from?: string
      to?: string
    }) => {
      const q = new URLSearchParams()
      if (params?.area_id) q.append('area_id', params.area_id)
      if (params?.site_id) q.append('site_id', params.site_id)
      if (params?.timeframe) q.append('timeframe', params.timeframe)
      if (params?.from) q.append('from', params.from)
      if (params?.to) q.append('to', params.to)
      return request<{
        area_id: string
        timeframe: string
        from: string
        to: string
        points: Array<{
          timestamp: string
          label: string
          full_label: string
          flow: number
          pressure: number
          power: number
          temp: number
        }>
        summary: Record<string, { min: number; max: number; avg: number; total?: number; unit: string }>
      }>(`/api/v1/dashboard/historical-telemetry?${q.toString()}`)
    },
  },

  // 4. Sites Management
  sites: {
    list: () => request<any[]>('/api/v1/sites'),
    get: (id: string) => request<any>(`/api/v1/sites/${id}`),
    create: (data: any) => request<any>('/api/v1/sites', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) =>
      request<any>(`/api/v1/sites/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) => request<any>(`/api/v1/sites/${id}`, { method: 'DELETE' }),
  },

  // 5. Areas / Pump Rooms
  areas: {
    list: (siteId?: string) =>
      request<any[]>(`/api/v1/areas${siteId ? `?site_id=${siteId}` : ''}`),
    get: (id: string) => request<any>(`/api/v1/areas/${id}`),
    create: (data: { site_id: string; code: string; name: string; description?: string }) =>
      request<any>('/api/v1/areas', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) =>
      request<any>(`/api/v1/areas/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) => request<any>(`/api/v1/areas/${id}`, { method: 'DELETE' }),
    getSensors: (id: string) => request<any[]>(`/api/v1/areas/${id}/sensors`),
  },

  // 6. Assets & Pumps Management
  assets: {
    list: (params?: { site_id?: string; area_id?: string; asset_type?: string; status?: string; search?: string; page?: number; page_size?: number }) => {
      const q = new URLSearchParams()
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          if (v !== undefined && v !== null && v !== '') q.append(k, String(v))
        })
      }
      return request<any[]>(`/api/v1/assets?${q.toString()}`)
    },
    get: (id: string) => request<any>(`/api/v1/assets/${id}`),
    create: (data: {
      site_id: string
      area_id?: string
      device_id?: string
      code: string
      name: string
      asset_type?: string
      asset_subtype?: string
      metadata?: any
    }) => request<any>('/api/v1/assets', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) =>
      request<any>(`/api/v1/assets/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) => request<any>(`/api/v1/assets/${id}`, { method: 'DELETE' }),
    getState: (id: string) => request<any>(`/api/v1/assets/${id}/state`),
    getControl: (id: string) => request<any>(`/api/v1/assets/${id}/control`),
    issuePowerCommand: (
      id: string,
      data: { desired_state: 'ON' | 'OFF'; confirmation: boolean; note?: string; idempotency_key?: string }
    ) =>
      request<{
        command_id: string
        status: string
        desired_state: string
        requested_at: string
        timeout_at: string
      }>(`/api/v1/assets/${id}/commands/power`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    getCommands: (id: string, page = 1, pageSize = 20) =>
      request<any[]>(`/api/v1/assets/${id}/commands?page=${page}&page_size=${pageSize}`),
    getSensors: (id: string) => request<any[]>(`/api/v1/assets/${id}/sensors`),
    getEvents: (id: string, page = 1, pageSize = 20) =>
      request<any[]>(`/api/v1/assets/${id}/events?page=${page}&page_size=${pageSize}`),
  },

  // 7. Sensors & Dynamic Bindings
  sensors: {
    list: (params?: { site_id?: string; sensor_type?: string; search?: string; page?: number; page_size?: number }) => {
      const q = new URLSearchParams()
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          if (v !== undefined && v !== null && v !== '') q.append(k, String(v))
        })
      }
      return request<any[]>(`/api/v1/sensors?${q.toString()}`)
    },
    getTopology: (siteId?: string) =>
      request<{
        site: { id: string; code: string; name: string }
        areas: Array<{
          id: string
          code: string
          name: string
          assets: Array<{
            id: string
            code: string
            name: string
            type: string
            status: string
            capabilities: any
            sensors: Array<{ code: string; label: string; metric_code: string; unit: string; value: any }>
          }>
          area_sensors: Array<{ code: string; label: string; unit: string; value: any }>
        }>
      }>(`/api/v1/sensors/topology${siteId ? `?site_id=${siteId}` : ''}`),
    get: (id: string) => request<any>(`/api/v1/sensors/${id}`),
    create: (data: {
      site_id: string
      device_id?: string
      code: string
      name: string
      sensor_type: string
      metric_code: string
      unit?: string
      config?: any
    }) => request<any>('/api/v1/sensors', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) =>
      request<any>(`/api/v1/sensors/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) => request<any>(`/api/v1/sensors/${id}`, { method: 'DELETE' }),
    getBinding: (id: string) => request<any>(`/api/v1/sensors/${id}/binding`),
    bind: (
      id: string,
      data: { asset_id?: string; area_id?: string; role?: string; effective_from?: string }
    ) => request<any>(`/api/v1/sensors/${id}/binding`, { method: 'PUT', body: JSON.stringify(data) }),
    unbind: (id: string) => request<any>(`/api/v1/sensors/${id}/binding`, { method: 'DELETE' }),
  },

  // 8. MQTT Gateways / Devices
  devices: {
    list: (params?: { site_id?: string; status?: string; search?: string; page?: number; page_size?: number }) => {
      const q = new URLSearchParams()
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          if (v !== undefined && v !== null && v !== '') q.append(k, String(v))
        })
      }
      return request<any[]>(`/api/v1/devices?${q.toString()}`)
    },
    get: (id: string) => request<any>(`/api/v1/devices/${id}`),
    create: (data: {
      site_id: string
      area_id?: string
      code: string
      name: string
      device_type?: string
      firmware_version?: string
      config?: any
      mqtt_username?: string
      mqtt_password?: string
    }) => request<any>('/api/v1/devices', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) =>
      request<any>(`/api/v1/devices/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) => request<any>(`/api/v1/devices/${id}`, { method: 'DELETE' }),
    getHealth: (id: string) =>
      request<{
        device: any
        health: {
          calculated_status: 'ONLINE' | 'STALE' | 'OFFLINE'
          last_seen_diff_seconds: number
          online_threshold_seconds: number
          offline_timeout_seconds: number
          is_healthy: boolean
        }
      }>(`/api/v1/devices/${id}/health`),
    getEvents: (id: string, page = 1, pageSize = 20) =>
      request<any[]>(`/api/v1/devices/${id}/events?page=${page}&page_size=${pageSize}`),
  },

  // 9. Telemetry & Time-Series History
  telemetry: {
    getAssetTelemetry: (
      assetId: string,
      params?: { from?: string; to?: string; metrics?: string; granularity?: string }
    ) => {
      const q = new URLSearchParams()
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          if (v) q.append(k, String(v))
        })
      }
      return request<{
        asset_id: string
        asset_code: string
        from: string
        to: string
        granularity: string
        metrics: Array<{ code: string; unit: string; points: [string, number][] }>
      }>(`/api/v1/assets/${assetId}/telemetry?${q.toString()}`)
    },
    getSiteTelemetry: (
      siteId: string,
      params?: { from?: string; to?: string; metrics?: string }
    ) => {
      const q = new URLSearchParams()
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          if (v) q.append(k, String(v))
        })
      }
      return request<any>(`/api/v1/sites/${siteId}/telemetry?${q.toString()}`)
    },
  },

  // 10. Alarms & Alarm Rules
  alarms: {
    list: (params?: { site_id?: string; asset_id?: string; status?: string; severity?: string; search?: string; page?: number; page_size?: number }) => {
      const q = new URLSearchParams()
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          if (v !== undefined && v !== null && v !== '') q.append(k, String(v))
        })
      }
      return request<any[]>(`/api/v1/alarms?${q.toString()}`)
    },
    get: (id: string) => request<any>(`/api/v1/alarms/${id}`),
    acknowledge: (id: string, note?: string) =>
      request<any>(`/api/v1/alarms/${id}/acknowledge`, {
        method: 'POST',
        body: JSON.stringify({ note }),
      }),
    resolve: (id: string, reason: string) =>
      request<any>(`/api/v1/alarms/${id}/resolve`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      }),
  },

  // 11. Alarm Rules
  alarmRules: {
    list: (params?: { site_id?: string; asset_id?: string; metric_code?: string; is_enabled?: boolean }) => {
      const q = new URLSearchParams()
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          if (v !== undefined && v !== null && v !== '') q.append(k, String(v))
        })
      }
      return request<any[]>(`/api/v1/alarm-rules?${q.toString()}`)
    },
    get: (id: string) => request<any>(`/api/v1/alarm-rules/${id}`),
    create: (data: {
      site_id?: string
      asset_id?: string
      area_id?: string
      code: string
      name: string
      metric_code: string
      condition: string
      threshold: number
      severity: string
      debounce_seconds?: number
      is_enabled?: boolean
      description?: string
    }) => request<any>('/api/v1/alarm-rules', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) =>
      request<any>(`/api/v1/alarm-rules/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) => request<any>(`/api/v1/alarm-rules/${id}`, { method: 'DELETE' }),
    enable: (id: string) => request<any>(`/api/v1/alarm-rules/${id}/enable`, { method: 'POST' }),
    disable: (id: string) => request<any>(`/api/v1/alarm-rules/${id}/disable`, { method: 'POST' }),
  },

  // 12. Audit Logs & System Events
  audit: {
    list: (params?: { user_id?: string; entity_type?: string; action?: string; page?: number; page_size?: number }) => {
      const q = new URLSearchParams()
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          if (v !== undefined && v !== null && v !== '') q.append(k, String(v))
        })
      }
      return request<any[]>(`/api/v1/audit-logs?${q.toString()}`)
    },
  },

  events: {
    list: (params?: { site_id?: string; asset_id?: string; device_id?: string; event_type?: string; page?: number; page_size?: number }) => {
      const q = new URLSearchParams()
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          if (v !== undefined && v !== null && v !== '') q.append(k, String(v))
        })
      }
      return request<any[]>(`/api/v1/events?${q.toString()}`)
    },
  },

  metrics: {
    list: () => request<any[]>('/api/v1/metrics'),
  },

  reports: {
    summary: (siteId: string, from?: string, to?: string) => {
      const q = new URLSearchParams()
      if (from) q.append('from', from)
      if (to) q.append('to', to)
      return request<any>(`/api/v1/reports/summary/${siteId}?${q.toString()}`)
    },
  },
}

// 13. Server-Sent Events (SSE) Realtime Stream Manager
export interface SSEOptions {
  siteId?: string
  token?: string
  onOpen?: () => void
  onMessage?: (event: { event: string; data: any }) => void
  onError?: (err: any) => void
}

export function subscribeRealtimeSSE(options: SSEOptions): () => void {
  const token = options.token || getStoredToken()
  const q = new URLSearchParams()
  if (options.siteId) q.append('site_id', options.siteId)
  if (token) q.append('token', token)

  const baseUrl = getApiBaseUrl()
  const sseUrl = `${baseUrl}/api/v1/realtime/stream?${q.toString()}`
  let eventSource: EventSource | null = null

  try {
    eventSource = new EventSource(sseUrl)

    eventSource.onopen = () => {
      options.onOpen?.()
    }

    const eventTypes = [
      'telemetry.update',
      'asset.state',
      'asset.status',
      'alarm.created',
      'alarm.updated',
      'device.status',
      'command.updated',
      'event.created',
      'system.notification',
    ]

    eventTypes.forEach((evtName) => {
      eventSource?.addEventListener(evtName, (e: MessageEvent) => {
        try {
          const parsed = JSON.parse(e.data)
          options.onMessage?.({ event: evtName, data: parsed })
        } catch {
          options.onMessage?.({ event: evtName, data: e.data })
        }
      })
    })

    eventSource.onerror = (err) => {
      options.onError?.(err)
    }
  } catch (err) {
    options.onError?.(err)
  }

  return () => {
    if (eventSource) {
      eventSource.close()
      eventSource = null
    }
  }
}
