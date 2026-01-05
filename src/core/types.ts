export enum Mode {
    AverageTime = "AverageTime",
    Throughput = "Throughput"
}

export enum TimeUnit {
    NANOSECONDS = "ns",
    MICROSECONDS = "us",
    MILLISECONDS = "ms",
    SECONDS = "s"
}

export type Duration = {
    time: number;
    timeUnit: TimeUnit;
};

export type WarmupConfig = {
    iterations: number;
    time: number; // time per iteration
    timeUnit: TimeUnit;
};

export type MeasurementConfig = {
    iterations: number;
    time: number; // time per iteration
    timeUnit: TimeUnit;
};

export type ForkConfig = {
    value: number;
    nodeArgs?: string[];
    env?: Record<string, string>;
};

export type BenchmarkClassConfig = {
    mode: Mode;
    outputTimeUnit: TimeUnit;
    warmup: WarmupConfig;
    measurement: MeasurementConfig;
    fork: ForkConfig;
};

export type BenchmarkMethodMeta = {
    name: string;
    methodName: string;
};

export type BenchRunResult = {
    benchName: string;
    mode: Mode;
    unit: TimeUnit;
    // AverageTime
    meanMsPerOp?: number;
    // Throughput
    opsPerSec?: number;
    // Stats
    rme?: number;
    samples?: number;
};

export type IterationResult = {
    iteration: number;
    results: BenchRunResult[];
};

export type ForkResult = {
    fork: number;
    iterations: IterationResult[];
    env: {
        node: string;
        platform: string;
        arch: string;
        pid: number;
        nodeArgs: string[];
    };
};

export type AggregatedResult = {
    summary: {
        forks: number;
        warmup: WarmupConfig;
        measurement: MeasurementConfig;
        mode: Mode;
        unit: TimeUnit;
    };
    forks: ForkResult[];
};
