/**
 * kinopoisk_response.ts
 *
 * Types and interfaces for Kinopoisk API (kinopoisk.dev)
 * Defines data structures for movie/series search and detailed information
 */

/**
 * Search result item
 */
export interface KinopoiskSuggestItem {
	id: number;
	name: string;
	alternativeName: string;
	type: string;
	year: number;
	poster?: KinopoiskImageUrl;
}

/**
 * Search API response
 */
export interface KinopoiskSuggestItemsResponse {
	docs: KinopoiskSuggestItem[];
}

/**
 * Complete movie/series information from Kinopoisk API
 */
export interface KinopoiskFullInfo {
	id: number;
	name: string;
	alternativeName: string;
	type: string;
	year: number;
	description?: string;
	poster?: KinopoiskImageUrl;
	genres: KinopoiskSimpleItem[];
	countries: KinopoiskSimpleItem[];
	persons: KinopoiskPerson[];
	movieLength?: number;
	backdrop?: KinopoiskImageUrl;
	logo?: KinopoiskImageUrl;
	isSeries: boolean;
	seriesLength?: number;
	status?: string;
	rating?: KinopoiskRatings;
	externalId?: KinopoiskExternalIds;
	seasonsInfo?: KinopoiskSeasonInfo[];
	slogan?: string;
	budget?: KinopoiskMoney;
	fees?: KinopoiskFees;
	premiere?: KinopoiskPremiere;
	votes?: KinopoiskVotes;
	facts?: KinopoiskFact[];
	shortDescription?: string;
	ageRating?: number;
	ratingMpaa?: string;
	releaseYears?: KinopoiskReleaseYear[];
	top10?: number;
	top250?: number;
	totalSeriesLength?: number;
	typeNumber?: number;
	enName?: string;
	names?: KinopoiskName[];
	networks?: KinopoiskNetworks;
	subType?: string;
	sequelsAndPrequels?: KinopoiskRelatedMovie[];
	productionCompanies?: KinopoiskProductionCompany[];
	distributors?: KinopoiskDistributors;
}

/**
 * Image URL with preview
 */
export interface KinopoiskImageUrl {
	url?: string;
	previewUrl?: string;
}

/**
 * Simple item with name (genre, country, etc.)
 */
export interface KinopoiskSimpleItem {
	name: string;
}

/**
 * Person information (actor, director, etc.)
 */
export interface KinopoiskPerson {
	id?: number;
	name: string;
	enName?: string;
	description?: string;
	profession?: string;
	enProfession: string;
	photo?: string;
}

/**
 * Series season information
 */
export interface KinopoiskSeasonInfo {
	number: number;
	episodesCount: number;
}

/**
 * Ratings from various sources
 */
export interface KinopoiskRatings {
	kp?: number;
	imdb?: number;
	filmCritics?: number;
	russianFilmCritics?: number;
	await?: number;
}

/**
 * External movie/series identifiers
 */
export interface KinopoiskExternalIds {
	imdb?: string;
	tmdb?: number;
	kpHD?: string;
}

/**
 * Money amount with currency
 */
export interface KinopoiskMoney {
	value?: number;
	currency?: string;
}

/**
 * Box office collections by region
 */
export interface KinopoiskFees {
	world?: KinopoiskMoney;
	russia?: KinopoiskMoney;
	usa?: KinopoiskMoney;
}

/**
 * Premiere dates in different formats
 */
export interface KinopoiskPremiere {
	world?: string;
	russia?: string;
	digital?: string;
	cinema?: string;
}

/**
 * Vote counts from various sources
 */
export interface KinopoiskVotes {
	kp?: number;
	imdb?: number;
	filmCritics?: number;
	russianFilmCritics?: number;
	await?: number;
}

export interface KinopoiskFact {
	value: string;
	type: string;
	spoiler: boolean;
}

/**
 * Release period (for series)
 */
export interface KinopoiskReleaseYear {
	start?: number;
	end?: number;
}

/**
 * Alternative names in different languages
 */
export interface KinopoiskName {
	name: string;
	language?: string;
	type?: string;
}

/**
 * TV networks/channels
 */
export interface KinopoiskNetworks {
	items?: KinopoiskSimpleItem[];
}

/**
 * Related movie/series (sequel, prequel, etc.)
 */
export interface KinopoiskRelatedMovie {
	id: number;
	name: string;
	alternativeName?: string;
	enName?: string;
	type: string;
	poster?: KinopoiskImageUrl;
	rating?: KinopoiskRatings;
	year?: number;
}

export interface KinopoiskProductionCompany {
	name: string;
	url?: string;
	previewUrl?: string;
}

export interface KinopoiskDistributors {
	distributor?: string;
	distributorRelease?: string;
}
