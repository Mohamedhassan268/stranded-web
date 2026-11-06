import type { Metadata } from "next";
import CinematicStudy from "@/components/cinematic/CinematicStudy";
import "./cinematic.css";
export const metadata: Metadata = {
  title: "Stranded / Cinematic study 01",
  description:
    "A local 3D visual study: freefall, an island, and a quantum mind.",
  robots: { index: false, follow: false },
};
export default function CinematicPage() {
  return <CinematicStudy />;
}
