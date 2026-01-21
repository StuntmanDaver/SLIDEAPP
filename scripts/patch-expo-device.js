const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "..", "node_modules", "expo-device", "ios", "UIDevice.swift");

if (!fs.existsSync(filePath)) {
  process.exit(0);
}

const contents = fs.readFileSync(filePath, "utf8");

if (!contents.includes("TARGET_OS_SIMULATOR")) {
  process.exit(0);
}

const updated = contents.replace(/^(\\s*)return TARGET_OS_SIMULATOR != 0/m, (match, indent) => {
  return [
    `${indent}#if targetEnvironment(simulator)`,
    `${indent}return true`,
    `${indent}#else`,
    `${indent}return false`,
    `${indent}#endif`,
  ].join("\n");
});

if (updated !== contents) {
  fs.writeFileSync(filePath, updated, "utf8");
}
