import { existsSync } from "node:fs";
import { NagaiKanaError, type ResolvedPresets } from "./core";

// ─── public API ────────────────────────────────────────────────────────────

export async function measureRenderHeight(
	fullHTML: string,
	presets: ResolvedPresets,
): Promise<number> {
	if (process.platform === "win32") {
		return measureWithEdgeCDP(fullHTML, presets);
	}
	return measureWithWebView(fullHTML, presets);
}

export interface WebViewSession {
	measureRenderHeight(
		fullHTML: string,
		presets: ResolvedPresets,
	): Promise<number>;
	close(): void;
}

export function createWebViewSession(presets: ResolvedPresets): WebViewSession {
	if (process.platform === "win32") {
		return createEdgeCDPSession(presets);
	}
	return createBunWebViewSession(presets);
}

// ─── Bun.WebView (macOS / Linux) ───────────────────────────────────────────

function resolveBackend(): "webkit" | "chrome" {
	return process.platform === "darwin" ? "webkit" : "chrome";
}

async function measureWithWebView(
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

function createBunWebViewSession(presets: ResolvedPresets): WebViewSession {
	const view = new Bun.WebView({
		width: presets.paper.width,
		height: presets.paper.height,
		headless: true,
		backend: resolveBackend(),
	});
	let closed = false;

	return {
		async measureRenderHeight(fullHTML, _presets) {
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

// ─── Edge CDP (Windows) ────────────────────────────────────────────────────

const EDGE_PATHS = [
	"C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
	"C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
];

function findEdgePath(): string {
	for (const p of EDGE_PATHS) {
		if (existsSync(p)) return p;
	}
	throw new NagaiKanaError(
		"Microsoft Edge が見つかりません。https://www.microsoft.com/edge からインストールしてください。",
	);
}

async function waitForCDP(port: number): Promise<void> {
	for (let i = 0; i < 30; i++) {
		try {
			const res = await fetch(`http://127.0.0.1:${port}/json/version`);
			if (res.ok) return;
		} catch {
			// まだ起動中
		}
		await Bun.sleep(100);
	}
	throw new NagaiKanaError("Edge の起動がタイムアウトしました。");
}

type CDPResponse = { result: { value: number } };

function cdpSession(wsUrl: string): {
	send(method: string, params?: Record<string, unknown>): Promise<unknown>;
	once(event: string, handler: () => void): void;
	ws: WebSocket;
} {
	const ws = new WebSocket(wsUrl);
	let nextId = 0;
	const pending = new Map<number, (r: unknown) => void>();
	const eventHandlers = new Map<string, () => void>();

	ws.addEventListener("message", (ev) => {
		const msg = JSON.parse(ev.data as string) as {
			id?: number;
			method?: string;
			result?: unknown;
		};
		if (msg.id !== undefined) {
			pending.get(msg.id)?.(msg.result);
			pending.delete(msg.id);
		} else if (msg.method) {
			eventHandlers.get(msg.method)?.();
			eventHandlers.delete(msg.method);
		}
	});

	return {
		send(method, params = {}) {
			const id = ++nextId;
			return new Promise((resolve) => {
				pending.set(id, resolve);
				ws.send(JSON.stringify({ id, method, params }));
			});
		},
		once(event, handler) {
			eventHandlers.set(event, handler);
		},
		ws,
	};
}

async function measureViaTab(wsUrl: string, fullHTML: string): Promise<number> {
	return new Promise((resolve, reject) => {
		const { send, once, ws } = cdpSession(wsUrl);

		ws.addEventListener("open", async () => {
			try {
				await send("Page.enable");

				const url = `data:text/html;charset=utf-8,${encodeURIComponent(fullHTML)}`;
				const loaded = new Promise<void>((res) => once("Page.loadEventFired", res));
				await send("Page.navigate", { url });
				await loaded;

				const result = (await send("Runtime.evaluate", {
					expression: `document.getElementById("nagai-kana-measure")?.scrollHeight ?? 0`,
					returnByValue: true,
				})) as CDPResponse;

				ws.close();
				resolve(result.result.value);
			} catch (err) {
				ws.close();
				reject(err);
			}
		});

		ws.addEventListener("error", reject);
	});
}

function randomPort(): number {
	// 19222–19999: デバッグポート用の範囲。複数プロセス同時起動時の衝突を減らす。
	return 19222 + Math.floor(Math.random() * 778);
}

async function spawnEdge(
	port: number,
	presets: ResolvedPresets,
): Promise<ReturnType<typeof Bun.spawn>> {
	return Bun.spawn(
		[
			findEdgePath(),
			`--remote-debugging-port=${port}`,
			"--headless",
			"--no-first-run",
			"--no-default-browser-check",
			"--disable-extensions",
			`--window-size=${presets.paper.width},${presets.paper.height}`,
		],
		{ stdout: "ignore", stderr: "ignore" },
	);
}

async function openTab(port: number): Promise<string> {
	const res = await fetch(`http://127.0.0.1:${port}/json/new`);
	const { webSocketDebuggerUrl } = (await res.json()) as {
		webSocketDebuggerUrl: string;
	};
	return webSocketDebuggerUrl;
}

async function measureWithEdgeCDP(
	fullHTML: string,
	presets: ResolvedPresets,
): Promise<number> {
	const port = randomPort();
	const proc = await spawnEdge(port, presets);
	try {
		await waitForCDP(port);
		const wsUrl = await openTab(port);
		return await measureViaTab(wsUrl, fullHTML);
	} finally {
		proc.kill();
	}
}

function createEdgeCDPSession(presets: ResolvedPresets): WebViewSession {
	const port = randomPort();
	let closed = false;
	let proc: ReturnType<typeof Bun.spawn> | null = null;
	let wsUrl: string | null = null;

	async function ensureReady(): Promise<string> {
		if (wsUrl) return wsUrl;
		proc = await spawnEdge(port, presets);
		await waitForCDP(port);
		wsUrl = await openTab(port);
		return wsUrl;
	}

	return {
		async measureRenderHeight(fullHTML, _presets) {
			if (closed) throw new NagaiKanaError("Counter is already closed.");
			const url = await ensureReady();
			return measureViaTab(url, fullHTML);
		},
		close() {
			if (!closed) {
				closed = true;
				proc?.kill();
			}
		},
	};
}
