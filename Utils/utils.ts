/**
 * utils.ts
 *
 * Набор вспомогательных функций для обработки данных фильмов/сериалов.
 * Содержит утилиты для:
 * - Форматирования текста и имен файлов
 * - Замены переменных в шаблонах
 * - Создания уникальных имен файлов
 * - Чтения содержимого шаблонов
 *
 * Ключевая особенность: разное форматирование для метаданных YAML
 * (с кавычками) и основного текста (без кавычек).
 */

import { MovieShow } from "Models/MovieShow.model";
import { App, normalizePath, Notice } from "obsidian";
import { t } from "../i18n";

/**
 * Делает первую букву строки заглавной
 */
export function capitalizeFirstLetter(input: string): string {
	if (!input || input.length === 0) {
		return input || "";
	}
	return input.charAt(0).toUpperCase() + input.slice(1);
}

/**
 * Заменяет недопустимые символы в именах файлов
 */
export function replaceIllegalFileNameCharactersInString(text: string): string {
	if (!text) {
		return "";
	}
	return text.replace(/[\\/:*?"<>|]/g, "");
}

/**
 * Получает значение из массива без кавычек для использования в основном тексте
 */
function getPlainValueFromArray(value: unknown): string | number {
	if (Array.isArray(value)) {
		if (value.length === 0) return "";

		// Если массив содержит один элемент, возвращаем его
		if (value.length === 1) {
			const firstValue = value[0];
			if (typeof firstValue === "string") {
				return firstValue.replace(/^"(.*)"$/, "$1");
			}
			return firstValue ?? "";
		}

		// Если массив содержит несколько элементов, объединяем их через запятую
		return value
			.filter((item) => item != null)
			.map((item) => {
				if (typeof item === "string") {
					return item.replace(/^"(.*)"$/, "$1");
				}
				return String(item);
			})
			.join(", ");
	}

	// Если это число, возвращаем как число
	if (typeof value === "number") {
		return value;
	}

	return String(value || "");
}

/**
 * Получает значение с кавычками для использования в YAML метаданных
 */
function getQuotedValueFromArray(value: unknown): string {
	if (Array.isArray(value)) {
		if (value.length === 0) return "";

		// Если массив содержит один элемент, возвращаем его
		if (value.length === 1) {
			const firstValue = String(value[0] || "");

			// Проверяем, является ли это markdown-ссылкой
			if (firstValue.startsWith("![[") || firstValue.startsWith("![](")) {
				// Для markdown-ссылок добавляем кавычки, если их еще нет
				if (!firstValue.startsWith('"') && !firstValue.endsWith('"')) {
					return `"${firstValue}"`;
				}
			}

			// Если это уже строка в кавычках, экранируем внутренние кавычки
			if (firstValue.startsWith('"') && firstValue.endsWith('"')) {
				// Убираем внешние кавычки, экранируем внутренние, добавляем внешние обратно
				const innerText = firstValue.slice(1, -1);
				const escapedInnerText = innerText.replace(/"/g, '\\"');
				return `"${escapedInnerText}"`;
			}

			return firstValue;
		}

		// Если массив содержит несколько элементов, объединяем их через запятую
		return value
			.filter((item) => item != null)
			.map((item) => {
				const itemStr = String(item);

				// Проверяем, является ли это markdown-ссылкой
				if (itemStr.startsWith("![[") || itemStr.startsWith("![](")) {
					// Для markdown-ссылок добавляем кавычки, если их еще нет
					if (!itemStr.startsWith('"') && !itemStr.endsWith('"')) {
						return `"${itemStr}"`;
					}
				}

				// Если это строка в кавычках, экранируем внутренние кавычки
				if (itemStr.startsWith('"') && itemStr.endsWith('"')) {
					const innerText = itemStr.slice(1, -1);
					const escapedInnerText = innerText.replace(/"/g, '\\"');
					return `"${escapedInnerText}"`;
				}

				return itemStr;
			})
			.join(", ");
	}

	const stringValue = String(value || "");

	// Если это строка в кавычках, экранируем внутренние кавычки
	if (stringValue.startsWith('"') && stringValue.endsWith('"')) {
		const innerText = stringValue.slice(1, -1);
		const escapedInnerText = innerText.replace(/"/g, '\\"');
		return `"${escapedInnerText}"`;
	}

	return stringValue;
}

/**
 * Заменяет переменные в шаблоне данными из объекта MovieShow
 * Обрабатывает по-разному YAML frontmatter (с кавычками) и основной текст (без кавычек)
 */
export function replaceVariableSyntax(
	movieShow: MovieShow,
	text: string
): string {
	if (!text?.trim()) {
		return "";
	}

	try {
		// Разделяем текст на блок метаданных и тело заметки
		const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
		const match = text.match(frontmatterRegex);

		if (match) {
			// Есть блок метаданных
			const [, frontmatter, body] = match;

			// Обрабатываем блок метаданных с кавычками
			const processedFrontmatter = Object.entries(movieShow).reduce(
				(result, [key, val = ""]) => {
					try {
						const quotedValue = getQuotedValueFromArray(val);
						return result.replace(
							new RegExp(`{{${key}}}`, "ig"),
							quotedValue
						);
					} catch (error) {
						console.error(
							`Error processing frontmatter variable ${key}:`,
							error
						);
						return result;
					}
				},
				frontmatter
			);

			// Обрабатываем тело заметки без кавычек
			const processedBody = Object.entries(movieShow).reduce(
				(result, [key, val = ""]) => {
					try {
						const plainValue = getPlainValueFromArray(val);
						return result.replace(
							new RegExp(`{{${key}}}`, "ig"),
							String(plainValue)
						);
					} catch (error) {
						console.error(
							`Error processing body variable ${key}:`,
							error
						);
						return result;
					}
				},
				body
			);

			// Собираем результат
			const result = `---\n${processedFrontmatter}\n---\n${processedBody}`;

			// Убираем неиспользованные переменные
			return result.replace(/{{\w+}}/gi, "").trim();
		} else {
			// Нет блока метаданных, обрабатываем весь текст без кавычек
			const entries = Object.entries(movieShow);

			return entries
				.reduce((result, [key, val = ""]) => {
					try {
						const plainValue = getPlainValueFromArray(val);
						return result.replace(
							new RegExp(`{{${key}}}`, "ig"),
							String(plainValue)
						);
					} catch (error) {
						console.error(
							`Error processing variable ${key}:`,
							error
						);
						return result;
					}
				}, text)
				.replace(/{{\w+}}/gi, "")
				.trim();
		}
	} catch (error) {
		console.error("Error in replaceVariableSyntax:", error);
		return text; // Возвращаем оригинальный текст в случае ошибки
	}
}

/**
 * Создает уникальное имя файла, избегая конфликтов с существующими файлами
 * Добавляет суффикс "(Копия[N])" если файл уже существует
 */
export async function makeFileName(
	app: App,
	movieShow: MovieShow,
	fileNameFormat?: string,
	folderPath?: string
): Promise<string> {
	try {
		let baseName;
		if (fileNameFormat) {
			baseName = replaceVariableSyntax(movieShow, fileNameFormat);
		} else {
			baseName = `${movieShow.nameForFile || t("utils.unknownMovie")} (${
				movieShow.year || t("utils.unknownMovie")
			})`;
		}

		const cleanedBaseName =
			replaceIllegalFileNameCharactersInString(baseName);
		if (!cleanedBaseName.trim()) {
			return `${t("utils.unknownMovie")}.md`;
		}

		const fileName = cleanedBaseName + ".md";

		// Проверяем существование файла с учетом папки
		const { vault } = app;
		const fullPath = folderPath ? `${folderPath}/${fileName}` : fileName;
		const normalizedPath = normalizePath(fullPath);

		if (!vault.getAbstractFileByPath(normalizedPath)) {
			// Файл не существует, возвращаем оригинальное имя
			return fileName;
		}

		// Файл существует, ищем свободный номер копии
		let copyNumber = 1;
		let copyFileName: string;
		let copyFullPath: string;

		do {
			copyFileName = `${cleanedBaseName} (${t(
				"utils.copyPrefix"
			)}[${copyNumber}]).md`;
			copyFullPath = folderPath
				? `${folderPath}/${copyFileName}`
				: copyFileName;
			copyNumber++;
		} while (vault.getAbstractFileByPath(normalizePath(copyFullPath)));

		return copyFileName;
	} catch (error) {
		console.error("Error creating file name:", error);
		return `${t("utils.unknownMovie")}.md`;
	}
}

/**
 * Читает содержимое файла шаблона
 * Возвращает пустую строку если шаблон не найден или произошла ошибка
 */
export async function getTemplateContents(
	app: App,
	templatePath: string | undefined
): Promise<string> {
	if (!templatePath || templatePath === "/") {
		return "";
	}

	try {
		const { metadataCache, vault } = app;
		const normalizedTemplatePath = normalizePath(templatePath);

		const templateFile = metadataCache.getFirstLinkpathDest(
			normalizedTemplatePath,
			""
		);

		if (!templateFile) {
			console.warn(
				`${t("utils.templateNotFound")}: ${normalizedTemplatePath}`
			);
			return "";
		}

		return await vault.cachedRead(templateFile);
	} catch (error) {
		console.error(`Failed to read the template '${templatePath}':`, error);
		new Notice(t("utils.templateReadError"));
		return "";
	}
}
