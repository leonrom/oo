/* global document, window, console, alert*/
/* exported olga_menuPopDn_Click*/
/*jshint asi:true  */
/*jshint esversion: 6*/
/**
 *  Общий модуль, обязательный при подключении одного (ли несколиких)   моулей библиотеки
 *
 * параметры могут дублироваться командной строкой вызова страницы
 **/

import { C } from '../index.js'
import { page } from './Page.js'

const
	csslist = {}, // перечень наименований создаваемых классов
	replaceTag = (tagName, change, adrName, url, errs) => {
		const addnew = document.createElement(tagName),
			regExp = new RegExp(/[\\+<>'"`=#\\/\\\\]/)
		let err = false
		for (const attr of change.attributes) {
			if (!err && attr.name.match(regExp)) {
				errs.push({ tag: tagName, ref: attr.name, txt: `cодержит кавычки или '+><=#/'` })
				err = true
			}
			else
				try {
					addnew.setAttribute(attr.name, attr.value) // здесь копирую "как есть" 
				} catch (err) {
					errs.push({ tag: tagName, ref: url, txt: (attr.name + '=' + attr.value), err: err.message })
				}
		}
		addnew.setAttribute(adrName, url)

		change.parentNode.insertBefore(addnew, change)
		change.parentNode.removeChild(change) //  ??  а вот удалять  -м.б. и не надо: для контроля

		return addnew
	},
	fillCss = W => {
		const css = W.makeCss ? W.makeCss() : '',
			head = `>>  СОЗДАНИЕ '${W.clasn}'`

		if (C.isDefined(csslist[W.clasn])) {	// т.е. класс уже был создан
			console.error('%c%s', C.consts.fmtErr, head, `классы уже были созданы`)
			return
		}
		if (!css)
			return

		const
			chs = document.head.children,
			id = W.clasn + '_internal'

		csslist[W.clasn] = css

		for (const ch of chs)
			if (ch.nodeName == "STYLE" && ch.id == id) {
				C.ConsoleError('%c%s', C.consts.fmtErr, head, `стиль id='${id}' (модуль: '${W.modul}', класс: '${W.clasn}) уже определён в документе`)
				return
			}

		if (C.consts.debug > 1)
			console.log('%c%s', C.consts.fmtOK, head, `(для модуля ${W.modul}) с id='${id}'`)

		const styl = document.createElement('style')
		styl.setAttribute('type', 'text/css')
		styl.id = id

		const moeCSS = document.head.appendChild(styl)
		moeCSS.innerHTML = css.replace(/(\/\/.*($|\n))|(\s*($|\n))/g, '\n')
		// (\/\/.*$)           мои коменты '//' до конца строки
		// (\/\*(.|\s)*?\*\/)  стандартные коменты (проверить!!! поему-то переносит строки правил)
		// (\s*$)              пустое до конца строки       
	},
	fillConsts = W => {
		// копируем константы из корневого модуля
		for (const [key, val] of Object.entries(C.consts))
			W.consts[key] = val

		// копируем константы из корневого модуля
		for (const key in C.dataset)
			if (key === name) {
				addToConsts(C.dataset[key], W.consts)
				break
			}

		// проверяю наличие и, при необходимости, добавляю заявленные			
		for (const par in W.needs)
			if (!C.isDefined(W.consts[par]))
				W.consts[par] = W.needs[par]

		Object.freeze(W.consts)
		Object.freeze(W)

		const e = new CustomEvent('o_modulReady', { detail: { modul: name } })
		window.dispatchEvent(e)
		return true
	},
	convertLinks = () => {
		const
			from = 'href',
			froms = [`${from}`, `data-${from}`, `_${from}`],
			debug = C.consts.debug,
			links = []
		for (const tag of document.head.children) {
			const attrs = tag.attributes
			if (tag.tagName.toLowerCase() == 'link' && !attrs[froms[0]]) {
				const str = attrs[froms[1]] || attrs[froms[2]]
				if (str) {
					const url = C.decodeUrl(str)
					if (url) {
						replaceTag('link', child, 'href', url, errs)
						if (debug)
							links.push({ orig: str, src: url })
					}
				}
				else
					C.ConsoleError(`обнаружен <link> без '${from}', 'data-${from}' или '_${from}': `, child.outerHTML)
			}
		}
		if (debug)
			if (links.length) C.ConsoleInfo("Скорректированны LINK'и : ", links.length, links)
			else C.ConsoleInfo("Скорректированных LINK'ов нет ")
	}
	
export function fillW(name) {
	const W = C.modules[name].mod.W
	if (W) {
		if (W.consts) {
			console.error('%c%s', C.consts.fmtErr, `Модуль '${name}' уже был инициирован `)
			return
		}

		W.consts = {}
		W.modul = name
		W.clasn = 'olga-' + name
		if (C.consts.debug > 1)
			console.log(`Регистрируется модуль '${name}'`)

		fillConsts(W)
		fillCss(W)
		if (W.prepare)
			W.prepare()
	}
	else
		if (C.consts.debug)
			console.log('%c%s', C.consts.fmtErr, ` ${name} `, ` для модуля не задан 'W'`)
}

fillW.executed = false
fillW.execute = function () {
	if (fillW.executed)
		throw new Error("fillW.execute уже выполнялось!");
	fillW.executed = true

	convertLinks()

	window.addEventListener('o_loaded', e => page.addLoaded(e))

	// варианты событий обновления странницы
	for (const eve of ['DOMContentLoaded', 'readystatechange', 'visibilitychange', 'blur'])
		document.addEventListener(eve, () => page.initPage())

// потом дать обработку всех завершений!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!	
	window.addEventListener(C.o_IamReady, () => page.finishPage(true))
}
