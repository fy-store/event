
let __unconfig_data;
let __unconfig_stub = function (data = {}) { __unconfig_data = data };
__unconfig_stub.default = (data = {}) => { __unconfig_data = data };
/// <reference types="vitest" />
import { defineConfig } from 'vite'
import fs from 'fs'
import path from 'path'
// @ts-ignore
import dts from 'vite-plugin-dts'

const __unconfig_default =  defineConfig({
	build: {
		target: 'es2015',
		lib: {
			entry: process.env.VITE_APP_PATH as string,
			name: 'yishuEvent',
			formats: ['es', 'cjs'],
			fileName(format, _entryName) {
				return `index.${format}.js`
			}
		}
	},

	plugins: [
		dts({
			rollupTypes: true,
			afterBuild(emittedFiles) {
				const rootPath = path.resolve()
				const reg = /\\/g
				const p = path.join(rootPath, '/dist/index.es.d.ts').replace(reg, '/')
				const content = emittedFiles.get(p) as string
				fs.writeFileSync(path.join(rootPath, '/dist/index.cjs.d.ts'), content)
			}
		})
	]
})

if (typeof __unconfig_default === "function") __unconfig_default(...[{"command":"serve","mode":"development"}]);export default __unconfig_data;