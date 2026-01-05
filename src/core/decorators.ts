import { addBenchmarkMethod, getOrInitConfig, setConfig } from "./metadata";
import { ForkConfig, MeasurementConfig, Mode, TimeUnit, WarmupConfig } from "./types";

export function BenchmarkMode(mode: Mode) {
    return function (ctor: Function) {
        setConfig(ctor, { mode });
    };
}

export function OutputTimeUnit(unit: TimeUnit) {
    return function (ctor: Function) {
        setConfig(ctor, { outputTimeUnit: unit });
    };
}

export function Fork(value: number, opts: Omit<ForkConfig, "value"> = {}) {
    return function (ctor: Function) {
        setConfig(ctor, { fork: { value, nodeArgs: opts.nodeArgs ?? [], env: opts.env ?? {} } });
    };
}

export function Warmup(cfg: WarmupConfig | number) {
    return function (ctor: Function) {
        const current = getOrInitConfig(ctor);
        const warmup =
            typeof cfg === "number"
                ? { ...current.warmup, iterations: cfg }
                : cfg;
        setConfig(ctor, { warmup });
    };
}

export function Measurement(cfg: MeasurementConfig | number) {
    return function (ctor: Function) {
        const current = getOrInitConfig(ctor);
        const measurement =
            typeof cfg === "number"
                ? { ...current.measurement, iterations: cfg }
                : cfg;
        setConfig(ctor, { measurement });
    };
}

export function BenchmarkCase(name?: string) {
    return function (target: any, propertyKey: string, _desc: PropertyDescriptor) {
        addBenchmarkMethod(target.constructor, { name: name ?? propertyKey, methodName: propertyKey });
    };
}
