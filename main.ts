/**
 * main.ts
 *
 * Main plugin class for Kinopoisk API integration in Obsidian.
 * Coordinates the entire workflow of searching and creating movie/series notes.
 */

import { Notice, Plugin } from "obsidian";
import { SearchModal } from "Views/search_modal";
import { ItemsSuggestModal } from "Views/suggest_modal";
import { KinopoiskSuggestItem } from "Models/kinopoisk_response";
import { MovieShow } from "Models/MovieShow.model";
import {
	ObsidianKinopoiskPluginSettings,
	DEFAULT_SETTINGS,
	ObsidianKinopoiskSettingTab,
} from "Settings/settings";
import {
	makeFileName,
	getTemplateContents,
	replaceVariableSyntax,
} from "Utils/utils";
import { CursorJumper } from "Utils/cursor_jumper";
import { initializeLanguage } from "./i18n";

export default class ObsidianKinopoiskPlugin extends Plugin {
	settings: ObsidianKinopoiskPluginSettings;

	async onload() {
		await this.loadSettings();

		// Initialize language from settings or auto-detect
		initializeLanguage(this.settings.language);

		this.addRibbonIcon("film", "Search in Kinopoisk", () => {
			this.createNewNote();
		});

		this.addCommand({
			id: "open-search-kinopoisk-modal",
			name: "Search",
			callback: () => {
				this.createNewNote();
			},
		});

		this.addSettingTab(new ObsidianKinopoiskSettingTab(this.app, this));
	}

	// Shows error notification to user
	showNotice(error: Error) {
		try {
			new Notice(error.message);
		} catch {
			// eslint-disable
		}
	}

	// Main workflow: search -> select -> create note with template
	async createNewNote(): Promise<void> {
		try {
			const movieShow = await this.searchMovieShow();

			const {
				movieFileNameFormat,
				movieFolder,
				seriesFileNameFormat,
				seriesFolder,
			} = this.settings;

			const renderedContents = await this.getRenderedContents(movieShow);
			const fileNameFormat = movieShow.isSeries
				? seriesFileNameFormat
				: movieFileNameFormat;
			const folderPath = movieShow.isSeries ? seriesFolder : movieFolder;

			// Create folder if it doesn't exist
			if (
				folderPath &&
				!(await this.app.vault.adapter.exists(folderPath))
			) {
				await this.app.vault.createFolder(folderPath);
			}

			const fileName = await makeFileName(
				this.app,
				movieShow,
				fileNameFormat,
				folderPath
			);
			const filePath = `${folderPath}/${fileName}`;
			const targetFile = await this.app.vault.create(
				filePath,
				renderedContents
			);
			const newLeaf = this.app.workspace.getLeaf(true);
			if (!newLeaf) {
				console.warn("No new leaf");
				return;
			}
			await newLeaf.openFile(targetFile, { state: { mode: "source" } });
			newLeaf.setEphemeralState({ rename: "all" });

			// Jump cursor to next template location
			await new CursorJumper(this.app).jumpToNextCursorLocation();
		} catch (err) {
			console.warn(err);
			this.showNotice(err);
		}
	}

	// Coordinates search process: search then select from results
	async searchMovieShow(): Promise<MovieShow> {
		const searchedItems = await this.openSearchModal();
		return await this.openSuggestModal(searchedItems);
	}

	// Opens search modal and returns found items
	async openSearchModal(): Promise<KinopoiskSuggestItem[]> {
		return new Promise((resolve, reject) => {
			return new SearchModal(this, (error, results) => {
				return error ? reject(error) : resolve(results ?? []);
			}).open();
		});
	}

	// Opens suggestion modal and returns detailed info about selected item
	async openSuggestModal(items: KinopoiskSuggestItem[]): Promise<MovieShow> {
		return new Promise((resolve, reject) => {
			return new ItemsSuggestModal(this, items, (error, selectedItem) => {
				return error ? reject(error) : resolve(selectedItem!);
			}).open();
		});
	}

	// Loads template content and fills it with movie/series data
	async getRenderedContents(movieShow: MovieShow) {
		const { movieTemplateFile, seriesTemplateFile } = this.settings;
		const templateFile = movieShow.isSeries
			? seriesTemplateFile
			: movieTemplateFile;
		if (templateFile) {
			const templateContents = await getTemplateContents(
				this.app,
				templateFile
			);
			const replacedVariable = replaceVariableSyntax(
				movieShow,
				templateContents
			);
			return replacedVariable;
		}
		return "";
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
