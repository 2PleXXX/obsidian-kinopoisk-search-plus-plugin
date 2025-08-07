/**
 * i18n.ts
 *
 * Internationalization system for Obsidian Kinopoisk plugin
 */

export type SupportedLanguage = "ru" | "en";

export interface Translations {
	common: {
		ok: string;
		cancel: string;
		save: string;
		loading: string;
		error: string;
		success: string;
	};

	modals: {
		searchTitle: string;
		searchPlaceholder: string;
		searchButton: string;
		searching: string;
		enterMovieName: string;
		needApiToken: string;
		loadingMovieInfo: string;
		preparingImages: string;
		movieInfoLoaded: string;
		errorMovieData: string;
		errorUnexpected: string;
		errorGettingDetails: string;
		// Новые строки из suggest_modal.ts
		posterPlaceholderEmoji: string;
		posterTooltipGeoblock: string;
		posterTooltipMissing: string;
		posterTooltipEmptyLink: string;
		posterTooltipInvalidLink: string;
	};

	suggesters: {
		fileListError: string;
		folderListError: string;
	};

	validation: {
		invalidApiToken: string;
		invalidSearchQuery: string;
		invalidMovieId: string;
		invalidPaginationParams: string;
	};

	provider: {
		tokenRequired: string;
		enterMovieTitle: string;
		nothingFound: string;
		invalidMovieId: string;
		tokenRequiredForMovie: string;
		movieInfoError: string;
		tryChangeQuery: string;
	};

	errorHandler: {
		badRequest: string;
		unauthorized: string;
		forbidden: string;
		notFound: string;
		tooManyRequests: string;
		internalServerError: string;
		badGateway: string;
		serviceUnavailable: string;
		gatewayTimeout: string;
		networkError: string;
		unknownStatusError: string;
		unexpectedError: string;
	};

	images: {
		poster: string;
		cover: string;
		logo: string;
		noImagesToDownload: string;
		downloading: string;
		downloadingPoster: string;
		downloadingCover: string;
		downloadingLogo: string;
		completed: string;
		completedAllDownloaded: string;
		completedAlreadyLocal: string;
		completedWithErrors: string;
		invalidUrl: string;
		imageNotFound: string;
		accessForbidden: string;
		serverError: string;
		httpError: string;
		downloadFailed: string;
		timeout: string;
		downloadedWithErrors: string;
		imagesUnavailable: string;
		processingError: string;
		posterUnavailable: string;
		coverUnavailable: string;
		logoUnavailable: string;
		downloadError: string;
	};

	utils: {
		unknownMovie: string;
		copyPrefix: string;
		templateNotFound: string;
		templateReadError: string;
	};

	settings: {
		apiToken: string;
		apiTokenDesc: string;
		getApiToken: string;
		checkToken: string;
		checking: string;
		tokenValid: string;
		tokenInvalid: string;
		tokenError: string;
		enterToken: string;
		imagesHeading: string;
		saveImagesLocally: string;
		saveImagesLocallyDesc: string;
		imagesFolder: string;
		imagesFolderDesc: string;
		imagesFolderPlaceholder: string;
		savePosterImage: string;
		savePosterImageDesc: string;
		saveCoverImage: string;
		saveCoverImageDesc: string;
		saveLogoImage: string;
		saveLogoImageDesc: string;
		moviesHeading: string;
		movieFileName: string;
		movieFileNameDesc: string;
		movieFileNamePlaceholder: string;
		movieFileLocation: string;
		movieFileLocationDesc: string;
		movieFileLocationPlaceholder: string;
		movieTemplateFile: string;
		movieTemplateFileDesc: string;
		movieTemplateFilePlaceholder: string;
		exampleTemplate: string;
		seriesHeading: string;
		seriesFileName: string;
		seriesFileNameDesc: string;
		seriesFileNamePlaceholder: string;
		seriesFileLocation: string;
		seriesFileLocationDesc: string;
		seriesFileLocationPlaceholder: string;
		seriesTemplateFile: string;
		seriesTemplateFileDesc: string;
		seriesTemplateFilePlaceholder: string;
		languageHeading: string;
		language: string;
		languageDesc: string;
	};
}

const ru: Translations = {
	common: {
		ok: "ОК",
		cancel: "Отмена",
		save: "Сохранить",
		loading: "Загрузка...",
		error: "Ошибка",
		success: "Успешно",
	},

	modals: {
		searchTitle: "🍿 Поиск фильма или сериала",
		searchPlaceholder: "Поиск по ключевому слову",
		searchButton: "Найти",
		searching: "Поиск...",
		enterMovieName: "Введите название фильма или сериала для поиска",
		needApiToken: "Необходимо указать API токен в настройках плагина",
		loadingMovieInfo: "Загружается информация о фильме...",
		preparingImages: "Подготовка к скачиванию изображений...",
		movieInfoLoaded: "Информация о фильме загружена!",
		errorMovieData: "Ошибка: неверные данные фильма",
		errorUnexpected: "Произошла неожиданная ошибка",
		errorGettingDetails:
			"Произошла неожиданная ошибка при получении информации о фильме",
		// Новые строки из suggest_modal.ts
		posterPlaceholderEmoji: "📽️",
		posterTooltipGeoblock: "Постер недоступен (возможно, геоблокировка)",
		posterTooltipMissing: "Постер отсутствует",
		posterTooltipEmptyLink: "Пустая ссылка на постер",
		posterTooltipInvalidLink: "Некорректная ссылка на постер",
	},

	suggesters: {
		fileListError: "Ошибка при получении списка файлов:",
		folderListError: "Ошибка при получении списка папок:",
	},

	validation: {
		invalidApiToken: "Недействительный API токен",
		invalidSearchQuery: "Недействительный поисковый запрос",
		invalidMovieId: "Недействительный ID фильма",
		invalidPaginationParams: "Недействительные параметры пагинации",
	},

	provider: {
		tokenRequired:
			"Необходимо указать действительный API токен в настройках плагина",
		enterMovieTitle: "Введите название фильма или сериала для поиска",
		nothingFound: 'По запросу "{query}" ничего не найдено.',
		invalidMovieId: "Неверный ID фильма",
		tokenRequiredForMovie: "Необходимо указать действительный API токен",
		movieInfoError: "Не удалось получить информацию о фильме",
		tryChangeQuery: "Попробуйте изменить поисковый запрос.",
	},

	errorHandler: {
		badRequest: "Неверный запрос. Проверьте введенные данные.",
		unauthorized:
			"Неавторизованный доступ. Убедитесь, что API токен указан и действителен.",
		forbidden: "Превышен суточный лимит. Подождите и попробуйте снова.",
		notFound: "Данные не найдены. Попробуйте изменить поисковый запрос.",
		tooManyRequests:
			"Слишком много запросов. Подождите немного и попробуйте снова.",
		internalServerError:
			"Внутренняя ошибка сервера Кинопоиска. Попробуйте позже.",
		badGateway: "Сервер Кинопоиска временно недоступен (502 Bad Gateway).",
		serviceUnavailable:
			"Сервис временно недоступен. Повторите попытку позже.",
		gatewayTimeout:
			"Сервер не отвечает. Превышено время ожидания (504 Gateway Timeout).",
		networkError:
			"Проблемы с подключением к интернету. Проверьте соединение.",
		unknownStatusError:
			"Произошла ошибка при запросе к серверу (код {status}). Попробуйте позже.",
		unexpectedError:
			"Произошла неожиданная ошибка при запросе. Попробуйте позже.",
	},

	images: {
		poster: "постера",
		cover: "обложки",
		logo: "логотипа",
		noImagesToDownload: "Нет изображений для скачивания",
		downloading: "Скачивание",
		downloadingPoster: "Скачивание постера...",
		downloadingCover: "Скачивание обложки...",
		downloadingLogo: "Скачивание логотипа...",
		completed: "Завершено!",
		completedAllDownloaded: "Завершено! Все изображения скачаны",
		completedAlreadyLocal: "Завершено! Изображения уже локальные",
		completedWithErrors:
			"Завершено! Успешно: {successful}, не удалось: {failed}",
		invalidUrl:
			"Неверный формат URL: {url}. Ожидался действительный HTTP/HTTPS URL.",
		imageNotFound: "Изображение не найдено (404): {url}",
		accessForbidden: "Доступ запрещен (403): {url}",
		serverError: "Ошибка сервера ({status}): {url}",
		httpError: "HTTP {status}: {url}",
		downloadFailed: "Не удалось скачать изображение: {url}",
		timeout: "Превышено время ожидания после {timeout}мс",
		downloadedWithErrors:
			"Скачано: {successful}/{total} изображений. Некоторые недоступны в вашем регионе.",
		imagesUnavailable:
			"Изображения недоступны в вашем регионе. Используются оригинальные ссылки.",
		processingError: "Ошибка при обработке изображений",
		posterUnavailable:
			"Постер недоступен (возможно, заблокирован в вашем регионе)",
		coverUnavailable:
			"Обложка недоступна (возможно, заблокирована в вашем регионе)",
		logoUnavailable:
			"Логотип недоступен (возможно, заблокирован в вашем регионе)",
		downloadError: "Не удалось скачать",
	},

	utils: {
		unknownMovie: "Неизвестный фильм",
		copyPrefix: "Копия",
		templateNotFound: "Шаблон не найден",
		templateReadError: "Не удалось прочитать файл шаблона",
	},

	settings: {
		apiToken: "API Токен",
		apiTokenDesc:
			"Вам нужно получить API токен для использования этого плагина. Выберите бесплатный план и следуйте инструкциям.",
		getApiToken: "Получить API Токен",
		checkToken: "Проверить токен",
		checking: "Проверяем...",
		tokenValid: "✅ Токен действителен!",
		tokenInvalid: "❌ Токен недействителен. Проверьте правильность токена.",
		tokenError: "❌ Ошибка при проверке токена. Попробуйте позже.",
		enterToken: "Введите API токен для проверки",
		imagesHeading: "Изображения",
		saveImagesLocally: "Сохранять изображения локально",
		saveImagesLocallyDesc:
			"Скачивать и сохранять изображения в локальную папку вместо использования веб-ссылок.",
		imagesFolder: "Папка для изображений",
		imagesFolderDesc: "Папка, где будут сохранены скачанные изображения.",
		imagesFolderPlaceholder: "Например: attachments/kinopoisk",
		savePosterImage: "Сохранять постеры",
		savePosterImageDesc: "Скачивать и сохранять постеры фильмов/сериалов.",
		saveCoverImage: "Сохранять обложки",
		saveCoverImageDesc:
			"Скачивать и сохранять обложки/бэкдропы фильмов/сериалов.",
		saveLogoImage: "Сохранять логотипы",
		saveLogoImageDesc: "Скачивать и сохранять логотипы фильмов/сериалов.",
		moviesHeading: "Фильмы",
		movieFileName: "Имя файла фильма",
		movieFileNameDesc: "Введите формат имени файла для фильмов.",
		movieFileNamePlaceholder: "Например: {{nameForFile}} ({{year}})",
		movieFileLocation: "Расположение файлов фильмов",
		movieFileLocationDesc: "Новые заметки о фильмах будут размещены здесь.",
		movieFileLocationPlaceholder: "Например: папка1/папка2",
		movieTemplateFile: "Файл шаблона для фильмов",
		movieTemplateFileDesc: "Файлы будут доступны как шаблоны.",
		movieTemplateFilePlaceholder: "Например: templates/template-file",
		exampleTemplate: "Пример шаблона",
		seriesHeading: "Сериалы",
		seriesFileName: "Имя файла сериала",
		seriesFileNameDesc: "Введите формат имени файла для сериалов.",
		seriesFileNamePlaceholder: "Например: {{nameForFile}} ({{year}})",
		seriesFileLocation: "Расположение файлов сериалов",
		seriesFileLocationDesc:
			"Новые заметки о сериалах будут размещены здесь.",
		seriesFileLocationPlaceholder: "Например: папка1/папка2",
		seriesTemplateFile: "Файл шаблона для сериалов",
		seriesTemplateFileDesc: "Файлы будут доступны как шаблоны.",
		seriesTemplateFilePlaceholder: "Например: templates/template-file",
		languageHeading: "Язык",
		language: "Язык интерфейса",
		languageDesc: "Выберите язык интерфейса плагина.",
	},
};

const en: Translations = {
	common: {
		ok: "OK",
		cancel: "Cancel",
		save: "Save",
		loading: "Loading...",
		error: "Error",
		success: "Success",
	},

	modals: {
		searchTitle: "🍿 Search movie or TV show",
		searchPlaceholder: "Search by keyword",
		searchButton: "Search",
		searching: "Searching...",
		enterMovieName: "Enter movie or TV show name to search",
		needApiToken: "API token must be specified in plugin settings",
		loadingMovieInfo: "Loading movie information...",
		preparingImages: "Preparing to download images...",
		movieInfoLoaded: "Movie information loaded!",
		errorMovieData: "Error: invalid movie data",
		errorUnexpected: "An unexpected error occurred",
		errorGettingDetails:
			"An unexpected error occurred while getting movie information",
		// Новые строки из suggest_modal.ts
		posterPlaceholderEmoji: "📽️",
		posterTooltipGeoblock: "Poster unavailable (possibly geo-blocked)",
		posterTooltipMissing: "Poster missing",
		posterTooltipEmptyLink: "Empty poster link",
		posterTooltipInvalidLink: "Invalid poster link",
	},

	suggesters: {
		fileListError: "Error getting file list:",
		folderListError: "Error getting folder list:",
	},

	validation: {
		invalidApiToken: "Invalid API token",
		invalidSearchQuery: "Invalid search query",
		invalidMovieId: "Invalid movie ID",
		invalidPaginationParams: "Invalid pagination parameters",
	},

	provider: {
		tokenRequired: "Valid API token must be specified in plugin settings",
		enterMovieTitle: "Enter movie or TV show title to search",
		nothingFound: 'Nothing found for query "{query}".',
		invalidMovieId: "Invalid movie ID",
		tokenRequiredForMovie: "Valid API token must be specified",
		movieInfoError: "Failed to get movie information",
		tryChangeQuery: "Try changing the search query.",
	},

	errorHandler: {
		badRequest: "Bad request. Please check the entered data.",
		unauthorized:
			"Unauthorized access. Make sure the API token is specified and valid.",
		forbidden: "Daily limit exceeded. Please wait and try again.",
		notFound: "Data not found. Try changing the search query.",
		tooManyRequests: "Too many requests. Please wait a bit and try again.",
		internalServerError:
			"Kinopoisk server internal error. Try again later.",
		badGateway:
			"Kinopoisk server temporarily unavailable (502 Bad Gateway).",
		serviceUnavailable: "Service temporarily unavailable. Try again later.",
		gatewayTimeout:
			"Server not responding. Timeout exceeded (504 Gateway Timeout).",
		networkError: "Internet connection problems. Check your connection.",
		unknownStatusError:
			"An error occurred when requesting the server (code {status}). Try again later.",
		unexpectedError:
			"An unexpected error occurred during the request. Try again later.",
	},

	images: {
		poster: "poster",
		cover: "cover",
		logo: "logo",
		noImagesToDownload: "No images to download",
		downloading: "Downloading",
		downloadingPoster: "Downloading poster...",
		downloadingCover: "Downloading cover...",
		downloadingLogo: "Downloading logo...",
		completed: "Completed!",
		completedAllDownloaded: "Completed! All images downloaded",
		completedAlreadyLocal: "Completed! Images are already local",
		completedWithErrors:
			"Completed! Successful: {successful}, failed: {failed}",
		invalidUrl: "Invalid URL format: {url}. Expected valid HTTP/HTTPS URL.",
		imageNotFound: "Image not found (404): {url}",
		accessForbidden: "Access forbidden (403): {url}",
		serverError: "Server error ({status}): {url}",
		httpError: "HTTP {status}: {url}",
		downloadFailed: "Failed to download image: {url}",
		timeout: "Timeout after {timeout}ms",
		downloadedWithErrors:
			"Downloaded: {successful}/{total} images. Some are unavailable in your region.",
		imagesUnavailable:
			"Images are unavailable in your region. Using original links.",
		processingError: "Error processing images",
		posterUnavailable:
			"Poster unavailable (possibly blocked in your region)",
		coverUnavailable: "Cover unavailable (possibly blocked in your region)",
		logoUnavailable: "Logo unavailable (possibly blocked in your region)",
		downloadError: "Failed to download",
	},

	utils: {
		unknownMovie: "Unknown Movie",
		copyPrefix: "Copy",
		templateNotFound: "Template not found",
		templateReadError: "Failed to read template file",
	},

	settings: {
		apiToken: "API Token",
		apiTokenDesc:
			"You need to get API token to use this plugin. Choose free plan and follow steps.",
		getApiToken: "Get API Token",
		checkToken: "Check Token",
		checking: "Checking...",
		tokenValid: "✅ Token is valid!",
		tokenInvalid: "❌ Token is invalid. Please check your token.",
		tokenError: "❌ Error checking token. Please try again later.",
		enterToken: "Enter API token to check",
		imagesHeading: "Images",
		saveImagesLocally: "Save images locally",
		saveImagesLocallyDesc:
			"Download and save images to local folder instead of using web URLs.",
		imagesFolder: "Images folder",
		imagesFolderDesc: "Folder where downloaded images will be saved.",
		imagesFolderPlaceholder: "Example: attachments/kinopoisk",
		savePosterImage: "Save poster images",
		savePosterImageDesc: "Download and save movie/series poster images.",
		saveCoverImage: "Save cover/backdrop images",
		saveCoverImageDesc:
			"Download and save movie/series cover/backdrop images.",
		saveLogoImage: "Save logo images",
		saveLogoImageDesc: "Download and save movie/series logo images.",
		moviesHeading: "Movies",
		movieFileName: "Movie file name",
		movieFileNameDesc: "Enter the movie file name format.",
		movieFileNamePlaceholder: "Example: {{nameForFile}} ({{year}})",
		movieFileLocation: "Movie file location",
		movieFileLocationDesc: "New movie notes will be placed here.",
		movieFileLocationPlaceholder: "Example: folder1/folder2",
		movieTemplateFile: "Movie template file",
		movieTemplateFileDesc: "Files will be available as templates.",
		movieTemplateFilePlaceholder: "Example: templates/template-file",
		exampleTemplate: "Example Template",
		seriesHeading: "TV series",
		seriesFileName: "TV series file name",
		seriesFileNameDesc: "Enter the TV series file name format.",
		seriesFileNamePlaceholder: "Example: {{nameForFile}} ({{year}})",
		seriesFileLocation: "TV series file location",
		seriesFileLocationDesc: "New TV series notes will be placed here.",
		seriesFileLocationPlaceholder: "Example: folder1/folder2",
		seriesTemplateFile: "TV series template file",
		seriesTemplateFileDesc: "Files will be available as templates.",
		seriesTemplateFilePlaceholder: "Example: templates/template-file",
		languageHeading: "Language",
		language: "Interface language",
		languageDesc: "Select the plugin interface language.",
	},
};

const translations: Record<SupportedLanguage, Translations> = {
	ru,
	en,
};

let currentLanguage: SupportedLanguage = "en";

/**
 * Initialize language based on system locale or user preference
 * Call this function when the plugin loads
 */
export function initializeLanguage(userPreference?: SupportedLanguage): void {
	if (userPreference) {
		currentLanguage = userPreference;
		return;
	}

	// Try to detect system language
	const systemLang = navigator.language || navigator.languages?.[0];
	if (systemLang?.startsWith("ru")) {
		currentLanguage = "ru";
	} else {
		currentLanguage = "en";
	}
}

/**
 * Set the current language
 */
export function setLanguage(language: SupportedLanguage): void {
	currentLanguage = language;
}

/**
 * Get the current language
 */
export function getCurrentLanguage(): SupportedLanguage {
	return currentLanguage;
}

/**
 * Get the list of supported languages
 */
export function getSupportedLanguages(): Array<{
	code: SupportedLanguage;
	name: string;
}> {
	return [
		{ code: "ru", name: "Русский" },
		{ code: "en", name: "English" },
	];
}

/**
 * Get translation by key
 * Usage: t('settings.apiToken') or t('common.ok')
 */
export function t(key: string): string {
	const keys = key.split(".");
	let value: unknown = translations[currentLanguage];

	for (const k of keys) {
		if (value && typeof value === "object" && k in value) {
			value = (value as Record<string, unknown>)[k];
		} else {
			console.warn(`Translation key not found: ${key}`);
			return key;
		}
	}

	return typeof value === "string" ? value : key;
}

/**
 * Get translation by key with parameter substitution
 * Usage: tWithParams('images.completedWithErrors', { successful: 2, failed: 1 })
 */
export function tWithParams(
	key: string,
	params: Record<string, string | number>
): string {
	let translation = t(key);

	for (const [paramKey, paramValue] of Object.entries(params)) {
		translation = translation.replace(
			new RegExp(`\\{${paramKey}\\}`, "g"),
			String(paramValue)
		);
	}

	return translation;
}
