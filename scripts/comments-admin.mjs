#!/usr/bin/env node
/**
 * CLI tool to manage blog comments.
 *
 * Usage:
 *   node scripts/comments-admin.mjs list                # list all comments
 *   node scripts/comments-admin.mjs list <slug>         # list comments for a post
 *   node scripts/comments-admin.mjs delete <slug> <id>  # delete a comment
 *
 * Env vars (set them or create a .env.local):
 *   SITE_URL       — e.g. https://madridhome.tech (or http://localhost:3000)
 *   ADMIN_SECRET   — must match the ADMIN_SECRET in Vercel env vars
 */

const SITE = process.env.SITE_URL || "https://madridhome.tech";
const SECRET = process.env.ADMIN_SECRET;

async function listComments(slug) {
  const url = slug
    ? `${SITE}/api/comments?slug=${encodeURIComponent(slug)}`
    : null;

  if (!slug) {
    console.log("Usage: node scripts/comments-admin.mjs list [slug]");
    console.log("       Provide a slug to list comments for that post.");
    console.log("\nTo list ALL comments, use the KV store directly.");
    return;
  }

  const res = await fetch(url);
  if (!res.ok) {
    console.error(`Error ${res.status}: ${await res.text()}`);
    return;
  }

  const comments = await res.json();
  if (comments.length === 0) {
    console.log(`No comments for "${slug}".`);
    return;
  }

  console.log(`\n${comments.length} comment(s) for "${slug}":\n`);
  for (const c of comments) {
    const date = new Date(c.createdAt).toLocaleString("es-ES");
    console.log(`  ID:   ${c.id}`);
    console.log(`  Name: ${c.name}`);
    console.log(`  Date: ${date}`);
    console.log(`  Text: ${c.text.slice(0, 120)}${c.text.length > 120 ? "..." : ""}`);
    console.log();
  }
}

async function deleteComment(slug, id) {
  if (!SECRET) {
    console.error("Error: ADMIN_SECRET env var is required for deletion.");
    console.error("Set it: export ADMIN_SECRET=your-secret");
    process.exit(1);
  }

  const url = `${SITE}/api/comments?slug=${encodeURIComponent(slug)}&id=${encodeURIComponent(id)}`;
  const res = await fetch(url, {
    method: "DELETE",
    headers: { "x-admin-secret": SECRET },
  });

  if (res.ok) {
    console.log(`Deleted comment ${id} from "${slug}".`);
  } else {
    console.error(`Error ${res.status}: ${await res.text()}`);
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────

const [, , command, ...args] = process.argv;

switch (command) {
  case "list":
    await listComments(args[0]);
    break;
  case "delete":
    if (args.length < 2) {
      console.error("Usage: node scripts/comments-admin.mjs delete <slug> <comment-id>");
      process.exit(1);
    }
    await deleteComment(args[0], args[1]);
    break;
  default:
    console.log("Blog Comments Admin");
    console.log("====================");
    console.log();
    console.log("Commands:");
    console.log("  list <slug>              List comments for a post");
    console.log("  delete <slug> <id>       Delete a comment");
    console.log();
    console.log("Env vars:");
    console.log("  SITE_URL      Base URL (default: https://madridhome.tech)");
    console.log("  ADMIN_SECRET  Secret for delete operations");
}
