import type { Metadata } from "next";
import { sourceUrl } from "@/data/site";
export const metadata: Metadata = {
  title: "Privacy",
  description:
    "How the Stranded showcase handles visitor data, replay files and hosting.",
};
export default function Privacy() {
  return (
    <article className="section-wrap prose-page">
      <p className="eyebrow">SITE NOTICE / 6 NOVEMBER 2026</p>
      <h1>Privacy.</h1>
      <h2>What the site does</h2>
      <p>
        This public showcase displays generated simulation recordings. Playback
        runs in your browser. The site has no user accounts, forms, advertising,
        analytics SDK, camera access or location access. It does not
        intentionally set application cookies or save playback selections to
        local storage.
      </p>
      <h2>Hosting</h2>
      <p>
        Vercel serves the site and static replay files. Hosting infrastructure
        may process request information such as IP address, browser information
        and requested URLs for service operation and security. See{" "}
        <a href="https://vercel.com/legal/privacy-policy">
          Vercel’s privacy policy
        </a>{" "}
        for its practices. This notice does not promise that infrastructure logs
        are absent.
      </p>
      <h2>External links</h2>
      <p>
        Source, reference and documentation links take you to other services,
        which apply their own privacy policies. Fonts are bundled with this site
        rather than loaded from a third-party font API.
      </p>
      <h2>Project contact</h2>
      <p>
        Use the contact or issue options available on the{" "}
        <a href={sourceUrl}>original research project</a>. Do not put private or
        sensitive information in a public issue.
      </p>
    </article>
  );
}
