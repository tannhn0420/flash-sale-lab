package com.lab.flashsale.common;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/**
 * Xử lý lỗi tập trung (RULES B5): controller/service chỉ ném exception nghiệp vụ,
 * nơi duy nhất map exception -> HTTP status + ApiError là ở đây.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

	private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

	@ExceptionHandler(NotFoundException.class)
	@ResponseStatus(HttpStatus.NOT_FOUND)
	public ApiError handleNotFound(NotFoundException e) {
		return ApiError.of("NOT_FOUND", e.getMessage());
	}

	@ExceptionHandler(Exception.class)
	@ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
	public ApiError handleUnexpected(Exception e) {
		log.error("Loi khong mong doi", e);
		return ApiError.of("INTERNAL_ERROR", "Có lỗi xảy ra, vui lòng thử lại sau");
	}
}
