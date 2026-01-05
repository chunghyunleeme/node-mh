import { spawnSync } from "node:child_process";
import { AggregatedResult, ForkResult } from "../core/types";
import { getClassConfig, runInProc } from "./inproc";

export async function runForked(BenchClass: new () => any): Promise<AggregatedResult> {
    const cfg = getClassConfig(BenchClass);
    const forks = Math.max(1, cfg.fork.value);

    if (process.env.NODE_MH_CHILD === "1") {
        const r = await runInProc(BenchClass);
        process.stdout.write(JSON.stringify(r));
        return {
            summary: {
                forks: 1,
                warmup: cfg.warmup,
                measurement: cfg.measurement,
                mode: cfg.mode,
                unit: cfg.outputTimeUnit
            },
            forks: [r]
        };
    }

    const forkResults: ForkResult[] = [];
    for (let i = 1; i <= forks; i++) {
        const env = {
            ...process.env,
            ...(cfg.fork.env ?? {}),
            NODE_MH_CHILD: "1",
            NODE_MH_FORK_INDEX: String(i)
        };

        const nodeArgs = [...(cfg.fork.nodeArgs ?? [])];

        throw new Error(
            "runForked(BenchClass) is intended to be used by CLI in MVP. Use CLI: node-mh run <glob>."
        );
    }

    return {
        summary: {
            forks,
            warmup: cfg.warmup,
            measurement: cfg.measurement,
            mode: cfg.mode,
            unit: cfg.outputTimeUnit
        },
        forks: forkResults
    };
}
