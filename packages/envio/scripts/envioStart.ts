#!/usr/bin/env node

/**
 * Script untuk menjalankan Envio indexer
 * Usage: npm run envio:start atau yarn envio:start
 */

import { spawn } from "child_process";
import { existsSync } from "fs";
import { join } from "path";

const ENVIO_DIR = join(__dirname, "..");
const CONFIG_FILE = join(ENVIO_DIR, "config.yaml");

async function startEnvioIndexer() {
  console.log("🚀 Starting Envio Indexer...");
  console.log(`📁 Working directory: ${ENVIO_DIR}`);

  // Check if config file exists
  if (!existsSync(CONFIG_FILE)) {
    console.error("❌ Config file not found:", CONFIG_FILE);
    process.exit(1);
  }

  console.log("✅ Config file found:", CONFIG_FILE);

  // Check if node_modules exists
  const nodeModulesPath = join(ENVIO_DIR, "node_modules");
  if (!existsSync(nodeModulesPath)) {
    console.log("📦 Installing dependencies...");
    const installProcess = spawn("npm", ["install"], {
      cwd: ENVIO_DIR,
      stdio: "inherit",
      shell: true,
    });

    installProcess.on("close", (code) => {
      if (code === 0) {
        console.log("✅ Dependencies installed successfully");
        runIndexer();
      } else {
        console.error("❌ Failed to install dependencies");
        process.exit(1);
      }
    });
  } else {
    runIndexer();
  }

  function runIndexer() {
    console.log("🔄 Starting indexer process...");

    // Run envio indexer
    const indexerProcess = spawn("npx", ["envio", "dev"], {
      cwd: ENVIO_DIR,
      stdio: "inherit",
      shell: true,
      env: {
        ...process.env,
        RUST_LOG: "info", // Set log level
      },
    });

    indexerProcess.on("close", (code) => {
      console.log(`📊 Indexer process exited with code ${code}`);
      if (code !== 0) {
        console.error("❌ Indexer failed to start");
        process.exit(1);
      }
    });

    indexerProcess.on("error", (error) => {
      console.error("❌ Failed to start indexer:", error);
      process.exit(1);
    });

    // Handle graceful shutdown
    process.on("SIGINT", () => {
      console.log("\n🛑 Shutting down indexer...");
      indexerProcess.kill("SIGINT");
    });

    process.on("SIGTERM", () => {
      console.log("\n🛑 Shutting down indexer...");
      indexerProcess.kill("SIGTERM");
    });
  }
}

// Run the script
startEnvioIndexer().catch((error) => {
  console.error("❌ Failed to start Envio indexer:", error);
  process.exit(1);
});
