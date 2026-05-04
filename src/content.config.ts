import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const column = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/column" }),
  schema: z.object({
    title: z.string(),
    date: z.date(),
    thumbnail: z.string(),
    category: z.string(),
    description: z.string(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { column };
