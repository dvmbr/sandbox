const fs = require("fs");

function printUsage() {
  console.log("Usage -> node index.js <filePath>");
  console.log("Example -> node index.js samples/input.txt");
}

const filePath = process.argv[2];

if (!filePath) {
  printUsage();
  process.exit(1);
}

let text = "";
try {
  text = fs.readFileSync(filePath, "utf-8");
} catch (e) {
  console.log("Failed to read file ->", filePath);
  process.exit(1);
}

const lines = text.length === 0 ? 0 : text.split("\n").length;
const words = text.trim().length === 0 ? 0 : text.trim().split(/\s+/).length;

console.log("Lines:", lines);
console.log("Words:", words);
console.log("");
console.log("Uppercase: \n" + text.toUpperCase() + "\n");
