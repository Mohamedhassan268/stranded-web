// The Team page reads this list. To add someone, fill in their entry and commit.
//
//   name    shown as the card's title; leave "" until you have it
//   role    what they do on the project
//   badge   the label at the top of the card
//   tone    the badge colour: green, orange, blue, red or purple
//   bio     a sentence or two; leave "" if you'd rather not
//   photo   a file in public/team/, such as "/team/sam.jpg"; leave "" to show initials
//   links   any of github, linkedin, website, email
//
// Add or remove entries freely: the page lays itself out to fit.
export type TeamMember = {
  name: string;
  role: string;
  badge: string;
  tone: "green" | "orange" | "blue" | "red" | "purple";
  bio: string;
  photo: string;
  links: { github?: string; linkedin?: string; website?: string; email?: string };
};

export const team: TeamMember[] = [
  { name: "", role: "Quantum mind", badge: "TECH A", tone: "purple", bio: "", photo: "", links: {} },
  { name: "", role: "Physics and disaster data", badge: "TECH B", tone: "orange", bio: "", photo: "", links: {} },
  { name: "", role: "Engine, world and GUI", badge: "TECH C", tone: "green", bio: "", photo: "", links: {} },
  { name: "", role: "Website and replay", badge: "PRODUCT D", tone: "blue", bio: "", photo: "", links: {} },
];
