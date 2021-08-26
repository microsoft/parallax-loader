import ConfigLoadFunc from "../config/Config.ini"
let config = null
export function initConfig(constraintList) {
    config = ConfigLoadFunc(constraintList)
}

export function getConfig() {
    return config
}