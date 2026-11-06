// The Team page reads these lists. To change it, edit an entry and commit.
//
//   name        shown as the card's title
//   university  where they study
//   study       what they study; leave "" if not known
//   country     where they're based
//   photo       a file in public/team/, such as "/team/sam.jpg"; leave "" to show initials
//   links       any of github, linkedin, website, email
//
// Photos are shown at 4:5, so crop them to that shape first.
// Add or remove entries freely: the page lays itself out to fit.
export type TeamMember = {
  name: string;
  university: string;
  study: string;
  country: string;
  photo: string;
  links: { github?: string; linkedin?: string; website?: string; email?: string };
};

export const team: TeamMember[] = [
  {
    name: "Muammal A. Fadhil",
    university: "Nahrain University",
    study: "AI and Robotics",
    country: "Iraq",
    photo: "/team/muammal-fadhil.jpg",
    links: {},
  },
  {
    name: "Bernard Kim",
    university: "University of Waterloo",
    study: "Computer Science",
    country: "Canada",
    photo: "/team/bernard-kim.jpg",
    links: {},
  },
  {
    name: "Mohammed Hassan",
    university: "Misr University for Science and Technology",
    study: "",
    country: "Egypt",
    photo: "/team/mohammed-hassan.jpg",
    links: {},
  },
  {
    name: "Brodin Vance",
    university: "University of Waterloo",
    study: "Honours Mathematics",
    country: "Canada",
    photo: "",
    links: {},
  },
];

export const credits = [
  { work: "Research paper", people: "Mohammed Hassan and Bernard Kim" },
  { work: "Quantum tech", people: "Muammal A. Fadhil and Brodin Vance" },
];
