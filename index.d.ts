export declare class Context {
    private commands;
    constructor();
    isEquals: (x: any, y: any) => boolean;
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
export declare type Spec<T, C extends CustomCommands<object> = never> = (T extends (Array<infer U> | ReadonlyArray<infer U>) ? ArraySpec<U, C> : T extends (Map<infer K, infer V> | ReadonlyMap<infer K, infer V>) ? MapSpec<K, V> : T extends (Set<infer X> | ReadonlySet<infer X>) ? SetSpec<X> : T extends object ? ObjectSpec<T, C> : never) | {
    $set: T;
} | {
    $apply: (v: T) => T;
} | ((v: T) => T) | (C extends CustomCommands<infer O> ? O : never);
declare type ArraySpec<T, C extends CustomCommands<object>> = {
    $push: T[];
} | {
    $unshift: T[];
} | {
    $splice: Array<[number, number?] | [number, number, ...T[]]>;
} | {
    [index: string]: Spec<T, C>;
};
declare type MapSpec<K, V> = {
    $add: Array<[K, V]>;
} | {
    $remove: K[];
} | {
    [key: string]: {
        $set: V;
    };
};
declare type SetSpec<T> = {
    $add: T[];
} | {
    $remove: T[];
};
declare type ObjectSpec<T, C extends CustomCommands<object>> = {
    $toggle: Array<keyof T>;
} | {
    $unset: Array<keyof T>;
} | {
    $merge: Partial<T>;
} | {
    [K in keyof T]?: Spec<T[K], C>;
};
