// Filename-only guard. Does not read or print secrets.
import {execFileSync} from "node:child_process";
import {readFileSync} from "node:fs";
const ignored=[
  /(^|\/)\.env(?:\.[^/]*)?$/i,
  /(^|\/)(?:[^/]*service-account[^/]*|[^/]*credentials[^/]*|dawson-kpi-platform[^/]*)\.json$/i,
  /(^|\/)[^/]+\.(?:pem|p8|key)$/i,
  /(^|\/)config\.bat$/i,
];
const tracked=execFileSync("git",["ls-files","-z"],{encoding:"utf8"}).split("\0").filter(Boolean);
const dangerous=tracked.filter(file=>file!==".env.example"&&ignored.some(pattern=>pattern.test(file)));
const ignore=readFileSync(".gitignore","utf8");
if(!ignore.split(/\r?\n/).includes(".env*")){
  console.error("FAIL: .gitignore must contain .env*; never commit local credentials.");
  process.exitCode=1;
}
if(dangerous.length){
  console.error("FAIL: potentially sensitive filenames are tracked by Git:");
  for(const file of dangerous)console.error(` - ${file}`);
  process.exitCode=1;
}
// Prevent a recurrence of hidden startup/build payloads.
if(tracked.includes("init")){
  console.error("FAIL: unexpected root init executable is tracked.");
  process.exitCode=1;
}
const pkg=JSON.parse(readFileSync("package.json","utf8"));
for(const name of ["dev","build","start"]){
  if(/\bnode\s+init\b/.test(pkg.scripts?.[name]??"")){
    console.error(`FAIL: ${name} executes an untrusted init script.`);
    process.exitCode=1;
  }
}
const postcss=readFileSync("postcss.config.mjs","utf8");
if(postcss.length>4096||/createRequire|fromCharCode|\beval\s*\(|\bFunction\s*\(/.test(postcss)){
  console.error("FAIL: PostCSS configuration contains unexpected executable content.");
  process.exitCode=1;
}
if(!process.exitCode)console.log("PASS: no tracked credential filenames or known unsafe startup payloads.");
