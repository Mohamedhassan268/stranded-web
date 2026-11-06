import type { Metadata } from "next";
import CinematicStudy from "@/components/cinematic/CinematicStudy";
import "./cinematic/cinematic.css";
export const metadata: Metadata = {
  title: { absolute: "Stranded — A quantum mind in an unknown world" },
  description: "Fall into an unknown island. Discover a quantum mind. Explore the Stranded survival simulation.",
};
export default function Home() { return <CinematicStudy />; }
