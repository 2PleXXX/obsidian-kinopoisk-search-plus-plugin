import { App, MarkdownView } from 'obsidian';

export class CursorJumper {
  constructor(private app: App) {}

  async jumpToNextCursorLocation(): Promise<void> {
    const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!activeView) { return; }
    if (!activeView.file) { return }
    const content = await this.app.vault.cachedRead(activeView.file);
    const editor = activeView.editor;
    editor.focus();
    editor.setCursor(0, 0);
  }
}