import { describe, it, expect } from 'vitest'
import Event from '../index.js'

describe('new Event()', () => {
	it('example Event', () => {
		expect(() => new Event()).not.toThrow()
	})

	it('example Event set options', () => {
		expect(() => {
			return new Event({
				events: {
					test() {}
				},
				onError() {},
				onWarning() {},
				ctx() {}
			})
		}).not.toThrow()
	})

	it('test ctx', () => {
		let clearAll: Function
		let clear: (eventName: string | symbol) => void
		const event = new Event({
			ctx(ctx) {
				ctx.setSelf('a', 1)
				clearAll = ctx.clearAll
				clear = ctx.clear
			}
		})

		event.on('test1', () => {})
		event.on('test2', () => {})
		event.on('test3', () => {})

		// @ts-ignore
		expect(event.a).toBe(1)
		expect(event.has('test1')).toBe(true)
		expect(event.has('test2')).toBe(true)
		expect(event.has('test3')).toBe(true)

		clear!('test1')
		expect(event.has('test1')).toBe(false)
		clearAll!()
		expect(event.has('test2')).toBe(false)
		expect(event.has('test3')).toBe(false)
	})
})
