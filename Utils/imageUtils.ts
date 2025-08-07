/**
 * imageUtils.ts
 *
 * Утилиты для скачивания и сохранения изображений локально.
 * Обрабатывает загрузку изображений по URL и сохранение их в указанную папку
 * с уникальными именами файлов.
 */

import { App, Notice, normalizePath, requestUrl } from "obsidian";
import { MovieShow } from "Models/MovieShow.model";
import { replaceIllegalFileNameCharactersInString } from "./utils";
import { ObsidianKinopoiskPluginSettings } from "Settings/settings";
import { t, tWithParams } from "../i18n";

/**
 * Интерфейс для callback функции прогресса
 */
export interface ProgressCallback {
	(current: number, total: number, currentTask: string): void;
}

/**
 * Конфигурация для скачивания изображений
 */
const DOWNLOAD_CONFIG = {
	timeout: 10000, // 10 секунд таймаут
	maxRetries: 2, // максимум 2 попытки
	retryDelay: 1000, // задержка между попытками в мс
};

/**
 * Поддерживаемые расширения изображений
 */
const SUPPORTED_EXTENSIONS = [
	"jpg",
	"jpeg",
	"png",
	"gif",
	"webp",
	"svg",
	"bmp",
];

/**
 * Маппинг MIME типов на расширения файлов
 */
const MIME_TO_EXTENSION_MAP: { [key: string]: string } = {
	"image/jpeg": "jpg",
	"image/jpg": "jpg",
	"image/png": "png",
	"image/gif": "gif",
	"image/webp": "webp",
	"image/svg+xml": "svg",
	"image/bmp": "bmp",
};

/**
 * Проверяет, является ли URL валидным для изображения
 */
function isValidImageUrl(url: string): boolean {
	if (!url || url.trim() === "") return false;

	try {
		new URL(url);
		return url.startsWith("http://") || url.startsWith("https://");
	} catch {
		return false;
	}
}

/**
 * Получает расширение файла из MIME типа или URL
 */
function getImageExtension(url: string, mimeType?: string): string {
	// Сначала проверяем MIME тип (более надежно)
	if (mimeType && MIME_TO_EXTENSION_MAP[mimeType]) {
		return MIME_TO_EXTENSION_MAP[mimeType];
	}

	// Потом пытаемся из URL
	const urlExtension = url.split(".").pop()?.toLowerCase();
	if (urlExtension && SUPPORTED_EXTENSIONS.includes(urlExtension)) {
		return urlExtension;
	}

	// По умолчанию используем jpg
	return "jpg";
}

/**
 * Создает уникальное имя файла для изображения
 */
function createImageFileName(
	movieShow: MovieShow,
	imageType: string,
	extension: string
): string {
	const baseName = `${movieShow.nameForFile}_${movieShow.year}_${imageType}`;
	const cleanedBaseName = replaceIllegalFileNameCharactersInString(baseName);
	return `${cleanedBaseName}.${extension}`;
}

/**
 * Проверяет, является ли ошибка сетевой проблемой
 */
function isNetworkError(error: unknown): boolean {
	if (
		!error ||
		typeof error !== "object" ||
		typeof (error as { message?: unknown }).message !== "string"
	) {
		return false;
	}

	const networkErrors = [
		"ERR_CONNECTION_TIMED_OUT",
		"ERR_NETWORK_CHANGED",
		"ERR_INTERNET_DISCONNECTED",
		"ERR_NAME_NOT_RESOLVED",
		"ERR_CONNECTION_REFUSED",
		"ERR_CONNECTION_RESET",
		"ERR_BLOCKED_BY_CLIENT",
	];

	return networkErrors.some((errorCode) =>
		(error as { message: string }).message.includes(errorCode)
	);
}

/**
 * Создает промис с таймаутом
 */
function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
	const timeoutPromise = new Promise<never>((_, reject) => {
		setTimeout(() => {
			reject(
				new Error(tWithParams("images.timeout", { timeout: timeoutMs }))
			);
		}, timeoutMs);
	});

	return Promise.race([promise, timeoutPromise]);
}

/**
 * Задержка между попытками
 */
function delay(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Скачивает изображение по URL с поддержкой таймаутов и повторных попыток
 */
async function downloadImage(
	url: string
): Promise<{ data: ArrayBuffer; mimeType?: string }> {
	// Проверяем валидность URL
	if (!isValidImageUrl(url)) {
		throw new Error(tWithParams("images.invalidUrl", { url }));
	}

	let lastError: Error = new Error(
		tWithParams("images.downloadFailed", { url })
	);

	for (let attempt = 1; attempt <= DOWNLOAD_CONFIG.maxRetries; attempt++) {
		try {
			const downloadPromise = requestUrl({
				url,
				method: "GET",
			});

			const response = await withTimeout(
				downloadPromise,
				DOWNLOAD_CONFIG.timeout
			);

			// Более детальная проверка статуса ответа
			if (response.status !== 200) {
				if (response.status === 404) {
					throw new Error(
						tWithParams("images.imageNotFound", { url })
					);
				} else if (response.status === 403) {
					throw new Error(
						tWithParams("images.accessForbidden", { url })
					);
				} else if (response.status >= 500) {
					throw new Error(
						tWithParams("images.serverError", {
							status: response.status,
							url,
						})
					);
				} else {
					throw new Error(
						tWithParams("images.httpError", {
							status: response.status,
							url,
						})
					);
				}
			}

			return {
				data: response.arrayBuffer,
				mimeType: response.headers["content-type"],
			};
		} catch (error) {
			lastError = error as Error;
			console.warn(
				`Failed to download image (attempt ${attempt}/${DOWNLOAD_CONFIG.maxRetries}): ${url}`,
				error
			);

			// Если это последняя попытка или не сетевая ошибка, не пытаемся снова
			if (
				attempt === DOWNLOAD_CONFIG.maxRetries ||
				!isNetworkError(error)
			) {
				break;
			}

			// Задержка перед следующей попыткой
			if (attempt < DOWNLOAD_CONFIG.maxRetries) {
				await delay(DOWNLOAD_CONFIG.retryDelay);
			}
		}
	}

	console.error(
		`Failed to download image after ${DOWNLOAD_CONFIG.maxRetries} attempts: ${url}`,
		lastError
	);
	throw lastError;
}

/**
 * Сохраняет изображение в локальное хранилище
 */
async function saveImageToVault(
	app: App,
	imageData: ArrayBuffer,
	folderPath: string,
	fileName: string
): Promise<string> {
	const { vault } = app;

	// Убеждаемся, что папка существует
	const normalizedFolderPath = normalizePath(folderPath);
	if (!vault.getAbstractFileByPath(normalizedFolderPath)) {
		await vault.createFolder(normalizedFolderPath);
	}

	// Создаем полный путь к файлу
	const fullPath = normalizePath(`${folderPath}/${fileName}`);

	// Проверяем, не существует ли уже файл с таким названием
	let finalPath = fullPath;
	let counter = 1;
	while (vault.getAbstractFileByPath(finalPath)) {
		const pathParts = fullPath.split(".");
		const extension = pathParts.pop();
		const basePath = pathParts.join(".");
		finalPath = `${basePath}_${counter}.${extension}`;
		counter++;
	}

	// Сохраняем файл
	await vault.createBinary(finalPath, imageData);

	return finalPath;
}

/**
 * Скачивает и сохраняет изображение, возвращает локальный путь
 */
export async function downloadAndSaveImage(
	app: App,
	url: string,
	movieShow: MovieShow,
	imageType: string,
	folderPath: string
): Promise<string> {
	try {
		// Если это не HTTP/HTTPS URL, просто возвращаем его
		if (!isValidImageUrl(url)) {
			return url;
		}

		// Скачиваем изображение
		const { data, mimeType } = await downloadImage(url);

		// Определяем расширение файла
		const extension = getImageExtension(url, mimeType);

		// Создаем имя файла
		const fileName = createImageFileName(movieShow, imageType, extension);

		// Сохраняем в хранилище
		const localPath = await saveImageToVault(
			app,
			data,
			folderPath,
			fileName
		);

		return localPath;
	} catch (error) {
		console.error(`Failed to download and save image: ${url}`, error);
		throw error;
	}
}

/**
 * Создает ссылку на изображение для Obsidian в зависимости от типа пути
 */
function createImageLink(imagePath: string): string[] {
	if (!imagePath || imagePath.trim() === "") return [];

	// Если это локальный путь, используем wiki-ссылки без пути (только имя файла)
	if (!imagePath.startsWith("http")) {
		// Извлекаем только имя файла из полного пути
		const fileName = imagePath.split("/").pop() || imagePath;
		return [`![[${fileName}]]`];
	}

	// Если это веб-ссылка, используем формат ![](url)
	return [`![](${imagePath})`];
}

/**
 * Подсчитывает общее количество изображений для скачивания
 */
function countImagesToDownload(
	movieShow: MovieShow,
	settings: Pick<
		ObsidianKinopoiskPluginSettings,
		"savePosterImage" | "saveCoverImage" | "saveLogoImage"
	>
): number {
	let count = 0;

	// Считаем постер, если он есть и это валидный HTTP URL
	if (
		settings.savePosterImage &&
		movieShow.posterUrl.length > 0 &&
		movieShow.posterUrl[0] &&
		isValidImageUrl(movieShow.posterUrl[0])
	) {
		count++;
	}

	// Считаем обложку, если она есть и это валидный HTTP URL
	if (
		settings.saveCoverImage &&
		movieShow.coverUrl.length > 0 &&
		movieShow.coverUrl[0] &&
		isValidImageUrl(movieShow.coverUrl[0])
	) {
		count++;
	}

	// Считаем логотип, если он есть и это валидный HTTP URL
	if (
		settings.saveLogoImage &&
		movieShow.logoUrl.length > 0 &&
		movieShow.logoUrl[0] &&
		isValidImageUrl(movieShow.logoUrl[0])
	) {
		count++;
	}

	return count;
}

/**
 * Получает читаемое название типа изображения
 */
function getImageTypeDisplayName(imageType: string): string {
	return t(`images.${imageType}`);
}

/**
 * Обрабатывает все изображения для фильма/сериала согласно настройкам
 */
export async function processImages(
	app: App,
	movieShow: MovieShow,
	settings: Pick<
		ObsidianKinopoiskPluginSettings,
		| "saveImagesLocally"
		| "imagesFolder"
		| "savePosterImage"
		| "saveCoverImage"
		| "saveLogoImage"
	>,
	progressCallback?: ProgressCallback
): Promise<MovieShow> {
	// Если локальное сохранение отключено, возвращаем оригинальные данные
	if (!settings.saveImagesLocally) {
		return movieShow;
	}

	const updatedMovieShow = { ...movieShow };

	// Подсчитываем общее количество изображений для скачивания
	const totalImages = countImagesToDownload(movieShow, settings);
	let processedImages = 0;
	let successfulDownloads = 0;
	let failedDownloads = 0;

	// Если нет изображений для скачивания, возвращаем оригинальные данные
	if (totalImages === 0) {
		progressCallback?.(0, 0, t("images.noImagesToDownload"));
		return movieShow;
	}

	try {
		// Обрабатываем постер
		if (
			settings.savePosterImage &&
			movieShow.posterUrl.length > 0 &&
			movieShow.posterUrl[0]
		) {
			const posterUrl = movieShow.posterUrl[0];

			// Проверяем, является ли это валидным HTTP URL
			if (isValidImageUrl(posterUrl)) {
				const imageTypeName = getImageTypeDisplayName("poster");
				progressCallback?.(
					processedImages + 1,
					totalImages,
					`${t("images.downloading")} ${imageTypeName}...`
				);

				try {
					const localPath = await downloadAndSaveImage(
						app,
						posterUrl,
						movieShow,
						"poster",
						settings.imagesFolder
					);
					updatedMovieShow.posterImageLink =
						createImageLink(localPath);
					processedImages++;
					successfulDownloads++;
				} catch (error) {
					console.warn("Failed to download poster image:", error);
					processedImages++;
					failedDownloads++;

					// Логируем ошибки, но не показываем Notice здесь
					if (isNetworkError(error)) {
						console.warn(t("images.posterUnavailable"));
					} else {
						console.warn(
							`${t("images.downloadError")} ${t("images.poster")}`
						);
					}
					// Оставляем оригинальный URL если скачивание не удалось
					updatedMovieShow.posterImageLink =
						createImageLink(posterUrl);
				}
			} else {
				// Уже локальный файл, создаем ссылку
				updatedMovieShow.posterImageLink = createImageLink(posterUrl);
			}
		}

		// Обрабатываем задник/фон
		if (
			settings.saveCoverImage &&
			movieShow.coverUrl.length > 0 &&
			movieShow.coverUrl[0]
		) {
			const coverUrl = movieShow.coverUrl[0];

			if (isValidImageUrl(coverUrl)) {
				const imageTypeName = getImageTypeDisplayName("cover");
				progressCallback?.(
					processedImages + 1,
					totalImages,
					`${t("images.downloading")} ${imageTypeName}...`
				);

				try {
					const localPath = await downloadAndSaveImage(
						app,
						coverUrl,
						movieShow,
						"cover",
						settings.imagesFolder
					);
					updatedMovieShow.coverImageLink =
						createImageLink(localPath);
					processedImages++;
					successfulDownloads++;
				} catch (error) {
					console.warn("Failed to download cover image:", error);
					processedImages++;
					failedDownloads++;

					if (isNetworkError(error)) {
						console.warn(t("images.coverUnavailable"));
					} else {
						console.warn(
							`${t("images.downloadError")} ${t("images.cover")}`
						);
					}
					// Оставляем оригинальный URL если скачивание не удалось
					updatedMovieShow.coverImageLink = createImageLink(coverUrl);
				}
			} else {
				updatedMovieShow.coverImageLink = createImageLink(coverUrl);
			}
		}

		// Обрабатываем логотип
		if (
			settings.saveLogoImage &&
			movieShow.logoUrl.length > 0 &&
			movieShow.logoUrl[0]
		) {
			const logoUrl = movieShow.logoUrl[0];

			if (isValidImageUrl(logoUrl)) {
				const imageTypeName = getImageTypeDisplayName("logo");
				progressCallback?.(
					processedImages + 1,
					totalImages,
					`${t("images.downloading")} ${imageTypeName}...`
				);

				try {
					const localPath = await downloadAndSaveImage(
						app,
						logoUrl,
						movieShow,
						"logo",
						settings.imagesFolder
					);
					updatedMovieShow.logoImageLink = createImageLink(localPath);
					processedImages++;
					successfulDownloads++;
				} catch (error) {
					console.warn("Failed to download logo image:", error);
					processedImages++;
					failedDownloads++;

					if (isNetworkError(error)) {
						console.warn(t("images.logoUnavailable"));
					} else {
						console.warn(
							`${t("images.downloadError")} ${t("images.logo")}`
						);
					}
					// Оставляем оригинальный URL если скачивание не удалось
					updatedMovieShow.logoImageLink = createImageLink(logoUrl);
				}
			} else {
				updatedMovieShow.logoImageLink = createImageLink(logoUrl);
			}
		}

		// Финальный callback с результатами
		if (progressCallback) {
			if (failedDownloads > 0) {
				progressCallback(
					totalImages,
					totalImages,
					tWithParams("images.completedWithErrors", {
						successful: successfulDownloads,
						failed: failedDownloads,
					})
				);
			} else if (successfulDownloads > 0) {
				progressCallback(
					totalImages,
					totalImages,
					t("images.completedAllDownloaded")
				);
			} else {
				progressCallback(
					totalImages,
					totalImages,
					t("images.completedAlreadyLocal")
				);
			}
		}

		// Показываем Notice только если были ошибки
		if (failedDownloads > 0) {
			if (successfulDownloads > 0) {
				new Notice(
					tWithParams("images.downloadedWithErrors", {
						successful: successfulDownloads,
						total: totalImages,
					})
				);
			} else {
				new Notice(t("images.imagesUnavailable"));
			}
		}
	} catch (error) {
		console.error("Error processing images:", error);
		progressCallback?.(
			processedImages,
			totalImages,
			t("images.processingError")
		);
		new Notice(t("images.processingError"));
	}

	return updatedMovieShow;
}
