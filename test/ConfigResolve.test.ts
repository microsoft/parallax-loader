import {ColorEnum} from "../example/Config"
import {generateConfig} from "../example/ConfigGen"

test("ConfigResolve test", () => {
    let config = generateConfig(["reg:south"])
    expect(config.Color).toBe(ColorEnum.Blue)
    expect(config.Enabled).toBe(true)
    expect(config.Strs.length).toBe(3)
    expect(config.Strs[0]).toBe("1")
    expect(config.Strs[1]).toBe("2")
    expect(config.Strs[2]).toBe("3")
    expect("ABC" in config.Map).toBeTruthy()
    expect(config.Map["ABC"].Cnt).toBe(3)
})