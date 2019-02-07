import { EventEmitter } from "events";
import Debugger from 'truffle-debugger';
import { DebugProtocol } from 'vscode-debugprotocol';
import { TruffleDebuggerTypes } from "./debugger-types";

const uuidv4 = require("uuid").v4;

export default class RuntimeInterface extends EventEmitter {
  private _session: any;

  private _sources: {
    [key: string]: string
  };

  private _selectors: any;

  //private _debuggerMessages: Map<string, Function | undefined>;

  constructor() {
    super();

    //this._debuggerMessages = new Map<string, Function | undefined>();

    this._selectors = Debugger.selectors();
  }

  public async clearBreakpoints(): Promise<void> {
    this._session.removeAllBreakpoints();
  }

  public async setBreakpoint(path: string, line: number): Promise<TruffleDebuggerTypes.Breakpoint> {
    let breakpoint: TruffleDebuggerTypes.Breakpoint;

    //we'll need the debugger-internal ID of this source
    let debuggerSources: any = this._session.view(this._selectors.solidity.info.sources);
    let matchingSources: any = Object.values(debuggerSources).filter((sourceObject: any) =>
      sourceObject.sourcePath.includes(path)
    );
    let sourceId = matchingSources[0].id;

    breakpoint = {
      sourceId,
      line
    };

    this._session.addBreakpoint(breakpoint);

    return breakpoint;
  }

  public async stack(startFrame: number, endFrame: number): Promise<any> {
  }

  public async variables(args?: DebugProtocol.VariablesArguments): Promise<any> {
  }

  public async continue(): Promise<void> {
    this._session.continueUntilBreakpoint();
  }

  public async continueReverse(): Promise<void> {
  }

  public async stepOver(): Promise<void> {
    this._session.stepOver();
  }

  public async stepBack(): Promise<void> {
  }

  public async stepIn(): Promise<void> {
    this._session.stepInto();
  }

  public async stepOut(): Promise<void> {
    this._session.stepOut();
  }

  public async evaluate(expression: string, context: string | undefined, frameId: number | undefined): Promise<any> {
  }

  public async attach(txHash: string): Promise<void> {
    let bugger = await Debugger.forTx(txHash, { provider, files, contracts });

    this._session = bugger.connect();
  }

  public sendEvent(event: string, ...args: any[]) {
    setImmediate(_ => {
      this.emit(event, ...args);
    });
  }
}