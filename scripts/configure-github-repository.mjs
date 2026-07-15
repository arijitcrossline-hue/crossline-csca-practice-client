import fs from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const packagePath = path.join(root, "package.json");
const slug = String(process.argv[2] || process.env.GITHUB_REPOSITORY || "").trim();

if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(slug)) {
  throw new Error("Pass the public GitHub repository as owner/repository, for example: npm run configure:github -- owner/crossline-csca-practice-client");
}

const [owner, repo] = slug.split("/");
const packageJson = JSON.parse(await fs.readFile(packagePath, "utf8"));
packageJson.repository = {
  type: "git",
  url: `https://github.com/${owner}/${repo}.git`
};
packageJson.build = packageJson.build || {};
packageJson.build.publish = [{
  provider: "github",
  owner,
  repo,
  releaseType: "release",
  vPrefixedTagName: false
}];
await fs.writeFile(packagePath, `${JSON.stringify(packageJson, null, 2)}\n`);
console.log(`Configured GitHub Releases for ${slug}.`);
