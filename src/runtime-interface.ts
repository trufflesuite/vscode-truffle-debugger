import { EventEmitter } from "events";
import Debugger from "truffle-debugger";
import { DebugProtocol } from 'vscode-debugprotocol';
import { TruffleDebuggerTypes } from "./debugger-types";
import { prepareContracts } from "./helpers";
import * as fs from "fs";

const Web3 = require("web3");

export default class RuntimeInterface extends EventEmitter {
  private _session: any;

  private _sources: {
    [key: string]: string
  };

  private _selectors: any;

  private _provider: any;

  private _numBreakpoints;

  //private _debuggerMessages: Map<string, Function | undefined>;

  constructor() {
    super();

    //this._debuggerMessages = new Map<string, Function | undefined>();

    this._selectors = Debugger.selectors();
    this._numBreakpoints = 0;
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
      id: this._numBreakpoints,
      sourceId,
      line
    };

    this._numBreakpoints++;

    this._session.addBreakpoint(breakpoint);

    return breakpoint;
  }

  public async stack(startFrame: number, endFrame: number): Promise<any> {
  }

  public async variables(args?: DebugProtocol.VariablesArguments): Promise<any> {
  }

  public async continue(): Promise<void> {
    this._session.continueUntilBreakpoint();
    this.sendEvent("stopOnBreakpoint");
  }

  public async continueReverse(): Promise<void> {
    this.sendEvent("stopOnBreakpoint");
  }

  public async stepOver(): Promise<void> {
    this._session.stepOver();
    this.sendEvent("stopOnStepOver");
  }

  public async stepBack(): Promise<void> {
    this.sendEvent("stopOnStepOver");
  }

  public async stepIn(): Promise<void> {
    this._session.stepInto();
    this.sendEvent("stopOnStepIn");
  }

  public async stepOut(): Promise<void> {
    this._session.stepOut();
    this.sendEvent("stopOnStepOut");
  }

  public async evaluate(expression: string, context: string | undefined, frameId: number | undefined): Promise<any> {
  }

  public async attach(providerUrl: string, txHash: string, filePaths: string[]): Promise<void> {
    this._provider = new Web3(providerUrl);

    this._sources = Object.assign(
      {},
      ...filePaths.map((file) => {
        // read each file, need to return object with file as key
        return {
          [file]: fs.readFileSync(file, { encoding: "utf8" })
        };
      })
    );

    let { artifacts: contracts, files }: any = await prepareContracts(
      this._provider,
      this._sources
    );

    let bugger = await Debugger.forTx(txHash, { provider: this._provider, files, contracts });

    this._session = bugger.connect();
  }

  public currentLine(): TruffleDebuggerTypes.Frame {
    const currentInstruction: any = this._session.view(this._selectors.solidity.current.instruction);

    return {
      file: this._session.view(this._selectors.solidity.current.source).sourcePath,
      line: currentInstruction.range ? currentInstruction.range.start.line : 0,
      column: currentInstruction.range ? currentInstruction.range.start.column : 0
    }
  }

  public sendEvent(event: string, ...args: any[]) {
    setImmediate(_ => {
      this.emit(event, ...args);
    });
  }
}