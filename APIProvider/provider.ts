/**
 * provider.ts
 *
 * Провайдер данных для работы с API Кинопоиска.
 * Отвечает за получение информации о фильмах и сериалах через API kinopoisk.dev,
 * а также за преобразование полученных данных в формат, подходящий для использования
 * в шаблонах Obsidian.
 */
import { requestUrl } from "obsidian";
import {
	KinopoiskSuggestItem,
	KinopoiskSuggestItemsResponse,
	KinopoiskFullInfo,
} from "Models/kinopoisk_response";
import { MovieShow } from "Models/MovieShow.model";
import { ErrorHandler } from "APIProvider/ErrorHandler";
import { DataFormatter } from "APIProvider/DataFormatter";
import { ApiValidator } from "APIProvider/ApiValidator";
import { t, tWithParams } from "../i18n";

// Константы
const API_BASE_URL = "https://api.kinopoisk.dev/v1.4";
const MAX_SEARCH_RESULTS = 50;

/**
 * Основной класс для работы с API Кинопоиска
 */
export class KinopoiskProvider {
	private errorHandler: ErrorHandler;
	private dataFormatter: DataFormatter;
	private validator: ApiValidator;

	constructor() {
		this.errorHandler = new ErrorHandler();
		this.dataFormatter = new DataFormatter();
		this.validator = new ApiValidator();
	}

	/**
	 * Выполняет HTTP GET запрос к API
	 */
	private async apiGet<T>(
		endpoint: string,
		token: string,
		params: Record<string, string | number> = {},
		headers?: Record<string, string>
	): Promise<T> {
		// Валидация токена
		if (!this.validator.isValidToken(token)) {
			throw new Error(t("provider.tokenRequired"));
		}

		const url = this.buildUrl(endpoint, params);

		try {
			const res = await requestUrl({
				url,
				method: "GET",
				headers: {
					Accept: "*/*",
					"X-API-KEY": token.trim(),
					...headers,
				},
			});

			return res.json as T;
		} catch (error: unknown) {
			throw this.errorHandler.handleApiError(error);
		}
	}

	/**
	 * Строит URL с параметрами
	 */
	private buildUrl(
		endpoint: string,
		params: Record<string, string | number>
	): string {
		const url = new URL(`${API_BASE_URL}${endpoint}`);

		for (const [key, value] of Object.entries(params)) {
			if (value !== undefined && value !== null && value !== "") {
				url.searchParams.set(key, value.toString());
			}
		}

		return url.href;
	}

	/**
	 * Поиск фильмов и сериалов по запросу
	 */
	public async searchByQuery(
		query: string,
		token: string
	): Promise<KinopoiskSuggestItem[]> {
		if (!this.validator.isValidSearchQuery(query)) {
			throw new Error(t("provider.enterMovieTitle"));
		}

		const searchResults = await this.apiGet<KinopoiskSuggestItemsResponse>(
			"/movie/search",
			token,
			{
				query: query.trim(),
				limit: MAX_SEARCH_RESULTS,
			}
		);

		if (!searchResults.docs || searchResults.docs.length === 0) {
			throw new Error(
				tWithParams("provider.nothingFound", { query }) +
					" " +
					t("provider.tryChangeQuery")
			);
		}

		return searchResults.docs;
	}

	/**
	 * Получает детальную информацию о фильме/сериале
	 */
	public async getMovieById(id: number, token: string): Promise<MovieShow> {
		if (!this.validator.isValidMovieId(id)) {
			throw new Error(t("provider.invalidMovieId"));
		}

		if (!this.validator.isValidToken(token)) {
			throw new Error(t("provider.tokenRequiredForMovie"));
		}

		const movieData = await this.apiGet<KinopoiskFullInfo>(
			`/movie/${id}`,
			token
		);

		if (!movieData) {
			throw new Error(t("provider.movieInfoError"));
		}

		const movieShow = this.dataFormatter.createMovieShowFrom(movieData);

		return movieShow;
	}

	/**
	 * Проверяет валидность API токена
	 */
	public async validateToken(token: string): Promise<boolean> {
		if (!this.validator.isValidToken(token)) {
			return false;
		}

		try {
			await this.apiGet<{ docs: unknown[] }>("/movie", token, {
				page: 1,
				limit: 1,
			});
			return true;
		} catch {
			return false;
		}
	}
}

// Экспорт функций для обратной совместимости
const provider = new KinopoiskProvider();

export async function getByQuery(
	query: string,
	token: string
): Promise<KinopoiskSuggestItem[]> {
	return provider.searchByQuery(query, token);
}

export async function getMovieShowById(
	id: number,
	token: string
): Promise<MovieShow> {
	return provider.getMovieById(id, token);
}

export async function validateApiToken(token: string): Promise<boolean> {
	return provider.validateToken(token);
}
