package com.lab.flashsale.product;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "products")
public class Product {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false)
	private String name;

	@Column(nullable = false)
	private BigDecimal price;

	@Column(nullable = false)
	private int stock;

	@Column(name = "sale_active", nullable = false)
	private boolean saleActive;

	// DB tự set DEFAULT now() — app không ghi cột này
	@Column(name = "created_at", insertable = false, updatable = false)
	private Instant createdAt;

	protected Product() {
		// JPA cần constructor không tham số; protected để không ai new bừa
	}

	public Long getId() {
		return id;
	}

	public String getName() {
		return name;
	}

	public BigDecimal getPrice() {
		return price;
	}

	public int getStock() {
		return stock;
	}

	public boolean isSaleActive() {
		return saleActive;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}
}
