import manifest from "./run-manifest.json";
export { manifest };
export const sourceUrl = `${manifest.sourceRepository}/tree/${manifest.sourceCommit}`;
export const sourceFile = (path: string) =>
  `${manifest.sourceRepository}/blob/${manifest.sourceCommit}/${path}`;
export const policyName = (policy: string) =>
  policy === "quantum" ? "Quantum cognition" : "Classical mixture";
export const label = (text: string) => text.replaceAll("_", " ");
