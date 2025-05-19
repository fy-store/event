import { it, expect } from 'vitest'
import Event from '../index.js'

type E1 = {
	sum?(a: number, b: number): number
	set?(str: 'a' | 'b'): string
	send?(msg: any): void
}

it('new Event()', () => {
	new Event<E1>({
		eventMap: {
			sum(a, b) {
				return a + b
			},
			set(str) {
				return str
			}
		},

		ctx(ctx) {
			ctx.setSelf('a', 1)
			// @ts-ignore
			expect(ctx.self.a).toBe(1)
			expect(ctx.eventMap.sum !== undefined).toBe(true)
			expect(ctx.eventMap.set !== undefined).toBe(true)
			ctx.clear('sum')
			expect(ctx.eventMap.sum === undefined).toBe(true)
			expect(ctx.eventMap.set !== undefined).toBe(true)
			ctx.clearAll()
			expect(ctx.eventMap.sum === undefined).toBe(true)
			expect(ctx.eventMap.set === undefined).toBe(true)
		}
	})
})

it('on() and emit()', () => {
	const state = {
		sum: 0
	}
	const event = new Event<E1>()
	event.on('sum', function (a, b) {
		state.sum = a + b
	})
	expect(state.sum).toBe(0)
	event.emit('sum', 1, 2)
	expect(state.sum).toBe(3)
})

it('off()', () => {
	const state = {
		sum: 0
	}
	const event = new Event<E1>()
	function sum(a: number, b: number) {
		state.sum = a + b
	}
	event.on('sum', sum)
	expect(state.sum).toBe(0)
	event.emit('sum', 1, 2)
	expect(state.sum).toBe(3)
	event.off('sum', sum)
	event.emit('sum', 2, 2)
	expect(state.sum).toBe(3)
})

it('offBySign()', () => {
	const state = {
		sum: 0
	}
	const event = new Event<E1>()
	const sign = event.on('sum', function (a, b) {
		state.sum = a + b
	})
	expect(state.sum).toBe(0)
	event.emit('sum', 1, 2)
	expect(state.sum).toBe(3)
	event.off('sum', sign)
	event.emit('sum', 2, 2)
	expect(state.sum).toBe(3)
})

it('once()', () => {
	const state = {
		sum: 0
	}
	const event = new Event<E1>()
	event.once('sum', function (a, b) {
		state.sum = a + b
	})
	expect(state.sum).toBe(0)
	event.emit('sum', 1, 2)
	expect(state.sum).toBe(3)
	event.emit('sum', 2, 2)
	expect(state.sum).toBe(3)
})

it('has()', () => {
	const state = {
		sum: 0
	}
	const event = new Event<E1>()
	function sum(a: number, b: number) {
		state.sum = a + b
	}
	event.on('sum', sum)
	expect(event.has('sum')).toBe(true)
	event.off('sum', sum)
	expect(event.has('sum')).toBe(false)
})

it('hasCallback()', () => {
	const state = {
		sum: 0
	}
	const event = new Event<E1>()
	function sum(a: number, b: number) {
		state.sum = a + b
	}
	event.on('sum', sum)
	expect(event.hasCallback('sum', sum)).toBe(true)
	event.off('sum', sum)
	expect(event.hasCallback('sum', sum)).toBe(false)
})

it('hasCallbackBySign()', () => {
	const state = {
		sum: 0
	}
	const event = new Event<E1>()
	function sum(a: number, b: number) {
		state.sum = a + b
	}
	const sign = event.on('sum', sum)
	expect(event.hasCallbackBySign(sign)).toBe(true)
	event.off('sum', sum)
	expect(event.hasCallbackBySign(sign)).toBe(false)
})

it('emitAwait', async () => {
	type E1 = {
		sum?(): number
	}
	{
		const state = {
			sum: 0
		}
		const event = new Event<E1>()
		async function sum1() {
			return new Promise((resolve) => {
				setTimeout(() => {
					state.sum = 5
					resolve(state.sum)
				}, 100)
			})
		}
		function sum2() {
			state.sum = 1
			return state.sum
		}
		event.on('sum', sum1)
		event.on('sum', sum2)
		event.emit('sum')
		expect(state.sum).toBe(1)
	}

	{
		const state = {
			sum: 0
		}
		const event = new Event<E1>()
		async function sum1() {
			return new Promise((resolve) => {
				setTimeout(() => {
					state.sum = 5
					resolve(state.sum)
				}, 100)
			})
		}
		function sum2() {
			state.sum = 1
			return state.sum
		}
		event.on('sum', sum1)
		event.on('sum', sum2)
		expect(await event.emitAwait('sum')).toEqual([
			{
				status: 'fulfilled',
				value: 5
			},
			{
				status: 'fulfilled',
				value: 1
			}
		])
		expect(state.sum).toBe(5)
	}
})
