import { createRequire } from "node:module";

export interface PaperDimensions {
	width: number;
	height: number;
	marginH: number;
	marginV: number;
}

export type PaperSize = "b5" | "a4" | "a3";

export interface MeasureOptions {
	paper?: PaperSize;
}

export interface ResolvedPresets {
	paper: PaperDimensions;
}

export interface PageResult {
	pages: number;
	renderHeight: number;
	contentHeight: number;
	lastPageFill: number;
	presets: ResolvedPresets;
}

export const PAPER_PRESETS: Record<PaperSize, PaperDimensions> = {
	b5: { width: 669, height: 945, marginH: 91, marginV: 91 },
	a4: { width: 794, height: 1123, marginH: 120, marginV: 96 },
	a3: { width: 1123, height: 1587, marginH: 120, marginV: 96 },
};

const VALID_PAPER_SIZES = Object.keys(PAPER_PRESETS) as PaperSize[];

export class NagaiKanaError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "NagaiKanaError";
	}
}

export function resolvePresets(options?: MeasureOptions): ResolvedPresets {
	const paperKey = options?.paper ?? "a4";
	if (!Object.hasOwn(PAPER_PRESETS, paperKey)) {
		throw new NagaiKanaError(
			`Invalid paper size '${paperKey}'. Valid options: ${VALID_PAPER_SIZES.join(", ")}`,
		);
	}
	return { paper: PAPER_PRESETS[paperKey] };
}

let cachedCSS: string | undefined;

async function getGithubMarkdownCSS(): Promise<string> {
	if (cachedCSS !== undefined) return cachedCSS;
	const require = createRequire(import.meta.url);
	const cssPath = require.resolve(
		"github-markdown-css/github-markdown-light.css",
	);
	cachedCSS = await Bun.file(cssPath).text();
	return cachedCSS;
}

export async function buildMeasurementHTML(
	renderedHTML: string,
	presets: ResolvedPresets,
): Promise<string> {
	const contentWidth = presets.paper.width - 2 * presets.paper.marginH;
	const css = await getGithubMarkdownCSS();
	return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
${css}
</style>
</head>
<body>
<div id="nagai-kana-measure"
     class="markdown-body"
     style="width: ${contentWidth}px;">
${renderedHTML}
</div>
</body>
</html>`;
}
