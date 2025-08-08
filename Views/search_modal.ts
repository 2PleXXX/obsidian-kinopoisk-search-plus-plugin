/**
 * search_modal.ts
 *
 * Search modal for movies and TV shows via Kinopoisk API.
 * Provides search interface and handles API requests.
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

	// Manages UI loading state
	setBusy(busy: boolean) {
		this.isBusy = busy;
		this.okBtnRef?.setDisabled(busy);
		this.okBtnRef?.setButtonText(
			busy ? t("modals.searching") : t("modals.searchButton")
		);
		this.inputRef?.setDisabled(busy);
	}

	// Validates input before search
	private validateInput(): boolean {
		if (!this.query?.trim()) {
			new Notice(t("modals.enterMovieName"));
			return false;
		}

		if (!this.token?.trim()) {
			new Notice(t("modals.needApiToken"));
			return false;
		}

		if (this.isBusy) {
			return false;
		}

		return true;
	}

	// Handles search errors
	private handleSearchError(error: unknown): void {
		const errorMessage =
			error instanceof Error
				? error.message
				: t("modals.errorUnexpected");
		new Notice(errorMessage);

		this.callback(error as Error);
	}

	// Performs search via Kinopoisk API
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

			this.callback(null, searchResults);
			this.close(); // Close modal only on success
		} catch (error) {
			this.handleSearchError(error);
		} finally {
			this.setBusy(false);
		}
	}

	// Enter key handler for search
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
		// Clean up event listener
		if (this.inputRef?.inputEl) {
			this.inputRef.inputEl.removeEventListener(
				"keydown",
				this.submitEnterCallback
			);
		}

		this.contentEl.empty();
	}
}
