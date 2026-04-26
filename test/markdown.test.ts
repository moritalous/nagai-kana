import { describe, expect, test } from "bun:test";
import { markdownToHTML } from "../src/markdown";

describe("markdownToHTML", () => {
	test("converts heading → <h1>", () => {
		expect(markdownToHTML("# Hello")).toContain("<h1>");
	});

	test("converts list → <li>", () => {
		expect(markdownToHTML("- item1\n- item2")).toContain("<li>");
	});

	test("converts GFM table → <table>", () => {
		expect(markdownToHTML("| a | b |\n|---|---|\n| 1 | 2 |")).toContain(
			"<table>",
		);
	});

	test("converts code block → <code>", () => {
		expect(markdownToHTML("```\nconsole.log('hi')\n```")).toContain("<code>");
	});

	test("converts GFM strikethrough → <del>", () => {
		expect(markdownToHTML("~~deleted~~")).toContain("<del>");
	});

	test("converts GFM task list → <input", () => {
		expect(markdownToHTML("- [x] done\n- [ ] todo")).toContain("<input");
	});

	test("empty string returns empty string", () => {
		expect(markdownToHTML("")).toBe("");
	});

	test("whitespace-only returns empty string", () => {
		expect(markdownToHTML("   \n\t  ")).toBe("");
	});
});
