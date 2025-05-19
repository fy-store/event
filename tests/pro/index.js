import Event from '../../dist/index.es.js'

/**
 * @type {Event<{ sum: (a: number, b: number) => void }>}
 */
const event1 = new Event()
event1.on('sum', (a, b) => {
	console.log(a, b)
})

/**
 * @type {Event<import('./type.js').E>}
 */
const event2 = new Event()
event2.on('sum', (a, b) => {
	console.log(a, b)
})
