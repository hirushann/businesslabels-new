export type TechnologyCard = {
  title: string;
  image: string;
  width: number;
  height: number;
};

export type MaterialCatalogItem = {
  slug: string;
  code: string;
  subtitle: string;
  image: string;
  listingImage: string;
  traits: string[];
  description: string;
  specifications: Array<{ label: string; value: string }>;
};

export type MaterialReview = {
  name: string;
  time: string;
  text: string;
};

export const technologyCards: TechnologyCard[] = [
  {
    title: "Inkjet",
    image: "https://placehold.co/352x320?text=Inkjet",
    width: 352,
    height: 320,
  },
  {
    title: "Thermal Transfer",
    image: "https://placehold.co/424x320?text=Thermal+Transfer",
    width: 424,
    height: 320,
  },
  {
    title: "Thermal Direct",
    image: "https://placehold.co/290x320?text=Thermal+Direct",
    width: 290,
    height: 320,
  },
];

const dia400Description =
  "Glossy paper with a very high-quality inkjet coating for razor-sharp full-color prints. The DIA400 from Diamondlabels is premium inkjet paper when it comes to fast drying and outstanding print quality in terms of resolution. Despite its strong gloss level, the inkjet coating is open enough to absorb ink quickly, minimizing ink bleeding to an absolute minimum. This results in prints with high color yield and brightness without sacrificing sharpness. The DIA400 features a permanent adhesive that is suitable for direct food contact and adheres well to many surfaces. Labels can be applied at temperatures as low as 0 degrees Celsius.";

const sharedSpecs = [
  { label: "Materia", value: "Paper" },
  { label: "Finish", value: "Glossy" },
  { label: "Coating", value: "Inkjet" },
  { label: "Adhesive", value: "Permanent acrylic" },
  { label: "Grammage", value: "85 +/- 4 g/m2" },
  { label: "Thickness", value: "101 +/- 5 um" },
  { label: "Opacity", value: "88 +/- 3%" },
  { label: "Gloss (60deg)", value: "45 +/- 5%" },
];

export const materialCatalog: MaterialCatalogItem[] = [
  {
    slug: "dia010",
    code: "DIA010",
    subtitle: "Glossy paper for inkjet labels",
    image: "https://placehold.co/732x509?text=DIA010",
    listingImage: "https://placehold.co/768x440?text=DIA010",
    traits: ["Paper", "Glossy", "Permanent adhesive"],
    description:
      "A glossy inkjet paper label stock designed for clean color output, fast drying, and reliable application across common packaging and product-labeling surfaces.",
    specifications: sharedSpecs,
  },
  {
    slug: "dia400",
    code: "DIA400",
    subtitle: "Premium glossy paper for inkjet",
    image: "https://placehold.co/732x509?text=DIA400",
    listingImage: "https://placehold.co/768x440?text=DIA400",
    traits: ["Paper", "Glossy", "Permanent adhesive"],
    description: dia400Description,
    specifications: sharedSpecs,
  },
  {
    slug: "dia704h",
    code: "DIA704H",
    subtitle: "High-gloss inkjet paper for durable labels",
    image: "https://placehold.co/732x509?text=DIA704H",
    listingImage: "https://placehold.co/768x440?text=DIA704H",
    traits: ["Paper", "Glossy", "Permanent adhesive"],
    description:
      "A high-gloss inkjet label material selected for crisp print definition, bright color reproduction, and dependable permanent adhesion in professional labeling workflows.",
    specifications: sharedSpecs,
  },
];

export const materialCards: MaterialCatalogItem[] = Array.from({ length: 15 }, (_, index) => {
  const material = materialCatalog[index % materialCatalog.length];
  return material;
});

export const materialReviews: MaterialReview[] = [
  {
    name: "David Tui",
    time: "1 day ago",
    text: "Reliable materials and fast support. The label quality has been consistent across every order.",
  },
  {
    name: "Sarah Mitchell",
    time: "21 days ago",
    text: "The team helped us compare media options and choose a stock that runs cleanly on our printer.",
  },
  {
    name: "Priya Sharma",
    time: "2 months ago",
    text: "Great print results and clear guidance on matching adhesive, finish, and printer type.",
  },
  {
    name: "Ethan Cooper",
    time: "6 months ago",
    text: "Good availability, quick delivery, and materials that hold up well in daily production.",
  },
];

export function getMaterialBySlug(slug: string): MaterialCatalogItem | null {
  return materialCatalog.find((material) => material.slug === slug) ?? null;
}
