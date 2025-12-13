const {execSync} = require("child_process");
const projects = require("./scripts/projects");

const name = process.argv[2];

if (!name) {
  console.log("Usage -> node run <project-name>");
  console.log("Available projects ->");
  Object.keys(projects).forEach((p) => console.log("-", p));
  process.exit(1);
}

const project = projects[name];

if (!project) {
  console.log(`Unknown project -> ${name}`);
  console.log("Available projects ->");
  Object.keys(projects).forEach((p) => console.log("-", p));
  process.exit(1);
}

try {
  execSync("npm install", {
    cwd: project.path,
    stdio: "inherit",
  });

  execSync(`npm run ${project.script}`, {
    cwd: project.path,
    stdio: "inherit",
  });
} catch {
  console.log("Failed to run project");
}
