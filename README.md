# 说明

一个事件控制器模块

## 安装

**使用 pnpm**

```sh
pnpm i @yishu/event
```

**使用 yarn**

```sh
yarn add @yishu/event
```

**使用 npm**

```sh
npm i @yishu/event
```

## 使用

```js
import Event from '@yishu/event'

const event = new Event()

/** 注册事件 */
event.on('e', (...args) => {
	console.log('e', ...args)
})

/** 触发事件并传递参数 */
event.emit('e', 1, 'a', { name: 'test' })

/** 移除事件1 */
const f1 = () => {}
event.on('f1', f1) // 注册
event.off('f1', f1) // 移除

/**
 * 移除事件2
 * - 使用标识符移除
 */
const f2 = event.on('f2', () => {}) // 注册并接收返回值
event.off(f2) // 通过标识符移除
```

如果你想使用 CommonJS 模块化规范, 那么你可以使用以下方式导入

```js
const Event = require('@yishu/event/dist/index.cjs.js')
const event = new Event()
```

## Event

**语法**

```
const event = new Event([options])
```

-   options 配置对象 [可选]
    -   eventMap 事件配置, 接收一个对象 [可选]
    -   ctx 实例上下文 hook, 接收一个函数 [可选]

事件中的函数 this 默认绑定为实例对象, 如果你希望使用 this 来获取实例, 请使用普通函数, 而非箭头函数

```js
const event = new Event({
	events: {
		/** 简写注册事件 */
		a(ctx) {},

		/** 数组形式注册多个事件 */
		b: [(ctx) => {}, (ctx) => {}],

		/** 数组对象形式完整配置注册多个事件 */
		c: [
			{
				fn: (ctx) => {},
				once: true, // 是否只执行一次
				sign: Symbol('自定义标识符')
			}
		]
	},

	/** 实例上下文 hook */
	ctx(ctx) {
		// ctx.clear('a') // 清除指定事件
		// ctx.clearAll() // 清除所有事件
		// ctx.state // 状态对象
		// ctx.eventMap // 解析后的事件对象
		// ctx.self // 当前实例
		// ctx.setSelf('d', 1) // 设置实例属性(避免ts警告)
	}
})
```

## 实例属性

## 原型方法

### on

注册一个事件

**语法**

```
event.on(eventName, callback)
```

-   eventName 事件名称, 支持字符串和 symbol
-   callback 事件回调函数

**返回值**

symbol 唯一标识, 后续可用该标识移除回调

### once

注册一个一次性事件, 当事件触发一次后将被移除

**语法**

```
event.once(eventName, callback)
```

-   eventName 事件名称, 支持字符串和 symbol

-   callback 事件回调函数

**返回值**

symbol 唯一标识, 后续可用该标识移除回调

### emit

触发指定事件

**语法**

```
event.emit(eventName [,arg1, arg2, arg3, ...argN])
```

-   eventName 需要触发的事件的名称
-   arg 需要传递的事件参数

**返回值**

this

### emitAwait

触发指定事件, 并返回一个 promise, 事件所有回调完成, promise resolve

-   与 `emit` 区别

-   `emit` 触发事件, 不等待回调完成

-   `emitAwait` 触发事件, 等待所有回调完成, promise resolve

**语法**

```
await event.emitAwait(eventName [,arg1, arg2, arg3, ...argN])
```

-   eventName 需要触发的事件的名称
-   arg 需要传递的事件参数

**返回值**

Promise.allSettled() 返回值

### off

移除一个事件中的回调

**语法**

```
event.off(eventName, ref)
```

-   eventName 需要移除的事件的名称
-   ref 事件回调引用(函数或 symbol)

**返回值**

this

### offBySign

移除一个事件中的回调

**语法**

```
event.offBySign(ref)
```

-   ref 事件回调唯一标识(不允许函数, 函数复用更为普遍)

**返回值**

this

### has

判断事件是否存在

**语法**

```
event.has(eventName)
```

-   eventName 事件的名称

**返回值**

boolean

### hasCallback

判断事件中的回调是否存在

**语法**

```
event.hasCallback(eventName, ref)
```

-   eventName 事件的名称
-   ref 事件回调引用(函数或 symbol)

**返回值**

boolean

### hasCallbackBySign

判断事件中的回调是否存在

**语法**

```
event.hasCallbackBySign(sign)
```

-   sign 回调唯一标识

**返回值**

boolean

## 上下文对象

通过实例时传递的 ctx 配置函数获得

```js
const event = new Event({
	ctx(ctx) {
		console.log(ctx)
	}
})
```

-   ctx 上下文对象

    -   ctx.clear(eventName) // 清除指定事件
    -   ctx.clearAll() // 清除所有事件
    -   ctx.state // 状态对象
    -   ctx.eventMap // 解析后的事件对象
    -   ctx.self // 当前实例
    -   ctx.setSelf(prop, value) // 设置实例属性(避免 ts 警告)

## ts 类型支持

导入类型

```ts
import type { EventCtx } from '@yishu/event'
```

使用

```ts
type A = EventCtx
```

自定义事件类型

示例 1

```ts
type E1 = {
	sum?(a: number, b: number): number
	set?(str: 'a' | 'b'): string
	send?(msg: any): void
}

const event = new Event<E1>()
event.on('sum', (a, b) => {}) // 类型推导
event.emit('sum', 1, 2) // 类型推导
```

示例 2

```ts
type E1 = {
	sum?(a: number, b: number): number
	set?(str: 'a' | 'b'): string
	send?(msg: any): void
}

class Test extends Event<E1> {
	constructor() {
		super()
	}
}

const test = new Test()
test.on('sum', (a, b) => {
	console.log(a, b)
})
test.emit('sum', 1, 2)
```

示例 3

js 中自定义类型, 创建 `TS` 文件然后通过 `JSDOC` 导入, 或直接在 `JSDOC` 中编写

```ts
// type.ts
export interface E {
	sum?(a: number, b: number): number
}
```

```js
import Event from '@yishu/event'

/**
 * 直接树形在文档注释中
 * @type {Event<{ sum: (a: number, b: number) => void }>}
 */
const event1 = new Event()
event1.on('sum', (a, b) => {
	console.log(a, b)
})

/**
 * 在文档注释中引入类型
 * 如果引入丢失, 尝试更改导入扩展名, `.ts` 或 `.js` 或 不添加
 * @type {Event<import('./type.ts').E>}
 */
const event2 = new Event()
event2.on('sum', (a, b) => {
	console.log(a, b)
})
```
