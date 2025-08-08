/**
 * FileSuggester.ts
 *
 * File autocomplete component for plugin settings.
 * Provides quick search and selection of .md files from Obsidian vault.
 */

import { TAbstractFile, TFile, AbstractInputSuggest, App } from "obsidian";
import { t } from "i18n";

export class FileSuggest extends AbstractInputSuggest<TFile> {
	onSelectFile: (value: string) => void;

	constructor(
		app: App,
		textInputEl: HTMLInputElement,
		onSelectFile: (value: string) => void
	) {
		super(app, textInputEl);
		this.onSelectFile = onSelectFile;
	}

	/**
	 * Get files matching input text - filters only .md files
	 */
	getSuggestions(inputStr: string): TFile[] {
		if (!inputStr) {
			return [];
		}

		try {
			const abstractFiles = this.app.vault.getAllLoadedFiles();
			const files: TFile[] = [];
			const lowerCaseInputStr = inputStr.toLowerCase();

			abstractFiles.forEach((file: TAbstractFile) => {
				if (
					file instanceof TFile &&
					file.extension === "md" &&
					file.path.toLowerCase().includes(lowerCaseInputStr)
				) {
					files.push(file);
				}
			});

			// Limit results for performance
			return files.slice(0, 20);
		} catch (error) {
			console.error(t("suggesters.fileListError"), error);
			return [];
		}
	}

	renderSuggestion(file: TFile, el: HTMLElement): void {
		if (file && el) {
			el.setText(file.path);
		}
	}

	selectSuggestion(file: TFile): void {
		if (file && file.path) {
			this.setValue(file.path);
			this.onSelectFile(file.path);
			this.close();
		}
	}
}
