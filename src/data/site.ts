import manifest from "./run-manifest.json";
import docs from "./docs.json";
export { manifest };
export const siteName = "Qognition";
export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://stranded-qognition-268.vercel.app";
// The site's links follow the same simulator commit its documentation was copied from.
export const sourceUrl = `${docs.sourceRepository}/tree/${docs.sourceCommit}`;
// Recording provenance stays pinned to the commit the recordings were made at.
export const sourceFile = (path: string) => `${manifest.sourceRepository}/blob/${manifest.sourceCommit}/${path}`;
export const policyName = (policy: string) => (policy === "quantum" ? "Quantum cognition" : "Classical mixture");
export const label = (text: string) => text.replaceAll("_", " ");
