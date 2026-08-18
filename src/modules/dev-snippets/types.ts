export type DevSnippetKind = "snippet" | "note";

export type DevSnippetCategory = {
  id: string;
  name: string;
  createdAt: string;
};

export type DevSnippet = {
  id: string;
  title: string;
  kind: DevSnippetKind;
  language: string | null;
  content: string;
  tags: string[];
  categoryId: string | null;
  categoryName: string | null;
  referenceUrl: string | null;
  imageUrl: string | null;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
};

export type DevSnippetInput = {
  title: string;
  kind: DevSnippetKind;
  language?: string | null;
  content: string;
  tags?: string[];
  categoryId?: string | null;
  referenceUrl?: string | null;
  imageUrl?: string | null;
  isPinned?: boolean;
};

/** Starter folders the user can create in one tap. */
export const SUGGESTED_SNIPPET_FOLDERS = [
  "Personnel",
  "Professionnel",
  "Formation",
  "Veille",
] as const;

export type WebSearchProvider =
  | "google"
  | "mdn"
  | "stackoverflow"
  | "devdocs"
  | "npm"
  | "github";

export const WEB_SEARCH_PROVIDERS: Array<{
  id: WebSearchProvider;
  label: string;
  description: string;
}> = [
  { id: "google", label: "Google", description: "Recherche générale" },
  { id: "mdn", label: "MDN", description: "Documentation web" },
  { id: "stackoverflow", label: "Stack Overflow", description: "Questions dev" },
  { id: "devdocs", label: "DevDocs", description: "Doc multi-langages" },
  { id: "npm", label: "npm", description: "Packages JavaScript" },
  { id: "github", label: "GitHub", description: "Code open source" },
];
