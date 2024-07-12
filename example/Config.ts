export interface Main{
    Map: Record<string, Sub>;
    Color: ColorEnum;
    Enabled: boolean;
    Sub: Sub;
    SubSubList: SubSub[];
    EmptyList: number[];
    EmptyCustomList: Sub[];
    Labels: string[];
    Strs: string[];
    Sub1: Sub;
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