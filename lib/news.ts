import { readFile } from "fs/promises";
import { join } from "path";
import type { NewsItem } from "@/components/NewsSection";

/**
 * Read all news items from content/news.json, sorted newest-first.
 * Safe to call server-side only (uses fs).
 */
export async function getAllNews(): Promise<NewsItem[]> {
  try {
    const filePath = join(process.cwd(), "content", "news.json");
    const raw = await readFile(filePath, "utf-8");
    const items = JSON.parse(raw) as NewsItem[];
    return items.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  } catch {
    return [];
  }
}
