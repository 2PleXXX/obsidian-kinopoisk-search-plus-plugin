/**
 * settings.ts
 *
 * Plugin settings interface, defaults, and settings tab.
 * Manages API token, templates, folders, and image handling configuration.
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

	// Image settings
	imagesFolder: string;
	saveImagesLocally: boolean;
	savePosterImage: boolean;
	saveCoverImage: boolean;
	saveLogoImage: boolean;
}

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

	// Image defaults
	imagesFolder: "attachments/kinopoisk",
	saveImagesLocally: false,
	savePosterImage: true,
	saveCoverImage: false,
	saveLogoImage: false,
};

export class ObsidianKinopoiskSettingTab extends PluginSettingTab {
	private validationTimeout: NodeJS.Timeout | null = null;
	private kinopoiskProvider: KinopoiskProvider;

	constructor(app: App, private plugin: ObsidianKinopoiskPlugin) {
		super(app, plugin);
		this.kinopoiskProvider = new KinopoiskProvider();

		// Set language from settings on creation
		setLanguage(this.plugin.settings.language);
	}

	get settings() {
		return this.plugin.settings;
	}

	onClose(): void {
		if (this.validationTimeout) {
			clearTimeout(this.validationTimeout);
			this.validationTimeout = null;
		}
	}

	/**
	 * Update token validation visual indicator
	 */
	private updateTokenValidationIndicator(
		inputElement: HTMLInputElement,
		isValid: boolean | null
	): void {
		if (!inputElement) return;

		// Remove previous indicator classes
		inputElement.removeClass(
			"kinopoisk-plugin__token-valid",
			"kinopoisk-plugin__token-invalid",
			"kinopoisk-plugin__token-checking"
		);

		// Add appropriate class
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
	 * Validate token with delay
	 */
	private async validateTokenWithDelay(
		token: string,
		inputElement: HTMLInputElement
	): Promise<void> {
		// Cancel previous validation
		if (this.validationTimeout) {
			clearTimeout(this.validationTimeout);
		}

		// Show checking state
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
	 * Create folder selection setting
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
	 * Create template file selection setting
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

		// Language setting (first setting)
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
						// Redraw settings with new language
						this.display();
					});
			});

		// API token setting
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

						// Automatic token validation with delay
						if (value.trim() !== "") {
							await this.validateTokenWithDelay(
								value.trim(),
								textComponent.inputEl
							);
						} else {
							// Cancel validation if token is empty and reset indicator
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

				// Show current token status on load
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

		// Images settings section
		new Setting(containerEl)
			.setName(t("settings.imagesHeading"))
			.setHeading();

		new Setting(containerEl)
			.setName(t("settings.saveImagesLocally"))
			.setDesc(t("settings.saveImagesLocallyDesc"))
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.saveImagesLocally)
					.onChange(async (value) => {
						this.plugin.settings.saveImagesLocally = value;
						await this.plugin.saveSettings();
						this.display(); // Redraw to show/hide dependent settings
					})
			);

		// Show additional settings only if local saving is enabled
		if (this.plugin.settings.saveImagesLocally) {
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

		// Movies settings section
		new Setting(containerEl)
			.setName(t("settings.moviesHeading"))
			.setHeading();

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

		// Series settings section
		new Setting(containerEl)
			.setName(t("settings.seriesHeading"))
			.setHeading();

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
