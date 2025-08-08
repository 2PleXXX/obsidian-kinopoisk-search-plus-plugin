/**
 * utils.ts
 *
 * Helper functions for movie/series data processing.
 * Handles text formatting, template variable replacement, and file operations.
 *
 * Key feature: Different formatting for YAML metadata (quoted) vs body text (unquoted).
 */

import { MovieShow } from "Models/MovieShow.model";
import { App, normalizePath, Notice } from "obsidian";
import { t } from "../i18n";

export function capitalizeFirstLetter(input: string): string {
	if (!input || input.length === 0) {
		return input || "";
	}
	return input.charAt(0).toUpperCase() + input.slice(1);
}

/**
 * Replace illegal filename characters
 */
export function replaceIllegalFileNameCharactersInString(text: string): string {
	if (!text) {
		return "";
	}
	return text.replace(/[\\/:*?"<>|]/g, "");
}

/**
 * Get unquoted value from array for use in body text
 */
function getPlainValueFromArray(value: unknown): string | number {
	if (Array.isArray(value)) {
		if (value.length === 0) return "";

		if (value.length === 1) {
			const firstValue = value[0];
			if (typeof firstValue === "string") {
				return firstValue.replace(/^"(.*)"$/, "$1");
			}
			return firstValue ?? "";
		}

		// Join multiple elements with comma
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

	if (typeof value === "number") {
		return value;
	}

	return String(value || "");
}

/**
 * Get quoted value from array for use in YAML metadata
 */
function getQuotedValueFromArray(value: unknown): string {
	if (Array.isArray(value)) {
		if (value.length === 0) return "";

		if (value.length === 1) {
			const firstValue = String(value[0] || "");

			// Handle markdown links
			if (firstValue.startsWith("![[") || firstValue.startsWith("![](")) {
				if (!firstValue.startsWith('"') && !firstValue.endsWith('"')) {
					return `"${firstValue}"`;
				}
			}

			// Escape quotes in already quoted strings
			if (firstValue.startsWith('"') && firstValue.endsWith('"')) {
				const innerText = firstValue.slice(1, -1);
				const escapedInnerText = innerText.replace(/"/g, '\\"');
				return `"${escapedInnerText}"`;
			}

			return firstValue;
		}

		// Join multiple elements with comma
		return value
			.filter((item) => item != null)
			.map((item) => {
				const itemStr = String(item);

				// Handle markdown links
				if (itemStr.startsWith("![[") || itemStr.startsWith("![](")) {
					if (!itemStr.startsWith('"') && !itemStr.endsWith('"')) {
						return `"${itemStr}"`;
					}
				}

				// Escape quotes in quoted strings
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

	// Escape quotes in quoted strings
	if (stringValue.startsWith('"') && stringValue.endsWith('"')) {
		const innerText = stringValue.slice(1, -1);
		const escapedInnerText = innerText.replace(/"/g, '\\"');
		return `"${escapedInnerText}"`;
	}

	return stringValue;
}

/**
 * Replace template variables with MovieShow data
 * Handles YAML frontmatter (quoted) and body text (unquoted) differently
 */
export function replaceVariableSyntax(
	movieShow: MovieShow,
	text: string
): string {
	if (!text?.trim()) {
		return "";
	}

	try {
		// Split text into frontmatter and body
		const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
		const match = text.match(frontmatterRegex);

		if (match) {
			// Has frontmatter block
			const [, frontmatter, body] = match;

			// Process frontmatter with quotes
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

			// Process body without quotes
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

			// Combine result
			const result = `---\n${processedFrontmatter}\n---\n${processedBody}`;

			// Remove unused variables
			return result.replace(/{{\w+}}/gi, "").trim();
		} else {
			// No frontmatter, process entire text without quotes
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
		return text; // Return original text on error
	}
}

/**
 * Create unique filename, avoiding conflicts with existing files
 * Adds "(Copy[N])" suffix if file already exists
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

		// Check file existence considering folder
		const { vault } = app;
		const fullPath = folderPath ? `${folderPath}/${fileName}` : fileName;
		const normalizedPath = normalizePath(fullPath);

		if (!vault.getAbstractFileByPath(normalizedPath)) {
			// File doesn't exist, return original name
			return fileName;
		}

		// File exists, find available copy number
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
 * Read template file contents
 * Returns empty string if template not found or error occurs
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
