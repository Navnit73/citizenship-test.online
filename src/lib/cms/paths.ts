export type PublicPostType = "blog" | "guide" | "howto" | "legal" | "page";

export const POST_BASE_PATH: Record<PublicPostType, string> = {
  blog: "/blog",
  guide: "/guides",
  howto: "/how-to",
  legal: "/legal",
  page: "/p",
};

export const POST_LABEL: Record<PublicPostType, string> = {
  blog: "Blog",
  guide: "Guides",
  howto: "How-to",
  legal: "Legal",
  page: "Pages",
};

export const postPath = (type: PublicPostType, slug: string) => `${POST_BASE_PATH[type]}/${slug}`;
