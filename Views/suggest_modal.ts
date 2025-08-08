/**
 * suggest_modal.ts
 *
 * Modal for selecting movies/TV shows from search results.
 * Displays search results with posters, handles filtering and detailed data fetching.
 */

import { SuggestModal, Notice } from "obsidian";
import { KinopoiskSuggestItem } from "Models/kinopoisk_response";
import { MovieShow } from "Models/MovieShow.model";
import { KinopoiskProvider } from "APIProvider/provider";
import { processImages, ProgressCallback } from "Utils/imageUtils";
import ObsidianKinopoiskPlugin from "main";
import { t } from "../i18n";

interface SuggestCallback {
	(error: Error | null, result?: MovieShow): void;
}

export class ItemsSuggestModal extends SuggestModal<KinopoiskSuggestItem> {
	private token = "";
	private loadingNotice?: Notice;
	private kinopoiskProvider: KinopoiskProvider;

	constructor(
		private plugin: ObsidianKinopoiskPlugin,
		private readonly suggestion: KinopoiskSuggestItem[],
		private onChoose: SuggestCallback
	) {
		super(plugin.app);
		this.token = plugin.settings.apiToken;
		this.kinopoiskProvider = new KinopoiskProvider();
	}

	// Filters suggestions by search query
	getSuggestions(query: string): KinopoiskSuggestItem[] {
		return this.suggestion.filter((item) => {
			const searchQuery = query?.toLowerCase();
			return (
				item.name.toLowerCase().includes(searchQuery) ||
				item.alternativeName.toLowerCase().includes(searchQuery)
			);
		});
	}

	// Validates image URL
	private isValidImageUrl(url?: string): boolean {
		if (!url || url.trim() === "") return false;

		try {
			new URL(url);
			return url.startsWith("http://") || url.startsWith("https://");
		} catch {
			return false;
		}
	}

	// Creates poster image element or placeholder
	private createPosterElement(
		item: KinopoiskSuggestItem,
		container: HTMLElement
	): HTMLElement {
		const posterUrl = item.poster?.url;

		if (this.isValidImageUrl(posterUrl)) {
			const imgElement = container.createEl("img", {
				cls: "kinopoisk-plugin__suggest-poster",
			});

			imgElement.src = posterUrl!;

			// Handle image loading error
			imgElement.addEventListener("error", () => {
				const placeholder = container.createEl("div", {
					text: t("modals.posterPlaceholderEmoji"),
					cls: "kinopoisk-plugin__suggest-poster-placeholder",
				});
				placeholder.title = t("modals.posterTooltipGeoblock");
				imgElement.replaceWith(placeholder);
			});

			return imgElement;
		} else {
			// Show placeholder if URL is invalid or missing
			const placeholder = container.createEl("div", {
				text: t("modals.posterPlaceholderEmoji"),
				cls: "kinopoisk-plugin__suggest-poster-placeholder",
			});

			// Determine reason and add tooltip
			const reason = !posterUrl
				? t("modals.posterTooltipMissing")
				: posterUrl.trim() === ""
				? t("modals.posterTooltipEmptyLink")
				: t("modals.posterTooltipInvalidLink");
			placeholder.title = reason;

			return placeholder;
		}
	}

	// Renders list item with poster and movie info
	renderSuggestion(item: KinopoiskSuggestItem, el: HTMLElement) {
		const title = item.name;
		const subtitle = `${item.year}, ${item.alternativeName} (${item.type})`;

		const container = el.createEl("div", {
			cls: "kinopoisk-plugin__suggest-item",
		});

		this.createPosterElement(item, container);

		const textInfo = container.createEl("div", {
			cls: "kinopoisk-plugin__suggest-text-info",
		});
		textInfo.appendChild(el.createEl("div", { text: title }));
		textInfo.appendChild(el.createEl("small", { text: subtitle }));
	}

	// Handles item selection
	onChooseSuggestion(item: KinopoiskSuggestItem) {
		this.getItemDetails(item);
	}

	// Manages loading notice display
	private updateStatus(message: string, persistent: boolean = true): void {
		this.hideLoadingNotice();
		this.loadingNotice = new Notice(message, persistent ? 0 : 3000);
	}

	// Hides loading notice
	private hideLoadingNotice(): void {
		if (this.loadingNotice) {
			this.loadingNotice.hide();
			this.loadingNotice = undefined;
		}
	}

	// Updates existing loading notice text
	private updateLoadingNotice(message: string): void {
		if (this.loadingNotice) {
			const noticeEl = this.loadingNotice.noticeEl;
			if (noticeEl) {
				noticeEl.textContent = message;
			}
		} else {
			this.updateStatus(message);
		}
	}

	// Creates progress text with percentage
	private createProgressText(
		current: number,
		total: number,
		task: string
	): string {
		if (total === 0) return task;

		const percentage = Math.round((current / total) * 100);
		const progressBar = this.createProgressBar(current, total);

		return `${task}\n${progressBar} ${current}/${total} (${percentage}%)`;
	}

	// Creates visual progress bar from characters
	private createProgressBar(
		current: number,
		total: number,
		length: number = 20
	): string {
		if (total === 0) return "";

		const filled = Math.round((current / total) * length);
		const empty = length - filled;

		return "█".repeat(filled) + "░".repeat(empty);
	}

	// Validates input data
	private validateInput(item: KinopoiskSuggestItem): boolean {
		if (!item?.id || item.id <= 0) {
			new Notice(t("modals.errorMovieData"));
			this.onChoose(new Error(t("modals.errorMovieData")));
			return false;
		}

		if (!this.token?.trim()) {
			new Notice(t("modals.needApiToken"));
			this.onChoose(new Error(t("modals.needApiToken")));
			return false;
		}

		return true;
	}

	// Fetches movie data via API
	private async fetchMovieData(itemId: number): Promise<MovieShow> {
		return await this.kinopoiskProvider.getMovieById(itemId, this.token);
	}

	// Processes movie images with progress tracking
	private async processMovieImages(movieShow: MovieShow): Promise<MovieShow> {
		this.updateLoadingNotice(t("modals.preparingImages"));

		let imageProcessingCompleted = false;

		// Progress callback for image processing
		const progressCallback: ProgressCallback = (
			current: number,
			total: number,
			currentTask: string
		) => {
			const progressText = this.createProgressText(
				current,
				total,
				currentTask
			);
			this.updateLoadingNotice(progressText);

			if (current === total) {
				imageProcessingCompleted = true;
			}
		};

		const processedMovieShow = await processImages(
			this.plugin.app,
			movieShow,
			this.plugin.settings,
			progressCallback
		);

		// Brief delay to show final status
		if (imageProcessingCompleted) {
			await new Promise((resolve) => setTimeout(resolve, 1000));
		}

		return processedMovieShow;
	}

	// Handles successful data retrieval
	private handleSuccess(
		movieShow: MovieShow,
		hadImageProcessing: boolean = false
	): void {
		this.hideLoadingNotice();

		if (!hadImageProcessing) {
			new Notice(t("modals.movieInfoLoaded"));
		}

		this.onChoose(null, movieShow);
	}

	// Handles errors during data retrieval
	private handleError(error: unknown): void {
		this.hideLoadingNotice();

		const errorMessage =
			error instanceof Error
				? error.message
				: t("modals.errorGettingDetails");
		new Notice(errorMessage);

		console.error("Error getting movie details:", error);
		this.onChoose(error as Error);
	}

	// Fetches detailed movie information with image processing and progress tracking
	async getItemDetails(item: KinopoiskSuggestItem) {
		if (!this.validateInput(item)) {
			return;
		}

		try {
			this.updateStatus(t("modals.loadingMovieInfo"));

			const movieShow = await this.fetchMovieData(item.id);

			// Return immediately if local image saving is disabled
			if (!this.plugin.settings.saveImagesLocally) {
				this.handleSuccess(movieShow, false);
				return;
			}

			const processedMovieShow = await this.processMovieImages(movieShow);
			this.handleSuccess(processedMovieShow, true);
		} catch (error) {
			this.handleError(error);
		}
	}

	// Clean up notices on close
	onClose() {
		this.hideLoadingNotice();
		super.onClose();
	}
}
