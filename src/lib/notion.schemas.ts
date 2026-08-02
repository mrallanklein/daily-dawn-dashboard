import { z } from "zod";

export const syncTargetSchema = z.enum(["projects", "tasks", "milestones"]);

export const notionSyncInputSchema = z.object({
  workspace: z.string().min(1).max(64),
  databaseId: z.string().min(1).max(128),
  target: syncTargetSchema,
});

export const notionRunsInputSchema = z.object({
  workspace: z.string().min(1).max(64),
});

export type NotionSyncInput = z.infer<typeof notionSyncInputSchema>;
