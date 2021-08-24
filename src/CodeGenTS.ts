import * as fs from "fs"
import { ConstraintField, ConvertConfigContent } from "./ConfigFileParser";
import { basicTypes, ConvertCustomTypes, isEnumType, RecordStartTag, RecordField, Type } from "./CustomTypeParser";

const newLine = "\n"
const tab = "\t"
const tempVarPrefix = "_temp_var_name_you_would_never_use"
const configSectionVarName = tempVarPrefix + "ConfigSections"
const constraintMapVarName = tempVarPrefix + "ConstraintMap"
const sectionCacheVarName = tempVarPrefix + "SectionCache"
let tmpInx = 0 
function generateConfigObjectCode(sections: ConstraintField[][]) : string {
    const sectionsStr = JSON.stringify(sections, null, 4)
    let code = ""
    code = code + `let ${configSectionVarName} : ConstraintField[][] = ` + sectionsStr + newLine + newLine
    return code
}

function generateConstraintMapCode(constraintMap: Map<string, number>) : string {
    let code = `let ${constraintMapVarName}: Record<string, number> = {`
    constraintMap.forEach((value, key) => {
        code = code + JSON.stringify(key) + " : " + value + ","
    })

    code = code + "}" + newLine + newLine
    code = code + "function getConstraintValues(constraints: string[], constraintMap: Record<string, number>): number[] {" + newLine
    code = code + tab + "let ret : number[] = []" + newLine
    code = code + tab + "constraints.forEach(constraint => {" + newLine
    code = code + tab + tab + "if (constraint in constraintMap) {" + newLine
    code = code + tab + tab + tab + "ret.push(constraintMap[constraint])" + newLine
    code = code + tab + tab + "}" + newLine
    code = code + tab + "})" + newLine
    code = code + tab + "return ret" + newLine
    code = code + "}" + newLine + newLine
    return code
}

function generateConfigCodeInternal(customType: Type, customTypes: Type[]) : string {
    let code = ""
    code = code + "function generate" + customType.name + "(sections: ConstraintField[][], inx: number, constraints: number[]) : " + customType.name + "{" + newLine
    const sectionVal = tempVarPrefix + tmpInx++ 
    code = code + tab + `if (${sectionCacheVarName}[inx]) return ${sectionCacheVarName}[inx]` + newLine
    code = code + tab + "let " + sectionVal + " : ConstraintField[] = sections[inx]" + newLine
    for (let inx = 0; inx < customType.fields.length; ++inx) {
        const field = customType.fields[inx]
        if (basicTypes.indexOf(field.type) >= 0 || isEnumType(field.type, customTypes)) {
            code = code + tab + "let " + field.name + " : " + field.type + " = convertFieldValue(constraints, " + sectionVal + "[" + inx + "]) as " + field.type + newLine
        }
        else if (field.type.startsWith(RecordStartTag)) {
            if (basicTypes.indexOf((field as RecordField).valueType) >= 0 || isEnumType((field as RecordField).valueType, customTypes)) {
                code = code + tab + "let " + field.name + " : " + field.type + " = convertFieldValue(constraints, " + sectionVal + "[" + inx + "]) as " + field.type + newLine
            }
            else {
                const recordVal = tempVarPrefix + tmpInx++
                code = code + tab + "let " + recordVal + " : Record<string, number> = convertFieldValue(constraints, " + sectionVal + "[" + inx + "]) as Record<string, number>" + newLine
                code = code + tab + "let " + field.name + " : " + field.type + " = {}" + newLine
                const keyVar = tempVarPrefix + tmpInx++
                code = code + tab + "for (var " + keyVar + " in " + recordVal + ") {" + newLine
                code = code + tab + tab + field.name + "[" + keyVar + "] = generate" + (field as RecordField).valueType + "(sections, " + recordVal + "[" + keyVar + "], constraints)" + newLine
                code = code + tab + "}" + newLine
            }
        }
        else if (field.type.endsWith("[]")) {
            const actualType = field.type.substr(0, field.type.length - 2)
            const arrVal = tempVarPrefix + tmpInx++
            code = code + tab + "let " + arrVal + " : number[]" +  " = convertFieldValue(constraints, " + sectionVal + "[" + inx + "]) as number[]" + newLine
            code = code + tab + "let " + field.name + " : " + field.type + " = []" + newLine
            code = code + tab + arrVal + ".forEach(ele => {" + newLine
            code = code + tab + tab + field.name + ".push(generate" + actualType + "(sections, ele, constraints))" + newLine
            code = code + tab + "})" + newLine
        }
        else {
            const objVal = tempVarPrefix + tmpInx++
            code = code + tab + "let " + objVal + " : number" +  " = convertFieldValue(constraints, " + sectionVal + "[" + inx + "]) as number" + newLine
            code = code + tab + "let " + field.name + " : " + field.type + " = generate" + field.type + "(sections, " + objVal + ", constraints)" + newLine
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

function generateConfigCode(customTypes: Type[], moduleName: string) : string {
    let code = ''
    customTypes.forEach(customType => {
        code = code + 'import {' + customType.name + '} from "./' + moduleName + '"' + newLine
    })

    code = code + newLine
    code = code + "function isSubSet(cons1: number[], cons2: number[]) {" + newLine
    code = code + tab + "let ret = true" + newLine
    code = code + tab + "cons1.forEach(con => {" + newLine
    code = code + tab + tab + "if (cons2.indexOf(con) < 0) {" + newLine
    code = code + tab + tab + tab + "ret = false" + newLine
    code = code + tab + tab + "}" + newLine
    code = code + tab + "})" + newLine
    code = code + tab + "return ret" + newLine
    code = code + "}" + newLine
    code = code + newLine
    code = code + "function convertFieldValue(constraints: number[], field: ConstraintField) : number | boolean | string | number[] | boolean[] | string[] | Record<string, boolean> | Record<string, number> | Record<string, string> {" + newLine
    code = code + tab + "for (let inx = 0; inx < field.length; ++inx) {" + newLine
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

export function generateMainCode(customTypes: Type[], entryType: string, moduleName: string) : string {
    let code = ""
    const mainFunc = "generate" + entryType
    code = code + generateConfigCode(customTypes, moduleName)
    code = code + newLine
    code = code + "export function generateConfig(constraints: string[]) : " + entryType + "{" + newLine
    code = code + tab + `${sectionCacheVarName} = new Array(${configSectionVarName}.length)` + newLine
    code = code + tab + `let cons = getConstraintValues(constraints, ${constraintMapVarName})` + newLine
    code = code + tab + "let ret = " + mainFunc + `(${configSectionVarName}, 0, cons)` + newLine
    code = code + tab + `${sectionCacheVarName} = []` + newLine
    code = code + tab + 'return ret' + newLine
    code = code + "}" + newLine
    code = code + newLine
    return code
}

export function generateTSCode(schemaPath: string, iniPath: string) : string {
    const schemaContent = fs.readFileSync(schemaPath, {encoding: "utf-8"})
    const module = schemaPath.replace(".ts", "")
    const configContent = fs.readFileSync(iniPath, {encoding: "utf-8"})
    return generateTSCodeInternal(schemaContent, module, configContent)
}

export function generateTSCodeInternal(schemaContent: string, module: string, configContent: string) : string {
    const customTypes = ConvertCustomTypes(schemaContent, "file.js")
    const parsedConfigObject = ConvertConfigContent(configContent, customTypes)
    let sepInx = -1
    sepInx = module.lastIndexOf('\\')
    if (sepInx < 0) {
        sepInx = module.lastIndexOf('/')
    }

    const declareCode = 
`
// The file is auto-generated, please don't modify it.

type ConstraintField = ConfigLine[]

interface ConfigLine {
    c: number[];
    v: number | boolean | string | number[] | boolean[] | string[] | number | boolean | string | number[] | boolean[] | string[] | Record<string, boolean> | Record<string, number> | Record<string, string>;
}

`

    const sectionCacheCode = `let ${sectionCacheVarName} : Array<any> = []` + newLine + newLine
    return declareCode + sectionCacheCode + generateConstraintMapCode(parsedConfigObject.cons) + generateConfigObjectCode(parsedConfigObject.sections) + generateMainCode(customTypes,  parsedConfigObject.entry, module.substring(sepInx + 1))
}
