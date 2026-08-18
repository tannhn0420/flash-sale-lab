import { useEffect, useState } from 'react'
import { api, ApiError } from '../../api/client'
import type { ProductResponse } from '../../api/types'

interface UseProductResult {
  data: ProductResponse | null
  loading: boolean
  error: string | null
}

// Server state nằm gọn trong hook (RULES C4): component chỉ nhận {data, loading, error}.
export function useProduct(id: number): UseProductResult {
  const [data, setData] = useState<ProductResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // cancelled chống race: component unmount (hoặc id đổi) trước khi fetch xong
    // thì bỏ kết quả, không setState trên component đã chết.
    let cancelled = false
    setLoading(true)
    setError(null)

    api
      .get<ProductResponse>(`/products/${id}`)
      .then((product) => {
        if (!cancelled) setData(product)
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setError(e instanceof ApiError ? e.message : 'Không tải được sản phẩm')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [id])

  return { data, loading, error }
}
