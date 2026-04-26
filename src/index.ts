export type {
	MeasureOptions,
	PageResult,
	PaperDimensions,
	PaperSize,
	ResolvedPresets,
} from "./core";
export { NagaiKanaError } from "./core";

import {
	type MeasureOptions,
	type PageResult,
	buildMeasurementHTML,
	resolvePresets,
} from "./core";
import { markdownToHTML } from "./markdown";
import { calculatePages } from "./measure";
import { createWebViewSession, measureRenderHeight } from "./renderer";

export async function countPages(
	markdown: string,
	options?: MeasureOptions,
): Promise<PageResult> {
	const presets = resolvePresets(options);
	const contentHeight = presets.paper.height - 2 * presets.paper.marginV;
	const html = markdownToHTML(markdown);

	if (!html) {
		return {
			pages: 0,
			renderHeight: 0,
			contentHeight,
			lastPageFill: 0,
			presets,
		};
	}

	const fullHTML = await buildMeasurementHTML(html, presets);
	const renderHeight = await measureRenderHeight(fullHTML, presets);
	const { pages, lastPageFill } = calculatePages({
		renderHeight,
		contentHeight,
	});
	return { pages, renderHeight, contentHeight, lastPageFill, presets };
}

export async function createCounter(): Promise<{
	countPages: (
		markdown: string,
		options?: MeasureOptions,
	) => Promise<PageResult>;
	close: () => void;
}> {
	const defaultPresets = resolvePresets();
	const session = createWebViewSession(defaultPresets);

	return {
		async countPages(
			markdown: string,
			options?: MeasureOptions,
		): Promise<PageResult> {
			const presets = resolvePresets(options);
			const contentHeight = presets.paper.height - 2 * presets.paper.marginV;
			const html = markdownToHTML(markdown);

			if (!html) {
				return {
					pages: 0,
					renderHeight: 0,
					contentHeight,
					lastPageFill: 0,
					presets,
				};
			}

			const fullHTML = await buildMeasurementHTML(html, presets);
			const renderHeight = await session.measureRenderHeight(fullHTML, presets);
			const { pages, lastPageFill } = calculatePages({
				renderHeight,
				contentHeight,
			});
			return {
				pages,
				renderHeight,
				contentHeight,
				lastPageFill,
				presets,
			};
		},
		close() {
			session.close();
		},
	};
}
