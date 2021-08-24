import { generateTSCodeInternal } from "../src/CodeGenTS"

test("CodeGen Normal Test", () => {

    const expectedCode = `
// The file is auto-generated, please don't modify it.

type ConstraintField = ConfigLine[]

interface ConfigLine {
    c: number[];
    v: number | boolean | string | number[] | boolean[] | string[] | number | boolean | string | number[] | boolean[] | string[] | Record<string, boolean> | Record<string, number> | Record<string, string>;
}

let _temp_var_name_you_would_never_useSectionCache : Array<any> = []

let _temp_var_name_you_would_never_useConstraintMap: Record<string, number> = {"reg:south" : 0,"reg:east" : 1,"gender:male" : 2,}

function getConstraintValues(constraints: string[], constraintMap: Record<string, number>): number[] {
	let ret : number[] = []
	constraints.forEach(constraint => {
		if (constraint in constraintMap) {
			ret.push(constraintMap[constraint])
		}
	})
	return ret
}

let _temp_var_name_you_would_never_useConfigSections : ConstraintField[][] = [
    [
        [
            {
                "c": [],
                "v": 0
            }
        ],
        [
            {
                "c": [
                    0
                ],
                "v": true
            },
            {
                "c": [
                    1
                ],
                "v": true
            },
            {
                "c": [],
                "v": false
            }
        ],
        [
            {
                "c": [],
                "v": [
                    "a",
                    "b",
                    "c"
                ]
            }
        ],
        [
            {
                "c": [],
                "v": {
                    "ABC": 1,
                    "BCD": 2
                }
            }
        ],
        [
            {
                "c": [],
                "v": [
                    "1",
                    "2",
                    "3"
                ]
            }
        ],
        [
            {
                "c": [],
                "v": 1
            }
        ],
        [
            {
                "c": [],
                "v": [
                    3
                ]
            }
        ]
    ],
    [
        [
            {
                "c": [],
                "v": 3
            }
        ],
        [
            {
                "c": [],
                "v": "Label"
            }
        ],
        [
            {
                "c": [
                    0
                ],
                "v": {
                    "ABC": 2,
                    "BCD": 3
                }
            },
            {
                "c": [],
                "v": {
                    "ABC": 1,
                    "BCD": 2
                }
            }
        ],
        [
            {
                "c": [],
                "v": 3
            }
        ]
    ],
    [
        [
            {
                "c": [],
                "v": 3
            }
        ],
        [
            {
                "c": [],
                "v": "Label"
            }
        ],
        [
            {
                "c": [
                    0
                ],
                "v": {
                    "ABC": 3,
                    "BCD": 4
                }
            },
            {
                "c": [],
                "v": {
                    "ABC": 2,
                    "BCD": 3
                }
            }
        ],
        [
            {
                "c": [],
                "v": 3
            }
        ]
    ],
    [
        [
            {
                "c": [
                    2
                ],
                "v": 8
            },
            {
                "c": [],
                "v": 9
            }
        ]
    ]
]

import {Main} from "./Config"
import {Sub} from "./Config"
import {ColorEnum} from "./Config"
import {SubSub} from "./Config"

function isSubSet(cons1: number[], cons2: number[]) {
	let ret = true
	cons1.forEach(con => {
		if (cons2.indexOf(con) < 0) {
			ret = false
		}
	})
	return ret
}

function convertFieldValue(constraints: number[], field: ConstraintField) : number | boolean | string | number[] | boolean[] | string[] | Record<string, boolean> | Record<string, number> | Record<string, string> {
	for (let inx = 0; inx < field.length; ++inx) {
		if (isSubSet(field[inx].c, constraints)) {
			return field[inx].v
		}
	}
	return 0
}

function generateMain(sections: ConstraintField[][], inx: number, constraints: number[]) : Main{
	if (_temp_var_name_you_would_never_useSectionCache[inx]) return _temp_var_name_you_would_never_useSectionCache[inx]
	let _temp_var_name_you_would_never_use0 : ConstraintField[] = sections[inx]
	let Color : ColorEnum = convertFieldValue(constraints, _temp_var_name_you_would_never_use0[0]) as ColorEnum
	let Enabled : boolean = convertFieldValue(constraints, _temp_var_name_you_would_never_use0[1]) as boolean
	let Labels : string[] = convertFieldValue(constraints, _temp_var_name_you_would_never_use0[2]) as string[]
	let _temp_var_name_you_would_never_use1 : Record<string, number> = convertFieldValue(constraints, _temp_var_name_you_would_never_use0[3]) as Record<string, number>
	let Map : Record<string, Sub> = {}
	for (var _temp_var_name_you_would_never_use2 in _temp_var_name_you_would_never_use1) {
		Map[_temp_var_name_you_would_never_use2] = generateSub(sections, _temp_var_name_you_would_never_use1[_temp_var_name_you_would_never_use2], constraints)
	}
	let Strs : string[] = convertFieldValue(constraints, _temp_var_name_you_would_never_use0[4]) as string[]
	let _temp_var_name_you_would_never_use3 : number = convertFieldValue(constraints, _temp_var_name_you_would_never_use0[5]) as number
	let Sub : Sub = generateSub(sections, _temp_var_name_you_would_never_use3, constraints)
	let _temp_var_name_you_would_never_use4 : number[] = convertFieldValue(constraints, _temp_var_name_you_would_never_use0[6]) as number[]
	let SubSubList : SubSub[] = []
	_temp_var_name_you_would_never_use4.forEach(ele => {
		SubSubList.push(generateSubSub(sections, ele, constraints))
	})
	return _temp_var_name_you_would_never_useSectionCache[inx] = {Color : Color,Enabled : Enabled,Labels : Labels,Map : Map,Strs : Strs,Sub : Sub,SubSubList : SubSubList,}
}

function generateSub(sections: ConstraintField[][], inx: number, constraints: number[]) : Sub{
	if (_temp_var_name_you_would_never_useSectionCache[inx]) return _temp_var_name_you_would_never_useSectionCache[inx]
	let _temp_var_name_you_would_never_use5 : ConstraintField[] = sections[inx]
	let Cnt : number = convertFieldValue(constraints, _temp_var_name_you_would_never_use5[0]) as number
	let Label : string = convertFieldValue(constraints, _temp_var_name_you_would_never_use5[1]) as string
	let Map : Record<string, number> = convertFieldValue(constraints, _temp_var_name_you_would_never_use5[2]) as Record<string, number>
	let _temp_var_name_you_would_never_use6 : number = convertFieldValue(constraints, _temp_var_name_you_would_never_use5[3]) as number
	let SubSub : SubSub = generateSubSub(sections, _temp_var_name_you_would_never_use6, constraints)
	return _temp_var_name_you_would_never_useSectionCache[inx] = {Cnt : Cnt,Label : Label,Map : Map,SubSub : SubSub,}
}

function generateSubSub(sections: ConstraintField[][], inx: number, constraints: number[]) : SubSub{
	if (_temp_var_name_you_would_never_useSectionCache[inx]) return _temp_var_name_you_would_never_useSectionCache[inx]
	let _temp_var_name_you_would_never_use7 : ConstraintField[] = sections[inx]
	let Num : number = convertFieldValue(constraints, _temp_var_name_you_would_never_use7[0]) as number
	return _temp_var_name_you_would_never_useSectionCache[inx] = {Num : Num,}
}


export function generateConfig(constraints: string[]) : Main{
	_temp_var_name_you_would_never_useSectionCache = new Array(_temp_var_name_you_would_never_useConfigSections.length)
	let cons = getConstraintValues(constraints, _temp_var_name_you_would_never_useConstraintMap)
	let ret = generateMain(_temp_var_name_you_would_never_useConfigSections, 0, cons)
	_temp_var_name_you_would_never_useSectionCache = []
	return ret
}

`
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

    let genCode = generateTSCodeInternal(schemaContent, "Config", configContent)
    expect(genCode).toEqual(expectedCode)
})
