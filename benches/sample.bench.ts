import {
    BenchmarkCase,
    BenchmarkMode,
    OutputTimeUnit,
    Fork,
    Warmup,
    Measurement,
    Mode,
    TimeUnit,
    Blackhole
} from "../src";

@BenchmarkMode(Mode.AverageTime)
@OutputTimeUnit(TimeUnit.MILLISECONDS)
@Fork(1, { nodeArgs: ["--max-old-space-size=2048"] })
@Warmup({ iterations: 1, time: 50, timeUnit: TimeUnit.MILLISECONDS })
@Measurement({ iterations: 1, time: 100, timeUnit: TimeUnit.MILLISECONDS })
export class SumBench {
    private data = Array.from({ length: 5000 }, (_, i) => i);

    @BenchmarkCase("baseline_for_loop")
    baseline() {
        let s = 0;
        for (const x of this.data) s += x;
        return Blackhole.consume(s);
    }

    @BenchmarkCase("optimized_reduce")
    optimized() {
        return Blackhole.consume(this.data.reduce((a, b) => a + b, 0));
    }
}
