const fs = require("fs");

const filePath = process.argv[2];

if (!filePath) {
  console.log("Usage -> node index.js <filePath>");
  process.exit(1);
}

let text = "";
try {
  text = fs.readFileSync(filePath, "utf-8");
} catch {
  console.log("Failed to read file");
  process.exit(1);
}

const slug = text
  .toLowerCase()
  .trim()
  .replace(/[^a-z0-9\s-]/g, "")
  .replace(/\s+/g, "-")
  .replace(/-+/g, "-");

console.log(slug);
