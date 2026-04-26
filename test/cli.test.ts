import { describe, expect, test } from "bun:test";
import { join } from "node:path";
import { parseArgs } from "../src/cli";

const FIXTURE_DIR = join(import.meta.dir, "fixtures");
const SAMPLE_MD = join(FIXTURE_DIR, "sample.md");
const CLI_PATH = join(import.meta.dir, "..", "src", "cli.ts");

async function runCLI(
	args: string[],
	timeoutMs = 30_000,
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
	const proc = Bun.spawn(["bun", CLI_PATH, ...args], {
		stdout: "pipe",
		stderr: "pipe",
	});
	const timer = setTimeout(() => proc.kill(), timeoutMs);
	const stdout = await new Response(proc.stdout).text();
	const stderr = await new Response(proc.stderr).text();
	const exitCode = await proc.exited;
	clearTimeout(timer);
	return { stdout, stderr, exitCode };
}

describe("CLI parseArgs", () => {
	test("default values with no args", () => {
		const r = parseArgs(["bun", "cli"]);
		expect(r.filePaths).toEqual([]);
		expect(r.paper).toBe("a4");
		expect(r.detail).toBe(false);
		expect(r.help).toBe(false);
	});

	test("file path is parsed from positional argument", () => {
		const r = parseArgs(["bun", "cli", "report.md"]);
		expect(r.filePaths).toEqual(["report.md"]);
	});

	test("multiple file paths", () => {
		const r = parseArgs(["bun", "cli", "a.md", "b.md"]);
		expect(r.filePaths).toEqual(["a.md", "b.md"]);
	});

	test("--paper flag sets paper size", () => {
		const r = parseArgs(["bun", "cli", "report.md", "--paper", "b5"]);
		expect(r.paper).toBe("b5");
	});

	test("--detail flag sets detail to true", () => {
		const r = parseArgs(["bun", "cli", "report.md", "--detail"]);
		expect(r.detail).toBe(true);
	});

	test("--help flag sets help to true", () => {
		const r = parseArgs(["bun", "cli", "--help"]);
		expect(r.help).toBe(true);
	});
});

describe("CLI execution", () => {
	test("--help shows usage and exits 0", async () => {
		const { stdout, exitCode } = await runCLI(["--help"]);
		expect(exitCode).toBe(0);
		expect(stdout).toContain("Usage:");
	});

	test("non-existent file exits non-zero", async () => {
		const { stderr, exitCode } = await runCLI([
			"/tmp/nonexistent-file.md",
		]);
		expect(exitCode).not.toBe(0);
		expect(stderr).toContain("not found");
	});

	test("no file argument shows error", async () => {
		const { stderr, exitCode } = await runCLI([]);
		expect(exitCode).not.toBe(0);
		expect(stderr).toContain("Error");
	});

	test("invalid --paper value exits non-zero", async () => {
		const { stderr, exitCode } = await runCLI([
			SAMPLE_MD,
			"--paper",
			"letter",
		]);
		expect(exitCode).not.toBe(0);
		expect(stderr).toContain("letter");
	});

	test("default output is simple number", async () => {
		const { stdout, exitCode } = await runCLI([SAMPLE_MD]);
		expect(exitCode).toBe(0);
		const output = stdout.trim();
		expect(Number.isFinite(Number(output))).toBe(true);
	});

	test("--detail output is JSON", async () => {
		const { stdout, exitCode } = await runCLI([SAMPLE_MD, "--detail"]);
		expect(exitCode).toBe(0);
		const result = JSON.parse(stdout);
		expect(result).toHaveProperty("pages");
		expect(result).toHaveProperty("renderHeight");
		expect(result).toHaveProperty("contentHeight");
		expect(result).toHaveProperty("lastPageFill");
		expect(result).toHaveProperty("presets");
	});
});
