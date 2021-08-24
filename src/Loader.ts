import {generateJSCodeInternal} from "./CodeGenJS"
import * as fs from "fs"
const loaderUtils = require("loader-utils") // eslint-disable-line

module.exports = function(source: string) : string {
    const options = loaderUtils.getOptions(this);
    const schemaContent = fs.readFileSync(options.schema, 'utf-8')
   return 'module.exports = ' + generateJSCodeInternal(source, schemaContent)
}
