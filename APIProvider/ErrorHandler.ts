/**
 * ErrorHandler.ts
 *
 * Centralized error handling for Kinopoisk API
 */

import { t, tWithParams } from "../i18n";

// Network error detection patterns
const NETWORK_ERROR_PATTERNS = [
	"net::",
	"NetworkError",
	"Failed to fetch",
	"ENOTFOUND",
	"ECONNREFUSED",
	"ETIMEDOUT",
] as const;

interface ApiErrorDetails {
	status: number;
	message: string;
	isNetworkError: boolean;
	originalError?: unknown;
}

export class ErrorHandler {
	/**
	 * Returns localized error message for HTTP status code
	 */
	private getHttpStatusMessage(status: number): string {
		const statusMessages: Record<number, string> = {
			400: t("errorHandler.badRequest"),
			401: t("errorHandler.unauthorized"),
			403: t("errorHandler.forbidden"),
			404: t("errorHandler.notFound"),
			429: t("errorHandler.tooManyRequests"),
			500: t("errorHandler.internalServerError"),
			502: t("errorHandler.badGateway"),
			503: t("errorHandler.serviceUnavailable"),
			504: t("errorHandler.gatewayTimeout"),
		};

		return statusMessages[status] || "";
	}

	/**
	 * Processes API errors and creates user-friendly error messages
	 */
	public handleApiError(error: unknown): Error {
		const errorDetails = this.extractErrorDetails(error);

		if (errorDetails.isNetworkError) {
			return new Error(t("errorHandler.networkError"));
		}

		const knownMessage = this.getHttpStatusMessage(errorDetails.status);
		if (knownMessage) {
			return new Error(knownMessage);
		}

		// Unknown status codes
		if (errorDetails.status > 0) {
			return new Error(
				tWithParams("errorHandler.unknownStatusError", {
					status: errorDetails.status.toString(),
				})
			);
		}

		return new Error(t("errorHandler.unexpectedError"));
	}

	/**
	 * Extracts error details from various error formats
	 */
	private extractErrorDetails(error: unknown): ApiErrorDetails {
		const details: ApiErrorDetails = {
			status: 0,
			message: "",
			isNetworkError: false,
			originalError: error,
		};

		if (this.isNetworkError(error)) {
			details.isNetworkError = true;
			return details;
		}

		details.status = this.extractStatusCode(error);
		return details;
	}

	private isNetworkError(error: unknown): boolean {
		if (!(error instanceof Error)) {
			return false;
		}

		return NETWORK_ERROR_PATTERNS.some((pattern) =>
			error.message.includes(pattern)
		);
	}

	/**
	 * Extracts HTTP status code from error object
	 */
	private extractStatusCode(error: unknown): number {
		if (!error || typeof error !== "object") {
			return 0;
		}

		// Check direct status property
		if ("status" in error && typeof error.status === "number") {
			return error.status;
		}

		// Check nested response.status
		if (
			"response" in error &&
			error.response &&
			typeof error.response === "object" &&
			"status" in error.response &&
			typeof error.response.status === "number"
		) {
			return error.response.status;
		}

		// Check alternative statusCode property
		if ("statusCode" in error && typeof error.statusCode === "number") {
			return error.statusCode;
		}

		return 0;
	}

	public logError(context: string, error: unknown): void {
		console.error(`[${context}] Error:`, error);
	}
}
