import { describe, expect, test } from "bun:test";
import fc from "fast-check";
import { markdownToHTML } from "../src/markdown";

describe("markdownToHTML property tests", () => {
	test("empty string returns empty string", () => {
		expect(markdownToHTML("")).toBe("");
	});

	test("whitespace-only strings return empty string", () => {
		fc.assert(
			fc.property(
				fc.string().filter((s) => s.length > 0 && s.trim() === ""),
				(ws) => {
					expect(markdownToHTML(ws)).toBe("");
				},
			),
		);
	});

	test("non-whitespace strings return non-empty HTML", () => {
		fc.assert(
			fc.property(
				fc.string().filter((s) => s.trim().length > 0),
				(nonEmpty) => {
					expect(markdownToHTML(nonEmpty).length).toBeGreaterThan(0);
				},
			),
		);
	});

	test("deterministic: same input → same output", () => {
		fc.assert(
			fc.property(fc.string(), (s) => {
				expect(markdownToHTML(s)).toBe(markdownToHTML(s));
			}),
		);
	});
});
