import { useProduct } from './useProduct'
import './product.css'

const formatVnd = (value: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)

export function ProductPage() {
  const { data: product, loading, error } = useProduct(1)

  if (loading) {
    return <p className="product-status">Đang tải sản phẩm…</p>
  }
  if (error) {
    return <p className="product-status product-status--error">{error}</p>
  }
  if (!product) {
    return null
  }

  return (
    <main className="product-page">
      <h1 className="product-name">{product.name}</h1>
      <p className="product-price">{formatVnd(product.price)}</p>
      <p className="product-stock">
        Còn lại: <strong>{product.stock}</strong> sản phẩm
      </p>
      <p className="product-sale">
        {product.saleActive ? '🔥 Flash sale đang mở!' : 'Flash sale chưa mở'}
      </p>
      {/* Phase 1 mới có POST /api/orders — nút này sẽ được kích hoạt ở P1.S2 */}
      <button className="product-buy" disabled>
        Mua ngay
      </button>
    </main>
  )
}
