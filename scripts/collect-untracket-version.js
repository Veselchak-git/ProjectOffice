#!/usr/bin/env node

import { readFileSync } from "fs";
import { glob } from "glob";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = join(__dirname, "..");

function stripJSONComments(jsonString) {
  return jsonString
    .replace(/\/\/.*$/gm, "")
    .replace(/\/\*[\s\S]*?\*\//g, "");
}

function readJSON(filePath) {
  try {
    const content = readFileSync(filePath, "utf-8");
    const jsonContent = filePath.endsWith(".jsonc")
      ? stripJSONComments(content)
      : content;

    return JSON.parse(jsonContent);
  } catch (error) {
    console.error(`❌ Error reading ${filePath}:`, error.message);
    process.exit(1);
  }
}

function createCollector() {
  return new Map();
}

function addVersion(collector, packageName, version, source) {
  if (!packageName || !version || version === "*") {
    return;
  }

  if (!collector.has(packageName)) {
    collector.set(packageName, {
      versions: new Map(),
      sources: [],
    });
  }

  const entry = collector.get(packageName);
  entry.versions.set(version, {
    version,
    count: (entry.versions.get(version)?.count ?? 0) + 1,
  });
  entry.sources.push(source);
}

function collectMissingFromGroup({
  pkg,
  packageName,
  groupName,
  trackedVersions,
  collector,
}) {
  const dependencies = pkg[groupName];
  if (!dependencies) {
    return;
  }

  for (const [dependencyName, version] of Object.entries(dependencies)) {
    if (trackedVersions[dependencyName]) {
      continue;
    }

    addVersion(collector, dependencyName, version, `${packageName}:${groupName}`);
  }
}

function resolveCollectedVersions(collector) {
  const resolved = {};
  const conflicts = [];

  for (const [packageName, entry] of [...collector.entries()].sort((a, b) =>
    a[0].localeCompare(b[0]),
  )) {
    const versions = [...entry.versions.values()].sort((a, b) => {
      if (b.count !== a.count) {
        return b.count - a.count;
      }

      return a.version.localeCompare(b.version);
    });

    resolved[packageName] = versions[0].version;

    if (versions.length > 1) {
      conflicts.push({
        packageName,
        versions: versions.map((item) => item.version),
        chosenVersion: versions[0].version,
        sources: entry.sources,
      });
    }
  }

  return { resolved, conflicts };
}

function main() {
  const versionsPath = join(ROOT_DIR, "versions.jsonc");
  const versions = readJSON(versionsPath);

  const packagePaths = glob.sync("{packages,apps,tooling}/*/package.json", {
    cwd: ROOT_DIR,
    absolute: true,
  });

  const missingDependencies = createCollector();
  const missingPeerDependencies = createCollector();

  for (const packagePath of packagePaths) {
    const pkg = readJSON(packagePath);
    const packageName = pkg.name ?? packagePath;

    collectMissingFromGroup({
      pkg,
      packageName,
      groupName: "dependencies",
      trackedVersions: versions.dependencies ?? {},
      collector: missingDependencies,
    });

    collectMissingFromGroup({
      pkg,
      packageName,
      groupName: "devDependencies",
      trackedVersions: versions.dependencies ?? {},
      collector: missingDependencies,
    });

    collectMissingFromGroup({
      pkg,
      packageName,
      groupName: "peerDependencies",
      trackedVersions: versions.peerDependencies ?? {},
      collector: missingPeerDependencies,
    });
  }

  const rootPkg = readJSON(join(ROOT_DIR, "package.json"));
  collectMissingFromGroup({
    pkg: rootPkg,
    packageName: `${rootPkg.name ?? "root"} (root)`,
    groupName: "devDependencies",
    trackedVersions: versions.dependencies ?? {},
    collector: missingDependencies,
  });

  const dependencyResult = resolveCollectedVersions(missingDependencies);
  const peerDependencyResult = resolveCollectedVersions(missingPeerDependencies);

  const result = {
    dependencies: dependencyResult.resolved,
    peerDependencies: peerDependencyResult.resolved,
  };

  console.log(JSON.stringify(result, null, 2));

  const conflicts = [
    ...dependencyResult.conflicts.map((item) => ({
      ...item,
      groupName: "dependencies",
    })),
    ...peerDependencyResult.conflicts.map((item) => ({
      ...item,
      groupName: "peerDependencies",
    })),
  ];

  if (conflicts.length > 0) {
    console.log("\n⚠️ Found version conflicts:");

    for (const conflict of conflicts) {
      console.log(
        `- ${conflict.groupName}: ${conflict.packageName} -> ${conflict.versions.join(", ")} (chosen ${conflict.chosenVersion})`,
      );
    }
  }
}

main();
