/* global document, window */
/*jshint asi:true  */
/*jshint strict:true  */
/*jshint esversion: 6 */

// import { AO5shp } from './AO5shp.js'
// import { DoChgs } from './DoChgs.js'
import { C } from '../index.js'
import { DoInit } from './DoInit.js'
// import { Frames } from './Frames.js'
// import { PBases } from './PBases.js'
// import { PO5shp } from './PO5shp.js'


const		
W = Object.seal({
	name:'',
	class:'',
	mtags :[],
			consts: {
				_needs: `		
						shift_speed=0.5 # при Shift - замедлять вдвое;
						return_time=0.3 # при возобновлении "отмотать" 0.3 сек ;
				`},
			urlrfs: { _needs: 'btn_play=""; btn_stop=', },
		}),
	ocss = `
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
	    `
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
// 		this.aO5s = new Set() // все контролируемые aO5
// 	}
// 	observe(tag) {
// 		if (!this.tags.has(tag)) {
// 			super.observe(tag)
// 			this.tags.add(tag)
// 			// const aO5s = tag.pO5.aO5xs.T
// 			// for (const aO5 of aO5s)
// 			// 	this.aO5s.add(aO5)
// 		}
// 	}
// 	unobserve(tag) {
// 		if (this.tags.has(tag)) {
// 			super.unobserve(tag)
// 			this.tags.delete(tag)

// 			this.aO5s.length = 0
// 			for (const tag of this.tags) {
// 				const aO5s = tag.pO5.aO5ps.T
// 				for (const aO5 of aO5s)
// 					this.aO5s.add(aO5)
// 			}
// 		}
// 	}
// 	disconnect() {
// 		super.disconnect()
// 		this.tags.length = 0
// 	}
// }


export function init(C, name) {

	// debug = C.consts.debug
	W.name = name
	W.class = 'olga-'+name
    W.mtags = C.SelectByClassName(W.class, W.name)

	// console.error('ParamsFill: исправить!')
	
		C.ParamsFill(W, ocss)

	const excls = document.getElementsByClassName('o-shpNone')
	for (const excl of excls) {
		const exs = excl.querySelectorAll(`[class *=${W.class}]`)
		for (const ex of exs)
			ex.classList.add('o-shpNone')
	}

	DoInit.Init(W)

	//  признак что было активироано. А нафига? В snd тоже что-то похожее?
	let activated = false
	const
		activateEvents = ['click', 'keyup', 'resize'],
		DeActivateAll = () => {
			activated = true
			activateEvents.forEach(e => window.removeEventListener(e, DeActivateAll))
		}
	for (const event of ['click', 'keyup', 'resize'])
		window.addEventListener(event, DeActivateAll)

	if (C.consts.debug)
		console.log(`Загружен 'shp'`)
}
