export interface BlogPostMeta {
  slug: string;
  title: string;
  description: string;
  publishedAt: string;
  category: string;
  type: "auto" | "mdx";
}

export interface BlogPostFull extends BlogPostMeta {
  html: string;
}
