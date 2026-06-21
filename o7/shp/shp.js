/* global document, window */
/*jshint asi:true  */
/*jshint strict:true  */
/*jshint esversion: 6 */

import { AO7 } from './AO7.js'
import { DoChgs } from './DoChgs.js'
let C;
// import { C } from '../index.js'
import { Init } from './Init.js'
import { Frame } from './Frame.js'
import { PBases } from './PBases.js'
import { PO5shp } from './PO5shp.js'
import { Debug } from './Debug.js'

// взять из snd initByClass = (tag, C) => 
// const		
const
	modul = 'shp',
	clasn = 'olga-' + modul

export const W = Object.freeze({
	modul: modul,
	act: Object.seal({ auto: -1 }),
	prepare: function (c) {
		C = c
		Init.prepare(C, clasn)
		AO7.prepare(C)
		PBases.prepare(C)
		PO5shp.prepare(C)
		DoChgs.prepare(C)
		Frame.prepare(C)
		Debug.prepare(C)		// дать динамическую подгрузку !!!!!!!!!!!!!!!!!!!
	},
	init: function () {
		Init.init()
		if (!this.act.auto)
			window.dispatchEvent(new CustomEvent('o_done', { detail: { module: W.modul, err: false } }))
	},
	reset: function () {
		Init.reset()
	},
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
	`
});

// проверка автономности. не надо try/catch,- и так выдаст "Uncaught (in promise) TypeError: Failed to fetch"
(async function () { (await import(`../com/Auto.js`)).Auto(W) })()