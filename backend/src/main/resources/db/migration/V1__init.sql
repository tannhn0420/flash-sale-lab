-- Schema theo ARCHITECTURE §4 — không sửa tay DB, mọi thay đổi schema đi qua Flyway.

CREATE TABLE products (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(255) NOT NULL,
    price       NUMERIC(12,0) NOT NULL,        -- VND, không thập phân
    stock       INT NOT NULL CHECK (stock >= 0),
    sale_active BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE orders (
    id             UUID PRIMARY KEY,            -- API sinh trước, dùng làm idempotency key phía worker
    product_id     BIGINT NOT NULL REFERENCES products(id),
    user_id        VARCHAR(64) NOT NULL,
    status         VARCHAR(20) NOT NULL,        -- PENDING | PROCESSING | CONFIRMED | FAILED
    failure_reason VARCHAR(255),
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_order_user_product UNIQUE (user_id, product_id)  -- 1 user 1 đơn/sản phẩm
);
