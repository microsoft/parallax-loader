import { generateJSCodeInternal } from "../src/CodeGenJS"

test("CodeGenJS Normal Test", () => {
    const schemaContent = `
    export interface Main{
        Map: Record<string, Sub>;
        Color: ColorEnum;
        Enabled: boolean;
        Sub: Sub;
        SubSubList: SubSub[];
        Labels: string[];
        Strs: string[];
    }
    
    export interface Sub {
        Label: string;
        Cnt: number;
        SubSub: SubSub;
        Map: Record<string, number>;
    }
    
    export enum ColorEnum {
        Blue = 0,
        Yellow = 1,
        Red = 2,
    }
    
    export interface SubSub{
        Num: number;
    }
    `

    const configContent = `
    [main]
    _type=Main
    Enabled&reg:south=true
    Enabled&reg:east=true
    Enabled=false
    Strs=1,2,3
    Sub=sub
    SubSubList=subsub
    Labels=a,b,c
    Color=Blue
    Map=ABC: sub,BCD: sub1
    
    ; section defintion for sub
    [sub]
    _type=Sub
    Label=Label
    Cnt=3
    SubSub=subsub
    Map&reg:south=ABC:2,BCD:3
    Map=ABC:1,BCD:2
    
    ; section defintion for sub
    [sub1]
    _type=Sub
    Label=Label
    Cnt=3
    SubSub=subsub
    Map&reg:south=ABC:3,BCD:4
    Map=ABC:2,BCD:3
    
    ; section definition for subsub
    [subsub]
    _type=SubSub
    Num&gender:male=8
    Num=9   
    `
    const expectedCode = `function (constraintList) {

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


var configData = [[[{"c":[],"v":0}],[{"c":[0],"v":true},{"c":[1],"v":true},{"c":[],"v":false}],[{"c":[],"v":["a","b","c"]}],[{"c":[],"v":{"ABC":1,"BCD":2}}],[{"c":[],"v":["1","2","3"]}],[{"c":[],"v":1}],[{"c":[],"v":[3]}]],[[{"c":[],"v":3}],[{"c":[],"v":"Label"}],[{"c":[0],"v":{"ABC":2,"BCD":3}},{"c":[],"v":{"ABC":1,"BCD":2}}],[{"c":[],"v":3}]],[[{"c":[],"v":3}],[{"c":[],"v":"Label"}],[{"c":[0],"v":{"ABC":3,"BCD":4}},{"c":[],"v":{"ABC":2,"BCD":3}}],[{"c":[],"v":3}]],[[{"c":[2],"v":8},{"c":[],"v":9}]]]
var constraintMap = {"reg:south":0,"reg:east":1,"gender:male":2}
var constraints = resolveConstraints(constraintList, constraintMap)
var _temp_var_name_you_would_never_useSectionCache = new Array(configData.length)

function isSubSet(cons1, cons2) {
	var ret = true
	cons1.forEach(con => {
		if (cons2.indexOf(con) < 0) {
			ret = false
		}
	})
	return ret
}

function convertFieldValue(constraints, field) {
	for (var inx = 0; inx < field.length; ++inx) {
		if (isSubSet(field[inx].c, constraints)) {
			return field[inx].v
		}
	}
	return 0
}

function generateMain(sections, inx, constraints) {
	if (_temp_var_name_you_would_never_useSectionCache[inx]) return _temp_var_name_you_would_never_useSectionCache[inx]
	var _temp_var_name_you_would_never_use0 = sections[inx]
	var Color  = convertFieldValue(constraints, _temp_var_name_you_would_never_use0[0]) 
	var Enabled  = convertFieldValue(constraints, _temp_var_name_you_would_never_use0[1]) 
	var Labels  = convertFieldValue(constraints, _temp_var_name_you_would_never_use0[2]) 
	var _temp_var_name_you_would_never_use1 = convertFieldValue(constraints, _temp_var_name_you_would_never_use0[3])
	var Map = {}
	for (var _temp_var_name_you_would_never_use2 in _temp_var_name_you_would_never_use1) {
		Map[_temp_var_name_you_would_never_use2] = generateSub(sections, _temp_var_name_you_would_never_use1[_temp_var_name_you_would_never_use2], constraints)
	}
	var Strs  = convertFieldValue(constraints, _temp_var_name_you_would_never_use0[4]) 
	var _temp_var_name_you_would_never_use3  = convertFieldValue(constraints, _temp_var_name_you_would_never_use0[5])
	var Sub = generateSub(sections, _temp_var_name_you_would_never_use3, constraints)
	var _temp_var_name_you_would_never_use4  = convertFieldValue(constraints, _temp_var_name_you_would_never_use0[6]) 
	var SubSubList  = []
	_temp_var_name_you_would_never_use4.forEach(ele => {
		SubSubList.push(generateSubSub(sections, ele, constraints))
	})
	return _temp_var_name_you_would_never_useSectionCache[inx] = {Color : Color,Enabled : Enabled,Labels : Labels,Map : Map,Strs : Strs,Sub : Sub,SubSubList : SubSubList,}
}

function generateSub(sections, inx, constraints) {
	if (_temp_var_name_you_would_never_useSectionCache[inx]) return _temp_var_name_you_would_never_useSectionCache[inx]
	var _temp_var_name_you_would_never_use5 = sections[inx]
	var Cnt  = convertFieldValue(constraints, _temp_var_name_you_would_never_use5[0]) 
	var Label  = convertFieldValue(constraints, _temp_var_name_you_would_never_use5[1]) 
	var Map = convertFieldValue(constraints, _temp_var_name_you_would_never_use5[2])
	var _temp_var_name_you_would_never_use6  = convertFieldValue(constraints, _temp_var_name_you_would_never_use5[3])
	var SubSub = generateSubSub(sections, _temp_var_name_you_would_never_use6, constraints)
	return _temp_var_name_you_would_never_useSectionCache[inx] = {Cnt : Cnt,Label : Label,Map : Map,SubSub : SubSub,}
}

function generateSubSub(sections, inx, constraints) {
	if (_temp_var_name_you_would_never_useSectionCache[inx]) return _temp_var_name_you_would_never_useSectionCache[inx]
	var _temp_var_name_you_would_never_use7 = sections[inx]
	var Num  = convertFieldValue(constraints, _temp_var_name_you_would_never_use7[0]) 
	return _temp_var_name_you_would_never_useSectionCache[inx] = {Num : Num,}
}


function generateConfig(sections, cons){
	return generateMain(sections, 0, cons)
}

var ret = generateConfig(configData, constraints)
_temp_var_name_you_would_never_useSectionCache = []
return ret
}
`
    let genCode = generateJSCodeInternal(configContent, schemaContent)
    expect(genCode).toEqual(expectedCode)
    let evaluateCode = genCode.replace("function", "function resolveConfig")
    evaluateCode = evaluateCode + "resolveConfig(['reg:south'])"
    let config = eval(evaluateCode)
    expect(config.Color).toBe(0)
    expect(config.Enabled).toBe(true)
    expect(config.Strs.length).toBe(3)
    expect(config.Strs[0]).toBe("1")
    expect(config.Strs[1]).toBe("2")
    expect(config.Strs[2]).toBe("3")
    expect("ABC" in config.Map).toBeTruthy()
    expect(config.Map["ABC"].Cnt).toBe(3)
})
