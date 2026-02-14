/* global document, window, console*/
/* exported olga_menuPopDn_Click*/
/*jshint asi:true  */
/*jshint esversion: 6*/

import { C } from '../index.js'

const	
	Match = scls => new RegExp(`\\b` + scls + `\\b(\\s*[:;+]\\s*[^\\s:\`'"]*|([\`'"\\([])(.*?)\\2)*`),
	getForName = (parent, typ, name) => {
		switch (typ) {
			case 'myclass': return parent.querySelectorAll(`[class*="${name}"]`)
			case 'class': return parent.getElementsByClassName(name)
			case 'node': return parent.getElementsByTagName(name)
		}
		throw new Error(`Неопределен тип '${typ}' для выборки name='${name}'`)
		return []
	}
// Repname = name => {
// 	return name.trim().replaceAll('-', '_').toLowerCase()
// }

export function CApi() {
	Object.assign(C, {
		shmPush: (arr, obj, shm) => {
			arr.push(Object.freeze(
				Object.assign(shm ? Object.seal({ ...shm }) : {}, obj)
			))
		},
		extractQuals: (tag, className, do_not_replace_class) => {
			const
				quals = [],
				match = Match(className),
				ms = tag.className.match(match)
			if (ms) {
				const
					m = ms[0].trim(),
					ss = m.split(/\s*[:;,]\s*/)

				if (!do_not_replace_class)  // кроме IniScript-теста ВСЕГДА убираю квалификаторы
					tag.className = tag.className.replace(m, className + ' ')

				for (let j = 1; j < ss.length; j++)
					quals.push(ss[j].trim())
			}
			return quals
		},
		pagedef: { olga: null },        // описание загруженной страницы		,		
		// makeByClassName: (className, make, only1) => {	
		makeForTypName: (make, typ, name, only1) => {
			const olga = C.pagedef.olga ??= document.getElementsByClassName('olga-start')
			if (olga?.length) {	// если есть — ищем только внутри них
				for (let r = 0; r < olga.length; r++) {
					const list = getForName(olga[r], typ, name)
					for (let i = 0; i < list.length; i++) {
						make(list[i])
						if (only1)
							return
					}
				}
			}
			else {
				const list = getForName(document, typ, name)
				for (let i = 0; i < list.length; i++) {
					make(list[i])
					if (only1)
						return
				}
			}
		},
		getObjName: function (obj, len) { // моё формирование имени объекта
			if (obj) {
				const nam = Object.is(obj, window) ? '#window' : (
					Object.is(obj, document) ? '#document' : (
						// (obj.id && obj.id.length > 0) ? ('#' + obj.id) : (
						(obj.id && obj.id.length > 0) ? obj.id : (
							('[' + obj.tagName ? obj.tagName : (obj.nodeName ? obj.nodeName : '?') + ']') +
							'.' + (obj.className ? obj.className : '?')
						)
					))
				return nam.padEnd(len ? len : 0);
			}
			else
				return 'null';
		},
		// DispatchEvent: (eve, modul) => {
		// 	if (C.consts.debug > 1) {
		// 		console.groupCollapsed(`DispatchEvent: '${eve}' ${modulx ? (' из  ' + modulx) : ''} `)
		// 		console.trace()
		// 		console.groupEnd()
		// 	}
		// 	const e = new CustomEvent(eve, { modul: modul })
		// 	window.dispatchEvent(e)
		// },
		getAttrs: attributes => {
			const attrs = {}
			for (const attribute of attributes)
				attrs[attribute.name] = C.tryToDigit(attribute.value)
			// attrs[C.Repname(attribute.name)] = C.tryToDigit(attribute.value)
			return attrs
		},
		ASSERT: (cond, msg, ctx) => {
			if (!cond) {
				console.error(
					'%cASSERT FAILED:%c ' + msg,
					'color:red;font-weight:bold',
					'color:inherit',
					ctx ?? ''
				)
				debugger   // ← очень полезно
				throw new Error(msg)
			}
		}
	})
}