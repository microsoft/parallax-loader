import { EnumField, Field, FieldType, isEnumType, RecordField, Type } from "./CustomTypeParser"

// start region prdefined types
export type ConstraintField = ConfigLine[]

export interface ConfigLine {
    c: number[];
    v: number | boolean | string | number[] | boolean[] | string[] | Record<string, boolean> | Record<string, number> | Record<string, string> ;
}

export interface ConvertedConfigObject {
    cons: Map<string, number>;
    sections: ConstraintField[][];
    entry: string;
}

// end region predefined types

// start region config parser
const sectionPattern = new RegExp("^\\s*\\[([^\\[\\]]+)\\]\\s*$")
const commentPattern = new RegExp("^\\s*;.*$")
const keyValuePattern = new RegExp("^\\s*([^=]+)=(.*)$")

interface ParsedConfigObject {
    cons: Map<string, number>;
    sections: ParsedConfigSection[];
}

interface ParsedConfigValue {
    cons: Set<string>;
    value: string;
}

interface ParsedConfigField {
    key: string;
    values: ParsedConfigValue[];
}

export interface ParsedConfigSection {
    type: string;
    name: string;
    fields: ParsedConfigField[];
}

function parseConfigContent(content: string) : ParsedConfigObject {
    const lines = content.split(/[\r\n]/)
    const sections: ParsedConfigSection[] = []
    let fields : ParsedConfigField[] = []
    let sectionName : string|undefined = undefined
    let type: string | undefined = undefined
    const globalConstraints: Map<string, number> = new Map<string, number>();
    let constraintInx = 0
    lines.forEach(line => {
        const trimmedLine = line.trim()
        if (!trimmedLine) {
            return
        }

        let arr = sectionPattern.exec(trimmedLine)
        if (arr && arr.length > 0) {
            if (sectionName) {
                fields.sort((a, b) => {return a.key > b.key ? 1 : -1})
                sections.push({
                    name: sectionName,
                    fields: fields,
                    type: type
                })
            }

            sectionName = arr[1]
            type = undefined
            fields = []
            return
        }

        arr = commentPattern.exec(trimmedLine)
        if (arr && arr.length) {
            return
        }

        if (!sectionName) {
            throw ("no section defined before key values " + line)
        }

        arr = keyValuePattern.exec(trimmedLine)
        if (arr && arr.length) {
            const keyWithConstraint = arr[1].trim()
            const value = arr[2].trim()
            const splitList = keyWithConstraint.split('&')
            const key = splitList[0]
            if (key == "_type") {
                type = value
                return
            }

            const constraints = new Set<string>()
            for (let inx = 1; inx < splitList.length; ++inx) {
                const constraint = splitList[inx].toLowerCase()
                constraints.add(constraint)
                if (!globalConstraints.has(constraint)) {
                    globalConstraints.set(constraint, constraintInx++)
                }
            }

            const fieldsLength = fields.length
            let findField = false
            for (let inx = 0; inx < fieldsLength; ++inx) {
                const field = fields[inx]
                if (field.key == key) {
                    field.values.push({
                        value: value,
                        cons: constraints
                    })

                    findField = true
                    break
                }
            }

            if (!findField) {
                fields.push({
                    key: key,
                    values: [
                        {
                            value: value,
                            cons: constraints
                        }
                    ]
                })
            }

            return
        }

        throw ("Unsupported line " + line)
    })

    fields.sort((a, b) => {return a.key > b.key ? 1 : -1})
    sections.push({
        name: sectionName,
        fields: fields,
        type: type
    })

    return {cons: globalConstraints, sections: sections}
}

function validateSections(sections : ParsedConfigSection[], customTypes: Type[]) {
    sections.forEach(section => {
        // find _type
        const type = section.type
        if (!type) {
            throw ("no type defined in section " + section.name)
        }

        let findType = false
        let fields: Field[] = []
        customTypes.forEach(customType => {
            if (customType.name == type) {
                findType = true
                fields = customType.fields
            }
        })

        if (!findType) {
            throw ("type " + type + " is not defined in section " + section.name)
        }

        if (section.fields.length != fields.length) {
            throw ("field count not the same for section " + section.name)
        }

        for (let inx = 0; inx < fields.length; ++inx) {
            if (section.fields[inx].key != fields[inx].name) {
                throw ("field key does not match for section " + section.name + " key1 " + section.fields[inx].key + " key2 " + fields[inx].name)
            }

            if (section.fields[inx].values.length <= 0) {
                throw ("empty filed for for section " + section.name + " key " + section.fields[inx].key)
            }

            if (section.fields[inx].values[section.fields[inx].values.length - 1].cons.size > 0) {
                throw ("no default value for section " + section.name + " key " + section.fields[inx].key)
            }
        }
    })
}
// end region config parser

// start region config convert
function getSectionDefintion(type : string, customTypes: Type[]) : Field[] {
    let fields : Field[] = []
    customTypes.forEach(typeDef => {
        if (typeDef.name == type) {
            fields = typeDef.fields
        }
    })

    return fields
}

function parseRecord(strValue: string, nativeField: Field, customTypes: Type[], sectionMap: Map<string, number>) {
    const ret = {}
    const field = nativeField as RecordField
    const pairs = strValue.split(',')
    const isEnum = isEnumType(field.valueType, customTypes)
    pairs.forEach(pair => {
        const kv = pair.split(':')
        if (kv.length != 2) {
            throw ('Expect record type to have key and value')
        }

        const key = kv[0].trim()
        const value = kv[1].trim()
        if (!key) {
            throw ('Empty or whitespace key found in Record')
        }

        if (isEnum) {
            const enumValue = tryParseEnum(field.valueType, value, customTypes)
            if (enumValue < 0) {
                throw ('Undefined enum value ' + value + ' for ' + field.valueType)
            }

            ret[key] = enumValue
        }
        else if (field.valueType == 'string') {
            ret[key] = value
        }
        else if (field.valueType == 'number') {
            const num = parseFloat(value)
            if (isNaN(num)) {
                throw ("NaN number found in " + value + " " + field.name)
            }

            ret[key] = num
        }
        else if (field.valueType == 'boolean') {
            ret[key] = (value == 'true')
        }
        else {
            if (sectionMap.has(value)) {
                ret[key] = sectionMap.get(value)
            }
            else{
                throw ('Undefined section in Record ' + value)
            }
        }
    })

    return ret
}

function splitAndTrimList(strValue: string) : string[] {
    strValue = strValue.trim()
    if (strValue.length == 0) {
        return []
    }

    const list = strValue.split(',')
    list.forEach((val, index, arr) => {
        arr[index] = arr[index].trim()
    })

    return list
}

function parseValue(strValue : string, customTypes: Type[], type: string,  sectionMap: Map<string, number>, sections: ParsedConfigSection[]) : boolean | number | string | boolean[] | number[] | string[] | Record<string, boolean> | Record<string, number> | Record<string, string> {
    const enumValue = tryParseEnum(type, strValue, customTypes)
    if (enumValue >= 0) {
        return enumValue
    }

    if (type == 'boolean') {
        return strValue == 'true'
    }
    else if (type == 'number') {
        const ret = parseFloat(strValue)
        if (isNaN(ret)) {
            throw ("NaN number found in " + strValue + " " + type)
        }

        return ret
    }
    else if (type == 'string') {
        return strValue
    }
    else if (type == 'boolean[]') {
        const list = splitAndTrimList(strValue)
        const ret = []
        list.forEach(ele => {
            ret.push(parseValue(ele, customTypes, 'boolean', sectionMap, sections))
        })

        return ret
    }
    else if (type == 'number[]') {
        const list = splitAndTrimList(strValue)
        const ret = []
        list.forEach(ele => {
            ret.push(parseValue(ele, customTypes, 'number', sectionMap, sections))
        })

        return ret
    }
    else if (type == 'string[]') {
        return  splitAndTrimList(strValue)
    }
    else if (type.endsWith('[]')) {
        const list = splitAndTrimList(strValue)    
        const ret = []
        list.forEach(ele => {
            ret.push(parseValue(ele, customTypes, type.substr(0, type.length - 2), sectionMap, sections))
        })

        return ret
    }
    else {
        // custom sections here
        if (sectionMap.has(strValue)) {
            const sectionInx = sectionMap.get(strValue)
            const section = sections[sectionInx]
            if (section.type == type) {
                return sectionInx
            }
        }

        throw ("undefined section ref " + strValue + " for type " + type)
    }
}

function tryParseEnum(type: string, value: string, customTypes: Type[]) : number {
    let ret = -1
    customTypes.forEach((customType) => {
        if (customType.name == type && customType.isEnum) {
            let foundMatch = false
            customType.fields.forEach(field => {
                if (field.name == value) {
                    ret = parseFloat((field as EnumField).value)
                    foundMatch = true
                }
            })

            if (!foundMatch) {
                throw ("Unknown enum value: " + value + " for type " + type)
            }
        }
    })

    return ret
}

function convertConfigObject(customTypes: Type[], sections : ParsedConfigSection[], constraintMap: Map<string, number>) : ConstraintField[][] {
    const convertedSections: ConstraintField[][] = []
    const sectionMap: Map<string, number> = new Map<string, number>();
    for (let inx = 0; inx < sections.length; ++inx) {
        sectionMap.set(sections[inx].name, inx)
    }

    for (let inx = 0; inx < sections.length; ++inx) {
        const convertedFields: ConstraintField[] = []
        const fields = sections[inx].fields
        const definedFields = getSectionDefintion(sections[inx].type, customTypes)
        for (let jnx = 0; jnx < fields.length; ++jnx) {
            const type = definedFields[jnx].type;
            const field = fields[jnx]
            const lines: ConfigLine[] = []
            field.values.forEach(val => {
                const cons: number[] = []
                val.cons.forEach(con => {
                    if (constraintMap.has(con)) {
                        cons.push(constraintMap.get(con))
                    }
                })

                if (definedFields[jnx].filedType == FieldType.Record) {
                    const line: ConfigLine = {
                        c: cons,
                        v: parseRecord(val.value, definedFields[jnx], customTypes, sectionMap)
                    }

                    lines.push(line)

                }
                else {
                    const line: ConfigLine = {
                        c: cons,
                        v: parseValue(val.value, customTypes, type, sectionMap, sections)
                    }

                    lines.push(line)
                }
            })

            convertedFields.push(lines)
        }

        convertedSections.push(convertedFields)
    }

    return convertedSections
}
// end region config convert

// start region overall interface
export function ConvertConfigContent(content: string, types: Type[]) : ConvertedConfigObject {
    const parsedConfigOjbject = parseConfigContent(content)
    validateSections(parsedConfigOjbject.sections, types)
    const convrtedObject = convertConfigObject(types, parsedConfigOjbject.sections, parsedConfigOjbject.cons)
    return {sections: convrtedObject, cons: parsedConfigOjbject.cons, entry: parsedConfigOjbject.sections[0].type}
}
// end region overall interface