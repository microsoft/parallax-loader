import React from 'react'
import {getConfig} from "./config"

export default function App() {
  const config = getConfig()
  return (<div>Feature Label {config.Label}, Count {config.Cnt}</div>)
}
