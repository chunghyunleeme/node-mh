import { BenchmarkClassConfig, BenchmarkMethodMeta, Mode, TimeUnit } from "./types";

const CONFIG = Symbol.for("node-mh:config");
const METHODS = Symbol.for("node-mh:methods");

export function getDefaultConfig(): BenchmarkClassConfig {
    return {
        mode: Mode.AverageTime,
        outputTimeUnit: TimeUnit.MILLISECONDS,
        warmup: { iterations: 1, time: 300, timeUnit: TimeUnit.MILLISECONDS },
        measurement: { iterations: 3, time: 800, timeUnit: TimeUnit.MILLISECONDS },
        fork: { value: 1, nodeArgs: [], env: {} }
    };
}

export function getOrInitConfig(ctor: Function): BenchmarkClassConfig {
    const existing = (ctor as any)[CONFIG] as BenchmarkClassConfig | undefined;
    if (existing) return existing;
    const def = getDefaultConfig();
    (ctor as any)[CONFIG] = def;
    return def;
}

export function setConfig(ctor: Function, partial: Partial<BenchmarkClassConfig>) {
    const cfg = getOrInitConfig(ctor);
    (ctor as any)[CONFIG] = { ...cfg, ...partial };
}

export function getConfig(ctor: Function): BenchmarkClassConfig {
    return getOrInitConfig(ctor);
}

export function addBenchmarkMethod(ctor: Function, meta: BenchmarkMethodMeta) {
    const methods = ((ctor as any)[METHODS] as BenchmarkMethodMeta[] | undefined) ?? [];
    methods.push(meta);
    (ctor as any)[METHODS] = methods;
}

export function getBenchmarkMethods(ctor: Function): BenchmarkMethodMeta[] {
    return (((ctor as any)[METHODS] as BenchmarkMethodMeta[] | undefined) ?? []).slice();
}
