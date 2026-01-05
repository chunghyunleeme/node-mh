import { AggregatedResult, Mode, TimeUnit, BenchRunResult } from "../core/types";

type Row = {
    name: string;
    unit: TimeUnit;
    mode: Mode;
    mean: number;     // in output unit (ms/op, us/op...)
    stdev: number;
    min: number;
    max: number;
    n: number;        // #samples (= forks * iterations)
    samplesTotal: number;
    rmeAvg: number;
};

function padRight(s: string, n: number) {
    return s.length >= n ? s : s + " ".repeat(n - s.length);
}
function padLeft(s: string, n: number) {
    return s.length >= n ? s : " ".repeat(n - s.length) + s;
}

function fmtUnit(unit: TimeUnit) {
    return unit === TimeUnit.MILLISECONDS
        ? "ms/op"
        : unit === TimeUnit.MICROSECONDS
            ? "us/op"
            : unit === TimeUnit.NANOSECONDS
                ? "ns/op"
                : "s/op";
}

function mean(arr: number[]) {
    return arr.reduce((a, b) => a + b, 0) / Math.max(1, arr.length);
}
function stdev(arr: number[]) {
    if (arr.length <= 1) return 0;
    const m = mean(arr);
    const v = arr.reduce((acc, x) => acc + (x - m) ** 2, 0) / (arr.length - 1);
    return Math.sqrt(v);
}

function pickValue(r: BenchRunResult): number {
    if (r.mode === Mode.AverageTime) {
        if (typeof r.meanMsPerOp !== "number") throw new Error("missing meanMsPerOp");
        return r.meanMsPerOp;
    }
    if (r.mode === Mode.Throughput) {
        if (typeof r.opsPerSec !== "number") throw new Error("missing opsPerSec");
        return r.opsPerSec;
    }
    throw new Error(`Unknown mode: ${r.mode}`);
}

function fmtValue(v: number, mode: Mode) {
    if (mode === Mode.Throughput) return v.toFixed(2);
    if (v >= 1) return v.toFixed(4);
    if (v >= 0.01) return v.toFixed(5);
    return v.toFixed(6);
}

export function printReport(agg: AggregatedResult) {
    const { mode, unit, forks, warmup, measurement } = agg.summary;

    console.log("");
    console.log("=== node-mh ===");
    console.log(
        `mode=${mode}, unit=${mode === Mode.AverageTime ? fmtUnit(unit) : "ops/s"}, forks=${forks}, warmup=${warmup.iterations}x${warmup.time}${warmup.timeUnit}, measurement=${measurement.iterations}x${measurement.time}${measurement.timeUnit}`
    );

    const byName = new Map<string, BenchRunResult[]>();

    for (const fr of agg.forks) {
        for (const iter of fr.iterations) {
            for (const r of iter.results) {
                const arr = byName.get(r.benchName) ?? [];
                arr.push(r);
                byName.set(r.benchName, arr);
            }
        }
    }

    const rows: Row[] = [];
    for (const [name, results] of byName.entries()) {
        const values = results.map(pickValue);
        const m = mean(values);
        const sd = stdev(values);
        const mn = Math.min(...values);
        const mx = Math.max(...values);
        const n = values.length;

        const samplesTotal = results.reduce((acc, r) => acc + (r.samples ?? 0), 0);
        const rmeAvg = mean(results.map((r) => r.rme ?? 0));

        rows.push({
            name,
            unit,
            mode,
            mean: m,
            stdev: sd,
            min: mn,
            max: mx,
            n,
            samplesTotal,
            rmeAvg,
        });
    }

    rows.sort((a, b) => a.mean - b.mean);

    const headers =
        mode === Mode.AverageTime
            ? ["Benchmark", "Mean", "Stdev", "Min", "Max", "N", "Samples", "RME%"]
            : ["Benchmark", "Ops/s", "Stdev", "Min", "Max", "N", "Samples", "RME%"];

    // column widths
    const nameW = Math.max(
        headers[0].length,
        ...rows.map((r) => r.name.length),
        18
    );
    const numW = 12;

    const line =
        padRight(headers[0], nameW) +
        "  " +
        headers
            .slice(1)
            .map((h) => padLeft(h, numW))
            .join("  ");

    console.log("");
    console.log(line);
    console.log("-".repeat(line.length));

    for (const r of rows) {
        const meanStr = fmtValue(r.mean, mode);
        const sdStr = fmtValue(r.stdev, mode);
        const minStr = fmtValue(r.min, mode);
        const maxStr = fmtValue(r.max, mode);

        const row =
            padRight(r.name, nameW) +
            "  " +
            [
                meanStr,
                sdStr,
                minStr,
                maxStr,
                String(r.n),
                String(r.samplesTotal),
                r.rmeAvg.toFixed(2),
            ]
                .map((x) => padLeft(x, numW))
                .join("  ");

        console.log(row);
    }

    if (rows.length >= 2 && mode === Mode.AverageTime) {
        const base = rows[0].mean;
        console.log("");
        console.log(`(relative to fastest: ${rows[0].name})`);
        for (const r of rows) {
            const ratio = r.mean / base;
            const pct = (ratio - 1) * 100;
            const sign = pct >= 0 ? "+" : "";
            console.log(`- ${r.name}: x${ratio.toFixed(3)} (${sign}${pct.toFixed(1)}%)`);
        }
    }
}
