import { getBenchmarkMethods } from "../core/metadata";

export function discoverBenchmarkClasses(moduleExports: any): Array<new () => any> {
    const classes: Array<new () => any> = [];

    for (const v of Object.values(moduleExports)) {
        if (typeof v !== "function") continue;
        // class constructor check (best-effort)
        const proto = v.prototype;
        if (!proto) continue;

        const methods = getBenchmarkMethods(v);
        if (methods.length > 0) classes.push(v as any);
    }

    return classes;
}
