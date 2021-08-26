'use strict';

var ts = require('typescript');
var fs = require('fs');

function _interopNamespace(e) {
   if (e && e.__esModule) return e;
   var n = Object.create(null);
   if (e) {
      Object.keys(e).forEach(function (k) {
         if (k !== 'default') {
            var d = Object.getOwnPropertyDescriptor(e, k);
            Object.defineProperty(n, k, d.get ? d : {
               enumerable: true,
               get: function () {
                  return e[k];
               }
            });
         }
      });
   }
   n['default'] = e;
   return Object.freeze(n);
}

var ts__namespace = /*#__PURE__*/_interopNamespace(ts);
var fs__namespace = /*#__PURE__*/_interopNamespace(fs);

var FieldType;
(function (FieldType) {
    FieldType[FieldType["Normal"] = 0] = "Normal";
    FieldType[FieldType["Enum"] = 1] = "Enum";
    FieldType[FieldType["Record"] = 2] = "Record";
})(FieldType || (FieldType = {}));
function createCleanGraph(length) {
    var graph = [];
    for (var inx = 0; inx < length; ++inx) {
        var arr = [];
        for (var jnx = 0; jnx < length; ++jnx) {
            arr.push(false);
        }
        graph.push(arr);
    }
    return graph;
}
function DFS(typeInx, customTypes, cleanGraph, typeMap) {
    var customType = customTypes[typeInx];
    customType.fields.forEach(function (field) {
        var type = field.type;
        if (type.endsWith("[]")) {
            type = type.substr(0, type.length - 2);
        }
        if (typeMap.has(type)) {
            var innerTypeInx = typeMap.get(type);
            if (cleanGraph[typeInx][innerTypeInx]) {
                throw ("circula reference for " + customType.name + " in field " + field.name);
            }
            cleanGraph[typeInx][innerTypeInx] = true;
            DFS(innerTypeInx, customTypes, cleanGraph, typeMap);
        }
    });
}
function circularRefDetection(customTypes) {
    var typeMap = new Map();
    var typeInx = 0;
    customTypes.forEach(function (customType) {
        typeMap.set(customType.name, typeInx++);
    });
    for (var inx = 0; inx < typeInx; ++inx) {
        var cleanGraph = createCleanGraph(typeInx);
        DFS(inx, customTypes, cleanGraph, typeMap);
    }
}
function getSupportedTypes(types) {
    var str = "";
    types.forEach(function (type) {
        str = str + type + ' ';
    });
    return str;
}
var RecordStartTag = "Record<";
function isEnumType(type, customTypes) {
    var ret = false;
    customTypes.forEach(function (customType) {
        if (type == customType.name && customType.isEnum) {
            ret = true;
        }
    });
    return ret;
}
var basicTypes = ["boolean", "number", "string", "boolean[]", "number[]", "string[]"];
function validateSchema(customTypes, startClass) {
    var knownClass = new Set();
    var classStack = [];
    classStack.push(startClass);
    var _loop_1 = function () {
        var curClass = classStack.pop();
        if (knownClass.has(curClass)) {
            return "continue";
        }
        knownClass.add(curClass);
        var fields = [];
        customTypes.forEach(function (type) {
            if (type.name == curClass) {
                fields = type.fields;
            }
        });
        var nestedTypes = new Set();
        fields.forEach(function (field) {
            if (basicTypes.indexOf(field.type) < 0) {
                if (field.type.endsWith('[]')) {
                    var trimmedType = field.type.substr(0, field.type.length - 2);
                    nestedTypes.add(trimmedType);
                }
                else {
                    nestedTypes.add(field.type);
                }
            }
        });
        nestedTypes.forEach(function (nestedType) {
            classStack.push(nestedType);
        });
    };
    while (classStack.length > 0) {
        _loop_1();
    }
}
function isNonNegativeInteger(text) {
    var num = parseFloat(text);
    if (isNaN(num)) {
        return false;
    }
    return num == Math.floor(num) && num >= 0;
}
function parseSchema(content, fileName) {
    var sc = ts__namespace.createSourceFile(fileName, content, ts__namespace.ScriptTarget.ES2015);
    var customTypes = [];
    var supportedTypes = [].concat(basicTypes);
    sc.statements.forEach(function (statement) {
        var statementAny = statement;
        var name = statementAny.name.escapedText;
        supportedTypes.push(name);
        supportedTypes.push(name + '[]');
    });
    sc.statements.forEach(function (statement) {
        var statementAny = statement;
        var name = statementAny.name.escapedText;
        if (statement.kind == ts__namespace.SyntaxKind.InterfaceDeclaration) {
            var fields_1 = [];
            var members = statementAny.members;
            members.forEach(function (member) {
                if (member.kind == ts__namespace.SyntaxKind.PropertySignature) {
                    var fieldName = member.name.escapedText;
                    var typeName = content.substr(member.type.pos, member.type.end - member.type.pos).trim();
                    if (supportedTypes.indexOf(typeName) < 0 && !typeName.startsWith(RecordStartTag)) {
                        throw ("unsupported type " + typeName + " found in interface " + name + ". Supported types: " + getSupportedTypes(supportedTypes));
                    }
                    if (typeName.startsWith(RecordStartTag)) {
                        var typeArguments = member.type.typeArguments;
                        if (typeArguments.length == 2) {
                            var keyType = content.substr(typeArguments[0].pos, typeArguments[0].end - typeArguments[0].pos).trim();
                            var valueType = content.substr(typeArguments[1].pos, typeArguments[1].end - typeArguments[1].pos).trim();
                            if (keyType != "string") {
                                throw ("Record currently supports string as key get " + keyType);
                            }
                            else {
                                if (valueType.endsWith('[]') || supportedTypes.indexOf(valueType) < 0) {
                                    throw ("Unexpected value type in Record " + valueType);
                                }
                                else {
                                    var recordField = { name: fieldName, type: typeName, filedType: FieldType.Record, keyType: keyType, valueType: valueType };
                                    fields_1.push(recordField);
                                }
                            }
                        }
                        else {
                            throw ("illegal Record type definition found in interface " + name);
                        }
                    }
                    else {
                        fields_1.push({ name: fieldName, type: typeName, filedType: FieldType.Normal });
                    }
                }
                else {
                    throw ("non property  found in interface " + name);
                }
            });
            fields_1.sort(function (a, b) { return a.name > b.name ? 1 : -1; });
            customTypes.push({
                name: name,
                fields: fields_1
            });
        }
        else if (statement.kind == ts__namespace.SyntaxKind.EnumDeclaration) {
            var fields_2 = [];
            var members = statementAny.members;
            members.forEach(function (member) {
                if (member.kind == ts__namespace.SyntaxKind.EnumMember) {
                    var fieldName = member.name.escapedText;
                    if (member.initializer && member.initializer.text && isNonNegativeInteger(member.initializer.text)) {
                        var enumField = { name: fieldName, type: "number", value: member.initializer.text, filedType: FieldType.Enum };
                        fields_2.push(enumField);
                    }
                    else {
                        throw ("no value specified or non-integer in enum definition for " + name);
                    }
                }
                else {
                    throw ("non member found in enum " + name);
                }
            });
            fields_2.sort(function (a, b) { return a.name > b.name ? 1 : -1; });
            customTypes.push({
                name: name,
                fields: fields_2,
                isEnum: true
            });
        }
        else {
            throw ("non interface/enum " + name + " found in schema file " + fileName);
        }
    });
    return customTypes;
}
function ConvertCustomTypes(content, fileName) {
    var customTypes = parseSchema(content, fileName);
    customTypes.forEach(function (customType) {
        validateSchema(customTypes, customType.name);
    });
    circularRefDetection(customTypes);
    return customTypes;
}

// end region predefined types
// start region config parser
var sectionPattern = new RegExp("^\\s*\\[([^\\[\\]]+)\\]\\s*$");
var commentPattern = new RegExp("^\\s*;.*$");
var keyValuePattern = new RegExp("^\\s*([^=]+)=(.*)$");
function parseConfigContent(content) {
    var lines = content.split(/[\r\n]/);
    var sections = [];
    var fields = [];
    var sectionName = undefined;
    var type = undefined;
    var globalConstraints = new Map();
    var constraintInx = 0;
    lines.forEach(function (line) {
        var trimmedLine = line.trim();
        if (!trimmedLine) {
            return;
        }
        var arr = sectionPattern.exec(trimmedLine);
        if (arr && arr.length > 0) {
            if (sectionName) {
                fields.sort(function (a, b) { return a.key > b.key ? 1 : -1; });
                sections.push({
                    name: sectionName,
                    fields: fields,
                    type: type
                });
            }
            sectionName = arr[1];
            type = undefined;
            fields = [];
            return;
        }
        arr = commentPattern.exec(trimmedLine);
        if (arr && arr.length) {
            return;
        }
        if (!sectionName) {
            throw ("no section defined before key values " + line);
        }
        arr = keyValuePattern.exec(trimmedLine);
        if (arr && arr.length) {
            var keyWithConstraint = arr[1].trim();
            var value = arr[2].trim();
            var splitList = keyWithConstraint.split('&');
            var key = splitList[0];
            if (key == "_type") {
                type = value;
                return;
            }
            var constraints = new Set();
            for (var inx = 1; inx < splitList.length; ++inx) {
                var constraint = splitList[inx].toLowerCase();
                constraints.add(constraint);
                if (!globalConstraints.has(constraint)) {
                    globalConstraints.set(constraint, constraintInx++);
                }
            }
            var fieldsLength = fields.length;
            var findField = false;
            for (var inx = 0; inx < fieldsLength; ++inx) {
                var field = fields[inx];
                if (field.key == key) {
                    field.values.push({
                        value: value,
                        cons: constraints
                    });
                    findField = true;
                    break;
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
                });
            }
            return;
        }
        throw ("Unsupported line " + line);
    });
    fields.sort(function (a, b) { return a.key > b.key ? 1 : -1; });
    sections.push({
        name: sectionName,
        fields: fields,
        type: type
    });
    return { cons: globalConstraints, sections: sections };
}
function validateSections(sections, customTypes) {
    sections.forEach(function (section) {
        // find _type
        var type = section.type;
        if (!type) {
            throw ("no type defined in section " + section.name);
        }
        var findType = false;
        var fields = [];
        customTypes.forEach(function (customType) {
            if (customType.name == type) {
                findType = true;
                fields = customType.fields;
            }
        });
        if (!findType) {
            throw ("type " + type + " is not defined in section " + section.name);
        }
        if (section.fields.length != fields.length) {
            throw ("field count not the same for section " + section.name);
        }
        for (var inx = 0; inx < fields.length; ++inx) {
            if (section.fields[inx].key != fields[inx].name) {
                throw ("field key does not match for section " + section.name + " key1 " + section.fields[inx].key + " key2 " + fields[inx].name);
            }
            if (section.fields[inx].values.length <= 0) {
                throw ("empty filed for for section " + section.name + " key " + section.fields[inx].key);
            }
            if (section.fields[inx].values[section.fields[inx].values.length - 1].cons.size > 0) {
                throw ("no default value for section " + section.name + " key " + section.fields[inx].key);
            }
        }
    });
}
// end region config parser
// start region config convert
function getSectionDefintion(type, customTypes) {
    var fields = [];
    customTypes.forEach(function (typeDef) {
        if (typeDef.name == type) {
            fields = typeDef.fields;
        }
    });
    return fields;
}
function parseRecord(strValue, nativeField, customTypes, sectionMap) {
    var ret = {};
    var field = nativeField;
    var pairs = strValue.split(',');
    var isEnum = isEnumType(field.valueType, customTypes);
    pairs.forEach(function (pair) {
        var kv = pair.split(':');
        if (kv.length != 2) {
            throw ('Expect record type to have key and value');
        }
        var key = kv[0].trim();
        var value = kv[1].trim();
        if (!key) {
            throw ('Empty or whitespace key found in Record');
        }
        if (isEnum) {
            var enumValue = tryParseEnum(field.valueType, value, customTypes);
            if (enumValue < 0) {
                throw ('Undefined enum value ' + value + ' for ' + field.valueType);
            }
            ret[key] = enumValue;
        }
        else if (field.valueType == 'string') {
            ret[key] = value;
        }
        else if (field.valueType == 'number') {
            var num = parseFloat(value);
            if (isNaN(num)) {
                throw ("NaN number found in " + value + " " + field.name);
            }
            ret[key] = num;
        }
        else if (field.valueType == 'boolean') {
            ret[key] = (value == 'true');
        }
        else {
            if (sectionMap.has(value)) {
                ret[key] = sectionMap.get(value);
            }
            else {
                throw ('Undefined section in Record ' + value);
            }
        }
    });
    return ret;
}
function splitAndTrimList(strValue) {
    var list = strValue.split(',');
    list.forEach(function (val, index, arr) {
        arr[index] = arr[index].trim();
    });
    return list;
}
function parseValue(strValue, customTypes, type, sectionMap, sections) {
    var enumValue = tryParseEnum(type, strValue, customTypes);
    if (enumValue >= 0) {
        return enumValue;
    }
    if (type == 'boolean') {
        return strValue == 'true';
    }
    else if (type == 'number') {
        var ret = parseFloat(strValue);
        if (isNaN(ret)) {
            throw ("NaN number found in " + strValue + " " + type);
        }
        return ret;
    }
    else if (type == 'string') {
        return strValue;
    }
    else if (type == 'boolean[]') {
        var list = splitAndTrimList(strValue);
        var ret_1 = [];
        list.forEach(function (ele) {
            ret_1.push(parseValue(ele, customTypes, 'boolean', sectionMap, sections));
        });
        return ret_1;
    }
    else if (type == 'number[]') {
        var list = splitAndTrimList(strValue);
        var ret_2 = [];
        list.forEach(function (ele) {
            ret_2.push(parseValue(ele, customTypes, 'number', sectionMap, sections));
        });
        return ret_2;
    }
    else if (type == 'string[]') {
        return splitAndTrimList(strValue);
    }
    else if (type.endsWith('[]')) {
        var list = splitAndTrimList(strValue);
        var ret_3 = [];
        list.forEach(function (ele) {
            ret_3.push(parseValue(ele, customTypes, type.substr(0, type.length - 2), sectionMap, sections));
        });
        return ret_3;
    }
    else {
        // custom sections here
        if (sectionMap.has(strValue)) {
            var sectionInx = sectionMap.get(strValue);
            var section = sections[sectionInx];
            if (section.type == type) {
                return sectionInx;
            }
        }
        throw ("undefined section ref " + strValue + " for type " + type);
    }
}
function tryParseEnum(type, value, customTypes) {
    var ret = -1;
    customTypes.forEach(function (customType) {
        if (customType.name == type && customType.isEnum) {
            var foundMatch_1 = false;
            customType.fields.forEach(function (field) {
                if (field.name == value) {
                    ret = parseFloat(field.value);
                    foundMatch_1 = true;
                }
            });
            if (!foundMatch_1) {
                throw ("Unknown enum value: " + value + " for type " + type);
            }
        }
    });
    return ret;
}
function convertConfigObject(customTypes, sections, constraintMap) {
    var convertedSections = [];
    var sectionMap = new Map();
    for (var inx = 0; inx < sections.length; ++inx) {
        sectionMap.set(sections[inx].name, inx);
    }
    var _loop_1 = function (inx) {
        var convertedFields = [];
        var fields = sections[inx].fields;
        var definedFields = getSectionDefintion(sections[inx].type, customTypes);
        var _loop_2 = function (jnx) {
            var type = definedFields[jnx].type;
            var field = fields[jnx];
            var lines = [];
            field.values.forEach(function (val) {
                var cons = [];
                val.cons.forEach(function (con) {
                    if (constraintMap.has(con)) {
                        cons.push(constraintMap.get(con));
                    }
                });
                if (definedFields[jnx].filedType == FieldType.Record) {
                    var line = {
                        c: cons,
                        v: parseRecord(val.value, definedFields[jnx], customTypes, sectionMap)
                    };
                    lines.push(line);
                }
                else {
                    var line = {
                        c: cons,
                        v: parseValue(val.value, customTypes, type, sectionMap, sections)
                    };
                    lines.push(line);
                }
            });
            convertedFields.push(lines);
        };
        for (var jnx = 0; jnx < fields.length; ++jnx) {
            _loop_2(jnx);
        }
        convertedSections.push(convertedFields);
    };
    for (var inx = 0; inx < sections.length; ++inx) {
        _loop_1(inx);
    }
    return convertedSections;
}
// end region config convert
// start region overall interface
function ConvertConfigContent(content, types) {
    var parsedConfigOjbject = parseConfigContent(content);
    validateSections(parsedConfigOjbject.sections, types);
    var convrtedObject = convertConfigObject(types, parsedConfigOjbject.sections, parsedConfigOjbject.cons);
    return { sections: convrtedObject, cons: parsedConfigOjbject.cons, entry: parsedConfigOjbject.sections[0].type };
}
// end region overall interface

var newLine = "\n";
var tab = '\t';
var tempVarPrefix = "_temp_var_name_you_would_never_use";
var sectionCacheVarName = tempVarPrefix + "SectionCache";
var tmpInx = 0;
function generateConfigCodeInternal(customType, customTypes) {
    var code = "";
    code = code + "function _generate" + customType.name + "(sections, inx, constraints) {" + newLine;
    var sectionVal = tempVarPrefix + tmpInx++;
    code = code + tab + ("if (" + sectionCacheVarName + "[inx]) return " + sectionCacheVarName + "[inx]") + newLine;
    code = code + tab + "var " + sectionVal + " = sections[inx]" + newLine;
    for (var inx = 0; inx < customType.fields.length; ++inx) {
        var field = customType.fields[inx];
        if (basicTypes.indexOf(field.type) >= 0 || isEnumType(field.type, customTypes)) {
            code = code + tab + "var " + field.name + "  = convertFieldValue(constraints, " + sectionVal + "[" + inx + "]) " + newLine;
        }
        else if (field.type.startsWith(RecordStartTag)) {
            if (basicTypes.indexOf(field.valueType) >= 0 || isEnumType(field.valueType, customTypes)) {
                code = code + tab + "var " + field.name + " = convertFieldValue(constraints, " + sectionVal + "[" + inx + "])" + newLine;
            }
            else {
                var recordVal = tempVarPrefix + tmpInx++;
                code = code + tab + "var " + recordVal + " = convertFieldValue(constraints, " + sectionVal + "[" + inx + "])" + newLine;
                code = code + tab + "var " + field.name + " = {}" + newLine;
                var keyVar = tempVarPrefix + tmpInx++;
                code = code + tab + "for (var " + keyVar + " in " + recordVal + ") {" + newLine;
                code = code + tab + tab + field.name + "[" + keyVar + "] = _generate" + field.valueType + "(sections, " + recordVal + "[" + keyVar + "], constraints)" + newLine;
                code = code + tab + "}" + newLine;
            }
        }
        else if (field.type.endsWith("[]")) {
            var actualType = field.type.substr(0, field.type.length - 2);
            var arrVal = tempVarPrefix + tmpInx++;
            code = code + tab + "var " + arrVal + "  = convertFieldValue(constraints, " + sectionVal + "[" + inx + "]) " + newLine;
            code = code + tab + "var " + field.name + "  = []" + newLine;
            code = code + tab + arrVal + ".forEach(ele => {" + newLine;
            code = code + tab + tab + field.name + ".push(_generate" + actualType + "(sections, ele, constraints))" + newLine;
            code = code + tab + "})" + newLine;
        }
        else {
            var objVal = tempVarPrefix + tmpInx++;
            code = code + tab + "var " + objVal + "  = convertFieldValue(constraints, " + sectionVal + "[" + inx + "])" + newLine;
            code = code + tab + "var " + field.name + " = _generate" + field.type + "(sections, " + objVal + ", constraints)" + newLine;
        }
    }
    code = code + tab + ("return " + sectionCacheVarName + "[inx] = {");
    for (var inx = 0; inx < customType.fields.length; ++inx) {
        code = code + customType.fields[inx].name + " : " + customType.fields[inx].name + ",";
    }
    code = code + "}" + newLine;
    code = code + "}" + newLine;
    code = code + newLine;
    return code;
}
function generateConfigCode(customTypes) {
    var code = newLine;
    code = code + "function isSubSet(cons1, cons2) {" + newLine;
    code = code + tab + "var ret = true" + newLine;
    code = code + tab + "cons1.forEach(con => {" + newLine;
    code = code + tab + tab + "if (cons2.indexOf(con) < 0) {" + newLine;
    code = code + tab + tab + tab + "ret = false" + newLine;
    code = code + tab + tab + "}" + newLine;
    code = code + tab + "})" + newLine;
    code = code + tab + "return ret" + newLine;
    code = code + "}" + newLine;
    code = code + newLine;
    code = code + "function convertFieldValue(constraints, field) {" + newLine;
    code = code + tab + "for (var inx = 0; inx < field.length; ++inx) {" + newLine;
    code = code + tab + tab + "if (isSubSet(field[inx].c, constraints)) {" + newLine;
    code = code + tab + tab + tab + "return field[inx].v" + newLine;
    code = code + tab + tab + "}" + newLine;
    code = code + tab + "}" + newLine;
    code = code + tab + "return 0" + newLine;
    code = code + "}" + newLine;
    code = code + newLine;
    customTypes.forEach(function (type) {
        if (type.isEnum) {
            return;
        }
        code = code + generateConfigCodeInternal(type, customTypes);
    });
    return code;
}
function generateMainCode(customTypes, entryType) {
    var code = "";
    var mainFunc = "_generate" + entryType;
    code = code + generateConfigCode(customTypes);
    code = code + newLine;
    code = code + "function generateConfig(sections, cons)" + "{" + newLine;
    code = code + tab + "return " + mainFunc + "(sections, 0, cons)" + newLine;
    code = code + "}" + newLine;
    code = code + newLine;
    return code;
}
function generateJSCodeInternal(configContent, schemaContent) {
    var customTypes = ConvertCustomTypes(schemaContent, "file.js");
    var parsedConfigObject = ConvertConfigContent(configContent, customTypes);
    var ret = "";
    ret = ret + "function (constraintList) {" + newLine;
    var constrintFunc = "\nfunction resolveConstraints(constraintList, constraintMap) {\n    var constraintIds = []\n    constraintList.forEach(exp => {\n\t\tlet lowerExp = exp.toLowerCase()\n        if (lowerExp in constraintMap) {\n            constraintIds.push(constraintMap[lowerExp])\n        }\n    })\n\n    return constraintIds\n}\n" + newLine;
    ret = ret + constrintFunc + newLine;
    ret = ret + "var configData = " + JSON.stringify(parsedConfigObject.sections) + newLine;
    var dict = {};
    parsedConfigObject.cons.forEach(function (value, key) {
        dict[key] = value;
    });
    ret = ret + "var constraintMap = " + JSON.stringify(dict) + newLine;
    ret = ret + 'var constraints = resolveConstraints(constraintList, constraintMap)' + newLine;
    ret = ret + ("var " + sectionCacheVarName + " = new Array(configData.length)") + newLine;
    ret = ret + generateMainCode(customTypes, parsedConfigObject.entry);
    ret = ret + "var ret = generateConfig(configData, constraints)" + newLine;
    ret = ret + (sectionCacheVarName + " = []") + newLine;
    ret = ret + 'return ret' + newLine;
    ret = ret + "}" + newLine;
    return ret;
}

var loaderUtils = require("loader-utils"); // eslint-disable-line
module.exports = function (source) {
    var options = loaderUtils.getOptions(this);
    var schemaContent = fs__namespace.readFileSync(options.schema, 'utf-8');
    return 'module.exports = ' + generateJSCodeInternal(source, schemaContent);
};
