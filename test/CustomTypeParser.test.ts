import { ConvertCustomTypes } from "../src/CustomTypeParser";

test('CustomTypeParser Normal Test', () => {
    const content = `
    export interface Main{
        Enabled: boolean;
        Sub: Sub;
        SubSubList: SubSub[];
        Labels: string[];
        Strs: string[];
        Color: Color;
    }

    export interface Sub {
        Label: string;
        Cnt: number;
        SubSub: SubSub;
    }
    
    export interface SubSub{
        Num: number;
    }
    
    export enum Color {
        Blue = 0,
        Red = 1,
        Yellow = 2,
    }
    `
    let types = ConvertCustomTypes(content, 'file.js')
    expect(types.length).toBe(4)
    expect(types[0].name).toBe("Main")
    expect(types[1].name).toBe("Sub")
    expect(types[2].name).toBe("SubSub")
    expect(types[3].name).toBe("Color")
    expect(types[0].fields.length).toBe(6)
    expect(types[0].fields[0].name).toBe("Color")
    expect(types[0].fields[1].name).toBe("Enabled")
    expect(types[0].fields[2].name).toBe("Labels")
    expect(types[0].fields[3].name).toBe("Strs")
    expect(types[0].fields[4].name).toBe("Sub")
    expect(types[0].fields[5].name).toBe("SubSubList")
})

test('CustomTypeParser Unexpected Field Type Test', () => {
    const content = `
    export interface SubSub{
        Num: Number;
    }
    `
    try{
        ConvertCustomTypes(content, 'file.js')
        expect(false).toBeTruthy()
    }
    catch(exp){
        expect(exp).toContain("unsupported type Number found in interface")
    }
})

test('CustomTypeParser Unexpected Class Type Test', () => {
    const content = `
    export class SubSub{
        Num: Number;
    }
    `
    try{
        ConvertCustomTypes(content, 'file.js')
        expect(false).toBeTruthy()
    }
    catch(exp){
        expect(exp).toContain("interface/enum")
    }
})
