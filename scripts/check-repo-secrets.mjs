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
if(!process.exitCode)console.log("PASS: environment and credential filenames are not tracked.");
