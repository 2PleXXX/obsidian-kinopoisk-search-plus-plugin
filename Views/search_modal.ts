/**
 * search_modal.ts
 *
 * Модальное окно для поиска фильмов и сериалов через API Кинопоиска.
 * Предоставляет интерфейс для ввода поискового запроса и инициации поиска.
 *
 * Основные функции:
 * - Отображение формы поиска с текстовым полем
 * - Отправка запроса к API при нажатии Enter или кнопки "Search"
 * - Управление состоянием загрузки (блокировка UI во время запроса)
 * - Передача результатов поиска через callback функцию
 * - Показ уведомлений при отсутствии результатов
 */

import {
	ButtonComponent,
	Modal,
	Setting,
	TextComponent,
	Notice,
} from "obsidian";
import { KinopoiskSuggestItem } from "Models/kinopoisk_response";
import { KinopoiskProvider } from "APIProvider/provider";
import ObsidianKinopoiskPlugin from "main";
import { t } from "../i18n";

interface SearchCallback {
	(error: Error | null, result?: KinopoiskSuggestItem[]): void;
}

export class SearchModal extends Modal {
	private isBusy = false;
	private okBtnRef?: ButtonComponent;
	private inputRef?: TextComponent;
	private query = "";
	private token = "";
	private kinopoiskProvider: KinopoiskProvider;

	constructor(
		plugin: ObsidianKinopoiskPlugin,
		private callback: SearchCallback
	) {
		super(plugin.app);
		this.token = plugin.settings.apiToken;
		this.kinopoiskProvider = new KinopoiskProvider();
	}

	/**
	 * Управляет состоянием загрузки UI
	 */
	setBusy(busy: boolean) {
		this.isBusy = busy;
		this.okBtnRef?.setDisabled(busy);
		this.okBtnRef?.setButtonText(
			busy ? t("modals.searching") : t("modals.searchButton")
		);
		this.inputRef?.setDisabled(busy);
	}

	/**
	 * Валидирует входные данные перед поиском
	 */
	private validateInput(): boolean {
		// Проверяем, что запрос не пустой
		if (!this.query?.trim()) {
			new Notice(t("modals.enterMovieName"));
			return false;
		}

		// Проверяем, что API токен установлен
		if (!this.token?.trim()) {
			new Notice(t("modals.needApiToken"));
			return false;
		}

		// Проверяем, что не выполняется другой запрос
		if (this.isBusy) {
			return false;
		}

		return true;
	}

	/**
	 * Обрабатывает ошибки поиска
	 */
	private handleSearchError(error: unknown): void {
		// Показываем понятную ошибку пользователю
		const errorMessage =
			error instanceof Error
				? error.message
				: t("modals.errorUnexpected");
		new Notice(errorMessage);

		// Передаем ошибку в callback для дополнительной обработки, если нужно
		this.callback(error as Error);
	}

	/**
	 * Выполняет поиск через API Кинопоиска
	 */
	async search() {
		if (!this.validateInput()) {
			return;
		}

		try {
			this.setBusy(true);
			const searchResults = await this.kinopoiskProvider.searchByQuery(
				this.query.trim(),
				this.token
			);

			// Успешный результат
			this.callback(null, searchResults);
			this.close(); // Закрываем модальное окно только при успехе
		} catch (error) {
			this.handleSearchError(error);
		} finally {
			// Всегда сбрасываем состояние загрузки
			this.setBusy(false);
		}
	}

	/**
	 * Обработчик нажатия Enter для запуска поиска
	 */
	private submitEnterCallback = (event: KeyboardEvent): void => {
		if (event.key === "Enter" && !event.isComposing) {
			this.search();
		}
	};

	onOpen() {
		const { contentEl } = this;

		contentEl.createEl("h2", { text: t("modals.searchTitle") });

		contentEl.createDiv(
			{ cls: "kinopoisk-plugin__search-modal--input" },
			(settingItem) => {
				this.inputRef = new TextComponent(settingItem)
					.setValue(this.query)
					.setPlaceholder(t("modals.searchPlaceholder"))
					.onChange((value) => (this.query = value));

				this.inputRef.inputEl.addEventListener(
					"keydown",
					this.submitEnterCallback
				);
			}
		);

		new Setting(contentEl).addButton((btn) => {
			return (this.okBtnRef = btn
				.setButtonText(t("modals.searchButton"))
				.setCta()
				.onClick(() => {
					this.search();
				}));
		});
	}

	onClose() {
		// Удаляем event listener
		if (this.inputRef?.inputEl) {
			this.inputRef.inputEl.removeEventListener(
				"keydown",
				this.submitEnterCallback
			);
		}

		this.contentEl.empty();
	}
}
