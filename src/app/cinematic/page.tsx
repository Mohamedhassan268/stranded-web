import type { Metadata } from "next";
import CinematicStudy from "@/components/cinematic/CinematicStudy";
import "./cinematic.css";
export const metadata: Metadata = {
  title: "The story",
  description:
    "A 3D story: freefall, an island, and a quantum mind.",
};
export default function CinematicPage() {
  return <CinematicStudy />;
}
