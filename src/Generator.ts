import * as path from "path"
import * as process from "process"
import { generateTSCode } from "./CodeGenTS"
import * as fs from "fs"
import { generateJSCode } from "./CodeGenJS"

const args = process.argv.slice(2)
if (args.length < 2) {
    throw "not schema and ini file sepcified"
}


const enableJS : boolean = (args[2] == '--js')
let content = ""
let genPath = ""
const schemaPath = path.resolve(args[0])
const configPath = path.resolve(args[1])
if (enableJS) {
    content = generateJSCode(schemaPath, configPath)
    genPath = schemaPath.replace(".ts", "Gen.js")
}
else{
    content = generateTSCode(schemaPath, configPath)
    genPath = schemaPath.replace(".ts", "Gen.ts")
}

fs.writeFileSync(genPath, content, {encoding: "utf-8"})
