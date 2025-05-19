import type {
	EventMapOption,
	Options,
	Callback,
	CallbackOptions,
	OnOptions,
	CallbackInfo,
	EventMap
} from './types/index.js'
import { isObj } from './utils/isObj/index.js'
import { isString } from './utils/isString/index.js'
import { isSymbol } from './utils/isSymbol/index.js'
import { isFunction } from './utils/isFunction/index.js'
import { isArray } from './utils/isArray/index.js'
import { isUndefined } from './utils/isUndefined/index.js'

class Event<E extends EventMapOption<E>> {
	#eventMap = Object.create(null) as EventMap<E>

	/**
	 * 事件控制器
	 * @param options 配置选项
	 */
	constructor(options?: Options<E>) {
		const { eventMap = Object.create(null), ctx } = options ?? {}
		if (!isObj(eventMap)) {
			throw new TypeError('events must be an object')
		}

		const eventMapKeys = Reflect.ownKeys(eventMap)
		eventMapKeys.forEach((key) => {
			const eventOption: EventMapOption<E> = eventMap[key]
			let callbackInfoList: CallbackInfo[]
			if (isFunction<Callback>(eventOption)) {
				callbackInfoList = [
					{
						once: false,
						fn: eventOption,
						sign: Symbol()
					}
				]
			} else if (isArray(eventOption)) {
				callbackInfoList = eventOption.map((it, i) => {
					if (isFunction<Callback>(it)) {
						return {
							once: false,
							fn: it,
							sign: Symbol()
						}
					} else if (isObj<CallbackOptions>(it)) {
						if (!(isSymbol(it.sign) || isUndefined(it.sign))) {
							throw new TypeError(
								`options.eventMap${String(key)}[${i}].sign must be a symbol or undefined`
							)
						}
						if (!isFunction(it.fn)) {
							throw new TypeError(`options.eventMap${String(key)}[${i}].fn must be a function`)
						}
						return {
							once: !!it.once,
							fn: it.fn,
							sign: it.sign ?? Symbol()
						}
					}
					throw new TypeError(`options.eventMap${String(key)} must be a function or object[]`)
				})
			} else {
				throw new TypeError(`options.eventMap${String(key)} must be a function or object[]`)
			}

			// @ts-ignore
			this.#eventMap[key] = callbackInfoList
		})

		if (ctx) {
			ctx.call(this, {
				eventMap: this.#eventMap,
				self: this,
				setSelf: (key: string | symbol, value: any) => {
					// @ts-ignore
					this[key] = value
					return this
				},
				clear: (eventName) => {
					if (!(isString(eventName) || isSymbol(eventName))) {
						throw new TypeError(`eventName must be a string or symbol`)
					}
					delete this.#eventMap[eventName]
					return this
				},
				clearAll: () => {
					const eventMapKeys = Reflect.ownKeys(this.#eventMap)
					eventMapKeys.forEach((key) => {
						delete this.#eventMap[key]
					})
					return this
				}
			})
		}
	}

	#on(eventName: string | symbol, callback: Callback, once: boolean, options: OnOptions = {}): symbol {
		if (!(isString(eventName) || isSymbol(eventName))) {
			throw new TypeError('eventName must be a string or symbol')
		}

		if (!isFunction(callback)) {
			throw new TypeError('callback must be a function')
		}

		if (!isObj(options)) {
			throw new TypeError('options must be a object')
		}

		if (!(isSymbol(options.sign) || isUndefined(options.sign))) {
			throw new TypeError('options.sign must be a symbol')
		}

		const symbol: symbol = options.sign ?? Symbol()
		if (!this.#eventMap[eventName]) {
			// @ts-ignore
			this.#eventMap[eventName] = []
		}

		this.#eventMap[eventName].push({
			once,
			fn: callback,
			sign: symbol
		})

		return symbol
	}

	/**
	 * 注册一个事件
	 * @param eventName 事件名称
	 * @param callback 事件回调
	 * @param options 配置选项
	 */
	on<K extends keyof E>(
		eventName: K,
		callback: (this: Event<E>, ...args: Parameters<E[K]>) => ReturnType<E[K]>,
		options?: OnOptions
	): symbol
	/**
	 * 注册一个事件
	 * @param eventName 事件名称
	 * @param callback 事件回调
	 * @param options 配置选项
	 */
	on(eventName: string | symbol, callback: Callback<Event<E>>, options?: OnOptions): symbol
	on(eventName: string | symbol, callback: Callback<Event<E>>, options?: OnOptions): symbol {
		return this.#on(eventName, callback, false, options)
	}

	/**
	 * 注册一个一次性事件
	 * @param eventName 事件名称
	 * @param callback 事件回调
	 * @param options 配置选项
	 */
	once<K extends keyof E>(eventName: K, callback: Callback<Event<E>>, options?: OnOptions): symbol
	/**
	 * 注册一个一次性事件
	 * @param eventName 事件名称
	 * @param callback 事件回调
	 * @param options 配置选项
	 */
	once(eventName: string | symbol, callback: Callback<Event<E>>, options?: OnOptions): symbol
	once(eventName: string | symbol, callback: Callback<Event<E>>, options?: OnOptions): symbol {
		return this.#on(eventName, callback, true, options)
	}

	/**
	 * 触发指定事件
	 * @param eventName 事件名称
	 * @param args 参数列表
	 */
	emit<K extends keyof E>(this: Event<E>, eventName: K, ...args: Parameters<E[K]>): this
	/**
	 * 触发指定事件
	 * @param eventName 事件名称
	 * @param args 参数列表
	 */
	emit<K extends keyof E>(this: Event<E>, eventName: string | symbol, ...args: Parameters<E[K]>): this
	emit<K extends keyof E>(this: Event<E>, eventName: string | symbol, ...args: Parameters<E[K]>) {
		const callbackInfoArr = this.#eventMap[eventName]
		if (!callbackInfoArr) {
			logWarn(`EventBus(warn): eventName -> '${String(eventName)}' is not exist`)
			return this
		}

		for (let i = 0; i < callbackInfoArr.length; i++) {
			const { fn, once } = callbackInfoArr[i]
			try {
				fn.call(this, ...args)
			} catch (error) {
				logError(error)
			}
			if (once) {
				callbackInfoArr.splice(i, 1)
				i--
			}
		}

		if (!callbackInfoArr.length) {
			delete this.#eventMap[eventName]
		}
		return this
	}

	/**
	 * 触发指定事件
	 * @param eventName 事件名称
	 * @param args 参数列表
	 */
	emitAwait<K extends keyof E>(
		this: Event<E>,
		eventName: K,
		...args: Parameters<E[K]>
	): Promise<PromiseSettledResult<any>[]>
	/**
	 * 触发指定事件
	 * @param eventName 事件名称
	 * @param args 参数列表
	 */
	emitAwait<K extends keyof E>(
		this: Event<E>,
		eventName: string | symbol,
		...args: Parameters<E[K]>
	): Promise<PromiseSettledResult<any>[]>
	emitAwait<K extends keyof E>(this: Event<E>, eventName: string | symbol, ...args: Parameters<E[K]>) {
		const callbackInfoArr = this.#eventMap[eventName]
		if (!callbackInfoArr) {
			logWarn(`EventBus(warn): eventName -> '${String(eventName)}' is not exist`)
			return Promise.allSettled([])
		}

		const task: Promise<any>[] = []
		for (let i = 0; i < callbackInfoArr.length; i++) {
			const { fn, once } = callbackInfoArr[i]
			task.push(
				new Promise(async (resolve, reject) => {
					try {
						const result = await fn.call(this, ...args)
						resolve(result)
					} catch (error) {
						reject(error)
					}
				})
			)

			if (once) {
				callbackInfoArr.splice(i, 1)
				i--
			}
		}

		if (!callbackInfoArr.length) {
			delete this.#eventMap[eventName]
		}
		return Promise.allSettled(task)
	}

	/**
	 * 移除指定事件中的回调
	 * @param eventName 事件名称
	 * @param ref 回调函数引用或回调标识
	 */
	off<K extends keyof E>(this: Event<E>, eventName: K, ref: symbol | Callback): this
	/**
	 * 移除指定事件中的回调
	 * @param eventName 事件名称
	 * @param ref 回调函数引用或回调标识
	 */
	off<K extends keyof E>(this: Event<E>, eventName: string | symbol, ref: symbol | Callback): this
	/**
	 * 移除指定事件中的回调
	 * @param eventName 事件名称
	 * @param ref 回调函数引用或回调标识
	 */
	off<K extends keyof E>(eventName: K, ref: symbol | Callback): this {
		const callbackInfoArr = this.#eventMap[eventName]
		if (!callbackInfoArr) {
			logWarn(`EventBus(warn): eventName -> '${String(eventName)}' is not exist`)
			return this
		}

		let refField: 'sign' | 'fn'
		if (isSymbol(ref)) {
			refField = 'sign'
		} else if (isFunction(ref)) {
			refField = 'fn'
		} else {
			throw new TypeError('ref must be a symbol or function')
		}

		for (let i = 0; i < callbackInfoArr.length; i++) {
			if (callbackInfoArr[i][refField] === ref) {
				callbackInfoArr.splice(i, 1)
				i--
			}
		}

		if (!callbackInfoArr.length) {
			delete this.#eventMap[eventName]
		}
		return this
	}

	/**
	 * 通过回调标识移除事件回调
	 * @param sign 回调标识
	 */
	offBySign(sign: symbol): this {
		if (!isSymbol(sign)) {
			throw new TypeError('sign must be a symbol')
		}

		const eventMapKeys = Reflect.ownKeys(this.#eventMap)
		eventMapKeys.forEach((key) => {
			const callbackInfoArr = this.#eventMap[key] ?? []
			for (let i = 0; i < callbackInfoArr.length; i++) {
				if (callbackInfoArr[i].sign === sign) {
					callbackInfoArr.splice(i, 1)
					i--
				}
			}

			if (!callbackInfoArr.length) {
				delete this.#eventMap[key]
			}
		})

		return this
	}

	/**
	 * 判断一个事件是否存在
	 * @param eventName 事件名称
	 */
	has<K extends keyof E>(eventName: K): boolean
	/**
	 * 判断一个事件是否存在
	 * @param eventName 事件名称
	 */
	has(eventName: string | symbol): boolean
	/**
	 * 判断一个事件是否存在
	 * @param eventName 事件名称
	 */
	has<K extends keyof E>(eventName: K): boolean {
		return !!this.#eventMap[eventName]
	}

	/**
	 * 判断事件中指定的回调是否存在
	 * @param eventName 事件名称
	 * @param ref 回调函数引用或回调标识
	 */
	hasCallback<K extends keyof E>(eventName: K, ref: symbol | Callback): boolean
	/**
	 * 判断事件中指定的回调是否存在
	 * @param eventName 事件名称
	 * @param ref 回调函数引用或回调标识
	 */
	hasCallback<K extends keyof E>(eventName: string | symbol, ref: symbol | Callback): boolean
	/**
	 * 判断事件中指定的回调是否存在
	 * @param eventName 事件名称
	 * @param ref 回调函数引用或回调标识
	 */
	hasCallback<K extends keyof E>(eventName: K, ref: symbol | Callback): boolean {
		const callbackInfoArr = this.#eventMap[eventName]
		if (!callbackInfoArr) {
			return false
		}

		let refField: 'sign' | 'fn'
		if (isSymbol(ref)) {
			refField = 'sign'
		} else if (isFunction(ref)) {
			refField = 'fn'
		} else {
			throw new TypeError('ref must be a symbol or function')
		}

		return callbackInfoArr.some((callbackInfo) => callbackInfo[refField] === ref)
	}

	/**
	 * 通过回调标识判断回调是否存在
	 * @param sign 回调标识
	 */
	hasCallbackBySign(sign: symbol): boolean {
		const eventMapKeys = Reflect.ownKeys(this.#eventMap)
		for (let i = 0; i < eventMapKeys.length; i++) {
			const callbackInfoArr = this.#eventMap[eventMapKeys[i]]
			if (callbackInfoArr.some((callbackInfo) => callbackInfo.sign === sign)) {
				return true
			}
		}
		return false
	}
}

function logWarn(...data: any[]) {
	data[0] = `\x1b[33m${String(data[0])} \x1B[0m`
	log.warn(...data)
}

function logError(...data: any[]) {
	data[0] = `\x1b[31m${String(data[0])} \x1B[0m`
	log.error(...data)
}

const log = (() => {
	if (typeof console !== 'undefined') {
		return console
	} else {
		return {
			warn(..._data: any[]) {},
			error(..._data: any[]) {}
		}
	}
})()

export type * from './types/index.js'
export default Event
