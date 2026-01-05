import { TimeUnit } from "./types";

export function timeUnitToMs(unit: TimeUnit): number {
    switch (unit) {
        case TimeUnit.NANOSECONDS:
            return 1 / 1_000_000;
        case TimeUnit.MICROSECONDS:
            return 1 / 1_000;
        case TimeUnit.MILLISECONDS:
            return 1;
        case TimeUnit.SECONDS:
            return 1000;
    }
}

export function formatMs(ms: number): string {
    if (ms >= 1) return `${ms.toFixed(4)} ms/op`;
    const us = ms * 1000;
    if (us >= 1) return `${us.toFixed(4)} us/op`;
    const ns = us * 1000;
    return `${ns.toFixed(2)} ns/op`;
}
