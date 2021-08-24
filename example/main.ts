import * as path from "path"
import { generateTSCode } from "../src/CodeGenTS"
import * as fs from "fs"

const content = generateTSCode(path.resolve("./example/Config.ts"), path.resolve("./example/main.ini"))
const genPath = path.resolve("./example/Config.ts").replace(".ts", "Gen.ts")
fs.writeFileSync(genPath, content, {encoding: "utf-8"})