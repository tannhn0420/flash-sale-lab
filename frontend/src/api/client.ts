import type { ApiErrorBody } from './types'

// Nơi DUY NHẤT biết base URL, gắn header, parse error format (RULES C2).
// Component không bao giờ gọi fetch trực tiếp.

const BASE_URL = '/api'

// Giả lập đăng nhập: Phase 0 tạm hardcode. P1.S2 sẽ thay bằng input + localStorage.
const USER_ID = 'u1'

export class ApiError extends Error {
  readonly code: string
  readonly status: number

  constructor(status: number, body: ApiErrorBody | null) {
    super(body?.message ?? `HTTP ${status}`)
    this.code = body?.code ?? 'UNKNOWN'
    this.status = status
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'X-User-Id': USER_ID,
      ...init?.headers,
    },
  })

  if (!res.ok) {
    // Backend luôn trả ApiErrorBody cho 4xx/5xx; catch phòng body không phải JSON
    const body = (await res.json().catch(() => null)) as ApiErrorBody | null
    throw new ApiError(res.status, body)
  }
  return res.json() as Promise<T>
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: 'POST',
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
}
