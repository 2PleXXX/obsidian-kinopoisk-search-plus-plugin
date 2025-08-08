/**
 * ApiValidator.ts
 *
 * Input validation for Kinopoisk API requests
 */

import { t } from "../i18n";

// Validation constants
const MIN_QUERY_LENGTH = 1;
const MAX_QUERY_LENGTH = 200;
const MIN_TOKEN_LENGTH = 10;
const MAX_TOKEN_LENGTH = 100;
const MIN_MOVIE_ID = 1;
const MAX_MOVIE_ID = 99999999;

export class ApiValidator {
	/**
	 * Validates API token format and length
	 */
	public isValidToken(token: unknown): boolean {
		if (typeof token !== "string") {
			return false;
		}

		const trimmedToken = token.trim();

		if (!trimmedToken) {
			return false;
		}

		if (
			trimmedToken.length < MIN_TOKEN_LENGTH ||
			trimmedToken.length > MAX_TOKEN_LENGTH
		) {
			return false;
		}

		// Check for valid token characters (letters, numbers, dashes, underscores)
		const tokenPattern = /^[A-Za-z0-9\-_]+$/;
		if (!tokenPattern.test(trimmedToken)) {
			return false;
		}

		return true;
	}

	/**
	 * Validates search query for safety and length
	 */
	public isValidSearchQuery(query: unknown): boolean {
		if (typeof query !== "string") {
			return false;
		}

		const trimmedQuery = query.trim();

		if (!trimmedQuery) {
			return false;
		}

		if (
			trimmedQuery.length < MIN_QUERY_LENGTH ||
			trimmedQuery.length > MAX_QUERY_LENGTH
		) {
			return false;
		}

		// Check for suspicious patterns (potential injection)
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
	 * Validates movie ID range and type
	 */
	public isValidMovieId(id: unknown): boolean {
		if (typeof id !== "number") {
			return false;
		}

		if (!Number.isFinite(id)) {
			return false;
		}

		if (id < MIN_MOVIE_ID || id > MAX_MOVIE_ID) {
			return false;
		}

		if (!Number.isInteger(id)) {
			return false;
		}

		return true;
	}

	/**
	 * Validates pagination parameters
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
	 * Sanitizes search query by removing dangerous characters
	 */
	public sanitizeQuery(query: string): string {
		return query
			.trim()
			.replace(/\s+/g, " ") // Multiple spaces to single space
			.replace(/[<>]/g, "") // Remove potentially dangerous characters
			.substring(0, MAX_QUERY_LENGTH);
	}

	/**
	 * Sanitizes token by keeping only allowed characters
	 */
	public sanitizeToken(token: string): string {
		return token
			.trim()
			.replace(/[^A-Za-z0-9\-_]/g, "") // Keep only allowed characters
			.substring(0, MAX_TOKEN_LENGTH);
	}

	/**
	 * Validates complete request configuration
	 */
	public validateRequestConfig(config: {
		token: string;
		query?: string;
		movieId?: number;
		page?: number;
		limit?: number;
	}): { isValid: boolean; errors: string[] } {
		const errors: string[] = [];

		if (!this.isValidToken(config.token)) {
			errors.push(t("validation.invalidApiToken"));
		}

		if (
			config.query !== undefined &&
			!this.isValidSearchQuery(config.query)
		) {
			errors.push(t("validation.invalidSearchQuery"));
		}

		if (
			config.movieId !== undefined &&
			!this.isValidMovieId(config.movieId)
		) {
			errors.push(t("validation.invalidMovieId"));
		}

		if (!this.isValidPaginationParams(config.page, config.limit)) {
			errors.push(t("validation.invalidPaginationParams"));
		}

		return {
			isValid: errors.length === 0,
			errors,
		};
	}
}
