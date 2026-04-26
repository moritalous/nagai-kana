import { describe, expect, test } from "bun:test";
import fc from "fast-check";
import {
	NagaiKanaError,
	PAPER_PRESETS,
	type PaperSize,
	resolvePresets,
} from "../src/core";

const VALID_KEYS: PaperSize[] = ["b5", "a4", "a3"];

describe("resolvePresets property tests", () => {
	test("invalid paper key throws NagaiKanaError", () => {
		fc.assert(
			fc.property(
				fc.string().filter((s) => !VALID_KEYS.includes(s as PaperSize)),
				(invalidKey) => {
					expect(() =>
						resolvePresets({ paper: invalidKey as PaperSize }),
					).toThrow(NagaiKanaError);
				},
			),
		);
	});

	test("no-arg and empty-object both default to A4", () => {
		const noArg = resolvePresets();
		const emptyObj = resolvePresets({});
		expect(noArg).toEqual(emptyObj);
		expect(noArg.paper).toEqual(PAPER_PRESETS.a4);
	});

	test("all presets have positive content width and height", () => {
		for (const key of VALID_KEYS) {
			const { paper } = resolvePresets({ paper: key });
			expect(paper.width - 2 * paper.marginH).toBeGreaterThan(0);
			expect(paper.height - 2 * paper.marginV).toBeGreaterThan(0);
		}
	});
});
