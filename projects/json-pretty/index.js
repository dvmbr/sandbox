const fs = require("fs");

const filePath = process.argv[2];

if (!filePath) {
  console.log("Usage -> node index.js <jsonFile>");
  process.exit(1);
}

let raw = "";
try {
  raw = fs.readFileSync(filePath, "utf-8");
} catch {
  console.log("Failed to read file");
  process.exit(1);
}

try {
  const parsed = JSON.parse(raw);
  console.log(JSON.stringify(parsed, null, 2));
} catch {
  console.log("Invalid JSON");
}
