import type { Metadata } from "next";
import { sourceUrl } from "@/data/site";

export const metadata: Metadata = {
  title: "Privacy",
  description: "How the Qognition site handles visitor data, posted sims, reviews and hosting.",
};

export default function Privacy() {
  return (
    <div className="q-page">
      <article className="q-card prose-page prose">
        <p className="q-kicker">Site notice, 6 November 2026</p>
        <h1>Privacy</h1>
        <h2>What the site does</h2>
        <p>
          This public site shows generated simulation recordings and documentation. Playback runs in your browser. The site has no user accounts, advertising,
          analytics SDK, camera access or location access. It does not intentionally set application cookies or save playback selections to local storage.
        </p>
        <h2>What you post in the Public Repo</h2>
        <p>
          The Public Repo is public. When you post a sim, its file is stored and shown to everyone, including the author name and description inside it. When you
          write a review, your rating, your text, the name you give and the date are stored and shown to everyone. Please leave out anything private. Names are
          optional.
        </p>
        <p>
          To limit abuse, the site keeps short-lived counts of how often an address has posted. These use a one-way hash of the address, are not shown anywhere,
          and expire within a day. Reviews and sims are not linked to your address.
        </p>
        <p>
          Posts are kept until they are removed. To ask for something to be taken down, open an issue on the <a href={sourceUrl}>project repository</a>. Don't put
          private details in the issue itself.
        </p>
        <h2>Hosting</h2>
        <p>
          Vercel serves the site and replay files. Hosting infrastructure may process request information such as IP address, browser information and requested
          URLs for service operation and security. See <a href="https://vercel.com/legal/privacy-policy">Vercel's privacy policy</a> for its practices. This notice
          does not promise that infrastructure logs are absent. Posted sims and reviews are held in a database run by Upstash, on the site's behalf.
        </p>
        <h2>External links</h2>
        <p>
          Source, reference and documentation links take you to other services, which apply their own privacy policies. Fonts are bundled with this site rather
          than loaded from a third-party font API.
        </p>
        <h2>Project contact</h2>
        <p>
          Use the contact or issue options available on the <a href={sourceUrl}>original research project</a>. Do not put private or sensitive information in a
          public issue.
        </p>
      </article>
    </div>
  );
}
