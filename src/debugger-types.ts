
export namespace TruffleDebuggerTypes {
  export interface Breakpoint {
    id: number,
    sourceId: number,
    line: number
  };

  export interface Frame {
    file: string,
    line: number,
    column: number
  };
}
