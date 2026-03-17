/* global document, window */
/*jshint asi:true  */
/*jshint strict:true  */
/*jshint esversion: 6 */

// import { AO7 } from './AO7.js'
// import { DoChgs } from './DoChgs.js'
import { C } from '../index.js'
import { Init } from './Init.js'
// import { Frames } from './Frames.js'
// import { PBases } from './PBases.js'
// import { PO5shp } from './PO5shp.js'

взять из snd initByClass = (tag, C) => 
// const		
// W = Object.seal({
// 	name:'',
// 	class:'',
// 	mtags :[],
// 			consts: {
// 				_needs: `		
// 						shift_speed=0.5 # при Shift - замедлять вдвое;
// 						back_time=0.3 # при возобновлении "отмотать" 0.3 сек ;
// 				`},
// 			urlrfs: { _needs: 'btn_play=""; btn_stop=', },
// 		}),
// 	ocss = `
// 			.o-shpCart {
//                 margin: 0;
// 				cursor: pointer; 
// 				position: fixed;
// 				background: none;
// 				overflow: hidden;
// 				transform: translate(0px, 0px);
// 			}
// 			.o-shpClon {
// 				display:none;
// 			}
// 	    `
// wshp.Map = class extends Map {
// 	constructor(cc = "|") {
// 		super()
// 		this.cc = cc
// 	}
// 	#normalizeKey(key) { return Array.isArray(key) ? key.join(this.cc) : key }
// 	set(key, value) { return super.set(this.#normalizeKey(key), value) }
// 	get(key) { return super.get(this.#normalizeKey(key)) }
// 	has(key) { return super.has(this.#normalizeKey(key)) }
// 	delete(key) { return super.delete(this.#normalizeKey(key)) }
// }

// wshp.IntersectionObserver = class extends IntersectionObserver {
// 	constructor(callback, options) {
// 		super(callback, options)
// 		this.tags = new Set() // Используем Set, чтобы не было дубликатов
// 		this.aO7s = new Set() // все контролируемые aO7
// 	}
// 	observe(tag) {
// 		if (!this.tags.has(tag)) {
// 			super.observe(tag)
// 			this.tags.add(tag)
// 			// const aO7s = tag.pO5.aO5xs.T
// 			// for (const aO7 of aO7s)
// 			// 	this.aO7s.add(aO7)
// 		}
// 	}
// 	unobserve(tag) {
// 		if (this.tags.has(tag)) {
// 			super.unobserve(tag)
// 			this.tags.delete(tag)

// 			this.aO7s.length = 0
// 			for (const tag of this.tags) {
// 				const aO7s = tag.pO5.aO5ps.T
// 				for (const aO7 of aO7s)
// 					this.aO7s.add(aO7)
// 			}
// 		}
// 	}
// 	disconnect() {
// 		super.disconnect()
// 		this.tags.length = 0
// 	}
// }

export const W = {
	needs: {},
	makeCss: () => `
		.o-shpCart {
            margin: 0;
			cursor: pointer; 
			position: fixed;
			background: none;
			overflow: hidden;
			transform: translate(0px, 0px);
		}
		.o-shpClon {
			display:none;
		}
	`, 
	init: () => {
		// const excls = document.getElementsByClassName('o-none')
		// for (const excl of excls) {
		// 	const exs = excl.querySelectorAll(`[class *=${W.clasn}]`)
		// 	for (const ex of exs)
		// 		ex.classList.add('o-none')
		// }

		Init.startObserver(W)

		//  признак что было активироано. А нафига? В snd тоже что-то похожее?
		let activated = false
		const
			activateEvents = ['click', 'keyup', 'resize'],
			DeActivateAll = () => {
				activated = true
				activateEvents.forEach(e => C.E.RemoveEventListener(window, e, DeActivateAll))
			}
		for (const event of ['click', 'keyup', 'resize'])
			C.E.AddEventListener(window, event, DeActivateAll)
	}
}
