import Benchmark = require("benchmark");
import { Blackhole } from "../core/blackhole";
import { BenchmarkClassConfig, BenchRunResult, Mode } from "../core/types";
import { timeUnitToMs } from "../core/utils";
import { BenchmarkInstance } from "benchmark";

type CaseFn = () => any | Promise<any>;

export async function runIterationWithBenchmarkJs(
    cfg: BenchmarkClassConfig,
    cases: { name: string; fn: CaseFn }[],
    minTimeMs: number
): Promise<BenchRunResult[]> {
    const suite = new Benchmark.Suite();

    for (const c of cases) {
        suite.add(
            c.name,
            function () {
                const v = c.fn();
                if (v && typeof (v as any).then === "function") {
                    throw new Error("Async benchmark is not supported in MVP (benchmark.js engine).");
                }
                Blackhole.consume(v);
            },
            {
                minTime: minTimeMs / 1000,
                maxTime: (minTimeMs / 1000) * 1.2,
                minSamples: 10
            }
        );
    }

    const results: BenchRunResult[] = [];

    await new Promise<void>((resolve, reject) => {
        suite
            .on("cycle", (event: any) => {
                const b = event.target as BenchmarkInstance;
                const secPerOp = b.stats.mean; // seconds/op
                const msPerOp = secPerOp * 1000;
                const unitMs = timeUnitToMs(cfg.outputTimeUnit);

                const r: BenchRunResult = {
                    benchName: b.name,
                    mode: cfg.mode,
                    unit: cfg.outputTimeUnit,
                    rme: b.stats.rme,
                    samples: b.stats.sample.length
                };

                if (cfg.mode === Mode.AverageTime) {
                    r.meanMsPerOp = msPerOp / unitMs;
                } else if (cfg.mode === Mode.Throughput) {
                    r.opsPerSec = b.hz;
                }

                results.push(r);
            })
            .on("complete", () => resolve())
            .on("error", (e: any) => reject(e))
            .run({ async: true });
    });

    return results;
}
