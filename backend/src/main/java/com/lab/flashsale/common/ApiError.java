package com.lab.flashsale.common;

import java.time.Instant;

/**
 * Error format thống nhất cho mọi lỗi 4xx/5xx (ARCHITECTURE §6):
 * { "code": "OUT_OF_STOCK", "message": "...", "timestamp": "..." }
 */
public record ApiError(String code, String message, Instant timestamp) {

	public static ApiError of(String code, String message) {
		return new ApiError(code, message, Instant.now());
	}
}
