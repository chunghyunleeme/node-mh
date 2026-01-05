import { getBenchmarkMethods, getConfig } from "../core/metadata";
import { BenchmarkClassConfig, ForkResult, IterationResult } from "../core/types";
import { runIterationWithBenchmarkJs } from "../engine/benchmarkjs";

export async function runInProc(BenchClass: new () => any): Promise<ForkResult> {
    const cfg = getConfig(BenchClass as any);
    const methods = getBenchmarkMethods(BenchClass as any);
    if (methods.length === 0) throw new Error(`No @BenchmarkCase methods found on ${BenchClass.name}`);

    const inst = new BenchClass();

    const cases = methods.map((m) => ({
        name: m.name,
        fn: () => (inst as any)[m.methodName]()
    }));

    // warmup
    for (let i = 1; i <= cfg.warmup.iterations; i++) {
        await runIterationWithBenchmarkJs(cfg, cases, cfg.warmup.time);
    }

    // measurement
    const iterations: IterationResult[] = [];
    for (let i = 1; i <= cfg.measurement.iterations; i++) {
        const results = await runIterationWithBenchmarkJs(cfg, cases, cfg.measurement.time);
        iterations.push({ iteration: i, results });
    }

    return {
        fork: Number(process.env.NODE_MH_FORK_INDEX ?? "1"),
        iterations,
        env: {
            node: process.version,
            platform: process.platform,
            arch: process.arch,
            pid: process.pid,
            nodeArgs: process.execArgv.slice()
        }
    };
}

export function getClassConfig(BenchClass: new () => any): BenchmarkClassConfig {
    return getConfig(BenchClass as any);
}
