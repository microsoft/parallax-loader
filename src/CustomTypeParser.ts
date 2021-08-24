import * as ts from "typescript"

export enum FieldType {
    Normal = 0,
    Enum = 1,
    Record = 2
}

export interface Field {
    name: string;
    type: string;
    filedType: FieldType;
}

export interface EnumField  extends Field {
    value: string;
}

export interface RecordField extends Field{
    keyType: string;
    valueType: string;
}

export interface Type {
    name: string;
    fields: Field[];
    isEnum?: boolean;
}


function createCleanGraph(length: number) : boolean[][] {
    const graph: boolean[][] = []
    for (let inx = 0; inx < length; ++inx) {
        const arr : boolean[] = []
        for (let jnx = 0; jnx < length; ++jnx) {
            arr.push(false)
        }

        graph.push(arr)
    }

    return  graph
}

function DFS(typeInx: number, customTypes: Type[], cleanGraph: boolean[][], typeMap: Map<string, number>) {
    const customType = customTypes[typeInx]
    customType.fields.forEach(field => {
        let type = field.type
        if (type.endsWith("[]")) {
            type = type.substr(0, type.length - 2)
        }

        if (typeMap.has(type)) {
            const innerTypeInx = typeMap.get(type)
            if (cleanGraph[typeInx][innerTypeInx]) {
                throw ("circula reference for " + customType.name + " in field " +  field.name)
            }
            
            cleanGraph[typeInx][innerTypeInx] = true
            DFS(innerTypeInx, customTypes, cleanGraph, typeMap)
        }
    })
}

function circularRefDetection(customTypes: Type[]) {
    const typeMap: Map<string, number> = new Map<string, number>();
    let typeInx = 0
    customTypes.forEach(customType => {
        typeMap.set(customType.name, typeInx++)
    })

    for (let inx = 0; inx < typeInx; ++inx) {
        const cleanGraph = createCleanGraph(typeInx)
        DFS(inx, customTypes, cleanGraph, typeMap)
    }
}

function getSupportedTypes(types) : string {
    let str = ""
    types.forEach(type => {
        str = str + type + ' '
    })

    return str
}

export const RecordStartTag = "Record<"
export function isEnumType(type: string, customTypes:Type[]) : boolean {
    let ret = false
    customTypes.forEach(customType => {
        if (type == customType.name && customType.isEnum) {
            ret = true
        } 
    })

    return ret
}

export const basicTypes = ["boolean", "number", "string", "boolean[]", "number[]", "string[]"]
function validateSchema(customTypes : Type[], startClass: string) {
    const knownClass = new Set()
    const classStack = []
    classStack.push(startClass)
    while(classStack.length > 0) {
        const curClass = classStack.pop()
        if (knownClass.has(curClass)) {
            continue
        }

        knownClass.add(curClass)
        let fields: Field[] = []
        customTypes.forEach(type => {
            if (type.name == curClass) {
                fields = type.fields
            }
        })

        const nestedTypes = new Set()
        fields.forEach(field => {
            if (basicTypes.indexOf(field.type) < 0) {
                if (field.type.endsWith('[]')) {
                    const trimmedType = field.type.substr(0, field.type.length - 2)
                    nestedTypes.add(trimmedType)
                }
                else {
                    nestedTypes.add(field.type)
                }
            }
        })

        nestedTypes.forEach(nestedType => {
            classStack.push(nestedType)
        })
    }
}

function isNonNegativeInteger(text: string) : boolean {
    const num = parseFloat(text)
    if (isNaN(num)) {
        return false
    }

    return num == Math.floor(num) && num >= 0
}

function parseSchema(content: string, fileName: string) : Type[] {
    const sc = ts.createSourceFile(fileName, content, ts.ScriptTarget.ES2015)
    const customTypes: Type[] = []
    const supportedTypes = [].concat(basicTypes)
    sc.statements.forEach(statement => {
        const statementAny = statement as any;
        const name = statementAny.name.escapedText;
        supportedTypes.push(name);
        supportedTypes.push(name + '[]');
    })
   
    sc.statements.forEach(statement => {
        const statementAny = statement as any;
        const name = statementAny.name.escapedText;
        if (statement.kind == ts.SyntaxKind.InterfaceDeclaration) {
            const fields: Field[] = []
            const members = statementAny.members
            members.forEach(member => {
                if (member.kind == ts.SyntaxKind.PropertySignature) {
                    const fieldName = member.name.escapedText
                    const typeName = content.substr(member.type.pos, member.type.end - member.type.pos).trim()
                    if (supportedTypes.indexOf(typeName) < 0 && !typeName.startsWith(RecordStartTag)) {
                        throw ("unsupported type " + typeName + " found in interface " + name + ". Supported types: " + getSupportedTypes(supportedTypes))
                    }

                    if (typeName.startsWith(RecordStartTag)) {
                        const typeArguments = member.type.typeArguments
                        if (typeArguments.length == 2) {
                            const keyType = content.substr(typeArguments[0].pos, typeArguments[0].end - typeArguments[0].pos).trim()
                            const valueType = content.substr(typeArguments[1].pos, typeArguments[1].end - typeArguments[1].pos).trim()
                            if (keyType != "string") {
                                throw ("Record currently supports string as key get " + keyType)
                            }
                            else{
                                if (valueType.endsWith('[]') || supportedTypes.indexOf(valueType) < 0) {
                                    throw ("Unexpected value type in Record " + valueType)
                                }
                                else{
                                    const recordField: RecordField = {name: fieldName, type: typeName, filedType: FieldType.Record, keyType: keyType, valueType: valueType}
                                    fields.push(recordField)
                                }
                            }
                        }
                        else {
                            throw ("illegal Record type definition found in interface " + name)
                        }
                    }
                    else{
                        fields.push({name: fieldName, type: typeName, filedType: FieldType.Normal})
                    }
                }
                else {
                    throw ("non property  found in interface " + name)
                }
            })

            fields.sort((a, b) => {return a.name > b.name ? 1 : -1})
            customTypes.push({
                name: name,
                fields: fields
            })
        }
        else if (statement.kind == ts.SyntaxKind.EnumDeclaration) {
            const fields: Field[] = []
            const members = statementAny.members
            members.forEach(member => {
                if (member.kind == ts.SyntaxKind.EnumMember) {
                    const fieldName = member.name.escapedText
                    if (member.initializer && member.initializer.text && isNonNegativeInteger(member.initializer.text)) {
                        const enumField: EnumField = {name: fieldName, type: "number", value: member.initializer.text, filedType: FieldType.Enum}
                        fields.push(enumField)
                    }
                    else{
                        throw ("no value specified or non-integer in enum definition for " + name)
                    }
                }
                else {
                    throw ("non member found in enum " + name)
                }
            })

            fields.sort((a, b) => {return a.name > b.name ? 1 : -1})
            customTypes.push({
                name: name,
                fields: fields,
                isEnum: true
            })
        }
        else {
            throw ("non interface/enum " + name + " found in schema file " + fileName)
        }
    })

    return customTypes
}


export function ConvertCustomTypes(content: string, fileName: string) : Type[] {
    const customTypes = parseSchema(content, fileName)
    customTypes.forEach(customType => {
        validateSchema(customTypes, customType.name)
    })

    circularRefDetection(customTypes)
    return customTypes
}