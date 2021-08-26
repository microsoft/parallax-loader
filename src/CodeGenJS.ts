import { ConvertConfigContent } from "./ConfigFileParser";
import { basicTypes, ConvertCustomTypes, isEnumType, RecordField, RecordStartTag, Type } from "./CustomTypeParser";
import * as fs from "fs"

const newLine = "\n"
const tab = '\t'
const tempVarPrefix = "_temp_var_name_you_would_never_use"
const sectionCacheVarName = tempVarPrefix + "SectionCache"
let tmpInx = 0 
function generateConfigCodeInternal(customType: Type, customTypes: Type[]) : string {
    let code = ""
    code = code + "function _generate" + customType.name + "(sections, inx, constraints) {" + newLine
    const sectionVal = tempVarPrefix + tmpInx++ 
    code = code + tab + `if (${sectionCacheVarName}[inx]) return ${sectionCacheVarName}[inx]` + newLine
    code = code + tab + "var " + sectionVal + " = sections[inx]" + newLine
    for (let inx = 0; inx < customType.fields.length; ++inx) {
        const field = customType.fields[inx]
        if (basicTypes.indexOf(field.type) >= 0 || isEnumType(field.type, customTypes)) {
            code = code + tab + "var " + field.name + "  = convertFieldValue(constraints, " + sectionVal + "[" + inx + "]) " + newLine
        }
        else if (field.type.startsWith(RecordStartTag)) {
            if (basicTypes.indexOf((field as RecordField).valueType) >= 0 || isEnumType((field as RecordField).valueType, customTypes)) {
                code = code + tab + "var " + field.name + " = convertFieldValue(constraints, " + sectionVal + "[" + inx + "])" + newLine
            }
            else {
                const recordVal = tempVarPrefix + tmpInx++
                code = code + tab + "var " + recordVal + " = convertFieldValue(constraints, " + sectionVal + "[" + inx + "])" + newLine
                code = code + tab + "var " + field.name + " = {}" + newLine
                const keyVar = tempVarPrefix + tmpInx++
                code = code + tab + "for (var " + keyVar + " in " + recordVal + ") {" + newLine
                code = code + tab + tab + field.name + "[" + keyVar + "] = _generate" + (field as RecordField).valueType + "(sections, " + recordVal + "[" + keyVar + "], constraints)" + newLine
                code = code + tab + "}" + newLine
            }
        }
        else if (field.type.endsWith("[]")) {
            const actualType = field.type.substr(0, field.type.length - 2)
            const arrVal = tempVarPrefix + tmpInx++
            code = code + tab + "var " + arrVal + "  = convertFieldValue(constraints, " + sectionVal + "[" + inx + "]) " + newLine
            code = code + tab + "var " + field.name + "  = []" + newLine
            code = code + tab + arrVal + ".forEach(ele => {" + newLine
            code = code + tab + tab + field.name + ".push(_generate" + actualType + "(sections, ele, constraints))" + newLine
            code = code + tab + "})" + newLine
        }
        else {
            const objVal = tempVarPrefix + tmpInx++
            code = code + tab + "var " + objVal + "  = convertFieldValue(constraints, " + sectionVal + "[" + inx + "])" + newLine
            code = code + tab + "var " + field.name + " = _generate" + field.type + "(sections, " + objVal + ", constraints)" + newLine
        }
    }

    code = code + tab + `return ${sectionCacheVarName}[inx] = {`
    for (let inx = 0; inx < customType.fields.length; ++inx) {
        code = code + customType.fields[inx].name + " : " + customType.fields[inx].name + ","
    }

    code = code + "}" + newLine
    code = code + "}" + newLine
    code = code + newLine
    return code
}

function generateConfigCode(customTypes: Type[]) : string {
    let code =  newLine
    code = code + "function isSubSet(cons1, cons2) {" + newLine
    code = code + tab + "var ret = true" + newLine
    code = code + tab + "cons1.forEach(con => {" + newLine
    code = code + tab + tab + "if (cons2.indexOf(con) < 0) {" + newLine
    code = code + tab + tab + tab + "ret = false" + newLine
    code = code + tab + tab + "}" + newLine
    code = code + tab + "})" + newLine
    code = code + tab + "return ret" + newLine
    code = code + "}" + newLine
    code = code + newLine
    code = code + "function convertFieldValue(constraints, field) {" + newLine
    code = code + tab + "for (var inx = 0; inx < field.length; ++inx) {" + newLine
    code = code + tab + tab + "if (isSubSet(field[inx].c, constraints)) {" + newLine
    code = code + tab + tab + tab + "return field[inx].v" + newLine
    code = code + tab + tab + "}" + newLine
    code = code + tab + "}" + newLine
    code = code + tab + "return 0" + newLine
    code = code + "}" + newLine
    code = code + newLine

    customTypes.forEach(type => {
        if (type.isEnum) {
            return
        }

        code = code + generateConfigCodeInternal(type, customTypes)
    })

    return code
}

function generateMainCode(customTypes: Type[], entryType: string) {
    let code = ""
    const mainFunc = "_generate" + entryType
    code = code + generateConfigCode(customTypes)
    code = code + newLine
    code = code + "function generateConfig(sections, cons)" + "{" + newLine
    code = code + tab + "return " + mainFunc + "(sections, 0, cons)" + newLine
    code = code + "}" + newLine
    code = code + newLine
    return code
}

export function generateJSCode(schemaPath: string, configPath: string) : string {
    const configContent = fs.readFileSync(configPath, 'utf-8')
    const schemaContent = fs.readFileSync(schemaPath, 'utf-8')
    return 'module.exports = ' + generateJSCodeInternal(configContent, schemaContent)
}

export function generateJSCodeInternal(configContent: string, schemaContent: string) : string {
    const customTypes = ConvertCustomTypes(schemaContent, "file.js")
    const parsedConfigObject = ConvertConfigContent(configContent, customTypes)
    let ret = ""
    ret = ret + "function (constraintList) {" + newLine
    const constrintFunc = 
`
function resolveConstraints(constraintList, constraintMap) {
    var constraintIds = []
    constraintList.forEach(exp => {
		let lowerExp = exp.toLowerCase()
        if (lowerExp in constraintMap) {
            constraintIds.push(constraintMap[lowerExp])
        }
    })

    return constraintIds
}
` + newLine
    ret = ret + constrintFunc + newLine
    ret = ret + "var configData = " +  JSON.stringify(parsedConfigObject.sections) + newLine
    const dict = {}
    parsedConfigObject.cons.forEach((value, key) => {
        dict[key] = value
    })

    ret = ret + "var constraintMap = " + JSON.stringify(dict) + newLine
    ret = ret + 'var constraints = resolveConstraints(constraintList, constraintMap)' + newLine
    ret = ret + `var ${sectionCacheVarName} = new Array(configData.length)` + newLine
    ret = ret + generateMainCode(customTypes, parsedConfigObject.entry)
    ret = ret + "var ret = generateConfig(configData, constraints)" + newLine
    ret = ret + `${sectionCacheVarName} = []` + newLine
    ret = ret + 'return ret' + newLine
    ret = ret + "}" + newLine
    return ret
}