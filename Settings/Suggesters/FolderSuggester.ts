/**
 * FolderSuggester.ts
 *
 * Folder autocomplete component for plugin settings.
 * Provides quick search and selection of folders from Obsidian vault.
 */

import { TAbstractFile, TFolder, AbstractInputSuggest, App } from "obsidian";
import { t } from "i18n";

export class FolderSuggest extends AbstractInputSuggest<TFolder> {
	onSelectFolder: (value: string) => void;

	constructor(
		app: App,
		textInputEl: HTMLInputElement,
		onSelectFolder: (value: string) => void
	) {
		super(app, textInputEl);
		this.onSelectFolder = onSelectFolder;
	}

	/**
	 * Get folders matching input text
	 */
	getSuggestions(inputStr: string): TFolder[] {
		if (!inputStr) {
			return [];
		}

		try {
			const abstractFiles = this.app.vault.getAllLoadedFiles();
			const folders: TFolder[] = [];
			const lowerCaseInputStr = inputStr.toLowerCase();

			abstractFiles.forEach((folder: TAbstractFile) => {
				if (
					folder instanceof TFolder &&
					folder.path.toLowerCase().includes(lowerCaseInputStr)
				) {
					folders.push(folder);
				}
			});

			// Limit results for performance
			return folders.slice(0, 20);
		} catch (error) {
			console.error(t("suggesters.folderListError"), error);
			return [];
		}
	}

	renderSuggestion(folder: TFolder, el: HTMLElement): void {
		if (folder && el) {
			el.setText(folder.path);
		}
	}

	selectSuggestion(folder: TFolder): void {
		if (folder && folder.path) {
			this.setValue(folder.path);
			this.onSelectFolder(folder.path);
			this.close();
		}
	}
}
