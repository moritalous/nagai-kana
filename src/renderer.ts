import { NagaiKanaError, type ResolvedPresets } from "./core";

function resolveBackend(): "webkit" | "chrome" {
	return process.platform === "darwin" ? "webkit" : "chrome";
}

export async function measureRenderHeight(
	fullHTML: string,
	presets: ResolvedPresets,
): Promise<number> {
	const view = new Bun.WebView({
		width: presets.paper.width,
		height: presets.paper.height,
		headless: true,
		backend: resolveBackend(),
	});
	try {
		await view.navigate(
			`data:text/html;charset=utf-8,${encodeURIComponent(fullHTML)}`,
		);
		return await view.evaluate<number>(
			`document.getElementById("nagai-kana-measure")?.scrollHeight ?? 0`,
		);
	} finally {
		view.close();
	}
}

export interface WebViewSession {
	measureRenderHeight(
		fullHTML: string,
		presets: ResolvedPresets,
	): Promise<number>;
	close(): void;
}

export function createWebViewSession(presets: ResolvedPresets): WebViewSession {
	const view = new Bun.WebView({
		width: presets.paper.width,
		height: presets.paper.height,
		headless: true,
		backend: resolveBackend(),
	});
	let closed = false;

	return {
		async measureRenderHeight(
			fullHTML: string,
			_presets: ResolvedPresets,
		): Promise<number> {
			if (closed) {
				throw new NagaiKanaError("Counter is already closed.");
			}
			await view.navigate(
				`data:text/html;charset=utf-8,${encodeURIComponent(fullHTML)}`,
			);
			return await view.evaluate<number>(
				`document.getElementById("nagai-kana-measure")?.scrollHeight ?? 0`,
			);
		},
		close() {
			if (!closed) {
				closed = true;
				view.close();
			}
		},
	};
}
