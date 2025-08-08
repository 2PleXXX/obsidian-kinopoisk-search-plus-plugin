/**
 * provider.ts
 *
 * Data provider for Kinopoisk API integration.
 * Handles movie and TV show data retrieval from kinopoisk.dev API
 * and transforms it for use in Obsidian templates.
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

const API_BASE_URL = "https://api.kinopoisk.dev/v1.4";
const MAX_SEARCH_RESULTS = 50;

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
	 * Performs HTTP GET request to API
	 */
	private async apiGet<T>(
		endpoint: string,
		token: string,
		params: Record<string, string | number> = {},
		headers?: Record<string, string>
	): Promise<T> {
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
	 * Builds URL with query parameters
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
	 * Search for movies and TV shows by query
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
	 * Retrieves detailed movie/TV show information by ID
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
	 * Validates API token by making test request
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

// Legacy compatibility functions
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
