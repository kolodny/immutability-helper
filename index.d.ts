export declare function invariant(condition: boolean, message: () => string): void;
export declare class Context {
    private commands;
    constructor();
    get isEquals(): (x: any, y: any) => boolean;
    set isEquals(value: (x: any, y: any) => boolean);
    extend<T>(directive: string, fn: (param: any, old: T) => T): void;
    update<T, C extends CustomCommands<object> = never>(object: T, $spec: Spec<T, C>): T;
}
export declare const isEquals: any;
export declare const extend: <T>(directive: string, fn: (param: any, old: T) => T) => void;
declare const _default: <T, C extends CustomCommands<object> = never>(object: T, $spec: Spec<T, C>) => T;
export default _default;
export declare type CustomCommands<T> = T & {
    __noInferenceCustomCommandsBrand: any;
};
export declare type Spec<T, C extends CustomCommands<object> = never> = (T extends (Array<infer U> | ReadonlyArray<infer U>) ? ArraySpec<U, C> : T extends (Map<infer K, infer V> | ReadonlyMap<infer K, infer V>) ? MapSpec<K, V, C> : T extends (Set<infer X> | ReadonlySet<infer X>) ? SetSpec<X> : T extends object ? ObjectSpec<T, C> : never) | {
    $set: T;
} | {
    $apply: (v: T) => T;
} | ((v: T) => T) | (C extends CustomCommands<infer O> ? O : never);
declare type ArraySpec<T, C extends CustomCommands<object>> = {
    $push: ReadonlyArray<T>;
} | {
    $unshift: ReadonlyArray<T>;
} | {
    $splice: ReadonlyArray<[number, number?] | [number, number, ...T[]]>;
} | {
    [index: string]: Spec<T, C>;
};
declare type MapSpec<K, V, C extends CustomCommands<object>> = {
    $add: ReadonlyArray<[K, V]>;
} | {
    $remove: ReadonlyArray<K>;
} | {
    [key: string]: Spec<V, C>;
};
declare type SetSpec<T> = {
    $add: ReadonlyArray<T>;
} | {
    $remove: ReadonlyArray<T>;
};
declare type ObjectSpec<T, C extends CustomCommands<object>> = {
    $toggle: ReadonlyArray<keyof T>;
} | {
    $unset: ReadonlyArray<keyof T>;
} | {
    $merge: Partial<T>;
} | {
    [K in keyof T]?: Spec<T[K], C>;
};
