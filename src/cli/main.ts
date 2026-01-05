import fg from "fast-glob";
import path from "node:path";
import { spawnSync } from "node:child_process";

import { discoverBenchmarkClasses } from "./discover";
import { printReport } from "./reporter";
import { ForkResult, AggregatedResult } from "../core/types";
import { getConfig } from "../core/metadata";
import { runInProc } from "../runner/inproc";

async function importFile(file: string) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require(path.resolve(file));
}

type ParsedArgs =
    | { cmd: "help"; arg: "" }
    | { cmd: "run"; arg: string } // glob
    | { cmd: "run-child"; arg: string }; // single file path

function parseArgs(argv: string[]): ParsedArgs {
    const [cmd, arg] = argv;

    if (!cmd || cmd === "help" || cmd === "-h" || cmd === "--help") {
        return { cmd: "help", arg: "" };
    }

    if (cmd === "run") {
        if (!arg) throw new Error(`Usage: node-mh run "<glob>"`);
        return { cmd: "run", arg };
    }

    // internal command used for forked runs
    if (cmd === "run-child") {
        if (!arg) throw new Error(`Usage: node-mh run-child "<file>"`);
        return { cmd: "run-child", arg };
    }

    throw new Error(`Unknown command: ${cmd}`);
}

async function runBenchFileInProc(file: string): Promise<ForkResult[]> {
    const mod = await importFile(file);
    const classes = discoverBenchmarkClasses(mod);
    if (classes.length === 0) return [];

    const results: ForkResult[] = [];
    for (const BenchClass of classes) {
        const fr = await runInProc(BenchClass);
        results.push(fr);
    }
    return results;
}

function runBenchFileForkChild(
    entryJs: string,
    file: string,
    forkIndex: number,
    nodeArgs: string[],
    env: NodeJS.ProcessEnv
): ForkResult[] {
    const proc = spawnSync(process.execPath, [...nodeArgs, entryJs, "run-child", file], {
        env: {
            ...env,
            NODE_MH_CHILD: "1",
            NODE_MH_FORK_INDEX: String(forkIndex)
        },
        encoding: "utf-8",
        stdio: ["ignore", "pipe", "pipe"]
    });

    if (proc.status !== 0) {
        throw new Error(
            `Fork ${forkIndex} failed.\nSTDERR:\n${proc.stderr}\nSTDOUT:\n${proc.stdout}`
        );
    }

    return JSON.parse(proc.stdout) as ForkResult[];
}

export async function main() {
    const parsed = parseArgs(process.argv.slice(2));

    if (parsed.cmd === "help") {
        console.log(`node-mh run "<glob>"`);
        console.log(`Example: node-mh run "dist/benches/**/*.bench.js"`);
        console.log(`(internal) node-mh run-child "<file>"`);
        process.exit(0);
    }

    if (parsed.cmd === "run-child") {
        const file = parsed.arg;
        const frs = await runBenchFileInProc(file);
        process.stdout.write(JSON.stringify(frs));
        return;
    }

    const globPattern = parsed.arg;

    const matches = await fg(globPattern, { dot: false });
    if (matches.length === 0) {
        throw new Error(`No files matched: ${globPattern}`);
    }

    const allForkResults: ForkResult[] = [];
    let summary: AggregatedResult["summary"] | null = null;

    const entryJs = path.resolve(process.argv[1]);

    for (const file of matches) {
        const mod = await importFile(file);
        const classes = discoverBenchmarkClasses(mod);

        if (classes.length === 0) continue;

        for (const BenchClass of classes) {
            const cfg = getConfig(BenchClass as any);
            const forks = Math.max(1, cfg.fork.value);

            summary = {
                forks,
                warmup: cfg.warmup,
                measurement: cfg.measurement,
                mode: cfg.mode,
                unit: cfg.outputTimeUnit
            };

            for (let i = 1; i <= forks; i++) {
                console.log(`[node-mh] fork ${i}/${forks} starting: ${file}`);

                const nodeArgs = cfg.fork.nodeArgs ?? [];
                const env: NodeJS.ProcessEnv = { ...process.env, ...(cfg.fork.env ?? {}) };

                const forkOut = runBenchFileForkChild(entryJs, file, i, nodeArgs, env);

                allForkResults.push(...forkOut);
            }
        }
    }

    if (!summary) {
        throw new Error("No benchmark classes found in matched files.");
    }

    const agg: AggregatedResult = { summary, forks: allForkResults };
    printReport(agg);
}

// CLI entrypoint
main().catch((e) => {
    console.error(e);
    process.exit(1);
});
