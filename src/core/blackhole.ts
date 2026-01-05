let sink = 0;

export class Blackhole {
    static consume<T>(value: T): T {
        const t = typeof value;
        if (t === "number") sink ^= (value as any) | 0;
        else if (t === "string") sink ^= (value as any).length | 0;
        else if (value && t === "object") sink ^= 1;
        return value;
    }

    static consumeCPU(tokens: number) {
        let x = 0;
        for (let i = 0; i < tokens; i++) x = (x * 1664525 + 1013904223) | 0;
        sink ^= x;
    }

    static _readSink() {
        return sink;
    }
}
