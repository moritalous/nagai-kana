import { describe, expect, test } from "bun:test";
import fc from "fast-check";
import { calculatePages } from "../src/measure";

describe("calculatePages property tests", () => {
	test("pages === Math.ceil(renderHeight / contentHeight)", () => {
		fc.assert(
			fc.property(
				fc.integer({ min: 1, max: 100000 }),
				fc.integer({ min: 1, max: 100000 }),
				(renderHeight, contentHeight) => {
					const r = calculatePages({ renderHeight, contentHeight });
					expect(r.pages).toBe(Math.ceil(renderHeight / contentHeight));
				},
			),
		);
	});

	test("lastPageFill is in range (0.0, 1.0]", () => {
		fc.assert(
			fc.property(
				fc.integer({ min: 1, max: 100000 }),
				fc.integer({ min: 1, max: 100000 }),
				(renderHeight, contentHeight) => {
					const r = calculatePages({ renderHeight, contentHeight });
					expect(r.lastPageFill).toBeGreaterThan(0);
					expect(r.lastPageFill).toBeLessThanOrEqual(1.0);
				},
			),
		);
	});

	test("exact multiple yields lastPageFill === 1.0", () => {
		fc.assert(
			fc.property(
				fc.integer({ min: 1, max: 1000 }),
				fc.integer({ min: 1, max: 1000 }),
				(multiplier, contentHeight) => {
					const renderHeight = multiplier * contentHeight;
					const r = calculatePages({ renderHeight, contentHeight });
					expect(r.lastPageFill).toBe(1.0);
				},
			),
		);
	});
});
