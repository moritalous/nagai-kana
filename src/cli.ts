#!/usr/bin/env bun

import type { PaperSize } from "./core";
import { countPages, createCounter } from "./index";

const HELP_TEXT = `Usage: nagai-kana <file.md ...> [options]

Options:
  --paper <b5|a4|a3>           Paper size (default: a4)
  --detail                     Show detailed measurement info
  --help                       Show help`;

const VALID_PAPER_SIZES = ["b5", "a4", "a3"];

export interface ParsedArgs {
	filePaths: string[];
	paper: PaperSize;
	detail: boolean;
	help: boolean;
}

export function parseArgs(argv: string[]): ParsedArgs {
	const args = argv.slice(2);
	const result: ParsedArgs = {
		filePaths: [],
		paper: "a4",
		detail: false,
		help: false,
	};

	for (let i = 0; i < args.length; i++) {
		const arg = args[i];
		if (arg === "--help") {
			result.help = true;
		} else if (arg === "--detail") {
			result.detail = true;
		} else if (arg === "--paper") {
			const value = args[++i];
			if (!value || !VALID_PAPER_SIZES.includes(value)) {
				console.error(
					`Error: Invalid paper size '${value ?? ""}'. Valid options: ${VALID_PAPER_SIZES.join(", ")}`,
				);
				process.exit(1);
			}
			result.paper = value as PaperSize;
		} else if (!arg.startsWith("--")) {
			result.filePaths.push(arg);
		}
	}

	return result;
}

async function main(): Promise<void> {
	const parsed = parseArgs(Bun.argv);

	if (parsed.help) {
		console.log(HELP_TEXT);
		process.exit(0);
	}

	if (parsed.filePaths.length === 0) {
		console.error("Error: Please specify a file path.");
		console.error(HELP_TEXT);
		process.exit(1);
	}

	// Check file existence
	for (const fp of parsed.filePaths) {
		const file = Bun.file(fp);
		if (!(await file.exists())) {
			console.error(`Error: File not found: ${fp}`);
			process.exit(1);
		}
	}

	try {
		if (parsed.filePaths.length === 1) {
			const markdown = await Bun.file(parsed.filePaths[0]).text();
			const result = await countPages(markdown, {
				paper: parsed.paper,
			});
			if (parsed.detail) {
				console.log(JSON.stringify(result));
			} else {
				const effectivePages = result.renderHeight / result.contentHeight;
				console.log(effectivePages);
			}
		} else {
			const counter = await createCounter();
			try {
				for (const fp of parsed.filePaths) {
					const markdown = await Bun.file(fp).text();
					const result = await counter.countPages(markdown, {
						paper: parsed.paper,
					});
					if (parsed.detail) {
						console.log(JSON.stringify(result));
					} else {
						const effectivePages = result.renderHeight / result.contentHeight;
						console.log(effectivePages);
					}
				}
			} finally {
				counter.close();
			}
		}
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		console.error(`Error: ${message}`);
		process.exit(1);
	}
}

if (import.meta.main) {
	main();
}
