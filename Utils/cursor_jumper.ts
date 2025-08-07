/**
 * cursor_jumper.ts
 *
 * Утилита для управления позицией курсора в редакторе Obsidian.
 * Используется для автоматического позиционирования курсора в начало документа
 * после создания новой заметки о фильме или сериале.
 *
 * Обеспечивает лучший UX, позволяя пользователю сразу начать редактирование
 * созданного файла.
 */

import { App, MarkdownView } from "obsidian";

export class CursorJumper {
	constructor(private app: App) {}

	/**
	 * Перемещает курсор в начало активного документа
	 * Используется после создания новой заметки для удобства редактирования
	 */
	async jumpToNextCursorLocation(): Promise<void> {
		try {
			const activeView =
				this.app.workspace.getActiveViewOfType(MarkdownView);
			if (!activeView?.file) {
				return;
			}

			const editor = activeView.editor;
			if (!editor) {
				return;
			}

			editor.focus();
			editor.setCursor(0, 0);
		} catch (error) {
			console.error("Error moving cursor:", error);
		}
	}
}
