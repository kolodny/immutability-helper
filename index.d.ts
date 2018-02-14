// Project: Immutability helper
// TypeScript Version: 2.2

export default update

declare function update<T>(
  data: ReadonlyArray<T>,
  query: ArrayOperators<T>,
): ReadonlyArray<T>

declare function update<T>(
  data: ReadonlySet<T>,
  query: SetOperators<T>,
): ReadonlySet<T>

declare function update<K, V>(
  data: ReadonlyMap<K, V>,
  query: MapOperators<K, V>,
): ReadonlyMap<K, V>

declare function update<T>(data: T, query: Query<T>): T

type Tree<T> = {[K in keyof T]?: Query<T[K]>}
export type Query<T> =
  | Tree<T>
  | ObjectOperators<T>
  | ArrayOperators<any>
  | SetOperators<any>

type ObjectOperators<T> =
  | {$set: any}
  | {$toggle: Array<keyof T | number>}
  | {$unset: Array<keyof T | number>}
  | {$merge: Partial<T>}
  | {$apply: (old: T) => T}
  | ((old: T) => any)
type ArrayOperators<T> =
  | {$push: T}
  | {$unshift: T}
  | {$splice: Array<[number, number]>}
  | {[customCommand: string]: any}

type MapOperators<K, V> = {$add: Array<[K, V]>} | {$remove: K[]}
type SetOperators<T> = {$add: T[]} | {$remove: T[]}

declare namespace update {
  function newContext(): typeof update
  function extend<T>(
    command: Command,
    handler: (param: CommandArg, old: T) => T,
  ): void

  type Command = string
  type CommandArg = any
}
