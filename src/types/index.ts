import type Event from '../index.js'

export type GetParams<T> = T extends (...args: infer P) => any ? P : never

/** 配置选项 */
export interface Options<E extends EventMapOption<E>> {
	/** 事件配置对象, key 为事件名, 支持 symbol */
	eventMap?: E
	/** 实例上下文, 通过该钩子可以最大限度操作 EventBus 的实例 */
	ctx?: (this: Event<E>, ctx: EventCtx<E, EventMap<E>>) => void
}

/** 事件配置对象, key 为事件名, 支持 symbol */
export type EventMapOption<T> = {
	[K in keyof T]: Callback
} & {
	[k: symbol]: Callback
}

/** 事件回调函数 */
export interface Callback<Self = any, Return = any> {
	(this: Self, ...args: any[]): Return
}

export type EventMap<T = any> = {
	[K in keyof T]: CallbackInfo[]
} & {
	[k: string]: CallbackInfo[]
	[k: symbol]: CallbackInfo[]
}

export interface CallbackInfo {
	once: boolean
	sign: symbol
	fn: Callback
}

export interface EventCtx<E extends EventMapOption<E>, EM extends EventMap> {
	/** 解析后的事件对象 */
	eventMap: EM
	/** 实例引用 */
	self: Event<E>
	/** 设置实例属性 */
	setSelf(key: string | symbol, value: any): any
	/**
	 * 清除一个事件
	 * @param eventName 事件名称
	 */
	clear(eventName: string | symbol): void
	/**
	 * 清除一个事件
	 * @param eventName 事件名称
	 */
	clear(eventName: keyof E): void
	/**
	 * 清除一个事件
	 * @param eventName 事件名称
	 */
	clear(eventName: string | symbol): void
	/**
	 * 清除所有事件
	 */
	clearAll(): void
}

/** 事件回调函数配置选项 */
export interface CallbackOptions {
	/** 是否只执行一次 */
	once?: boolean
	/** 自定义标识 */
	sign?: symbol
	/** 事件回调 */
	fn: Callback
}

/** 注册事件配置选项 */
export interface OnOptions {
	/** 自定义标识 */
	sign?: symbol
}
