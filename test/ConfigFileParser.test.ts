import { ConvertCustomTypes } from "../src/CustomTypeParser";
import { ConvertConfigContent } from "../src/ConfigFileParser";

test("ConfigFileParser Normal Test", () => {
    const schemaContent = `
    export interface Main{
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
    
    ; section defintion for sub
    [sub]
    _type=Sub
    Label=Label
    Cnt=3
    SubSub=subsub
    
    ; section definition for subsub
    [subsub]
    _type=SubSub
    Num&gender:male=8
    Num=9    
    `

    let types = ConvertCustomTypes(schemaContent, 'file.js')
    let configObject = ConvertConfigContent(configContent, types)
    expect(configObject.sections.length).toBe(3)
    expect(configObject.entry).toBe("Main")
    expect(configObject.cons.size).toBe(3)
    expect(configObject.cons.get("reg:south")).toBe(0)
    expect(configObject.cons.get("reg:east")).toBe(1)
    expect(configObject.cons.get("gender:male")).toBe(2)
    expect(configObject.sections[0].length).toBe(5)
    expect(configObject.sections[0][0].length).toBe(3)
    expect(configObject.sections[0][0][0].c.length).toBe(1)
    expect(configObject.sections[0][0][0].c[0]).toBe(0)
    expect(configObject.sections[0][0][0].v).toBe(true)
    expect(configObject.sections[0][0][1].c.length).toBe(1)
    expect(configObject.sections[0][0][1].c[0]).toBe(1)
    expect(configObject.sections[0][0][1].v).toBe(true)
    expect(configObject.sections[0][0][2].c.length).toBe(0)
    expect(configObject.sections[0][0][2].v).toBe(false)
    expect(configObject.sections[0][1].length).toBe(1)
    expect(configObject.sections[0][2].length).toBe(1)
    expect(configObject.sections[0][3].length).toBe(1)
    expect(configObject.sections[0][4].length).toBe(1)
})