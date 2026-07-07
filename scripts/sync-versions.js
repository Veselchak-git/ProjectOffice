#!/usr/bin/env node

import { readFileSync, writeFileSync } from "fs";
import { glob } from "glob";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = join(__dirname, "..");

const args = process.argv.slice(2);
const isDryRun = args.includes("--dry-run");
const isCheck = args.includes("--check");

function stripJSONComments(jsonString) {
  // Remove single-line comments (// ...)
  // Remove multi-line comments (/* ... */)
  return jsonString
    .replace(/\/\/.*$/gm, "") // Remove // comments
    .replace(/\/\*[\s\S]*?\*\//g, ""); // Remove /* */ comments
}

function readJSON(filePath) {
  try {
    const content = readFileSync(filePath, "utf-8");
    // Strip comments if it's a .jsonc file
    const jsonContent = filePath.endsWith(".jsonc")
      ? stripJSONComments(content)
      : content;
    return JSON.parse(jsonContent);
  } catch (error) {
    console.error(`❌ Error reading ${filePath}:`, error.message);
    process.exit(1);
  }
}

function writeJSON(filePath, data) {
  writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf-8");
}

function syncDependencyGroup({
  target,
  groupName,
  sourceVersions,
  skipWorkspaceWildcards = false,
}) {
  const changes = [];

  if (!target?.[groupName]) {
    return changes;
  }

  for (const [name, currentVersion] of Object.entries(target[groupName])) {
    if (skipWorkspaceWildcards && currentVersion === "*") {
      continue;
    }

    const newVersion = sourceVersions?.[name];
    if (newVersion && newVersion !== currentVersion) {
      changes.push({
        type: groupName,
        name,
        from: currentVersion,
        to: newVersion,
      });
      target[groupName][name] = newVersion;
    }
  }

  return changes;
}

function main() {
  console.log("🔄 Syncing dependency versions...\n");

  // Читаем versions.json
  const versionsPath = join(ROOT_DIR, "versions.jsonc");
  const versions = readJSON(versionsPath);

  // Находим все package.json в воркспейсах
  const packagePaths = glob.sync("{packages,apps,tooling}/*/package.json", {
    cwd: ROOT_DIR,
    absolute: true,
  });

  let hasChanges = false;
  let updatedCount = 0;

  for (const packagePath of packagePaths) {
    const pkg = readJSON(packagePath);
    const packageName = pkg.name;
    const changes = [
      ...syncDependencyGroup({
        target: pkg,
        groupName: "dependencies",
        sourceVersions: versions.dependencies,
        skipWorkspaceWildcards: true,
      }),
      ...syncDependencyGroup({
        target: pkg,
        groupName: "devDependencies",
        sourceVersions: versions.dependencies,
        skipWorkspaceWildcards: true,
      }),
      ...syncDependencyGroup({
        target: pkg,
        groupName: "peerDependencies",
        sourceVersions: versions.peerDependencies,
      }),
    ];
    const packageChanged = changes.length > 0;

    if (packageChanged) {
      hasChanges = true;
      updatedCount++;

      console.log(`📦 ${packageName}`);
      for (const change of changes) {
        console.log(
          `  ${change.type}: ${change.name} ${change.from} → ${change.to}`,
        );
      }
      console.log();

      if (!isDryRun && !isCheck) {
        writeJSON(packagePath, pkg);
      }
    }
  }

  // Обновляем root package.json
  const rootPackagePath = join(ROOT_DIR, "package.json");
  const rootPkg = readJSON(rootPackagePath);
  const rootChanges = syncDependencyGroup({
    target: rootPkg,
    groupName: "devDependencies",
    sourceVersions: versions.dependencies,
  });
  const rootChanged = rootChanges.length > 0;

  if (rootChanged) {
    hasChanges = true;
    updatedCount++;
    console.log(`📦 ${rootPkg.name} (root)`);
    for (const change of rootChanges) {
      console.log(
        `  ${change.type}: ${change.name} ${change.from} → ${change.to}`,
      );
    }
    console.log();

    if (!isDryRun && !isCheck) {
      writeJSON(rootPackagePath, rootPkg);
    }
  }

  // Итоги
  console.log("─".repeat(60));
  if (!hasChanges) {
    console.log("✅ All versions are in sync!");
    process.exit(0);
  } else if (isCheck) {
    console.log(`❌ Found differences in ${updatedCount} package(s)`);
    console.log("   Run without --check to apply changes");
    process.exit(1);
  } else if (isDryRun) {
    console.log(`ℹ️  Would update ${updatedCount} package(s)`);
    console.log("   Run without --dry-run to apply changes");
  } else {
    console.log(`✅ Updated ${updatedCount} package(s)`);
    console.log('\n💡 Run "npm install" to update lock file');
  }
}

main();
