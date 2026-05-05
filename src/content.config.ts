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
    rank: z.number().optional(),
  }),
});

const cases = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/cases" }),
  schema: z.object({
    title: z.string(),
    age: z.string(),
    gender: z.string(),
    area: z.string(),
    image: z.string().optional(),
    order: z.number().optional(),
    draft: z.boolean().optional(),
  }),
});

export const collections = { column, cases };
