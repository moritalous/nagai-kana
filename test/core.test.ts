import { describe, expect, test } from "bun:test";
import {
	NagaiKanaError,
	PAPER_PRESETS,
	type PaperSize,
	buildMeasurementHTML,
	resolvePresets,
} from "../src/core";

describe("resolvePresets", () => {
	test("returns correct PaperDimensions for b5", () => {
		expect(resolvePresets({ paper: "b5" }).paper).toEqual(PAPER_PRESETS.b5);
	});

	test("returns correct PaperDimensions for a4", () => {
		expect(resolvePresets({ paper: "a4" }).paper).toEqual(PAPER_PRESETS.a4);
	});

	test("returns correct PaperDimensions for a3", () => {
		expect(resolvePresets({ paper: "a3" }).paper).toEqual(PAPER_PRESETS.a3);
	});

	test("defaults to A4 when no options provided", () => {
		expect(resolvePresets().paper).toEqual(PAPER_PRESETS.a4);
	});

	test("defaults to A4 when empty options {} provided", () => {
		expect(resolvePresets({}).paper).toEqual(PAPER_PRESETS.a4);
	});

	test("throws NagaiKanaError for invalid key", () => {
		expect(() => resolvePresets({ paper: "letter" as PaperSize })).toThrow(
			NagaiKanaError,
		);
		try {
			resolvePresets({ paper: "letter" as PaperSize });
		} catch (e) {
			expect(e).toBeInstanceOf(NagaiKanaError);
			expect((e as NagaiKanaError).message).toContain("letter");
			expect((e as NagaiKanaError).message).toContain("b5");
		}
	});
});

describe("buildMeasurementHTML", () => {
	const presets = resolvePresets({ paper: "a4" });

	test("output contains the rendered HTML content", async () => {
		const html = await buildMeasurementHTML("<p>Hello</p>", presets);
		expect(html).toContain("<p>Hello</p>");
	});

	test("output contains markdown-body class", async () => {
		const html = await buildMeasurementHTML("<p>test</p>", presets);
		expect(html).toContain('class="markdown-body"');
	});

	test('output contains id="nagai-kana-measure"', async () => {
		const html = await buildMeasurementHTML("<p>test</p>", presets);
		expect(html).toContain('id="nagai-kana-measure"');
	});

	test("starts with <!DOCTYPE html>", async () => {
		const html = await buildMeasurementHTML("<p>test</p>", presets);
		expect(html.startsWith("<!DOCTYPE html>")).toBe(true);
	});

	test("sets correct container width for A4 (794 - 2*120 = 554px)", async () => {
		const html = await buildMeasurementHTML("<p>test</p>", presets);
		expect(html).toContain("width: 554px");
	});

	test("sets correct container width for B5", async () => {
		const b5Presets = resolvePresets({ paper: "b5" });
		const html = await buildMeasurementHTML("<p>test</p>", b5Presets);
		expect(html).toContain("width: 487px");
	});

	test("contains embedded CSS (github-markdown-css)", async () => {
		const html = await buildMeasurementHTML("<p>test</p>", presets);
		expect(html).toContain("<style>");
		expect(html).toContain(".markdown-body");
	});
});
