/**
 * kinopoisk_response.ts
 *
 * Типы и интерфейсы для работы с API Кинопоиска (kinopoisk.dev).
 * Определяет структуру данных, получаемых от API для поиска фильмов/сериалов
 * и получения детальной информации о них.
 *
 * Включает в себя:
 * - Типы для результатов поиска
 * - Типы для полной информации о фильме/сериале
 * - Вспомогательные интерфейсы для структурированных данных
 */

/**
 * Элемент результата поиска фильма/сериала
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
 * Ответ API на запрос поиска
 */
export interface KinopoiskSuggestItemsResponse {
	docs: KinopoiskSuggestItem[];
}

/**
 * Полная информация о фильме/сериале от API Кинопоиска
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
 * URL изображения с превью
 */
export interface KinopoiskImageUrl {
	url?: string;
	previewUrl?: string;
}

/**
 * Простой элемент с названием (жанр, страна и т.д.)
 */
export interface KinopoiskSimpleItem {
	name: string;
}

/**
 * Информация о персоне (актер, режиссер и т.д.)
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
 * Информация о сезоне сериала
 */
export interface KinopoiskSeasonInfo {
	number: number;
	episodesCount: number;
}

/**
 * Рейтинги от различных источников
 */
export interface KinopoiskRatings {
	kp?: number;
	imdb?: number;
	filmCritics?: number;
	russianFilmCritics?: number;
	await?: number;
}

/**
 * Внешние идентификаторы фильма/сериала
 */
export interface KinopoiskExternalIds {
	imdb?: string;
	tmdb?: number;
	kpHD?: string;
}

/**
 * Денежная сумма с валютой
 */
export interface KinopoiskMoney {
	value?: number;
	currency?: string;
}

/**
 * Сборы в разных регионах
 */
export interface KinopoiskFees {
	world?: KinopoiskMoney;
	russia?: KinopoiskMoney;
	usa?: KinopoiskMoney;
}

/**
 * Даты премьер в разных форматах
 */
export interface KinopoiskPremiere {
	world?: string;
	russia?: string;
	digital?: string;
	cinema?: string;
}

/**
 * Количество голосов от разных источников
 */
export interface KinopoiskVotes {
	kp?: number;
	imdb?: number;
	filmCritics?: number;
	russianFilmCritics?: number;
	await?: number;
}

/**
 * Интересный факт о фильме/сериале
 */
export interface KinopoiskFact {
	value: string;
	type: string;
	spoiler: boolean;
}

/**
 * Период выпуска (для сериалов)
 */
export interface KinopoiskReleaseYear {
	start?: number;
	end?: number;
}

/**
 * Альтернативное название на разных языках
 */
export interface KinopoiskName {
	name: string;
	language?: string;
	type?: string;
}

/**
 * Телевизионные сети/каналы
 */
export interface KinopoiskNetworks {
	items?: KinopoiskSimpleItem[];
}

/**
 * Связанный фильм/сериал (сиквел, приквел и т.д.)
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

/**
 * Производящая компания
 */
export interface KinopoiskProductionCompany {
	name: string;
	url?: string;
	previewUrl?: string;
}

/**
 * Информация о дистрибьюторе
 */
export interface KinopoiskDistributors {
	distributor?: string;
	distributorRelease?: string;
}
