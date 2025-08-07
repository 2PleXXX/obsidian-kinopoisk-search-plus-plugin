/**
 * suggest_modal.ts
 *
 * Модальное окно для выбора фильма/сериала из результатов поиска.
 * Отображает список найденных элементов с постерами и основной информацией,
 * позволяет фильтровать результаты и выбрать нужный элемент.
 *
 * Основные функции:
 * - Отображение списка фильмов/сериалов с постерами
 * - Фильтрация результатов по названию (основному и альтернативному)
 * - Получение детальной информации о выбранном элементе через API
 * - Передача полных данных фильма/сериала через callback функцию
 * - Отображение прогресса скачивания изображений
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

	/**
	 * Фильтрует список предложений по поисковому запросу
	 */
	getSuggestions(query: string): KinopoiskSuggestItem[] {
		return this.suggestion.filter((item) => {
			const searchQuery = query?.toLowerCase();
			return (
				item.name.toLowerCase().includes(searchQuery) ||
				item.alternativeName.toLowerCase().includes(searchQuery)
			);
		});
	}

	/**
	 * Проверяет, является ли URL валидным для изображения
	 */
	private isValidImageUrl(url?: string): boolean {
		if (!url || url.trim() === "") return false;

		try {
			new URL(url);
			return url.startsWith("http://") || url.startsWith("https://");
		} catch {
			return false;
		}
	}

	/**
	 * Создает элемент изображения постера или заглушку
	 */
	private createPosterElement(
		item: KinopoiskSuggestItem,
		container: HTMLElement
	): HTMLElement {
		const posterUrl = item.poster?.url;

		if (this.isValidImageUrl(posterUrl)) {
			const imgElement = container.createEl("img", {
				cls: "kinopoisk-plugin__suggest-poster",
			});

			// Устанавливаем src отдельно, чтобы избежать ошибки TypeScript
			imgElement.src = posterUrl!;

			// Добавляем обработчик ошибки загрузки изображения
			imgElement.addEventListener("error", () => {
				// Если изображение не загрузилось, заменяем на заглушку
				const placeholder = container.createEl("div", {
					text: t("modals.posterPlaceholderEmoji"),
					cls: "kinopoisk-plugin__suggest-poster-placeholder",
				});
				placeholder.title = t("modals.posterTooltipGeoblock");
				imgElement.replaceWith(placeholder);
			});

			return imgElement;
		} else {
			// Если URL не валиден или отсутствует, показываем заглушку
			const placeholder = container.createEl("div", {
				text: t("modals.posterPlaceholderEmoji"),
				cls: "kinopoisk-plugin__suggest-poster-placeholder",
			});

			// Определяем причину и добавляем подсказку
			const reason = !posterUrl
				? t("modals.posterTooltipMissing")
				: posterUrl.trim() === ""
				? t("modals.posterTooltipEmptyLink")
				: t("modals.posterTooltipInvalidLink");
			placeholder.title = reason;

			return placeholder;
		}
	}

	/**
	 * Отрисовывает элемент списка с постером и информацией о фильме/сериале
	 */
	renderSuggestion(item: KinopoiskSuggestItem, el: HTMLElement) {
		const title = item.name;
		const subtitle = `${item.year}, ${item.alternativeName} (${item.type})`;

		const container = el.createEl("div", {
			cls: "kinopoisk-plugin__suggest-item",
		});

		// Добавляем постер или заглушку
		this.createPosterElement(item, container);

		// Добавляем текстовую информацию
		const textInfo = container.createEl("div", {
			cls: "kinopoisk-plugin__suggest-text-info",
		});
		textInfo.appendChild(el.createEl("div", { text: title }));
		textInfo.appendChild(el.createEl("small", { text: subtitle }));
	}

	/**
	 * Обрабатывает выбор элемента из списка
	 */
	onChooseSuggestion(item: KinopoiskSuggestItem) {
		this.getItemDetails(item);
	}

	/**
	 * Управляет отображением уведомлений о загрузке
	 */
	private updateStatus(message: string, persistent: boolean = true): void {
		this.hideLoadingNotice();
		this.loadingNotice = new Notice(message, persistent ? 0 : 3000);
	}

	/**
	 * Скрывает уведомление о загрузке, если оно существует
	 */
	private hideLoadingNotice(): void {
		if (this.loadingNotice) {
			this.loadingNotice.hide();
			this.loadingNotice = undefined;
		}
	}

	/**
	 * Обновляет текст существующего уведомления о загрузке
	 */
	private updateLoadingNotice(message: string): void {
		if (this.loadingNotice) {
			// Получаем элемент DOM уведомления и обновляем его содержимое
			const noticeEl = this.loadingNotice.noticeEl;
			if (noticeEl) {
				noticeEl.textContent = message;
			}
		} else {
			// Если уведомления нет, создаем новое
			this.updateStatus(message);
		}
	}

	/**
	 * Создает прогресс-бар в виде текста с процентами
	 */
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

	/**
	 * Создает визуальный прогресс-бар из символов
	 */
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

	/**
	 * Валидирует входные данные
	 */
	private validateInput(item: KinopoiskSuggestItem): boolean {
		// Проверяем базовые данные
		if (!item?.id || item.id <= 0) {
			new Notice(t("modals.errorMovieData"));
			this.onChoose(new Error(t("modals.errorMovieData")));
			return false;
		}

		// Проверяем API токен
		if (!this.token?.trim()) {
			new Notice(t("modals.needApiToken"));
			this.onChoose(new Error(t("modals.needApiToken")));
			return false;
		}

		return true;
	}

	/**
	 * Получает основную информацию о фильме через API
	 */
	private async fetchMovieData(itemId: number): Promise<MovieShow> {
		return await this.kinopoiskProvider.getMovieById(itemId, this.token);
	}

	/**
	 * Обрабатывает изображения фильма с прогресс-баром
	 */
	private async processMovieImages(movieShow: MovieShow): Promise<MovieShow> {
		this.updateLoadingNotice(t("modals.preparingImages"));

		let imageProcessingCompleted = false;

		// Создаем callback для отслеживания прогресса
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

			// Отмечаем завершение обработки изображений
			if (current === total) {
				imageProcessingCompleted = true;
			}
		};

		// Обрабатываем изображения с прогресс-баром
		const processedMovieShow = await processImages(
			this.plugin.app,
			movieShow,
			this.plugin.settings,
			progressCallback
		);

		// Небольшая задержка, чтобы пользователь увидел финальный статус
		if (imageProcessingCompleted) {
			await new Promise((resolve) => setTimeout(resolve, 1000));
		}

		return processedMovieShow;
	}

	/**
	 * Обрабатывает успешное получение данных фильма
	 */
	private handleSuccess(
		movieShow: MovieShow,
		hadImageProcessing: boolean = false
	): void {
		this.hideLoadingNotice();

		// Показываем соответствующее уведомление об успешном завершении
		if (!hadImageProcessing) {
			// Если изображения не обрабатывались (уже локальные или отключено)
			new Notice(t("modals.movieInfoLoaded"));
		} else {
			// Если были изображения - не показываем дополнительное уведомление
			// так как processImages уже показало соответствующее сообщение
		}

		// Успешно получили данные
		this.onChoose(null, movieShow);
	}

	/**
	 * Обрабатывает ошибки получения данных фильма
	 */
	private handleError(error: unknown): void {
		// Скрываем уведомление о загрузке в случае ошибки
		this.hideLoadingNotice();

		// Показываем понятную ошибку пользователю
		const errorMessage =
			error instanceof Error
				? error.message
				: t("modals.errorGettingDetails");
		new Notice(errorMessage);

		// Логируем подробную ошибку для разработчика
		console.error("Error getting movie details:", error);

		// Передаем ошибку в callback
		this.onChoose(error as Error);
	}

	/**
	 * Получает детальную информацию о выбранном фильме/сериале через API
	 * с поддержкой локального сохранения изображений и прогресс-бара
	 */
	async getItemDetails(item: KinopoiskSuggestItem) {
		if (!this.validateInput(item)) {
			return;
		}

		try {
			// Показываем начальное уведомление о загрузке
			this.updateStatus(t("modals.loadingMovieInfo"));

			// Получаем основную информацию о фильме через новый API
			const movieShow = await this.fetchMovieData(item.id);

			// Если локальное сохранение изображений отключено, сразу возвращаем результат
			if (!this.plugin.settings.saveImagesLocally) {
				this.handleSuccess(movieShow, false);
				return;
			}

			// Обрабатываем изображения
			const processedMovieShow = await this.processMovieImages(movieShow);
			this.handleSuccess(processedMovieShow, true);
		} catch (error) {
			this.handleError(error);
		}
	}

	/**
	 * Переопределяем метод закрытия для очистки уведомлений
	 */
	onClose() {
		this.hideLoadingNotice();
		super.onClose();
	}
}
