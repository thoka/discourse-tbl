// Step 2b: `bin/dev-instance check` and the pin file dev/discourse.env.
// The tests put fake `docker`, `getent`, and `id` commands into a temporary folder, and the PATH of the script holds
// only that folder. Thus no test needs Docker.
import { afterAll, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { chmodSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const root = join(import.meta.dir, "..");
const script = join(root, "bin", "dev-instance");
const bash = spawnSync("bash", ["-c", "command -v bash"], { encoding: "utf8" }).stdout.trim();
const folders: string[] = [];

afterAll(() => {
  for (const folder of folders) rmSync(folder, { recursive: true, force: true });
});

/** The fake commands: each value is the body of a bash script. A missing key means that the command does not exist. */
type Fakes = { docker?: string; getent?: string; id?: string };

/** Runs `bin/dev-instance` with the fake commands as the only commands on the PATH. */
function run(args: string[], fakes: Fakes) {
  const folder = mkdtempSync(join(tmpdir(), "dev-instance-"));
  folders.push(folder);
  for (const [name, body] of Object.entries(fakes)) {
    const file = join(folder, name);
    writeFileSync(file, `#!${bash}\n${body}\n`);
    chmodSync(file, 0o755);
  }
  const result = spawnSync(bash, [script, ...args], { env: { PATH: folder }, encoding: "utf8" });
  return { status: result.status, stdout: result.stdout, stderr: result.stderr };
}

/** A user `ada` who is in the group docker. `inSession` says whether the process has the group. */
function user(inSession: boolean): Fakes {
  return {
    getent: 'echo "docker:x:968:bob,ada"',
    id: `case "$1" in -un) echo ada ;; -nG) echo ${inSession ? "ada wheel docker" : "ada wheel"} ;; esac`,
  };
}

test("check passes when docker info works", () => {
  const result = run(["check"], { docker: "exit 0", ...user(true) });
  expect(result.status).toBe(0);
  expect(result.stdout).toContain("docker works");
});

test("check exits with 3 when the session does not have the group docker yet", () => {
  const result = run(["check"], {
    docker: 'echo "permission denied while trying to connect to the Docker daemon socket" >&2; exit 1',
    ...user(false),
  });
  expect(result.status).toBe(3);
  expect(result.stderr).toContain("the user ada is in the group docker, but this session does not have the group yet");
  expect(result.stderr).toContain("Log in again or start a new session.");
});

test("check exits with 5 when docker info fails for another reason", () => {
  const result = run(["check"], { docker: 'echo "Cannot connect to the Docker daemon" >&2; exit 1', ...user(true) });
  expect(result.status).toBe(5);
  expect(result.stderr).toContain("docker info failed: Cannot connect to the Docker daemon");
});

test("check exits with 5 when the user is not in the group docker", () => {
  const result = run(["check"], {
    docker: "exit 1",
    getent: 'echo "docker:x:968:bob"',
    id: 'case "$1" in -un) echo ada ;; -nG) echo ada ;; esac',
  });
  expect(result.status).toBe(5);
});

test("check exits with 4 when docker is not installed", () => {
  const result = run(["check"], user(true));
  expect(result.status).toBe(4);
  expect(result.stderr).toContain("the command docker is not installed");
});

test("an unknown command exits with 2 and shows the usage with the exit codes", () => {
  const result = run(["start"], {});
  expect(result.status).toBe(2);
  expect(result.stderr).toContain("unknown command: start");
  for (const code of ["0", "2", "3", "4", "5"]) expect(result.stderr).toMatch(new RegExp(`^  ${code}  `, "m"));
});

test("no command exits with 2, and help exits with 0", () => {
  expect(run([], {}).status).toBe(2);
  const help = run(["help"], {});
  expect(help.status).toBe(0);
  expect(help.stdout).toContain("Usage: bin/dev-instance <command>");
});

test("the pin file has a dated image tag, not release, and a full core commit", () => {
  const values = Object.fromEntries(
    readFileSync(join(root, "dev", "discourse.env"), "utf8")
      .split("\n")
      .filter((line) => /^[A-Z_]+=/.test(line))
      .map((line) => line.split("=", 2) as [string, string]),
  );
  expect(values.DISCOURSE_DEV_IMAGE).toMatch(/^discourse\/discourse_dev:\d{8}-\d{4}$/);
  expect(values.DISCOURSE_DEV_IMAGE).not.toContain("release");
  expect(values.DISCOURSE_COMMIT).toMatch(/^[0-9a-f]{40}$/);
});
