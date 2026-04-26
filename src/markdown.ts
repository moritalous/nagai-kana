export function markdownToHTML(markdown: string): string {
	if (!markdown.trim()) return "";
	return Bun.markdown.html(markdown);
}
