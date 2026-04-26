import { describe, expect, test } from "bun:test";
import { calculatePages } from "../src/measure";

describe("calculatePages", () => {
	test("exact 2 pages → lastPageFill: 1.0", () => {
		const r = calculatePages({ renderHeight: 1000, contentHeight: 500 });
		expect(r.pages).toBe(2);
		expect(r.lastPageFill).toBe(1.0);
	});

	test("1001/500 → 3 pages, lastPageFill ≈ 0.002", () => {
		const r = calculatePages({ renderHeight: 1001, contentHeight: 500 });
		expect(r.pages).toBe(3);
		expect(r.lastPageFill).toBeCloseTo(0.002, 3);
	});

	test("renderHeight 0 → pages 0, lastPageFill 0", () => {
		const r = calculatePages({ renderHeight: 0, contentHeight: 500 });
		expect(r.pages).toBe(0);
		expect(r.lastPageFill).toBe(0);
	});

	test("499/500 → 1 page, lastPageFill ≈ 0.998", () => {
		const r = calculatePages({ renderHeight: 499, contentHeight: 500 });
		expect(r.pages).toBe(1);
		expect(r.lastPageFill).toBeCloseTo(0.998, 3);
	});

	test("exact 1 page → lastPageFill: 1.0", () => {
		const r = calculatePages({ renderHeight: 500, contentHeight: 500 });
		expect(r.pages).toBe(1);
		expect(r.lastPageFill).toBe(1.0);
	});
});
