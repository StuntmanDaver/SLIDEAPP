const fs = require("fs");
const path = require("path");

// Try multiple possible node_modules locations (monorepo hoisted, local, etc.)
const possiblePaths = [
  path.join(__dirname, "..", "node_modules"),
  path.join(__dirname, "..", "..", "..", "node_modules"),
];

function findNodeModules() {
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      return p;
    }
  }
  return null;
}

const nodeModules = findNodeModules();
if (!nodeModules) {
  console.log("node_modules not found, skipping patches");
  process.exit(0);
}

// Patch expo-device UIDevice.swift
const devicePath = path.join(nodeModules, "expo-device", "ios", "UIDevice.swift");
if (fs.existsSync(devicePath)) {
  let contents = fs.readFileSync(devicePath, "utf8");
  if (contents.includes("TARGET_OS_SIMULATOR")) {
    contents = contents.replace(
      /return TARGET_OS_SIMULATOR != 0/g,
      `#if targetEnvironment(simulator)
    return true
    #else
    return false
    #endif`
    );
    fs.writeFileSync(devicePath, contents, "utf8");
    console.log("✓ Patched expo-device UIDevice.swift");
  } else {
    console.log("✓ expo-device already patched");
  }
}

// Patch expo-apple-authentication AppleAuthenticationExceptions.swift
const authPath = path.join(nodeModules, "expo-apple-authentication", "ios", "AppleAuthenticationExceptions.swift");
if (fs.existsSync(authPath)) {
  let contents = fs.readFileSync(authPath, "utf8");
  if (!contents.includes("@unknown default")) {
    contents = contents.replace(
      /case \.notInteractive:\s*\n\s*return RequestNotInteractiveException\(\)\s*\n\s*\}/g,
      `case .notInteractive:
    return RequestNotInteractiveException()
  @unknown default:
    return RequestUnknownException()
  }`
    );
    fs.writeFileSync(authPath, contents, "utf8");
    console.log("✓ Patched expo-apple-authentication AppleAuthenticationExceptions.swift");
  } else {
    console.log("✓ expo-apple-authentication already patched");
  }
}

console.log("Expo module patches complete");
