declare module "benchmark" {
    type Deferred = {
        resolve: () => void;
    };

    interface BenchmarkStats {
        mean: number; // seconds per operation
        deviation: number;
        variance: number;
        sample: number[];
        rme: number; // relative margin of error (%)
    }

    interface BenchmarkOptions {
        minTime?: number; // seconds
        maxTime?: number;
        minSamples?: number;
        async?: boolean;
        defer?: boolean;
    }

    export interface BenchmarkInstance {
        name: string;
        hz: number;
        stats: BenchmarkStats;
    }

    interface BenchmarkConstructor {
        new (
            name: string,
            fn: (this: BenchmarkInstance, deferred?: Deferred) => void,
            options?: BenchmarkOptions
        ): BenchmarkInstance;

        // Benchmark.Suite
        Suite: {
            new (): BenchmarkSuite;
        };
    }

    interface BenchmarkSuite {
        add(
            name: string,
            fn: (this: BenchmarkInstance, deferred?: Deferred) => void,
            options?: BenchmarkOptions
        ): this;

        on(event: "cycle", listener: (event: { target: BenchmarkInstance }) => void): this;
        on(event: "complete", listener: () => void): this;
        on(event: "error", listener: (error: any) => void): this;

        run(options?: { async?: boolean }): this;
    }

    const Benchmark: BenchmarkConstructor;
    export = Benchmark;
}
