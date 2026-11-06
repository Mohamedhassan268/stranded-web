import type { Metadata } from "next";
import { RepoBrowser } from "@/components/repo/RepoBrowser";
import { canPost, listSims } from "@/lib/repo";

export const metadata: Metadata = {
  title: "Public Repo",
  description: "Scenarios people have built in Qognition. Download a .qsim file, run it, and review it, or post your own.",
};

// Posts and reviews change all the time, so this page is built for each visit.
export const dynamic = "force-dynamic";

export default async function Repo() {
  const { sims, storeOk } = await listSims();
  return (
    <div className="q-page">
      <RepoBrowser sims={sims} canPost={canPost() && storeOk} storeOk={storeOk} />
    </div>
  );
}
