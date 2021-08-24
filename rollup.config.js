import typescript from 'rollup-plugin-typescript2';

export default [
    {
        input: './src/Loader.ts',
        output: {
            file: './dist/index.js',
            format: 'commonjs',
        },
        plugins: [
            typescript()
        ],
        external: [
            "fs",
            "path",
            "process",
            "typescript"
        ]
    },
    {
        input: './src/Generator.ts',
        output: {
            file: './dist/gen.js',
            format: 'commonjs',
        },
        plugins: [
            typescript()
        ],
        external: [
            "fs",
            "path",
            "process",
            "typescript"
        ]
    }
]