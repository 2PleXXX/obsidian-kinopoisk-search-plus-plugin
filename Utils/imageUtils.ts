/**
 * imageUtils.ts
 *
 * Utilities for downloading and saving images locally.
 * Handles image downloading from URLs and saving them to specified folder
 * with unique file names.
 */

import { App, Notice, normalizePath, requestUrl } from "obsidian";
import { MovieShow } from "Models/MovieShow.model";
import { replaceIllegalFileNameCharactersInString } from "./utils";
import { ObsidianKinopoiskPluginSettings } from "Settings/settings";
import { t, tWithParams } from "../i18n";

export interface ProgressCallback {
	(current: number, total: number, currentTask: string): void;
}

const DOWNLOAD_CONFIG = {
	timeout: 10000, // 10 seconds timeout
	maxRetries: 2, // maximum 2 attempts
	retryDelay: 1000, // delay between attempts in ms
};

const SUPPORTED_EXTENSIONS = [
	"jpg",
	"jpeg",
	"png",
	"gif",
	"webp",
	"svg",
	"bmp",
];

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
 * Checks if URL is valid for image downloading
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
 * Gets file extension from MIME type or URL
 */
function getImageExtension(url: string, mimeType?: string): string {
	// Check MIME type first (more reliable)
	if (mimeType && MIME_TO_EXTENSION_MAP[mimeType]) {
		return MIME_TO_EXTENSION_MAP[mimeType];
	}

	// Try to extract from URL
	const urlExtension = url.split(".").pop()?.toLowerCase();
	if (urlExtension && SUPPORTED_EXTENSIONS.includes(urlExtension)) {
		return urlExtension;
	}

	// Default to jpg
	return "jpg";
}

/**
 * Creates unique filename for image
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
 * Extracts clean path from URL or file path for template usage
 * Returns filename only (without path) for both local and web images
 */
function extractCleanPath(imagePath: string): string {
	if (!imagePath || imagePath.trim() === "") return "";

	// For local paths, extract filename only
	if (!imagePath.startsWith("http")) {
		return imagePath.split("/").pop() || imagePath;
	}

	// For web URLs, return the full URL as-is
	// User will need to download images locally to use wiki-link sizing
	return imagePath;
}

/**
 * Checks if error is a network-related issue
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
 * Creates promise with timeout
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

function delay(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Downloads image from URL with timeout and retry support
 */
async function downloadImage(
	url: string
): Promise<{ data: ArrayBuffer; mimeType?: string }> {
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

			// Check response status
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

			// Don't retry if it's the last attempt or non-network error
			if (
				attempt === DOWNLOAD_CONFIG.maxRetries ||
				!isNetworkError(error)
			) {
				break;
			}

			// Delay before next attempt
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
 * Saves image to local vault storage
 */
async function saveImageToVault(
	app: App,
	imageData: ArrayBuffer,
	folderPath: string,
	fileName: string
): Promise<string> {
	const { vault } = app;

	// Ensure folder exists
	const normalizedFolderPath = normalizePath(folderPath);
	if (!vault.getAbstractFileByPath(normalizedFolderPath)) {
		await vault.createFolder(normalizedFolderPath);
	}

	// Create full file path
	const fullPath = normalizePath(`${folderPath}/${fileName}`);

	// Handle file name conflicts by adding counter
	let finalPath = fullPath;
	let counter = 1;
	while (vault.getAbstractFileByPath(finalPath)) {
		const pathParts = fullPath.split(".");
		const extension = pathParts.pop();
		const basePath = pathParts.join(".");
		finalPath = `${basePath}_${counter}.${extension}`;
		counter++;
	}

	await vault.createBinary(finalPath, imageData);
	return finalPath;
}

/**
 * Downloads and saves image, returns local path
 */
export async function downloadAndSaveImage(
	app: App,
	url: string,
	movieShow: MovieShow,
	imageType: string,
	folderPath: string
): Promise<string> {
	try {
		// Return URL as-is if it's not HTTP/HTTPS
		if (!isValidImageUrl(url)) {
			return url;
		}

		const { data, mimeType } = await downloadImage(url);
		const extension = getImageExtension(url, mimeType);
		const fileName = createImageFileName(movieShow, imageType, extension);
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
 * Creates Obsidian image link based on path type
 */
function createImageLink(imagePath: string): string[] {
	if (!imagePath || imagePath.trim() === "") return [];

	// For local paths, use wiki-links with filename only
	if (!imagePath.startsWith("http")) {
		const fileName = imagePath.split("/").pop() || imagePath;
		return [`![[${fileName}]]`];
	}

	// For web URLs, use markdown format
	return [`![](${imagePath})`];
}

/**
 * Counts total images to download based on settings
 */
function countImagesToDownload(
	movieShow: MovieShow,
	settings: Pick<
		ObsidianKinopoiskPluginSettings,
		"savePosterImage" | "saveCoverImage" | "saveLogoImage"
	>
): number {
	let count = 0;

	if (
		settings.savePosterImage &&
		movieShow.posterUrl.length > 0 &&
		movieShow.posterUrl[0] &&
		isValidImageUrl(movieShow.posterUrl[0])
	) {
		count++;
	}

	if (
		settings.saveCoverImage &&
		movieShow.coverUrl.length > 0 &&
		movieShow.coverUrl[0] &&
		isValidImageUrl(movieShow.coverUrl[0])
	) {
		count++;
	}

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

function getImageTypeDisplayName(imageType: string): string {
	return t(`images.${imageType}`);
}

/**
 * Processes all images for movie/show according to settings
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
	// Return original data if local saving is disabled
	if (!settings.saveImagesLocally) {
		return movieShow;
	}

	const updatedMovieShow = { ...movieShow };
	const totalImages = countImagesToDownload(movieShow, settings);
	let processedImages = 0;
	let successfulDownloads = 0;
	let failedDownloads = 0;

	if (totalImages === 0) {
		progressCallback?.(0, 0, t("images.noImagesToDownload"));
		return movieShow;
	}

	try {
		// Process poster
		if (
			settings.savePosterImage &&
			movieShow.posterUrl.length > 0 &&
			movieShow.posterUrl[0]
		) {
			const posterUrl = movieShow.posterUrl[0];

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
					updatedMovieShow.posterMarkdown =
						createImageLink(localPath);
					updatedMovieShow.posterPath = [extractCleanPath(localPath)];
					processedImages++;
					successfulDownloads++;
				} catch (error) {
					console.warn("Failed to download poster image:", error);
					processedImages++;
					failedDownloads++;

					if (isNetworkError(error)) {
						console.warn(t("images.posterUnavailable"));
					} else {
						console.warn(
							`${t("images.downloadError")} ${t("images.poster")}`
						);
					}
					// Keep original URL if download failed
					updatedMovieShow.posterMarkdown =
						createImageLink(posterUrl);
					updatedMovieShow.posterPath = [extractCleanPath(posterUrl)];
				}
			} else {
				// Already local file, create link
				updatedMovieShow.posterMarkdown = createImageLink(posterUrl);
				updatedMovieShow.posterPath = [extractCleanPath(posterUrl)];
			}
		}

		// Process cover/background
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
					updatedMovieShow.coverMarkdown = createImageLink(localPath);
					updatedMovieShow.coverPath = [extractCleanPath(localPath)];
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
					updatedMovieShow.coverMarkdown = createImageLink(coverUrl);
					updatedMovieShow.coverPath = [extractCleanPath(coverUrl)];
				}
			} else {
				updatedMovieShow.coverMarkdown = createImageLink(coverUrl);
				updatedMovieShow.coverPath = [extractCleanPath(coverUrl)];
			}
		}

		// Process logo
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
					updatedMovieShow.logoMarkdown = createImageLink(localPath);
					updatedMovieShow.logoPath = [extractCleanPath(localPath)];
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
					updatedMovieShow.logoMarkdown = createImageLink(logoUrl);
					updatedMovieShow.logoPath = [extractCleanPath(logoUrl)];
				}
			} else {
				updatedMovieShow.logoMarkdown = createImageLink(logoUrl);
				updatedMovieShow.logoPath = [extractCleanPath(logoUrl)];
			}
		}

		// Final callback with results
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

		// Show Notice only if there were errors
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
