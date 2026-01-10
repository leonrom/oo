/* global document, window, console */
/*jshint asi:true  */
/*jshint esversion: 6*/
(function () {               // ---------------------------------------------- dbg o5dbgx ---
	'use strict'
	const
		C = window.o7.C,
		W = {
			modul: 'dbg',
			Init: DbgInit,
			curScript: document.currentScript,
			incls: ['Pos', 'Ccss', 'Logs', 'Utils', 'Events'],
		},
		wshp = (window.o7 ??= {})[W.modul] = { W },

	function DbgInit() {
		if (wshp.Pos) wshp.Pos()
		if (wshp.Ccss) wshp.Ccss()
		if (wshp.Logs) wshp.Logs()
		if (wshp.Utils) wshp.Utils()
		if (wshp.Events) wshp.Events()

		C.DispatchEvent('o_scriptDone', W.modul)
	}

	if (C.consts.nomnu || C.consts.noact)
		console.error(`DbgInit не выполняется, т.к. задано:` +
			C.consts.nomnu ? `  o_nomnu=${C.consts.nomnu}` : '' +
				C.consts.noact ? `  o_noact=${C.consts.noact}` : '')
	else {
		const nms = W.consts.load ? W.consts.load.toUpperCase() : 'U'

		if (nms.includes('P')) W.incls.names.push('Pos')
		if (nms.includes('C')) W.incls.names.push('Ccss')
		if (nms.includes('L')) W.incls.names.push('Logs')
		if (nms.includes('U')) W.incls.names.push('Utils')
		if (nms.includes('E')) W.incls.names.push('Events')
	}
})();