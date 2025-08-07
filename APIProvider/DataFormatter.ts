/**
 * DataFormatter.ts
 *
 * Форматирование данных от API Кинопоиск для использования в Obsidian
 */

import { KinopoiskFullInfo, KinopoiskPerson } from "Models/kinopoisk_response";
import { MovieShow } from "Models/MovieShow.model";
import { capitalizeFirstLetter } from "Utils/utils";

// Константы для форматирования
const MAX_ARRAY_ITEMS = 15;
const MAX_FACTS_COUNT = 5;

// Переводы типов контента
const TYPE_TRANSLATIONS: Record<string, string> = {
	"animated-series": "Анимационный сериал",
	anime: "Аниме",
	cartoon: "Мультфильм",
	movie: "Фильм",
	"tv-series": "Сериал",
} as const;

// HTML сущности для декодирования
const HTML_ENTITIES: Record<string, string> = {
	"&laquo;": "«",
	"&raquo;": "»",
	"&ldquo;": '"',
	"&rdquo;": '"',
	"&lsquo;": "'",
	"&rsquo;": "'",
	"&quot;": '"',
	"&amp;": "&",
	"&lt;": "<",
	"&gt;": ">",
	"&nbsp;": " ",
	"&ndash;": "–",
	"&mdash;": "—",
	"&hellip;": "…",
} as const;

/**
 * Типы форматирования для разных видов данных
 */
enum FormatType {
	SHORT_VALUE = "short", // Короткие значения без кавычек (жанры, актёры)
	LONG_TEXT = "long", // Длинные тексты с кавычками (описания)
	URL = "url", // URL без кавычек
	LINK = "link", // Ссылки Obsidian с кавычками
}

/**
 * Класс для форматирования данных от API
 */
export class DataFormatter {
	/**
	 * Основной метод преобразования данных API в формат MovieShow
	 */
	public createMovieShowFrom(fullInfo: KinopoiskFullInfo): MovieShow {
		// Вычисляем данные о сезонах
		const seasonsData = this.calculateSeasonsData(fullInfo.seasonsInfo);

		// Извлекаем людей по профессиям
		const people = this.extractPeople(fullInfo.persons || []);

		// Извлекаем компании и сети
		const companies = this.extractCompanies(fullInfo);

		// Обрабатываем факты
		const facts = this.processFacts(fullInfo.facts || []);

		// Обрабатываем названия
		const names = this.processNames(fullInfo);

		// Первый период выпуска
		const firstReleaseYear = fullInfo.releaseYears?.[0];

		const item: MovieShow = {
			// Основная информация
			id: fullInfo.id,
			name: this.formatArray([fullInfo.name], FormatType.SHORT_VALUE),
			alternativeName: this.formatArray(
				[fullInfo.alternativeName || ""],
				FormatType.SHORT_VALUE
			),
			year: fullInfo.year,
			description: this.formatArray(
				[fullInfo.description || ""],
				FormatType.LONG_TEXT
			),
			shortDescription: this.formatArray(
				[fullInfo.shortDescription || ""],
				FormatType.LONG_TEXT
			),

			// Дополнительные свойства для имен файлов
			nameForFile: this.cleanTextForMetadata(fullInfo.name),
			alternativeNameForFile: this.cleanTextForMetadata(
				fullInfo.alternativeName || ""
			),
			enNameForFile: this.cleanTextForMetadata(fullInfo.enName || ""),

			// Изображения
			posterUrl: this.formatArray(
				[fullInfo.poster?.url || ""],
				FormatType.URL
			),
			coverUrl: this.formatArray(
				[fullInfo.backdrop?.url || ""],
				FormatType.URL
			),
			logoUrl: this.formatArray(
				[fullInfo.logo?.url || ""],
				FormatType.URL
			),

			// Готовые ссылки на изображения для Obsidian
			posterImageLink: this.createImageLink(fullInfo.poster?.url || ""),
			coverImageLink: this.createImageLink(fullInfo.backdrop?.url || ""),
			logoImageLink: this.createImageLink(fullInfo.logo?.url || ""),

			// Классификация
			genres: this.formatArray(
				fullInfo.genres.map((g) => capitalizeFirstLetter(g.name)),
				FormatType.SHORT_VALUE
			),
			genresLinks: this.formatArray(
				fullInfo.genres.map((g) => capitalizeFirstLetter(g.name)),
				FormatType.LINK
			),
			countries: this.formatArray(
				fullInfo.countries.map((c) => c.name),
				FormatType.SHORT_VALUE
			),
			countriesLinks: this.formatArray(
				fullInfo.countries.map((c) => c.name),
				FormatType.LINK
			),
			type: this.formatArray(
				[this.translateType(fullInfo.type || "")],
				FormatType.SHORT_VALUE
			),
			subType: this.formatArray(
				[fullInfo.subType || ""],
				FormatType.SHORT_VALUE
			),

			// Люди
			director: this.formatArray(
				people.directors,
				FormatType.SHORT_VALUE
			),
			directorsLinks: this.formatArray(people.directors, FormatType.LINK),
			actors: this.formatArray(people.actors, FormatType.SHORT_VALUE),
			actorsLinks: this.formatArray(people.actors, FormatType.LINK),
			writers: this.formatArray(people.writers, FormatType.SHORT_VALUE),
			writersLinks: this.formatArray(people.writers, FormatType.LINK),
			producers: this.formatArray(
				people.producers,
				FormatType.SHORT_VALUE
			),
			producersLinks: this.formatArray(people.producers, FormatType.LINK),

			// Технические характеристики
			movieLength: fullInfo.movieLength || 0,
			isSeries: fullInfo.isSeries,
			seriesLength: fullInfo.seriesLength || 0,
			totalSeriesLength: fullInfo.totalSeriesLength || 0,
			isComplete: (fullInfo.status || "") === "completed",
			seasonsCount: seasonsData.count,
			seriesInSeasonCount: seasonsData.averageEpisodesPerSeason,

			// Рейтинги и голоса
			ratingKp: fullInfo.rating?.kp || 0,
			ratingImdb: fullInfo.rating?.imdb || 0,
			ratingFilmCritics: fullInfo.rating?.filmCritics || 0,
			ratingRussianFilmCritics: fullInfo.rating?.russianFilmCritics || 0,
			votesKp: fullInfo.votes?.kp || 0,
			votesImdb: fullInfo.votes?.imdb || 0,
			votesFilmCritics: fullInfo.votes?.filmCritics || 0,
			votesRussianFilmCritics: fullInfo.votes?.russianFilmCritics || 0,

			// Внешние идентификаторы и ссылки
			kinopoiskUrl: this.formatArray(
				[`https://www.kinopoisk.ru/film/${fullInfo.id}/`],
				FormatType.URL
			),
			imdbId: this.formatArray(
				[fullInfo.externalId?.imdb || ""],
				FormatType.SHORT_VALUE
			),
			tmdbId: fullInfo.externalId?.tmdb || 0,
			kpHDId: this.formatArray(
				[fullInfo.externalId?.kpHD || ""],
				FormatType.SHORT_VALUE
			),

			// Дополнительная информация
			slogan: this.formatArray(
				[fullInfo.slogan || ""],
				FormatType.LONG_TEXT
			),
			ageRating: fullInfo.ageRating || 0,
			ratingMpaa: this.formatArray(
				[fullInfo.ratingMpaa || ""],
				FormatType.SHORT_VALUE
			),

			// Финансы
			budgetValue: fullInfo.budget?.value || 0,
			budgetCurrency: this.formatArray(
				[fullInfo.budget?.currency || ""],
				FormatType.SHORT_VALUE
			),
			feesWorldValue: fullInfo.fees?.world?.value || 0,
			feesWorldCurrency: this.formatArray(
				[fullInfo.fees?.world?.currency || ""],
				FormatType.SHORT_VALUE
			),
			feesRussiaValue: fullInfo.fees?.russia?.value || 0,
			feesRussiaCurrency: this.formatArray(
				[fullInfo.fees?.russia?.currency || ""],
				FormatType.SHORT_VALUE
			),
			feesUsaValue: fullInfo.fees?.usa?.value || 0,
			feesUsaCurrency: this.formatArray(
				[fullInfo.fees?.usa?.currency || ""],
				FormatType.SHORT_VALUE
			),

			// Даты премьер
			premiereWorld: this.formatArray(
				[this.formatDate(fullInfo.premiere?.world)],
				FormatType.SHORT_VALUE
			),
			premiereRussia: this.formatArray(
				[this.formatDate(fullInfo.premiere?.russia)],
				FormatType.SHORT_VALUE
			),
			premiereDigital: this.formatArray(
				[this.formatDate(fullInfo.premiere?.digital)],
				FormatType.SHORT_VALUE
			),
			premiereCinema: this.formatArray(
				[this.formatDate(fullInfo.premiere?.cinema)],
				FormatType.SHORT_VALUE
			),

			// Периоды выпуска
			releaseYearsStart: firstReleaseYear?.start || 0,
			releaseYearsEnd: firstReleaseYear?.end || 0,

			// Рейтинги в топах
			top10: fullInfo.top10 || 0,
			top250: fullInfo.top250 || 0,

			// Факты
			facts: this.formatArray(facts, FormatType.LONG_TEXT),

			// Альтернативные названия
			allNamesString: this.formatArray(
				names.allNames,
				FormatType.SHORT_VALUE
			),
			enName: this.formatArray(
				[fullInfo.enName || ""],
				FormatType.SHORT_VALUE
			),

			// Сети и компании
			networks: this.formatArray(
				companies.networks,
				FormatType.SHORT_VALUE
			),
			networksLinks: this.formatArray(
				companies.networks,
				FormatType.LINK
			),
			productionCompanies: this.formatArray(
				companies.productionCompanies,
				FormatType.SHORT_VALUE
			),
			productionCompaniesLinks: this.formatArray(
				companies.productionCompanies,
				FormatType.LINK
			),

			// Дистрибьюторы
			distributor: this.formatArray(
				[fullInfo.distributors?.distributor || ""],
				FormatType.SHORT_VALUE
			),
			distributorRelease: this.formatArray(
				[
					this.formatDate(
						fullInfo.distributors?.distributorRelease
					) ||
						fullInfo.distributors?.distributorRelease ||
						"",
				],
				FormatType.SHORT_VALUE
			),

			// Связанные фильмы/сериалы
			sequelsAndPrequels: this.formatArray(
				companies.sequelsAndPrequels,
				FormatType.SHORT_VALUE
			),
			sequelsAndPrequelsLinks: this.formatArray(
				companies.sequelsAndPrequels,
				FormatType.LINK
			),
		};

		return item;
	}

	/**
	 * Универсальное форматирование массивов в зависимости от типа
	 */
	private formatArray(
		items: string[],
		formatType: FormatType,
		maxItems = MAX_ARRAY_ITEMS
	): string[] {
		const filteredItems = items
			.filter((item) => item && item.trim() !== "")
			.slice(0, maxItems);

		switch (formatType) {
			case FormatType.SHORT_VALUE:
				return filteredItems.map((item) =>
					this.cleanTextForMetadata(item)
				);

			case FormatType.LONG_TEXT:
				return filteredItems.map((item) => {
					const cleanedItem = item
						.replace(/\n/g, " ")
						.replace(/\s+/g, " ")
						.trim();
					return `"${cleanedItem}"`;
				});

			case FormatType.URL:
				return filteredItems.map((item) => item.trim());

			case FormatType.LINK:
				return filteredItems.map(
					(item) => `"[[${this.cleanTextForMetadata(item)}]]"`
				);

			default:
				return filteredItems;
		}
	}

	/**
	 * Вычисляет данные о сезонах
	 */
	private calculateSeasonsData(
		seasonsInfo?: Array<{ episodesCount: number }>
	): {
		count: number;
		averageEpisodesPerSeason: number;
	} {
		if (!seasonsInfo || seasonsInfo.length === 0) {
			return { count: 0, averageEpisodesPerSeason: 0 };
		}

		const totalEpisodes = seasonsInfo.reduce(
			(total, season) => total + season.episodesCount,
			0
		);
		const averageEpisodes = Math.ceil(totalEpisodes / seasonsInfo.length);

		return {
			count: seasonsInfo.length,
			averageEpisodesPerSeason: averageEpisodes,
		};
	}

	/**
	 * Извлекает людей по профессиям
	 */
	private extractPeople(persons: KinopoiskPerson[]): {
		directors: string[];
		actors: string[];
		writers: string[];
		producers: string[];
	} {
		const result = {
			directors: [] as string[],
			actors: [] as string[],
			writers: [] as string[],
			producers: [] as string[],
		};

		for (const person of persons) {
			if (!person.name || !person.enProfession) continue;

			switch (person.enProfession) {
				case "director":
					result.directors.push(person.name);
					break;
				case "actor":
					result.actors.push(person.name);
					break;
				case "writer":
					result.writers.push(person.name);
					break;
				case "producer":
					result.producers.push(person.name);
					break;
			}
		}

		return result;
	}

	/**
	 * Извлекает компании и связанные фильмы
	 */
	private extractCompanies(fullInfo: KinopoiskFullInfo): {
		networks: string[];
		productionCompanies: string[];
		sequelsAndPrequels: string[];
	} {
		const networks =
			fullInfo.networks?.items
				?.map((network) => network.name)
				.filter((name) => name && name.trim() !== "") || [];

		const productionCompanies =
			fullInfo.productionCompanies
				?.map((company) => company.name)
				.filter((name) => name && name.trim() !== "") || [];

		const sequelsAndPrequels =
			fullInfo.sequelsAndPrequels
				?.map((movie) => movie.name)
				.filter((name) => name && name.trim() !== "") || [];

		return { networks, productionCompanies, sequelsAndPrequels };
	}

	/**
	 * Обрабатывает факты (удаляет спойлеры и HTML)
	 */
	private processFacts(
		facts: Array<{ spoiler?: boolean; value: string }>
	): string[] {
		return facts
			.filter(
				(fact) =>
					!fact.spoiler && fact.value && fact.value.trim() !== ""
			)
			.slice(0, MAX_FACTS_COUNT)
			.map((fact) => this.stripHtmlTags(fact.value));
	}

	/**
	 * Обрабатывает названия
	 */
	private processNames(fullInfo: KinopoiskFullInfo): {
		allNames: string[];
	} {
		const allNames =
			fullInfo.names
				?.map((nameObj) => nameObj.name)
				.filter((name) => name && name.trim() !== "") || [];

		return { allNames };
	}

	/**
	 * Форматирует дату в формат Obsidian (YYYY-MM-DD)
	 */
	private formatDate(dateString?: string): string {
		if (!dateString) return "";

		try {
			const date = new Date(dateString);

			// Проверяем валидность даты более строго
			if (
				isNaN(date.getTime()) ||
				date.getFullYear() < 1800 ||
				date.getFullYear() > 2100
			) {
				return "";
			}

			return date.toISOString().split("T")[0];
		} catch {
			return "";
		}
	}

	/**
	 * Очищает текст от символов, которые могут нарушить метаданные
	 */
	private cleanTextForMetadata(text: string): string {
		if (!text) return "";
		return text.replace(/:/g, "").trim();
	}

	/**
	 * Создает ссылку на изображение для Obsidian
	 */
	private createImageLink(imagePath: string): string[] {
		if (!imagePath || imagePath.trim() === "") return [];

		// Если это локальный путь, используем формат ![[путь]]
		if (!imagePath.startsWith("http")) {
			return [`![[${imagePath}]]`];
		}

		// Если это веб-ссылка, используем формат ![](url)
		return [`![](${imagePath})`];
	}

	/**
	 * Переводит типы контента на русский язык
	 */
	private translateType(type: string): string {
		return TYPE_TRANSLATIONS[type] || type;
	}

	/**
	 * Удаляет HTML теги и декодирует HTML сущности
	 */
	private stripHtmlTags(text: string): string {
		// Удаляем HTML теги
		let cleanText = text.replace(/<[^>]*>/g, "");

		// Декодируем HTML сущности
		for (const [entity, char] of Object.entries(HTML_ENTITIES)) {
			cleanText = cleanText.replace(new RegExp(entity, "g"), char);
		}

		// Удаляем любые оставшиеся HTML сущности
		cleanText = cleanText.replace(/&#?\w+;/g, "");

		return cleanText.trim();
	}
}
