# Parallax ini library
Parallax config is configuration schema that is widely used within Microsoft Bing. The config is usually expressed in ini file with a schema file.

## Example
Assume there is a typescript schema file as below
```typescript
export interface MainConfig {
    Label: string;
    Cnt: number;
    Sub: SubConfig;
}

export interface SubConfig {
    Enabled: boolean;
    Arr: number[];
    Map: Record<string, number>;
}
```
And there is ini file as below,
```ini
[main]
_type=MainConfig
Label=sample
Cnt&param1:value1=8
Cnt=9
Sub&param1:value1&param2:value2=sub1
Sub=sub

[sub]
_type=SubConfig
Enabled=false
Arr=1,2,3
Map&param3:value3=A:0,B:1,C:2
Map=A:1,B:2,C:3

[sub1]
_type=SubConfig
Enabled=true
Arr&param3:value3=5,6,7
Arr=4,5,6
Map=A:2,B:3,C:4
```
In the ini file above, each section corresponds to one specific interface. Value of **_type** would be same as interface name. The key of each config line correponds to field of the interface with some constraints. For example, **Arr&param3:value3=2,3,4** means when **param3:value3** condition matches, its value is [2,3,4].
<br/>
And if there is reference to CustomType, it should be represented by section name for the the CustomType, like **Sub=sub** should point to section sub.
<br/>
Currently the library supports list and map (which is Record in typescript). List would be represented by string seperataed by ','. Map would be represented by string seperated by ',' as well and its key and value would be seperated by ':'.
<br/>
**Please notice that, in current version, only line after trimmed starts with ';' would be treated as comment line.**
## Constraint combination
In parallax config, we could easily express constraint combination. Take the ini config below for example,
```ini
[main]
_type=Config
Probability&reg:east&gender:female=0.8
Probability&reg:east&gender:male=0.7
Probability&reg:west&gender:female=0.5
Probability&reg:west&gender:male=0.4
Probability=0.1
```
As you could see from ini file, we could express some probability with region and gender combination. Once specific constraints recieved, we could get related resolved Probability value without checking different condition combinations.
## Configuration Resolve
For the ini file above, each field value is resolved by matching the constraints attached with order as prioerity. For example, if only **param3:value3** matches, then MainConfig would be resolved as below,
```json
{
    Label: "sample",
    Cnt: 9,
    Sub: {
        Enabled: false,
        Arr: [1, 2, 3],
        Map: {
            A: 0,
            B: 1,
            C: 2
        }
    }
}
```
If **param1:value1&param2:value2** matches, **param1:value1** matches as well, then MainConfig would be resolved as below,
```json
{
    Label: "sample",
    Cnt: 8,
    Sub: {
        Enabled: true,
        Arr: [4,5,6],
        Map: {
            A: 2,
            B: 3,
            C: 4
        }
    }
}
```
**Please notice that the library assumes that the resolved config would be parsed from the first section of the ini file.**
## Supported types
Currently the library supports types as below in typescript,
- string
- number
- boolean
- enum
- CustomType
- string[]
- number[]
- boolean[]
- enum[]
- CustomType[]
- Record<string, string>
- Record<string, number>
- Record<string, boolean>
- Record<string, enum>
- Record<string, CustomType>

For custom defined enum, it should have non-negative integer assigned to each field.
## Development Setup
Please install vscode as IDE.
```ini
# install
npm install

# build
npm run build

# run test
npm run test

# run lint
npm run lint
```
To debug test case, please set configuration to be **Jest Current File**, open test file and run **Start Debugging** from vscode menu.
<br/>
To debug **main.ts** from example folder, please update the **module** to be **CommonJS** in **tsconfig.json**, set configuration to be **Launch Example Gen** and run **Start Debugging** from vscode menu. Please do remember to revert the **module** change back to **ESNext** for building and running tests.
## Usage
The library would be published as npm package parallax-loader which is actually a webpack loader. If your bundle tools is webpack, then you could define a rule as below,
```javascript
{
    test: /\.ini$/,
    use: [
        {
            loader: 'parallax-loader',
            options: {
                schema: path.resolve(__dirname, '../src/Config.ts')
            }
        }
    ]
}
```
Then you could load the ini file in code as below,
```
const configLoadFunc = rquire('./Config.ini')
const config = configLoadFunc(['reg:south'])
```
Please check more in [Demo Folder](https://github.com/microsoft/parallax-loader/tree/main/demo).
<br/>
If you don't have any bundle tool, then you run the built gen.js with node.js, to generate output typescript file under the same folder of schema file, which would be ConfigGen.ts for the command below,
```
node gen.js ./src/Config.ts ./src/Config.ini
```
And you could import **generateConfig** from the genreated file and resolve config with constraint list. For example,
```typescript
import {generateConfig} from "./ConfigGen"
const config = generateConfig(['reg:south'])
```
To generate js code, add --js as below,

```ini
node gen.js ./src/Config.ts ./src/Config.ini --js
```
You could also resolved config with code below,
```javascript
const configLoadFunc = require("./ConfigGen")
const config = configLoadFunc(["reg:south"])
```
If you have the parallax-loader installed, gen.js is also generated as part of the library. Then you could run command like below as well.
```
node node_modules/parallax-loader/dist/gen.js ./src/Config.ts ./src/Config.ini --js
```
And you could add this command to the build/debug command, which would be like a webpack loader to automatically update the generated code if you change the schema/configuration file. For example,
```
{
    "scripts": {
        "code_gen": "node node_modules/parallax-loader/dist/gen.js ./src/Config.ts ./src/Config.ini --js",
        "build_inner": "some build command",
        "build": "npm run code_gen && npm run build_inner"
    }
}
```
