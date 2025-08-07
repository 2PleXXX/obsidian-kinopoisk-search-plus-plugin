/**
 * main.ts
 *
 * Главный класс плагина для интеграции с API Кинопоиска в Obsidian.
 * Координирует весь процесс поиска и создания заметок о фильмах/сериалах.
 *
 * Основной workflow:
 * 1. Пользователь инициирует поиск (через ribbon icon или команду)
 * 2. Открывается модальное окно поиска
 * 3. Отображаются результаты для выбора
 * 4. Создается новая заметка на основе выбранного шаблона
 * 5. Заполняются переменные шаблона данными из API
 * 6. Файл сохраняется в соответствующую папку с правильным именем
 *
 * Поддерживает разные шаблоны и папки для фильмов и сериалов.
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
		// Загружаем настройки
		await this.loadSettings();

		// Инициализируем язык из настроек или определяем автоматически
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

	/**
	 * Отображает уведомление с ошибкой пользователю
	 */
	showNotice(error: Error) {
		try {
			new Notice(error.message);
		} catch {
			// eslint-disable
		}
	}

	/**
	 * Основной метод создания новой заметки:
	 * - Выполняет поиск и выбор фильма/сериала
	 * - Определяет шаблон и папку в зависимости от типа контента
	 * - Создает папку если она не существует
	 * - Создает файл с уникальным именем
	 * - Заполняет шаблон данными и открывает для редактирования
	 */
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

			// Создаем папку если она не существует
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

			// Перемещает курсор к следующему местоположению в шаблоне
			await new CursorJumper(this.app).jumpToNextCursorLocation();
		} catch (err) {
			console.warn(err);
			this.showNotice(err);
		}
	}

	/**
	 * Координирует процесс поиска: сначала поиск, затем выбор из результатов
	 */
	async searchMovieShow(): Promise<MovieShow> {
		const searchedItems = await this.openSearchModal();
		return await this.openSuggestModal(searchedItems);
	}

	/**
	 * Открывает модальное окно поиска и возвращает найденные элементы
	 */
	async openSearchModal(): Promise<KinopoiskSuggestItem[]> {
		return new Promise((resolve, reject) => {
			return new SearchModal(this, (error, results) => {
				return error ? reject(error) : resolve(results ?? []);
			}).open();
		});
	}

	/**
	 * Открывает модальное окно выбора и возвращает детальную информацию о выбранном элементе
	 */
	async openSuggestModal(items: KinopoiskSuggestItem[]): Promise<MovieShow> {
		return new Promise((resolve, reject) => {
			return new ItemsSuggestModal(this, items, (error, selectedItem) => {
				return error ? reject(error) : resolve(selectedItem!);
			}).open();
		});
	}

	/**
	 * Загружает содержимое шаблона и заполняет его данными фильма/сериала
	 */
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
