import express from "express";
import { z } from "zod";

const app = express();
const PORT = process.env.PORT || 3000;

const views = new Map();

const querySchema = z.object({
  username: z.string().trim().min(1),
  color: z.string().trim().min(1).default("blue"),
  style: z
    .enum([
      "flat",
      "flat-square",
      "plastic",
      "for-the-badge",
      "social",
    ])
    .default("for-the-badge"),
});

app.get("/", async (req, res) => {
  const result = querySchema.safeParse(req.query);

  if (!result.success) {
    return res.status(400).json({
      error: "Invalid query parameters",
      issues: result.error.issues,
    });
  }

  const { username, color, style } = result.data;

  const count = (views.get(username) ?? 0) + 1;
  views.set(username, count);

  try {
    const badgeUrl = new URL(
      `https://img.shields.io/badge/${encodeURIComponent(
        "Profile Views"
      )}-${encodeURIComponent(count)}-${encodeURIComponent(color)}`
    );

    badgeUrl.searchParams.set("style", style);

    const response = await fetch(badgeUrl);

    if (!response.ok) {
      return res.status(500).send("Failed to generate badge");
    }

    const svg = await response.text();

    res.setHeader("Content-Type", "image/svg+xml");
    res.setHeader("Cache-Control", "no-store");
    res.send(svg);
  } catch {
    res.status(500).send("Internal Server Error");
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});