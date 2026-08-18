// Type của API response — đồng bộ TAY với DTO backend (RULES C5).
// Khi backend đổi DTO, sửa file này theo.

export interface ProductResponse {
  id: number
  name: string
  price: number
  stock: number
  saleActive: boolean
}

// Error format thống nhất từ GlobalExceptionHandler (ARCHITECTURE §6)
export interface ApiErrorBody {
  code: string
  message: string
  timestamp: string
}
