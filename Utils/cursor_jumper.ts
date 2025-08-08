/**
 * cursor_jumper.ts
 *
 * Utility for managing cursor position in Obsidian editor.
 * Automatically positions cursor at document start after creating new notes.
 */

import { App, MarkdownView } from "obsidian";

export class CursorJumper {
	constructor(private app: App) {}

	/**
	 * Move cursor to the beginning of active document
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
