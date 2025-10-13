#!/usr/bin/env ts-node

/**
 * Auto-update Envio Configuration
 * Watches for changes in deployedContracts.ts and automatically updates Envio config
 */

import * as fs from "fs";
import * as path from "path";
import { parseScaffoldEthFiles } from "../se-integration/parseFiles";
import { updateConfigAndCodegen } from "../se-integration/configGenerator";

const DEPLOYED_CONTRACTS_PATH = path.resolve(
  __dirname,
  "../../nextjs/contracts/deployedContracts.ts"
);
const ENVIO_DIR = path.resolve(__dirname, "..");
const CONFIG_PATH = path.join(ENVIO_DIR, "config.yaml");

/**
 * Main update function
 */
function updateEnvioConfig() {
  try {
    console.log("\n🔄 Updating Envio configuration...");
    console.log(`📁 Reading from: ${DEPLOYED_CONTRACTS_PATH}`);

    if (!fs.existsSync(DEPLOYED_CONTRACTS_PATH)) {
      console.error("❌ deployedContracts.ts not found!");
      return false;
    }

    const parsedData = parseScaffoldEthFiles(DEPLOYED_CONTRACTS_PATH, "");
    console.log(
      `📊 Found ${parsedData.contracts.length} contracts across ${parsedData.chains.length} chains`
    );

    updateConfigAndCodegen(CONFIG_PATH, parsedData, ENVIO_DIR);

    console.log("✅ Envio configuration updated successfully!\n");
    return true;
  } catch (error) {
    console.error("❌ Error updating Envio config:", error);
    return false;
  }
}

/**
 * Watch mode
 */
function watchMode() {
  console.log("👀 Watching for changes in deployedContracts.ts...");
  console.log(`📁 Watching: ${DEPLOYED_CONTRACTS_PATH}\n`);

  let timeout: NodeJS.Timeout;

  fs.watch(DEPLOYED_CONTRACTS_PATH, (eventType) => {
    if (eventType === "change") {
      // Debounce multiple rapid changes
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        console.log("\n📝 Change detected in deployedContracts.ts");
        updateEnvioConfig();
      }, 1000);
    }
  });

  // Initial update
  updateEnvioConfig();

  // Keep process alive
  console.log("Press Ctrl+C to stop watching\n");
}

/**
 * CLI Interface
 */
const args = process.argv.slice(2);
const command = args[0];

if (command === "watch") {
  watchMode();
} else if (command === "update" || !command) {
  const success = updateEnvioConfig();
  process.exit(success ? 0 : 1);
} else {
  console.log(`
Envio Auto-Update Script

Usage:
  ts-node auto-update.ts [command]

Commands:
  update (default)  - Update Envio config once
  watch             - Watch for changes and auto-update

Examples:
  yarn envio:update       # Update once
  yarn envio:watch        # Watch mode
  `);
  process.exit(0);
}
