/**
 * ErrorHandler.ts
 *
 * Централизованная обработка ошибок API Кинопоиска
 */

import { t, tWithParams } from "../i18n";

// Паттерны для определения сетевых ошибок
const NETWORK_ERROR_PATTERNS = [
	"net::",
	"NetworkError",
	"Failed to fetch",
	"ENOTFOUND",
	"ECONNREFUSED",
	"ETIMEDOUT",
] as const;

/**
 * Интерфейс для стандартизации ошибок
 */
interface ApiErrorDetails {
	status: number;
	message: string;
	isNetworkError: boolean;
	originalError?: unknown;
}

/**
 * Класс для обработки ошибок API
 */
export class ErrorHandler {
	/**
	 * Получает сообщение об ошибке для HTTP статуса
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
	 * Обрабатывает ошибки от API и создает понятные сообщения
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

		// Для неизвестных статусов
		if (errorDetails.status > 0) {
			return new Error(
				tWithParams("errorHandler.unknownStatusError", {
					status: errorDetails.status.toString(),
				})
			);
		}

		// Общая ошибка
		return new Error(t("errorHandler.unexpectedError"));
	}

	/**
	 * Извлекает детали ошибки из различных форматов
	 */
	private extractErrorDetails(error: unknown): ApiErrorDetails {
		const details: ApiErrorDetails = {
			status: 0,
			message: "",
			isNetworkError: false,
			originalError: error,
		};

		// Проверяем на сетевую ошибку
		if (this.isNetworkError(error)) {
			details.isNetworkError = true;
			return details;
		}

		// Извлекаем статус код
		details.status = this.extractStatusCode(error);

		return details;
	}

	/**
	 * Проверяет, является ли ошибка сетевой
	 */
	private isNetworkError(error: unknown): boolean {
		if (!(error instanceof Error)) {
			return false;
		}

		return NETWORK_ERROR_PATTERNS.some((pattern) =>
			error.message.includes(pattern)
		);
	}

	/**
	 * Извлекает HTTP статус код из объекта ошибки
	 */
	private extractStatusCode(error: unknown): number {
		if (!error || typeof error !== "object") {
			return 0;
		}

		// Проверяем прямое свойство status
		if ("status" in error && typeof error.status === "number") {
			return error.status;
		}

		// Проверяем вложенное свойство response.status
		if (
			"response" in error &&
			error.response &&
			typeof error.response === "object" &&
			"status" in error.response &&
			typeof error.response.status === "number"
		) {
			return error.response.status;
		}

		// Проверяем другие возможные структуры
		if ("statusCode" in error && typeof error.statusCode === "number") {
			return error.statusCode;
		}

		return 0;
	}

	/**
	 * Логирует ошибку
	 */
	public logError(context: string, error: unknown): void {
		console.error(`[${context}] Error:`, error);
	}
}
