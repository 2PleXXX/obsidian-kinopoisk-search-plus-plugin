/**
 * FolderSuggester.ts
 *
 * Компонент автодополнения для выбора папок в настройках плагина.
 * Предоставляет пользователю возможность быстро найти и выбрать папку
 * из хранилища Obsidian для сохранения создаваемых заметок о фильмах/сериалах.
 *
 * Используется в настройках плагина для выбора целевой папки сохранения.
 * Основан на коде из плагина Periodic Notes от Liam Cain.
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
	 * Получает список папок, соответствующих введенному тексту
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

			// Ограничиваем количество результатов для производительности
			return folders.slice(0, 20);
		} catch (error) {
			console.error(t("suggesters.folderListError"), error);
			return [];
		}
	}

	/**
	 * Отображает предложение папки в выпадающем списке
	 */
	renderSuggestion(folder: TFolder, el: HTMLElement): void {
		if (folder && el) {
			el.setText(folder.path);
		}
	}

	/**
	 * Обрабатывает выбор папки пользователем
	 */
	selectSuggestion(folder: TFolder): void {
		if (folder && folder.path) {
			this.setValue(folder.path);
			this.onSelectFolder(folder.path);
			this.close();
		}
	}
}
