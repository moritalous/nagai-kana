import { describe, expect, test } from "bun:test";
import { buildMeasurementHTML, resolvePresets } from "../src/core";
import { createWebViewSession, measureRenderHeight } from "../src/renderer";

const presets = resolvePresets({ paper: "a4" });

describe("measureRenderHeight", () => {
	test("returns a non-negative number for simple HTML", async () => {
		const fullHTML = await buildMeasurementHTML("<p>Hello World</p>", presets);
		const height = await measureRenderHeight(fullHTML, presets);
		expect(height).toBeGreaterThanOrEqual(0);
		expect(Number.isInteger(height)).toBe(true);
	});
});

describe("createWebViewSession", () => {
	test("session can measure multiple times", async () => {
		const session = createWebViewSession(presets);
		try {
			const html1 = await buildMeasurementHTML("<p>A</p>", presets);
			const html2 = await buildMeasurementHTML("<p>B</p>", presets);
			const h1 = await session.measureRenderHeight(html1, presets);
			const h2 = await session.measureRenderHeight(html2, presets);
			expect(h1).toBeGreaterThanOrEqual(0);
			expect(h2).toBeGreaterThanOrEqual(0);
		} finally {
			session.close();
		}
	});

	test("close is idempotent", () => {
		const session = createWebViewSession(presets);
		session.close();
		session.close(); // should not throw
	});

	test("measureRenderHeight after close throws", async () => {
		const session = createWebViewSession(presets);
		session.close();
		const html = await buildMeasurementHTML("<p>test</p>", presets);
		expect(session.measureRenderHeight(html, presets)).rejects.toThrow(
			"already closed",
		);
	});
});
