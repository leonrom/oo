/* global document, window, console*/
/* exported olga_menuPopDn_Click*/
/*jshint asi:true  */
/*jshint esversion: 6*/

import { C } from '../index.js'

const
	Match = scls => new RegExp(`\\b` + scls + `\\b(\\s*[:;+]\\s*[^\\s:\`'"]*|([\`'"\\([])(.*?)\\2)*`),
	mquals = /\s*[:;]\s*/,
	GetTagsBy = (modul, fun, ask) => {
		const list = [],
			errs = [],
			nams = ask.split(ask.match(/;/) ? /\s*;\s*/ : /\s*,\s*/)
		for (const owner of C.owners)
			if (owner.modules.length == 0 || !modul ||
				owner.modules.find(m => { return m == modul })) {
				const Fun = owner.start[fun]
				if (Fun)
					for (const nam of nams) {
						const matches = Fun.call(owner.start, nam)
						let tags = []

						// проверяю сам тег 'olga_start'
						if (nam && owner.start.matches(nam))
							tags.push(owner.start)

						if (matches) {
							const amatches = Array.from(matches)
							tags = tags.concat(amatches)
						}

						for (const tag of tags)
							if (!list.includes(tag))
								list.push(tag)
					}
				else
					errs.push({ tag: C.MakeObjName(owner.start), Fun: fun })
			}
		if (errs.length > 0)
			C.ConsoleError(`Ошибочные запросы функций для тегов`, errs.length, errs)
		return list
	}

export function CApi() {
	Object.assign(C, {
		MakeObjName: function (obj, len) { // моё формирование имени объекта
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
		GetTagsByQueryes: (queryes, modul) => {
			return GetTagsBy(modul, 'querySelectorAll', queryes)
		},
		GetTagsByClassNames: (classnams, modul) => {
			const tags = GetTagsBy(modul, 'getElementsByClassName', classnams),
				rez = []
			for (const tag of tags)
				rez.push(tag)

			return rez
		},
		GetTagsByTagNames: (tagnams, modul) => {
			return GetTagsBy(modul, 'getElementsByTagName', tagnams)
		},
		SelectByClassName: (classnam, modul, do_not_replace_class) => {
			const
				tags = GetTagsBy(modul, 'querySelectorAll', '[class *=' + classnam + ']'),
				match = Match(classnam),
				rez = []
			for (const tag of tags) {
				// if (!tag.classList.contains(C.olga5ignore)) {
				const ms = tag.className.match(match)
				if (ms) {
					const quals = [],
						m = ms[0].trim(),
						ss = m.split(mquals)

					if (!do_not_replace_class)  // кромк IniScript-теста ВСЕГДА убираю квалификаторы
						tag.className = tag.className.replace(m, classnam + ' ')

					for (let j = 1; j < ss.length; j++)
						quals.push(ss[j].trim())
					rez.push({ tag: tag, quals: quals, origcls: ms.input })
				}
			}
			return rez
		},
		DispatchEvent: (eve, modul) => {
			if (C.consts.debug > 1) {
				console.groupCollapsed(`DispatchEvent: '${eve}' ${modulx ? (' из  ' + modulx) : ''} `)
				console.trace()
				console.groupEnd()
			}
			const e = new CustomEvent(eve, { modul: modul })
			window.dispatchEvent(e)
		},
		getAttrs: attributes => {
			const attrs = {}
			for (const attribute of attributes)
				attrs[C.Repname(attribute.name)] = C.tryToDigit(attribute.value)
			return attrs
		}
	})
}