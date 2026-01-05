# node-mh

JMH-like benchmark harness for Node.js

## Installation

```bash
npm install node-mh
```

## Quick Start

```typescript
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
} from "node-mh";

@BenchmarkMode(Mode.AverageTime)
@OutputTimeUnit(TimeUnit.MILLISECONDS)
@Fork(1)
@Warmup({ iterations: 1, time: 100, timeUnit: TimeUnit.MILLISECONDS })
@Measurement({ iterations: 3, time: 500, timeUnit: TimeUnit.MILLISECONDS })
export class MyBenchmark {
  private data = Array.from({ length: 10000 }, (_, i) => i);

  @BenchmarkCase("for_loop")
  forLoop() {
    let sum = 0;
    for (const x of this.data) sum += x;
    return Blackhole.consume(sum);
  }

  @BenchmarkCase("reduce")
  reduce() {
    return Blackhole.consume(this.data.reduce((a, b) => a + b, 0));
  }
}
```

## Running Benchmarks

```bash
# Build your TypeScript files first
npx tsc

# Run benchmarks
npx node-mh run "dist/**/*.bench.js"
```

## Decorators

### Class Decorators

| Decorator | Description |
|-----------|-------------|
| `@BenchmarkMode(mode)` | Set benchmark mode: `Mode.AverageTime` or `Mode.Throughput` |
| `@OutputTimeUnit(unit)` | Output time unit: `TimeUnit.NANOSECONDS`, `MICROSECONDS`, `MILLISECONDS`, `SECONDS` |
| `@Fork(n, opts?)` | Number of forked processes. Options: `{ nodeArgs?: string[], env?: Record<string, string> }` |
| `@Warmup(config)` | Warmup config: `{ iterations, time, timeUnit }` or just iterations count |
| `@Measurement(config)` | Measurement config: `{ iterations, time, timeUnit }` or just iterations count |

### Method Decorators

| Decorator | Description |
|-----------|-------------|
| `@BenchmarkCase(name?)` | Mark method as benchmark case. Optional custom name. |

## Blackhole

Use `Blackhole.consume()` to prevent dead code elimination:

```typescript
@BenchmarkCase()
myBench() {
  const result = expensiveComputation();
  return Blackhole.consume(result);
}
```

## Output Example

```
=== node-mh ===
mode=AverageTime, unit=ms/op, forks=1, warmup=1x100ms, measurement=3x500ms

Benchmark                Mean        Stdev          Min          Max     N      Samples     RME%
--------------------------------------------------------------------------------------------------
for_loop               0.0234       0.0012       0.0220       0.0248     3           45     1.23
reduce                 0.0312       0.0015       0.0295       0.0330     3           42     1.45

(relative to fastest: for_loop)
- for_loop: x1.000 (+0.0%)
- reduce: x1.333 (+33.3%)
```

## License

MIT