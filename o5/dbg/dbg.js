/* global document, window, console */
/*jshint asi:true  */
/*jshint esversion: 6*/

import { Pos } from './Pos.js'
import { Ccss } from './Ccss.js'
// import { Logs } from './Logs.js'
// import { Utils } from './Utils.js'
import { Events } from './Events.js'

export function init(C) {
	if (C.consts.nomnu || C.consts.noact)
		console.error(`DbgInit не выполняется, т.к. задано:` +
			C.consts.nomnu ? `  o_nomnu=${C.consts.nomnu}` : '' +
				C.consts.noact ? `  o_noact=${C.consts.noact}` : '')
	else {
		if (typeof Pos !== "undefined")  Pos(C)
		if (typeof Ccss !== "undefined")  Ccss(C)
		if (typeof Logs !== "undefined")  Logs(C)
		if (typeof Utils !== "undefined")  Utils(C)
		if (typeof Events !== "undefined")  Events(C)
		if (C.consts.debug)
			console.log(`Загружен 'dbg'`)
	}
}