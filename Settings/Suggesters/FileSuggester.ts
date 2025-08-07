/**
 * FileSuggester.ts
 *
 * Компонент автодополнения для выбора файлов в настройках плагина.
 * Предоставляет пользователю возможность быстро найти и выбрать .md файлы
 * из хранилища Obsidian при настройке шаблонов.
 *
 * Используется в настройках плагина для выбора файла шаблона.
 * Основан на коде из плагина Periodic Notes от Liam Cain.
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
	 * Получает список файлов, соответствующих введенному тексту
	 * Фильтрует только .md файлы
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

			// Ограничиваем количество результатов для производительности
			return files.slice(0, 20);
		} catch (error) {
			console.error(t("suggesters.fileListError"), error);
			return [];
		}
	}

	/**
	 * Отображает предложение в выпадающем списке
	 */
	renderSuggestion(file: TFile, el: HTMLElement): void {
		if (file && el) {
			el.setText(file.path);
		}
	}

	/**
	 * Обрабатывает выбор файла пользователем
	 */
	selectSuggestion(file: TFile): void {
		if (file && file.path) {
			this.setValue(file.path);
			this.onSelectFile(file.path);
			this.close();
		}
	}
}
