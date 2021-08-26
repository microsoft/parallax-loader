import App  from "./app"
import React from "react"
import ReactDOM from "react-dom"
import {initConfig} from "./config"

initConfig(["reg:south"])
ReactDOM.render(<App />, document.getElementById('root'));