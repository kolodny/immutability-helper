// Type definitions for immutability-helper
// Project: Immutability helper

export = update

declare function update<T>(data: T, query: update.Query<T>): T

export namespace update {
  function newContext(): typeof update
  function extend<T>(
    command: Command,
    handler: (param: CommandArg, old: T) => T
  )

  type Command = string
  type CommandArg = any

  type ObjectOperator<T> =
    | {$set: any}
    | {$toggle: Array<keyof T>}
    | {$unset: Array<keyof T>}
    | {$merge: Partial<T>}
    | {$apply: (old: T) => any}
    | ((old: T) => any)

  type MapAndSetOperators = {$add: Array<any>} | {$remove: Array<string>}

  type ArrayOperator<T> =
    | {$push: T}
    | {$unshift: T}
    | {$splice: [number, number][]}

  type Operators<T> =
    | ObjectOperator<T>
    | ArrayOperator<T>
    | MapAndSetOperators<T>

  type Tree<T> = {[K in keyof T]?: Query<T[K]>}

  type Query<T> = Tree<T> | Operators<T>
}
