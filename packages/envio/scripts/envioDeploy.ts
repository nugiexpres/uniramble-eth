#!/usr/bin/env node

/**
 * Script untuk generate dan deploy Envio indexer
 * Usage: npm run envio:deploy atau yarn envio:deploy
 */

import { spawn } from "child_process";
import { existsSync } from "fs";
import { join } from "path";

const ENVIO_DIR = join(__dirname, "..");

async function deployEnvioIndexer() {
  console.log("🚀 Deploying Envio Indexer...");
  console.log(`📁 Working directory: ${ENVIO_DIR}`);

  // Step 1: Generate indexer code
  console.log("📝 Step 1: Generating indexer code...");
  await runCommand("npx", ["envio", "codegen"], "Generate indexer code");

  // Step 2: Build indexer
  console.log("🔨 Step 2: Building indexer...");
  await runCommand("npm", ["run", "build"], "Build indexer");

  // Step 3: Deploy indexer
  console.log("🚀 Step 3: Deploying indexer...");
  await runCommand("npx", ["envio", "deploy"], "Deploy indexer");

  console.log("✅ Envio indexer deployed successfully!");
  console.log(
    "🌐 Your GraphQL API should be available at: http://localhost:8080/graphql"
  );
}

async function runCommand(
  command: string,
  args: string[],
  description: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log(`⏳ ${description}...`);

    const process = spawn(command, args, {
      cwd: ENVIO_DIR,
      stdio: "inherit",
      shell: true,
    });

    process.on("close", (code) => {
      if (code === 0) {
        console.log(`✅ ${description} completed successfully`);
        resolve();
      } else {
        console.error(`❌ ${description} failed with code ${code}`);
        reject(new Error(`${description} failed`));
      }
    });

    process.on("error", (error) => {
      console.error(`❌ Failed to run ${description}:`, error);
      reject(error);
    });
  });
}

// Run the script
deployEnvioIndexer().catch((error) => {
  console.error("❌ Failed to deploy Envio indexer:", error);
  process.exit(1);
});
