/**
 * settings.ts
 *
 * Настройки плагина Obsidian Kinopoisk.
 * Определяет интерфейс настроек, значения по умолчанию и создает вкладку настроек
 * в интерфейсе Obsidian.
 *
 * Позволяет пользователю настроить:
 * - Язык интерфейса
 * - API токен для доступа к Кинопоиску
 * - Формат имен файлов для фильмов и сериалов
 * - Папки для сохранения заметок
 * - Файлы шаблонов для создания заметок
 */

import { App, PluginSettingTab, Setting, Notice } from "obsidian";
import ObsidianKinopoiskPlugin from "main";
import { FolderSuggest } from "./Suggesters/FolderSuggester";
import { FileSuggest } from "./Suggesters/FileSuggester";
import { KinopoiskProvider } from "../APIProvider/provider";
import {
	t,
	setLanguage,
	getSupportedLanguages,
	SupportedLanguage,
} from "../i18n";

const docUrl =
	"https://github.com/2PleXXX/obsidian-kinopoisk-search-plus-plugin";
const apiSite = "https://kinopoisk.dev/";

/**
 * Интерфейс настроек плагина
 */
export interface ObsidianKinopoiskPluginSettings {
	language: SupportedLanguage;
	apiToken: string;
	apiTokenValid: boolean;
	movieFileNameFormat: string;
	movieFolder: string;
	movieTemplateFile: string;
	seriesFileNameFormat: string;
	seriesFolder: string;
	seriesTemplateFile: string;

	// Настройки для изображений
	imagesFolder: string;
	saveImagesLocally: boolean;
	savePosterImage: boolean;
	saveCoverImage: boolean;
	saveLogoImage: boolean;
}

/**
 * Настройки по умолчанию
 */
export const DEFAULT_SETTINGS: ObsidianKinopoiskPluginSettings = {
	language: "en",
	apiToken: "",
	apiTokenValid: false,
	movieFileNameFormat: "",
	movieFolder: "",
	movieTemplateFile: "",
	seriesFileNameFormat: "",
	seriesFolder: "",
	seriesTemplateFile: "",

	// Значения по умолчанию для изображений
	imagesFolder: "attachments/kinopoisk",
	saveImagesLocally: false,
	savePosterImage: true,
	saveCoverImage: false,
	saveLogoImage: false,
};

/**
 * Вкладка настроек плагина
 */
export class ObsidianKinopoiskSettingTab extends PluginSettingTab {
	private validationTimeout: NodeJS.Timeout | null = null;
	private kinopoiskProvider: KinopoiskProvider;

	constructor(app: App, private plugin: ObsidianKinopoiskPlugin) {
		super(app, plugin);
		this.kinopoiskProvider = new KinopoiskProvider();

		// Устанавливаем язык из настроек при создании
		setLanguage(this.plugin.settings.language);
	}

	get settings() {
		return this.plugin.settings;
	}

	/**
	 * Очистка ресурсов при закрытии настроек
	 */
	onClose(): void {
		if (this.validationTimeout) {
			clearTimeout(this.validationTimeout);
			this.validationTimeout = null;
		}
	}

	/**
	 * Обновляет визуальный индикатор валидности токена
	 */
	private updateTokenValidationIndicator(
		inputElement: HTMLInputElement,
		isValid: boolean | null
	): void {
		if (!inputElement) return;

		// Убираем предыдущие классы индикации
		inputElement.removeClass(
			"kinopoisk-plugin__token-valid",
			"kinopoisk-plugin__token-invalid",
			"kinopoisk-plugin__token-checking"
		);

		// Добавляем соответствующий класс
		if (this.plugin.settings.apiToken.trim() !== "") {
			if (isValid === null) {
				inputElement.addClass("kinopoisk-plugin__token-checking");
			} else if (isValid) {
				inputElement.addClass("kinopoisk-plugin__token-valid");
			} else {
				inputElement.addClass("kinopoisk-plugin__token-invalid");
			}
		}
	}

	/**
	 * Валидирует токен с задержкой
	 */
	private async validateTokenWithDelay(
		token: string,
		inputElement: HTMLInputElement
	): Promise<void> {
		// Отменяем предыдущую проверку
		if (this.validationTimeout) {
			clearTimeout(this.validationTimeout);
		}

		// Показываем состояние проверки
		this.updateTokenValidationIndicator(inputElement, null);

		this.validationTimeout = setTimeout(async () => {
			try {
				const isValid = await this.kinopoiskProvider.validateToken(
					token
				);
				this.plugin.settings.apiTokenValid = isValid;
				await this.plugin.saveSettings();
				this.updateTokenValidationIndicator(inputElement, isValid);
			} catch (error) {
				console.error("Token validation error:", error);
				this.plugin.settings.apiTokenValid = false;
				await this.plugin.saveSettings();
				this.updateTokenValidationIndicator(inputElement, false);
			}
		}, 1500);
	}

	/**
	 * Создает настройку для выбора папки
	 */
	private createFolderSetting(
		containerEl: HTMLElement,
		name: string,
		desc: string,
		placeholder: string,
		currentValue: string,
		onValueChange: (value: string) => void
	): void {
		new Setting(containerEl)
			.setName(name)
			.setDesc(desc)
			.addSearch((cb) => {
				try {
					new FolderSuggest(this.app, cb.inputEl, onValueChange);
				} catch (error) {
					console.error("Error creating FolderSuggest:", error);
				}
				cb.setPlaceholder(placeholder)
					.setValue(currentValue)
					.onChange(onValueChange);
			});
	}

	/**
	 * Создает настройку для выбора файла шаблона
	 */
	private createTemplateSetting(
		containerEl: HTMLElement,
		name: string,
		desc: DocumentFragment,
		placeholder: string,
		currentValue: string,
		onValueChange: (value: string) => void
	): void {
		new Setting(containerEl)
			.setName(name)
			.setDesc(desc)
			.addSearch((cb) => {
				try {
					new FileSuggest(this.app, cb.inputEl, onValueChange);
				} catch (error) {
					console.error("Error creating FileSuggest:", error);
				}
				cb.setPlaceholder(placeholder)
					.setValue(currentValue)
					.onChange(onValueChange);
			});
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();
		containerEl.classList.add("obsidian-kinopoisk-plugin__settings");

		// Настройка языка (первая настройка)
		new Setting(containerEl)
			.setName(t("settings.languageHeading"))
			.setHeading();

		new Setting(containerEl)
			.setName(t("settings.language"))
			.setDesc(t("settings.languageDesc"))
			.addDropdown((dropdown) => {
				const languages = getSupportedLanguages();
				languages.forEach((lang) => {
					dropdown.addOption(lang.code, lang.name);
				});

				dropdown
					.setValue(this.plugin.settings.language)
					.onChange(async (value: SupportedLanguage) => {
						this.plugin.settings.language = value;
						setLanguage(value);
						await this.plugin.saveSettings();
						// Перерисовываем настройки с новым языком
						this.display();
					});
			});

		// Настройка API токена
		const apiKeyDesc = document.createDocumentFragment();
		apiKeyDesc.createDiv({
			text: t("settings.apiTokenDesc"),
		});
		apiKeyDesc.createEl("a", {
			text: t("settings.getApiToken"),
			href: apiSite,
		});

		let tokenInputElement: HTMLInputElement;

		new Setting(containerEl)
			.setName(t("settings.apiToken"))
			.setDesc(apiKeyDesc)
			.addText((text) => {
				const textComponent = text
					.setPlaceholder(t("settings.enterToken"))
					.setValue(this.plugin.settings.apiToken)
					.onChange(async (value) => {
						this.plugin.settings.apiToken = value.trim();
						this.plugin.settings.apiTokenValid = false;
						await this.plugin.saveSettings();

						// Автоматическая проверка токена с задержкой
						if (value.trim() !== "") {
							await this.validateTokenWithDelay(
								value.trim(),
								textComponent.inputEl
							);
						} else {
							// Если токен пустой, отменяем проверку и сбрасываем индикатор
							if (this.validationTimeout) {
								clearTimeout(this.validationTimeout);
								this.validationTimeout = null;
							}
							this.updateTokenValidationIndicator(
								textComponent.inputEl,
								false
							);
						}
					});

				tokenInputElement = textComponent.inputEl;

				// Показываем текущий статус токена при загрузке
				if (this.plugin.settings.apiToken.trim() !== "") {
					this.updateTokenValidationIndicator(
						textComponent.inputEl,
						this.plugin.settings.apiTokenValid
					);
				}

				return textComponent;
			})
			.addButton((button) =>
				button
					.setButtonText(t("settings.checkToken"))
					.setCta()
					.onClick(async () => {
						const token = this.plugin.settings.apiToken.trim();
						if (!token) {
							new Notice(t("settings.enterToken"));
							return;
						}

						button.setDisabled(true);
						button.setButtonText(t("settings.checking"));

						try {
							new Notice(t("settings.checking"));
							const isValid =
								await this.kinopoiskProvider.validateToken(
									token
								);
							this.plugin.settings.apiTokenValid = isValid;
							await this.plugin.saveSettings();

							this.updateTokenValidationIndicator(
								tokenInputElement,
								isValid
							);

							new Notice(
								isValid
									? t("settings.tokenValid")
									: t("settings.tokenInvalid")
							);
						} catch (error) {
							console.error(
								"Manual token validation error:",
								error
							);
							this.plugin.settings.apiTokenValid = false;
							await this.plugin.saveSettings();
							this.updateTokenValidationIndicator(
								tokenInputElement,
								false
							);
							new Notice(t("settings.tokenError"));
						} finally {
							button.setDisabled(false);
							button.setButtonText(t("settings.checkToken"));
						}
					})
			);

		// Секция настроек изображений
		new Setting(containerEl)
			.setName(t("settings.imagesHeading"))
			.setHeading();

		// Включить локальное сохранение изображений
		new Setting(containerEl)
			.setName(t("settings.saveImagesLocally"))
			.setDesc(t("settings.saveImagesLocallyDesc"))
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.saveImagesLocally)
					.onChange(async (value) => {
						this.plugin.settings.saveImagesLocally = value;
						await this.plugin.saveSettings();
						this.display(); // Перерисовываем для показа/скрытия зависимых настроек
					})
			);

		// Показываем дополнительные настройки только если включено локальное сохранение
		if (this.plugin.settings.saveImagesLocally) {
			// Папка для изображений
			this.createFolderSetting(
				containerEl,
				t("settings.imagesFolder"),
				t("settings.imagesFolderDesc"),
				t("settings.imagesFolderPlaceholder"),
				this.plugin.settings.imagesFolder,
				async (folder) => {
					this.plugin.settings.imagesFolder = folder;
					await this.plugin.saveSettings();
				}
			);

			// Настройки для конкретных типов изображений
			new Setting(containerEl)
				.setName(t("settings.savePosterImage"))
				.setDesc(t("settings.savePosterImageDesc"))
				.addToggle((toggle) =>
					toggle
						.setValue(this.plugin.settings.savePosterImage)
						.onChange(async (value) => {
							this.plugin.settings.savePosterImage = value;
							await this.plugin.saveSettings();
						})
				);

			new Setting(containerEl)
				.setName(t("settings.saveCoverImage"))
				.setDesc(t("settings.saveCoverImageDesc"))
				.addToggle((toggle) =>
					toggle
						.setValue(this.plugin.settings.saveCoverImage)
						.onChange(async (value) => {
							this.plugin.settings.saveCoverImage = value;
							await this.plugin.saveSettings();
						})
				);

			new Setting(containerEl)
				.setName(t("settings.saveLogoImage"))
				.setDesc(t("settings.saveLogoImageDesc"))
				.addToggle((toggle) =>
					toggle
						.setValue(this.plugin.settings.saveLogoImage)
						.onChange(async (value) => {
							this.plugin.settings.saveLogoImage = value;
							await this.plugin.saveSettings();
						})
				);
		}

		// Секция настроек для фильмов
		new Setting(containerEl)
			.setName(t("settings.moviesHeading"))
			.setHeading();

		// Формат имени файла для фильмов
		new Setting(containerEl)
			.setName(t("settings.movieFileName"))
			.setDesc(t("settings.movieFileNameDesc"))
			.addText((text) =>
				text
					.setPlaceholder(t("settings.movieFileNamePlaceholder"))
					.setValue(this.plugin.settings.movieFileNameFormat)
					.onChange(async (value) => {
						this.plugin.settings.movieFileNameFormat = value;
						await this.plugin.saveSettings();
					})
			);

		// Папка для файлов фильмов
		this.createFolderSetting(
			containerEl,
			t("settings.movieFileLocation"),
			t("settings.movieFileLocationDesc"),
			t("settings.movieFileLocationPlaceholder"),
			this.plugin.settings.movieFolder,
			async (folder) => {
				this.plugin.settings.movieFolder = folder;
				await this.plugin.saveSettings();
			}
		);

		// Файл шаблона для фильмов
		const movieTemplateFileDesc = document.createDocumentFragment();
		movieTemplateFileDesc.createDiv({
			text: t("settings.movieTemplateFileDesc"),
		});
		movieTemplateFileDesc.createEl("a", {
			text: t("settings.exampleTemplate"),
			href: `${docUrl}#example-template`,
		});

		this.createTemplateSetting(
			containerEl,
			t("settings.movieTemplateFile"),
			movieTemplateFileDesc,
			t("settings.movieTemplateFilePlaceholder"),
			this.plugin.settings.movieTemplateFile,
			async (file) => {
				this.plugin.settings.movieTemplateFile = file;
				await this.plugin.saveSettings();
			}
		);

		// Секция настроек для сериалов
		new Setting(containerEl)
			.setName(t("settings.seriesHeading"))
			.setHeading();

		// Формат имени файла для сериалов
		new Setting(containerEl)
			.setName(t("settings.seriesFileName"))
			.setDesc(t("settings.seriesFileNameDesc"))
			.addText((text) =>
				text
					.setPlaceholder(t("settings.seriesFileNamePlaceholder"))
					.setValue(this.plugin.settings.seriesFileNameFormat)
					.onChange(async (value) => {
						this.plugin.settings.seriesFileNameFormat = value;
						await this.plugin.saveSettings();
					})
			);

		// Папка для файлов сериалов
		this.createFolderSetting(
			containerEl,
			t("settings.seriesFileLocation"),
			t("settings.seriesFileLocationDesc"),
			t("settings.seriesFileLocationPlaceholder"),
			this.plugin.settings.seriesFolder,
			async (folder) => {
				this.plugin.settings.seriesFolder = folder;
				await this.plugin.saveSettings();
			}
		);

		// Файл шаблона для сериалов
		const seriesTemplateFileDesc = document.createDocumentFragment();
		seriesTemplateFileDesc.createDiv({
			text: t("settings.seriesTemplateFileDesc"),
		});
		seriesTemplateFileDesc.createEl("a", {
			text: t("settings.exampleTemplate"),
			href: `${docUrl}#example-template`,
		});

		this.createTemplateSetting(
			containerEl,
			t("settings.seriesTemplateFile"),
			seriesTemplateFileDesc,
			t("settings.seriesTemplateFilePlaceholder"),
			this.plugin.settings.seriesTemplateFile,
			async (file) => {
				this.plugin.settings.seriesTemplateFile = file;
				await this.plugin.saveSettings();
			}
		);
	}
}
