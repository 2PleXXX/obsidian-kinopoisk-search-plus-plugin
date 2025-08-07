/**
 * ApiValidator.ts
 *
 * Валидация входных данных для API Кинопоиск
 */

import { t } from "../i18n";

// Константы для валидации
const MIN_QUERY_LENGTH = 1;
const MAX_QUERY_LENGTH = 200;
const MIN_TOKEN_LENGTH = 10;
const MAX_TOKEN_LENGTH = 100;
const MIN_MOVIE_ID = 1;
const MAX_MOVIE_ID = 99999999;

/**
 * Класс для валидации данных перед отправкой в API
 */
export class ApiValidator {
	/**
	 * Проверяет валидность API токена
	 */
	public isValidToken(token: unknown): boolean {
		if (typeof token !== "string") {
			return false;
		}

		const trimmedToken = token.trim();

		// Проверяем на пустоту
		if (!trimmedToken) {
			return false;
		}

		// Проверяем длину
		if (
			trimmedToken.length < MIN_TOKEN_LENGTH ||
			trimmedToken.length > MAX_TOKEN_LENGTH
		) {
			return false;
		}

		// Проверяем на валидные символы (обычно токены содержат буквы, цифры, дефисы)
		const tokenPattern = /^[A-Za-z0-9\-_]+$/;
		if (!tokenPattern.test(trimmedToken)) {
			return false;
		}

		return true;
	}

	/**
	 * Проверяет валидность поискового запроса
	 */
	public isValidSearchQuery(query: unknown): boolean {
		if (typeof query !== "string") {
			return false;
		}

		const trimmedQuery = query.trim();

		// Проверяем на пустоту
		if (!trimmedQuery) {
			return false;
		}

		// Проверяем длину
		if (
			trimmedQuery.length < MIN_QUERY_LENGTH ||
			trimmedQuery.length > MAX_QUERY_LENGTH
		) {
			return false;
		}

		// Проверяем на подозрительные символы (потенциальная инъекция)
		const suspiciousPatterns = [
			/<script/i,
			/javascript:/i,
			/on\w+=/i,
			/<%/,
			/%>/,
		];

		if (suspiciousPatterns.some((pattern) => pattern.test(trimmedQuery))) {
			return false;
		}

		return true;
	}

	/**
	 * Проверяет валидность ID фильма
	 */
	public isValidMovieId(id: unknown): boolean {
		// Проверяем тип
		if (typeof id !== "number") {
			return false;
		}

		// Проверяем на NaN и Infinity
		if (!Number.isFinite(id)) {
			return false;
		}

		// Проверяем диапазон
		if (id < MIN_MOVIE_ID || id > MAX_MOVIE_ID) {
			return false;
		}

		// Проверяем что это целое число
		if (!Number.isInteger(id)) {
			return false;
		}

		return true;
	}

	/**
	 * Проверяет валидность параметров пагинации
	 */
	public isValidPaginationParams(page?: number, limit?: number): boolean {
		if (page !== undefined) {
			if (!Number.isInteger(page) || page < 1 || page > 1000) {
				return false;
			}
		}

		if (limit !== undefined) {
			if (!Number.isInteger(limit) || limit < 1 || limit > 250) {
				return false;
			}
		}

		return true;
	}

	/**
	 * Санитизирует поисковый запрос
	 */
	public sanitizeQuery(query: string): string {
		return query
			.trim()
			.replace(/\s+/g, " ") // Множественные пробелы в один
			.replace(/[<>]/g, "") // Удаляем потенциально опасные символы
			.substring(0, MAX_QUERY_LENGTH); // Обрезаем до максимальной длины
	}

	/**
	 * Санитизирует токен
	 */
	public sanitizeToken(token: string): string {
		return token
			.trim()
			.replace(/[^A-Za-z0-9\-_]/g, "") // Оставляем только допустимые символы
			.substring(0, MAX_TOKEN_LENGTH); // Обрезаем до максимальной длины
	}

	/**
	 * Проверяет общую валидность конфигурации запроса
	 */
	public validateRequestConfig(config: {
		token: string;
		query?: string;
		movieId?: number;
		page?: number;
		limit?: number;
	}): { isValid: boolean; errors: string[] } {
		const errors: string[] = [];

		// Проверяем токен
		if (!this.isValidToken(config.token)) {
			errors.push(t("validation.invalidApiToken"));
		}

		// Проверяем запрос если есть
		if (
			config.query !== undefined &&
			!this.isValidSearchQuery(config.query)
		) {
			errors.push(t("validation.invalidSearchQuery"));
		}

		// Проверяем ID фильма если есть
		if (
			config.movieId !== undefined &&
			!this.isValidMovieId(config.movieId)
		) {
			errors.push(t("validation.invalidMovieId"));
		}

		// Проверяем пагинацию если есть
		if (!this.isValidPaginationParams(config.page, config.limit)) {
			errors.push(t("validation.invalidPaginationParams"));
		}

		return {
			isValid: errors.length === 0,
			errors,
		};
	}
}
