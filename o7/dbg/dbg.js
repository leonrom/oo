/* global document, window, console */
/*jshint asi:true  */
/*jshint esversion: 6*/

import { C } from '../index.js'
import { Pos } from './Pos.js'
import { Ccss } from './Ccss.js'
// import { Logs } from './Logs.js'
// import { Utils } from './Utils.js'
import { Events } from './Events.js'

export const W = {
	prepare: () => {
		if (C.consts.nomnu || C.consts.noact)
			console.error(`DbgInit не выполняется, т.к. задано:` +
				C.consts.nomnu ? `  nomnu=${C.consts.nomnu}` : '' +
					C.consts.noact ? `  noact=${C.consts.noact}` : '')
		else {
			if (typeof Pos !== "undefined") Pos(C)
			if (typeof Ccss !== "undefined") Ccss(C)
			if (typeof Logs !== "undefined") Logs(C)
			if (typeof Utils !== "undefined") Utils(C)
			if (typeof Events !== "undefined") Events(C)
		}
	}
}