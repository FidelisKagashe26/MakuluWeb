import fs from "node:fs";
import path from "node:path";

const siteUrl = process.env.VITE_SITE_URL || "https://dodomamakulusda.org";
const routes = [
  "/",
  "/idara",
  "/viongozi",
  "/vikundi",
  "/matukio",
  "/media",
  "/admin/login"
];

const now = new Date().toISOString();
const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes
  .map(
    (route) => `  <url>
    <loc>${siteUrl}${route}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${route === "/" ? "1.0" : "0.8"}</priority>
  </url>`
  )
  .join("\n")}
</urlset>
`;

const outDir = path.resolve(process.cwd(), "public");
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, "sitemap.xml"), xml, "utf-8");

// eslint-disable-next-line no-console
console.log("sitemap.xml generated");
