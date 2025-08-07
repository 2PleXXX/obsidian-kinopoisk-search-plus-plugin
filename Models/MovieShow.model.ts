/**
 * MovieShow.model.ts
 *
 * Модель данных фильма/сериала для использования в шаблонах Obsidian.
 * Определяет унифицированную структуру данных, которая будет подставляться
 * в шаблоны плагина.
 *
 * Особенности структуры:
 * - Большинство полей представлены как массивы строк для корректной работы с YAML
 * - Строковые поля обрамляются кавычками для метаданных
 * - URL и ссылки остаются без кавычек
 * - Числовые поля остаются примитивными типами
 * - Отдельные поля для создания имен файлов (без кавычек и спецсимволов)
 */

export interface MovieShow {
	// Основная информация
	id: number;
	name: string[];
	alternativeName: string[];
	year: number;
	description: string[];
	shortDescription: string[];

	// Изображения (URL без кавычек)
	// Могут содержать как веб-ссылки, так и локальные пути
	posterUrl: string[];
	coverUrl: string[];
	logoUrl: string[];

	// Дополнительные поля для использования в шаблонах Obsidian
	// Автоматически форматируются как ![[путь]] или ![](путь) в зависимости от типа пути
	posterImageLink: string[]; // Готовая ссылка на изображение для Obsidian
	coverImageLink: string[]; // Готовая ссылка на изображение для Obsidian
	logoImageLink: string[]; // Готовая ссылка на изображение для Obsidian

	// Классификация
	genres: string[];
	genresLinks: string[]; // Форматированные как ссылки Obsidian [[Genre]]
	countries: string[];
	countriesLinks: string[]; // Форматированные как ссылки Obsidian [[Country]]
	type: string[];
	subType: string[];

	// Люди (участники проекта)
	director: string[];
	directorsLinks: string[]; // Форматированные как ссылки Obsidian [[Director]]
	actors: string[];
	actorsLinks: string[]; // Форматированные как ссылки Obsidian [[Actor]]
	writers: string[];
	writersLinks: string[]; // Форматированные как ссылки Obsidian [[Writer]]
	producers: string[];
	producersLinks: string[]; // Форматированные как ссылки Obsidian [[Producer]]

	// Технические характеристики
	movieLength: number; // Длительность в минутах
	isSeries: boolean;
	seriesLength: number; // Длительность одной серии
	totalSeriesLength: number; // Общая длительность всех серий
	isComplete: boolean; // Завершен ли сериал
	seasonsCount: number;
	seriesInSeasonCount: number; // Среднее количество серий в сезоне

	// Рейтинги и голоса
	ratingKp: number;
	ratingImdb: number;
	ratingFilmCritics: number;
	ratingRussianFilmCritics: number;
	votesKp: number;
	votesImdb: number;
	votesFilmCritics: number;
	votesRussianFilmCritics: number;

	// Внешние идентификаторы и ссылки
	kinopoiskUrl: string[]; // URL без кавычек
	imdbId: string[];
	tmdbId: number;
	kpHDId: string[];

	// Дополнительная информация
	slogan: string[];
	ageRating: number;
	ratingMpaa: string[];

	// Финансы
	budgetValue: number;
	budgetCurrency: string[];
	feesWorldValue: number;
	feesWorldCurrency: string[];
	feesRussiaValue: number;
	feesRussiaCurrency: string[];
	feesUsaValue: number;
	feesUsaCurrency: string[];

	// Даты премьер (форматированные согласно настройкам)
	premiereWorld: string[];
	premiereRussia: string[];
	premiereDigital: string[];
	premiereCinema: string[];

	// Периоды выпуска
	releaseYearsStart: number;
	releaseYearsEnd: number;

	// Рейтинги в топах
	top10: number;
	top250: number;

	// Факты (ограничено 5 элементами, очищено от HTML)
	facts: string[];

	// Альтернативные названия
	allNamesString: string[]; // Все известные названия
	enName: string[];

	// Сети и компании
	networks: string[]; // Телевизионные сети/каналы
	networksLinks: string[]; // Форматированные как ссылки Obsidian
	productionCompanies: string[];
	productionCompaniesLinks: string[]; // Форматированные как ссылки Obsidian

	// Дистрибьюторы
	distributor: string[];
	distributorRelease: string[];

	// Связанные фильмы/сериалы
	sequelsAndPrequels: string[];
	sequelsAndPrequelsLinks: string[]; // Форматированные как ссылки Obsidian

	// Дополнительные свойства для создания имен файлов
	// (очищены от спецсимволов, без кавычек)
	nameForFile: string;
	alternativeNameForFile: string;
	enNameForFile: string;
}
