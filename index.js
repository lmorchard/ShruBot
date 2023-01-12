#!/usr/bin/env node
import ShruBot from "./bot.js";

async function main() {
  return new ShruBot().run();
}

main().catch(console.error);
