/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

'use strict';

import {
  window,
  commands,
  debug,
  workspace,
  DebugConfigurationProvider,
  ExtensionContext,
  WorkspaceFolder,
  DebugConfiguration,
  ProviderResult,
  CancellationToken,
  QuickPickItem
} from 'vscode';

import * as ethers from "ethers";

import * as path from "path";

export function activate(context: ExtensionContext) {
  context.subscriptions.push(
    commands.registerCommand("extension.truffle.debugTransaction", async () => {
      if (typeof workspace.workspaceFolders === "undefined" || workspace.workspaceFolders.length === 0) {
        return;
      }

      const truffleDirectory = workspace.workspaceFolders[0].uri.fsPath;
      const output = require(path.join(truffleDirectory, "truffle-config.js"));
      const providerUrl = "http://" + output.networks.development.host + ":" + output.networks.development.port;
      const provider = new ethers.providers.JsonRpcProvider(providerUrl);
      const latestBlock = await provider.getBlock("latest");
      let txHashes: string[] = [];
      let block = latestBlock;
      while (txHashes.length < 5 && block.number > 0) {
        for (let i = 0; i < block.transactions.length && txHashes.length < 5; i++) {
          txHashes.push(block.transactions[i]);
        }
        block = await provider.getBlock(block.number - 1);
      }

      const quickPick = window.createQuickPick();
      quickPick.placeholder = "Enter the transaction hash to debug";
      quickPick.ignoreFocusOut = true;
      quickPick.items = txHashes.map((tx) => {
        return <QuickPickItem>{
          label: tx,
          alwaysShow: true
        };
      });
      quickPick.onDidChangeSelection(selection => {
        if (selection[0]) {
          const txHash = selection[0].label;
          debug.startDebugging(undefined, <DebugConfiguration>{
            type: "truffle",
            request: "launch",
            name: "Debug Transactions",
            txHash,
            files: [
              "/home/mike/work/truffle/solidity-magic-square/contracts/SquareLib.sol",
              "/home/mike/work/truffle/solidity-magic-square/contracts/MagicSquare.sol"
            ],
            providerUrl
          });
        }
        quickPick.hide();
      });
      quickPick.onDidHide(() => quickPick.dispose());
      quickPick.show();
    })
  );

  //if (EMBED_DEBUG_ADAPTER) {
  //  const factory = new MockDebugAdapterDescriptorFactory();
  //  context.subscriptions.push(vscode.debug.registerDebugAdapterDescriptorFactory('mock', factory));
  //  context.subscriptions.push(factory);
  //}

  // register a configuration provider for 'sdb' debug type
  context.subscriptions.push(
    debug.registerDebugConfigurationProvider(
      "truffle",
      new TruffleDebuggerConfigurationProvider()
    )
  );
}

export function deactivate() {
  // nothing to do
}

class TruffleDebuggerConfigurationProvider implements DebugConfigurationProvider {
  /**
   * Massage a debug configuration just before a debug session is being launched,
   * e.g. add all missing attributes to the debug configuration.
   */
  resolveDebugConfiguration(folder: WorkspaceFolder | undefined, config: DebugConfiguration, token?: CancellationToken): ProviderResult<DebugConfiguration> {
    return config;
  }
}
