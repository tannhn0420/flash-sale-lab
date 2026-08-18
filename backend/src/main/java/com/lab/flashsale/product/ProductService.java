package com.lab.flashsale.product;

import com.lab.flashsale.common.NotFoundException;
import com.lab.flashsale.product.dto.ProductResponse;
import org.springframework.stereotype.Service;

@Service
public class ProductService {

	private final ProductRepository productRepository;

	public ProductService(ProductRepository productRepository) {
		this.productRepository = productRepository;
	}

	// 1 câu SELECT duy nhất — chưa cần @Transactional (RULES B4: chỉ bọc khi có
	// nhiều thao tác cần chung số phận; Phase 1 sẽ là nơi thấy rõ điều đó).
	public ProductResponse getProduct(long id) {
		Product product = productRepository.findById(id)
				.orElseThrow(() -> new NotFoundException("Không tìm thấy sản phẩm id=" + id));
		return toResponse(product);
	}

	private ProductResponse toResponse(Product product) {
		return new ProductResponse(
				product.getId(),
				product.getName(),
				product.getPrice(),
				product.getStock(),
				product.isSaleActive()
		);
	}
}
