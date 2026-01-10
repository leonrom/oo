/* global document, window, console, CustomEvent */
/* exported olga5_menuPopDn_Click*/
/*jshint asi:true  */
/*jshint esversion: 6*/
/**
 *  сборщик модулей ядра библиотеки
 * 
**/
// 
(function () {              // ---------------------------------------------- com ---
	'use strict';
	// let C;
	const
		C = window.o7.C,
		debug = C.consts.debug,
		W = {
			modul: 'com',
			Init: InitCom,
			incls: ['CApi', 'CConsole', 'CEncode', 'CParams', 'CPops', 'IniScripts', 'TagsRef'],
		},
		wshp = (window.o7 ??= {})[W.modul] = { W },
		LoadModuleScripts = () => {
			for (const modul in C.scrpts) {
				const scrpt = C.scrpts[modul]
				// тут проверить нужно ли оно еще
				const names = (scrpt.W?.incls || '').split(/\s*[;,]\s*/)
				for (const nam of names){
					AddSubScripts ( modul, names, scrpt.cls.script, iniFun = {}, args = [] ) 
					}
				// а если не нужно, то проверять очередность и Init()				
			}
		}
function InitCom(){
	if (debug)
		console.log(`Загружен 'com'. Начинается проверка загрузки и исполнение остальных модулей`)
	addEventListener('o_modulLoad', LoadModuleScripts)
	// wshp = C.AddModule(W)	
}
})();
/* global document, window, console*/
/* exported olga5_menuPopDn_Click*/
/*jshint asi:true  */
/*jshint esversion: 6*/
(function () {              // ---------------------------------------------- com/CApi --- 111
	'use strict'
	const
		C = window.o7.C,
		olga5_modul = 'com',
		modulname = 'CApi',
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

							// проверяю сам тег 'olga5_start'
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

	C.AddModuleSub(olga5_modul, modulname, () => {
		Object.assign(C, {
			owners: [],
			scrpts: [],
			Match: Match,
			// MyRound: s => { return Math.round(parseFloat(s)) },
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
			GetTagsByIds: (ids, modul) => {
				const nams = ids.split(/\s*,\s*/)
				nams.forEach((nam, i, nams) => { nams[i] = '#' + nam });
				return GetTagsBy(modul, 'querySelectorAll', nams.join(','))
			},
			GetTagsByClassNames: (classnams, modul) => {
				const tags = GetTagsBy(modul, 'getElementsByClassName', classnams),
					rez = []
				for (const tag of tags)
					// if (!tag.classList.contains(C.olga5ignore))
					rez.push(tag)
				return rez
			},
			GetTagsByTagNames: (tagnams, modul) => {
				return GetTagsBy(modul, 'getElementsByTagName', tagnams)
			},
			SelectByClassName: (classnam, modul, do_not_replace_class) => {
				const tags = GetTagsBy(modul, 'querySelectorAll', '[class *=' + classnam + ']'),
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
			QuerySelectorInit: (starts, scls) => {
				C.owners.splice(0, C.owners.length)

				const match = Match(scls),
					errs = []
				if (!starts || starts.length == 0)
					C.owners.push({ start: document.body, modules: [], origcls: 'document' }) // специально чуть по-иному
				else
					for (const tag of starts) {
						const quals = [],
							ms = tag.className.match(match)
						if (ms) {
							const
								m = ms[0].trim(),
								ss = m.split(mquals)

							tag.className = tag.className.replace(m, scls)// ВСЕГДА убираю квалификаторы (остальные в ms - не трогать!)

							// for (let j = 1; j < ss.length; j++) {
							// 	const modul = ss[j]

							// 	if (C.scrpts.find(scrpt => scrpt.modul == modul)) quals.push(modul)
							// 	else errs.push(modul)
							// }

							if (ss[1]) {
								const us = ss[1].split(/\s*[,]\s*/)
								for (const modul of us)
									if (C.scrpts.find(scrpt => scrpt.modul == modul)) quals.push(modul)
									else errs.push(modul)
							}
							C.owners.push({ start: tag, modules: quals, origcls: m }) // специально чуть по-иному
							if (C.consts.debug > 1)
								console.log(`${olga5_modul}/${modulname} QuerySelectorInit: id='${tag.id}',  '${m}', \n\t${quals}`)
						}
					}
				if (errs.length > 0)
					C.ConsoleError(`Неопределены квалификаторы для '${scls}': `, errs.join(', '))
			}
		})
	})
})();
/* global  window, console, Map, NamedNodeMap*/
/* exported olga5_menuPopDn_Click*/
/*jshint asi:true  */
/*jshint esversion: 6*/
/**
 * расширение логирования
 */
(function () {              // ---------------------------------------------- com/CConsole ---
	'use strict'
	const olga5_modul = 'com',
		modulname = 'CConsole',
		C = window.o7.C,
		padd = "padding-left:0.5rem;",
		clrtypes = {
			'A': "background: yellow; color: black;border: solid 3px red;",
			'E': "background: yellow; color: black;border: solid 1px gold;",
			'S': "background: blue;   color: white;border: solid 1px bisque;",
			'I': "background: beige;  color: black;border: solid 1px bisque;",
		},
		ConsoleMsg = (styp, txts, add, tab) => {
			const txt = (txts && txts[txts.length - 1] != '') ? txts + ' ' : txts,
				type = styp.substr(0, 1).toUpperCase(),
				clr1 = clrtypes[type],
				clr2 = "margin-left:0.4rem; background: white; color: black; border: solid " +
					(tab ? "1px gray;" : "1px bisque;")

			if (add === null || typeof add === 'undefined' || add === '') console.groupCollapsed('%c%s', (padd + clr1), txt)
			else
				if (Number.isInteger(add)) console.groupCollapsed('%c%s%c%s', (padd + clr1), txt, (padd), '', add + ' ')
				else console.groupCollapsed('%c%s%c%s', (padd + clr1), txt, (padd + clr2), '', add + ' ')

			const tt = []
			if (tab) {
				if (tab instanceof Array)
					tab.forEach((v, nam) => {
						let t = {}
						const // ss = [],
							O = (o) => {
								const uu = []
								if (o instanceof NamedNodeMap) {
									for (const atr of o) uu.push(atr.name + '=' + atr.value)
									return uu.join(',')
								} else if (o instanceof Object) {
									for (const x in o) uu.push(x + '=' + o[x])
									return uu.join(',')
								}
								else return (typeof o === 'undefined') ? ' `undef`' : (o == null ? '`null`' : o.toString())
							}
						let s = ''
						if (v instanceof Map) {
							v.forEach((x, nam) => s += (s == '' ? '' : ', ') + nam + ':' + x.toString())
							t[nam].val = '{' + s + '}'
						} else if (v instanceof Array) {
							v.forEach(x => s += (s == '' ? '' : ', ') + x)
							t[nam].val = '{' + s + '}'
						} else if (v instanceof Object) {
							for (const x in v)
								t[x] = O(v[x])
						} else
							t = v //t[nam] = v
						tt.push(t)
					})
				else if (tab instanceof Map)
					tab.forEach((v, nam) => {
						const t = { nam: nam }
						let s = ''
						if (v instanceof Map) {
							v.forEach((x, nam) => s += (s == '' ? '' : ', ') + nam + ':' + x.toString())
							t.val = '{' + s + '}'
						} else if (v instanceof Array) {
							v.forEach(x => s += (s == '' ? '' : ', ') + x)
							t.val = '{' + s + '}'
						} else if (v instanceof Object) {
							for (const x in v) s += (s == '' ? '' : ', ') + x + ':' + v[x]
							t.val = '{' + s + '}'
						} else
							t.val = v
						tt.push(t)
					})
				else for (const t in tab) {
					const v = tab[t]
					if (!t.match(/^\d*$/) && typeof v !== 'function')
						if (typeof v !== 'object') tt.push({ nam: t, val: v })
						else {
							const r = { nam: t }
							if (Array.isArray(v))
								for (let i = 0; i < v.length; i++)
									r['№-' + i] = v[i]
							else
								for (const x in v)
									r[x] = v[x]

							tt.push(r)
						}
				}
				if (tt.length > 0) {
					console.table(tt)
				}
			}
			console.table()
			{
				console.groupCollapsed(`трассировка вызова`)
				console.trace()
				console.groupEnd()
			}
			console.groupEnd()
		},
		ConsoleLog = (head, text, err, xy, add) => {
			const duration = 2222,
				fmt = err ?
					"background: greenyellow; color: black;" :
					"background: darkseagreen; color: black;",
				pos = xy ? xy : {
					x: window.innerWidth / 2,
					y: window.innerHeight / 2,
				}

			console.log("%c%s", fmt, head, text, add||'')

			if (err){
			const div = document.createElement('div')
			Object.assign(div.style, {
				top: (pos.y -12)+ 'px',
				left: pos.x + 'px',
				position: 'fixed',
				transform: 'translateX(-50%)',
				padding: '10px 20px',
				border: '1px solid rgb(204, 204, 204)',
				backgroundColor: ' lightyellow',
				borderRadius: '5px',
				boxShadow: 'rgba(0, 0, 0, 0.3) 0px 2px 6px',
				zIndex: 9999,
				fontFamily: 'sans-serif',
				fontSize: '14px',
				maxWidth: '60%',
				whiteSpace: 'pre-line',
			})
			div.textContent = text 		//+ '\n(см. console.log)'

			document.body.appendChild(div)

			setTimeout(() => { div.remove(); }, duration)}
		}

	C.AddModuleSub(olga5_modul, modulname, () => {
		Object.assign(C, {
			ConsoleMsg: ConsoleMsg,
			ConsoleAlert: (txt, add, tab) => ConsoleMsg('alert', txt, add, tab),
			ConsoleError: (txt, add, tab) => ConsoleMsg('error', txt, add, tab),
			ConsoleSign: (txt, add, tab) => ConsoleMsg('sign', txt, add, tab),
			ConsoleInfo: (txt, add, tab) => ConsoleMsg('info', txt, add, tab),
			ConsoleLog: (head, text, err, xy, add) => ConsoleLog(head, text, err, xy, add),
		})
		return true
	} )
})();
/* global  window*/
/* exported olga5_menuPopDn_Click*/
/*jshint asi:true  */
/*jshint esversion: 6*/
/* eslint-disable no-prototype-builtins */
(function () {              // ---------------------------------------------- com/CEncode ---
	'use strict'
	const olga5_modul = 'com',
		modulname = 'CEncode',
		C = window.o7.C,
		DelBacks = (s0) => {
			// const s00 = s0
			let n = 0
			const mrkN = '\n',
				mrk2 = '..'
			do {
				const l = s0.length,
					// eslint-disable-next-line no-useless-escape
					m1 = s0.match(/\.\.[^\/]/)
				if (m1) s0 = s0.substr(0, m1.index + 2) + '/' + s0.substr(m1.index + 2)

				const
					// eslint-disable-next-line no-useless-escape
					m2 = s0.match(/[^\/]\.\./)
				if (m2) s0 = s0.substr(0, m2.index + 1) + '/' + s0.substr(m2.index + 1)
				if (l == s0.length) break
			} while (n++ < 99)

			const s2s = s0.split('/')
			// tt = []
			for (let i = 0; i < s2s.length; i++)
				if (s2s[i] == mrk2) {
					let j = i
					while (j-- > 0)
						if (s2s[j] != mrkN && s2s[j] != mrk2 && s2s[j] != '') {
							s2s[j] = mrkN
							s2s[i] = ''
							break
						}
				}

			let i = s2s.length
			while (i-- > 0)
				if (s2s[i] == mrkN || (i > 0 && s2s[i] == '' && s2s[i - 1] == ''))
					s2s.splice(i, 1)

			const s = s2s.join('/').replaceAll(/\/\.\//g, '/')
			return s.replaceAll(/[^:]\/\/+/g, (u) => { return u.substr(0, 2) })
		},
		// IsUrlNam = u => { return !!(u.trim() && !u.match(/[\/.\\#]/)) },
		IsUrlNam = u => {
			// eslint-disable-next-line no-useless-escape
			const isurl = !!(u && u.trim() && !u.match(/[\/.\\#]/))
			return isurl
		},
		IsFullUrl = url => {
			return url.match(/^https?:/i) ||
				url.match(/^\s*\/*\s*(((\d{1,3}\.){3}\d{1,3})|localhost)\//i)
		},

		GetAttribute = (attrs, name) => { // нахождение значения 'attr' в массиве атрибутов 'attrs'
			for (const nam of [name, 'data-' + name, '_' + name])
				if (C.HasProperty(attrs, nam)) return attrs[nam]
		},
		DeCodeUrl = function (urlrfs, url, o5attrs = null) { // старое DeCodeUrl
			if (url.match(/^\s*data:/)) {
				return { url: url.trim(), err: '', num: 0 }
			}
			// if (url.match('myTunes-icon'))					
			// 	console.log(121212)				
			const errs = [],
				parts = [],
				Replace4320 = u =>
					u.replaceAll(/(&#43;)/g, '+').replaceAll(/(%20|&nbsp;)/g, ' ').trim(), // давать в такой очерёдностии, иначе снова вернёт %20 !,
				IsCompaund = orig => orig && (orig.includes('+') || IsUrlNam(orig)),
				SplitRefs = (s, refs = null) => {
					const sprts = s.split('+')
					for (const sprt of sprts) {
						const prt = sprt.replace(/^(['"`])([\s\S]*)\1$/, '$2') // replace(C.consts.repQuotes, ''),	// trim(),
							isnam = IsUrlNam(prt),
							ref = isnam ? C.Repname(prt) : prt

						if (isnam) parts.num++
						if (refs && refs.find(r => ref == r))
							errs.push(`цикл. ссылки ${refs.join('->')}=>${ref};`)
						else {
							const attr = (isnam && o5attrs) ? GetAttribute(o5attrs, ref) : null

							if (attr) {
								if (!refs) refs = []
								refs.push(ref)
								SplitRefs(attr, refs)
							}
							else if (isnam) {
								if (urlrfs[ref]) SplitRefs(urlrfs[ref], refs)
								else
									errs.push(`неопр.: '${prt}` + (prt != ref ? ` (т.е. '${ref})` : ''))
							}
							else
								parts.push(ref)
						}
					}
				},
				ss = url.split('?'),
				orig = Replace4320(ss[0].trim()),
				ret = { url: url, err: '', num: 0 }

			if (IsCompaund(orig)) {
				Object.assign(parts, { num: 0, rght: ss[1] ? ('?' + ss[1]) : '' })

				SplitRefs(orig)

				let urld = ''
				for (const part of parts)
					if (urld && part && urld[urld.length - 1] != '/' && part[0] != '/') urld = urld + '/' + part
					else urld = ((urld ? urld : '') + (part ? part : ''))
				// console.log(orig, urld)
				if (urld) {
					if (!IsFullUrl(urld)) {
						if (parts[0] == '') urld = C.urlrfs._olga + urld
						else 
							urld = C.urlrfs._html + urld

						if (!IsFullUrl(urld)) {  // если всё еще нету
							const hr = new window.URL(window.location).href
							urld = hr.substring(0, hr.lastIndexOf('/') + 1) + urld
						}
					}
					urld = DelBacks(urld) + parts.rght
				}
				Object.assign(ret, {
					url: urld,
					err: errs.length > 0 ? errs.join(', ') : (urld ? '' : `пустой 'url'`),
					num: parts.num
				})
			}
			return ret
		},
		TagDes = (tag, ref, errs = null) => {
			const
				regExp1 = /(.*(\/|\+)\s*)|(!*\.js\s*$)/g,
				regExp2 = /(\s*\+\s*)+/g
			for (const code of ['data-', '_', '']) {
				const from = code + ref,
					attr = tag.attributes[from]
				if (attr) {
					const orig = attr.nodeValue.replace(/\s+/g, '')

					return {
						code: code,
						from: from,
						modul: orig.replace(regExp1, ''),
						orig: orig,
						trans: !!(orig.match(regExp2) || IsUrlNam(orig)),
					}
				}
			}
			if (errs)
				errs.push({ tag: C.MakeObjName(tag), ref: ref, txt: 'не определены атрибуты' })
		}

	C.AddModuleSub(olga5_modul, modulname, () => {
		Object.assign(C, {
			TagDes: TagDes,
			DelBacks: DelBacks,
			IsFullUrl: IsFullUrl,
			DeCodeUrl: DeCodeUrl,
			GetAttribute:GetAttribute,
		})
		return true
	})
})();
/* global document, window, console, alert*/
/* exported olga5_menuPopDn_Click*/
/*jshint asi:true  */
/*jshint esversion: 6*/
/**
 *  Общий модуль, обязательный при подключении одного (ли несколиких)   моулей библиотеки
 *
 * параметры могут дублироваться командной строкой вызова страницы
 **/

(function () {              // ---------------------------------------------- com/CParams ---
	'use strict'
	const olga5_modul = 'com',
		modulname = 'CParams',
		C = window.o7.C,
		debug=C.consts.debug,
		csslist = {}, // перечень наименований создаваемых классо
		SplitParams = (s, parnam, dlms = ';') => {
			const errs = [],
				params = {},
				regexp = new RegExp('\\s*[' + dlms + ']\\s*', 'g'),

				regcomments = /(\s+\/\/|#).*?(\n|$|;)/g,

				x = s.replace(/\/\*(.|\n)*?\*\//gm, '').
					replace(regcomments, ';'),		 // убрал оба типа коментов
				spairs = x.trim().split(regexp)

			// const
			// 	match= new RegExp(`\\s*[${dlms}]\\s*$`),
			// 	spairs = []

			// for (const m of mm)
			// 	spairs.push(m[0].replace(/\s+/g, ''))
			// // ,m2=s(Symbol.matchAll(regexp))

			if (debug > 0) {
				const comments = s.match(regcomments)
				if (comments)
					comments.forEach(comment => {
						if (comment.match(/[^=]=[^=]/))
							errs.push({ par: comment, err: `в комменте подозрительный одиночный '='` })
					})
			}

			for (const spair of spairs)
				if (spair) {
					const pair = spair.split(/\s*=\s*/),
						nam = C.Repname(pair[0].trim())
					if (params[nam])	
						errs.push({ par: spair, err: `повтор '${nam}' (замена)` })
										
					if (pair.length == 1) {
						params[nam] = true
						errs.push({ par: spair, err: `отсутствие '=' (принято =true)` })
					}
					else {
						const val = (pair[1] || '').replace(C.repQuote2, '')
						
						if (nam) params[nam] = C.TryToDigit(val)
						else
							if (val.length > 1)
								errs.push({ par: spair, err: `у параметра (с val='${val}') нет имени` })
					}
				}

			if (errs.length > 0)
				C.ConsoleError(`Разбор  параметров `, parnam, errs)

			return params
		},
		DeCodeUrlRfs = (urlrfs, modul) => {
			const urlerrs = [],
				urlsets = []

			for (const nam in urlrfs) {
				const val = urlrfs[nam]
				// if (val.match('myMusikIT'))					
				// console.log(121212)		isurl		
				if (val != null && typeof val !== 'undefined') {
					if (!val.replace)
						alert('значение URL - не строка')
					const url = val.replace(/^(['"`])([\s\S]*)\1$/, '$2'), //replace(C.consts.repQuotes, ''),
						wref = C.DeCodeUrl(urlrfs, url)

					if (wref.err.length > 0)
						urlerrs.push({ ori: nam, err: wref.err, url: url })
					urlsets.push({ nam: nam, url: wref.url, 'ориг.': (wref.url != url) ? url : '-"-' })
					urlrfs[nam] = wref.url
				} else
					urlerrs.push({ ori: nam, err: `не определено`, url: '' })
			}

			if (debug > 0 && urlsets.length == 0)
				C.ConsoleInfo(`${modul}: именованные ссылки отсутствуют`, '   ?')

			if (urlerrs.length > 0)
				C.ConsoleError(`${modul}: недоопределённые ссылки`, urlerrs.length, urlerrs)
		},
		// CopyVals = (xs, c, type) => {
		// 	for (const nam in c) {
		// 		const x = xs.find(x => x.nam == nam)
		// 		if (x) Object.assign(x, { val: c[nam], source: type })
		// 		else xs.push({ nam: nam, val: c[nam], source: type })
		// 	}
		// },
		InitCSS = (W, o5css) => {
			const chs = document.head.children,
				id = W.class + '_internal',
				cmodul = csslist[W.class]
			let err = ''

			if (typeof cmodul === 'undefined') {
				for (const ch of chs)
					if (ch.nodeName == "STYLE" && ch.id == id) {
						err = `Стиль id='${id}' (модуль: '${W.modul}', класс: '${W.class}) уже определён в документе`
						break
					}
			} else
				if (cmodul != W.modul) err = `Класс '${W.class}' повторяется в модулях '${cmodul}' и '${W.modul}. '`

			if (err) C.ConsoleError('>>  создание CSS  ' + err, 'InitCSS')
			else {
				if (debug > 1)
					console.log(`>>  СОЗДАНИЕ CSS   ${W.class} (для модуля ${W.modul}) с id='${id}'`)
				csslist[W.class] = W.modul

				const styl = document.createElement('style')
				styl.setAttribute('type', 'text/css')
				styl.id = id

				const moeCSS = document.head.appendChild(styl)
				moeCSS.innerHTML = o5css.replace(/(\/\/.*($|\n))|(\s*($|\n))/g, '\n')
				// (\/\/.*$)           мои коменты '//' до конца строки
				// (\/\*(.|\s)*?\*\/)  стандартные коменты (проверить!!! поему-то переносит строки правил)
				// (\s*$)              пустое до конца строки       
			}
		},
		PrintParams = (modul, xs, p, n1) => {
			let n2 = 0
			// eslint-disable-next-line no-unused-vars
			for (const nam in xs) n2++
			C.ConsoleInfo(`${modul}: все '${p}' `, `${('' + n2).padStart(2)} (своих=${('' + n1).padStart(2)})`, xs)
		},
        GetAttrs=(attributes) =>{
            const attrs = {}
            for (const attribute of attributes)
                attrs[this.Repname(attribute.name)] = this.TryToDigit(attribute.value)
            return attrs
        },
		ParamsFill = function (W, o5css) {
			if (W.isReady)
				return

			const scrpt = C.scrpts.find(scrpt => scrpt.modul == W.modul)

			if (!scrpt) {
				C.ConsoleError(`В 'C.scrpts' не наден модуль `, W.modul)
				return
			}

			if (o5css) InitCSS(W, o5css)

			const m1 = /\s+|\/\/.*$/gm,
				isnew = !!scrpt.script,
				attrs = isnew ? C.GetAttrs(scrpt.W.curScript.attributes) : C.o5attrsParamsFillFromScript

			if (!W.origs)
				W.origs = {
					consts: (W.consts || '').replace(m1, ''),
					urlrfs: (W.urlrfs || '').replace(m1, '')
				}

			for (const p of ['consts', 'urlrfs']) {
				const xs = {} // временное хранилилище для считываемых параметров

				/* eslint-disable no-prototype-builtins */
				for (const nam in C[p]) {
					const source = C.constsurl.hasOwnProperty(nam) ? C.save.urlName : `ядро`
					if (!xs.hasOwnProperty(nam))
						xs[nam] = { val: C[p][nam], source: source }
				}
				/* eslint-enable no-prototype-builtins */

				if (isnew) {
					const askps = SplitParams(W.origs[p], p, ';'),
						n1 = C.ParamsFillFromScript(xs, askps, attrs, p)

					W[p] = {}	// преобразовываю в объект
					if (p == 'urlrfs') {
						const urls = {}
						for (const nam in xs) urls[nam] = xs[nam].val
						DeCodeUrlRfs(urls, `${W.modul}: `)
						for (const nam in xs)
							xs[nam].url = urls[nam]
					}
					else
						// for (const nam in C.constsurl)
						// 	if (xs[nam].source != C.save.urlName)
						// 		Object.assign(xs[nam], { val: C.constsurl[nam], source: `${C.save.urlName}(восстановил)` })

					for (const nam in xs)
						W[p][nam] = xs[nam].val

					if (debug > 0) PrintParams(W.modul, xs, p, n1)
				}
				else
					if (debug > 0) C.ConsoleInfo(`${W.modul}: параметры и ссылки берутся только из скрипта ядра библиотеки`)
			}
		}

	C.AddModuleSub(olga5_modul, modulname, url_olga5 => {
		C.urlrfs._olga = url_olga5

		Object.assign(C, {
			GetAttrs: GetAttrs,
			ParamsFill: ParamsFill,
			SplitParams: SplitParams,
		})

		// if (debug > 0) PrintParams(C.save.libName, C.save.xs, C.save.p, C.save.n1)

		const p = 'urlrfs',
			xs = {}, // временное хранилилище для считываемых параметров
			defs = C[p]
/*  ???????????????????????????
		const n1 = C.ParamsFillFromScript(xs, defs, C.o5attrs, p)
		for (const nam in xs) defs[nam] = xs[nam].val
		DeCodeUrlRfs(defs, C.save.libName)
		for (const nam in defs) { xs[nam].url = defs[nam] }
		if (debug > 0) PrintParams(C.save.libName, xs, p, n1)
*/
		return true
	})
})();
/* global document, window,  */
/* exported olga5_menuPopDn_Click*/
/*jshint asi:true  */
/*jshint esversion: 6*/
(function () {              // ---------------------------------------------- com/CEncode ---
	'use strict'
	let diva = null

	const olga5_modul = 'com',
		modulname = 'CPops',
		C = window.o7.C,
		wp = { W: 0, H: 0 },
		divs = [],
		zIndex = 99999,

		SetVP = () => {
			const w = window.visualViewport,
				W = w ? w.width : window.innerWidth,
				H = w ? w.height : window.innerHeight
			Object.assign(wp, { W, H })
		},
		Resize = () => {
			SetVP()
			for (const div of divs) {
				const ao5 = div.ao5pps,
					dx = ao5.L + ao5.W - wp.W,
					dy = ao5.T + ao5.H - wp.H

				if (dx > 0) {
					const L = ao5.L - dx;
					if (L < ao5.L) {
						div.style.left = L + 'px';
						ao5.L = L
					}
				}
				if (dy > 0) {
					const T = ao5.T - dy;
					if (T < ao5.T) {
						div.style.top = T + 'px';
						ao5.T = T
					}
				}
			}
		},
		StopEvent = e => {
			e.cancelBubble = true
			e.stopPropagation()
			e.preventDefault()
		},
		MouseMove = e => {
			// console.log(`(окно): x=pageY =${parseInt(e.pageX)}, (экран): screenY =${parseInt(e.screenX)}`)
			if (!diva)
				return
			StopEvent(e)

			const div = diva,
				ao5 = div.ao5pps,
				ux = e.x - ao5.ux,
				uy = e.y - ao5.uy,
				dx = e.x + ao5.dx,
				dy = e.y + ao5.dy,
				state = ao5.state,
				old = { L: 0, T: 0, W: 0, H: 0 }

			Object.assign(old, { L: ao5.L, T: ao5.T, W: ao5.W, H: ao5.H })

			if (state.includes('M')) { ao5.L = ux; ao5.T = uy; }
			if (state.includes('R')) ao5.W = dx - ao5.L;  // именно такая очередность, чтобы не переопределяло
			if (state.includes('B')) ao5.H = dy - ao5.T;
			if (state.includes('L')) { ao5.W -= ux - ao5.L; ao5.L = ux }
			if (state.includes('T')) { ao5.H -= uy - ao5.T; ao5.T = uy }

			if (ao5.L < 0 || ao5.L + ao5.W > wp.W || ao5.d > ao5.W) Object.assign(ao5, { L: old.L, W: old.W })
			if (ao5.T < 0 || ao5.T + ao5.H > wp.H || ao5.d > ao5.H) Object.assign(ao5, { T: old.T, H: old.H })

			Object.assign(div.style, { left: ao5.L + 'px', top: ao5.T + 'px', width: ao5.W + 'px', height: ao5.H + 'px' })
		},
		SetCursors = (div, ao5) => {
			/*
					nwse-  nw-       ns- n-	      nesw- ne-
								+--------------+  
					ew-    e-   | grab grabbing|  ew-   w-   
								+--------------+ 
					nesw-  sw-       ns-  s-      nwse- se-
			*/
			let cursor = ''
			switch (div.ao5pps.state) {
				case 'M': cursor = ao5 ? 'grabbing' : 'grab'; break
				case 'L': cursor = ao5 ? 'ew-resize' : 'e-resize'; break
				case 'R': cursor = ao5 ? 'ew-resize' : 'w-resize'; break
				case 'T': cursor = ao5 ? 'ns-resize' : 'n-resize'; break
				case 'B': cursor = ao5 ? 'ns-resize' : 's-resize'; break
				case 'LT': cursor = ao5 ? 'nwse-resize' : 'nw-resize'; break
				case 'RB': cursor = ao5 ? 'nwse-resize' : 'se-resize'; break
				case 'LB': cursor = ao5 ? 'nesw-resize' : 'sw-resize'; break
				case 'RT': cursor = ao5 ? 'nesw-resize' : 'ne-resize'; break
				default: cursor = 'pointer'
			}
			div.style.cursor = cursor
			div.style.outlineWidth = ao5 ? 2 : 0
		},
		GetDivN = div => {
			let i = divs.length
			while (i-- > 0)
				if (divs[i] == div)
					return i
			return -1
		},
		ReIndex = () => {
			for (let j = 0; j < divs.length; j++)
				divs[j].style.zIndex = zIndex + j
		},
		PopO6Close = div => {
			const i = GetDivN(div)
			if (i >= 0) {
				divs[i].ao5pps.ShowAct(divs[i], false)
				divs.splice(i, 1)
			}
			div.parentNode.removeChild(div);
			ReIndex()
		},
		PopO6Create = (pos, html, ShowAct, n) => {
			const
				EmptyAct = () => {
					// просто заглушка на случай незадани ShowAct()
				},
				DivAct = e => {
					const div = e.currentTarget,
						i = GetDivN(div)
					if (i >= 0 && i < divs.length - 1) { // если этот div не есть последний - таки ставит его в конец
						divs.splice(i, 1)
						divs.push(div)
						ReIndex()
					}
				},
				DivDown = e => {
					if (diva) return

					StopEvent(e)
					DivAct(e)

					const div = e.currentTarget

					if (div.classList.contains('cellD_2')) return

					const ao5 = div.ao5pps

					ao5.ux = e.x - ao5.L
					ao5.uy = e.y - ao5.T
					ao5.dx = ao5.L + ao5.W - e.x
					ao5.dy = ao5.T + ao5.H - e.y
					SetCursors(div, true)

					diva = div
				},
				DivMove = e => {
					if (diva) return
					StopEvent(e)

					const div = e.currentTarget,
						ao5 = div.ao5pps

					const d = ao5.d,
						isT = (e.y - ao5.T < d),
						isB = (ao5.T + ao5.H - e.y < d)

					let state = ''
					if ((e.x - ao5.L < d)) {
						if (isT) state = 'LT'; else if (isB) state = 'LB'; else state = 'L'
					} else if (ao5.L + ao5.W - e.x < d) {
						if (isT) state = 'RT'; else if (isB) state = 'RB'; else state = 'R'
					}
					else if (isT) state = 'T'
					else if (isB) state = 'B'
					else state = 'M'

					if (state != ao5.state) {
						ao5.state = state
						SetCursors(div, false)
					}
				},
				DivClose = e => {
					PopO6Close(e.currentTarget)
				}

			while (n && divs.length >= n)
				PopO6Close(divs[0])

			const div = document.createElement('div')

			div.ao5pps = {
				d: 8, state: '', new: true,
				L: pos.L, T: pos.T, W: pos.W, H: pos.H, 	//  абсолютные позиция на экране (getBoundingClientRect())
				ux: 0, uy: 0, dx: 0, dy: 0,	//  позиция мышки на div'е
				ShowAct: ShowAct || EmptyAct,
			}
			Object.seal(div.ao5pps)

			Object.assign(div.style, {
				left: pos.L + 'px', top: pos.T + 'px',
				width: pos.W + 'px', height: pos.H + 'px'
			})

			div.innerHTML = html
			div.id = '223'

			// ShowAct(div, true)

			document.body.appendChild(div)
			divs.push(div)
			ReIndex()
			Resize()

			div.addEventListener('activate', DivAct)
			div.addEventListener('mousedown', DivDown)
			div.addEventListener('mousemove', DivMove)
			div.addEventListener('dblclick', DivClose)

			return div
		}
		
Object.assign(C, {
			PopO6Create: PopO6Create,
			PopO6Close: PopO6Close,
		})

	C.AddModuleSub(olga5_modul, modulname, () => {

		SetVP()
		document.addEventListener('mousemove', MouseMove, { capture: true })

		document.addEventListener('mouseup', e => {
			if (diva) {
				StopEvent(e)
				SetCursors(diva, false)
				diva = null
			}
		})

		window.addEventListener('resize', Resize)

		
		return true
	})
})();
/* global document, window, console*/
/* exported olga5_menuPopDn_Click*/
/*jshint asi:true  */
/*jshint esversion: 6*/
/**
 *  загрузка (при необходимости) и инициализация подключаемых скриптов
 **/
//
(function () {              // ---------------------------------------------- com/IniScripts ---
	'use strict'
	const
		C = window.o7.C,
		debug = C.consts.debug,
		olga5_modul = 'com',
		modulname = 'IniScripts',
		clrPage = "background: green;color:white;",
		clrMy = "background: blue; color: white;border: none;"

	class MyEvents {
		static doceves = ['DOMContentLoaded', 'readystatechange', 'visibilitychange', 'blur']

		constructor(list) {
			const
				eves = list.trim().split(/\s*[,;]\s*/) || [],
				errs = []

			this.meves = []
			for (const eve of eves) {
				const ss = eve.trim().split(/\s*[:]\s*/)
				if (ss[0].length > 0) {
					const eve = ss[0],
						ers = []
					let isd = MyEvents.doceves.includes(eve),
						isu = false

					for (let i = 1; i < ss.length; i++)
						if (ss[i])
							switch (ss[i][0].toUpperCase()) {
								case 'W': isd = 'W'
									break
								case 'D': isd = 'D'
									break
								case 'U': isu = true
									break
								default: "'" + ers.push(ss[i]) + "'"
							}
					this.meves.push({ eve: eve, isd: isd, isu: isu })
					if (ers.length > 0)
						errs.push(`${eve}: ${ers.join(', ')}`)
				}
				if (errs.length > 0)
					C.ConsoleError(`Недопустимые ('W','D','U') квалификаторы событий`, errs.length, errs)
			}
			Object.freeze(this)
		}
		AddEvents(Fun) {
			for (const meve of this.meves)
				(meve.isd ? document : window).addEventListener(meve.eve, Fun, true)
		}
		RemEvents(Fun) {
			for (const meve of this.meves)
				(meve.isd ? document : window).removeEventListener(meve.eve, Fun, true)
		}
	}

	class MyTimer {
		constructor(text) {
			this.text = text
			this.act = { time: 0, name: '' }
			Object.seal(this.act)
			Object.freeze(this)
		}
		Stop(add) {
			// console.log('...=', this.act.time,  this.act.name)
			if (this.act.time) {
				const dt = (' ' + (Number(new Date()) - this.act.time)).padStart(8) + ' ms',
					name = dt + ' ' + this.act.name.padStart(12)
				if (add)
					console.error('%c%s', "background: yellow; color: black;border: none;",
						this.text + name + ' [' + add + ']')
				else {
					console.log('%c%s', clrMy, this.text, name)
					this.act.time = 0
				}
			}
		}
		Start(name, iso5inc) {
			if (this.act.time && !iso5inc)
				this.Stop('не закончено')

			this.act.time = Number(new Date())
			this.act.name = name
			// console.log('...+', this.act.time,  this.act.name)
		}
	}

	const
		// DocURL = () => document.URL.match(/[^?&#]*/)[0].trim(),
		/**
		 * InitScripts(nam) - выполнение очередного требуемого скрипта
		 * 			ВЫЗЫВАЕТСЯ: 
		 * 				- в конце инициализации данного скрипта
		 * 				- по событиям загрузки и/или обновления документа
		 * 				- по событиям загрузки и/или инициализаации очередного скрипта
		 * 			ВЫПОЛНЯЕТСЯ если документ содержит тег '.olga-start' (или загружен тест)
		 * 				или документ уже загружен/обновлён, или вызов был по обновлению документа
		 * @param {nam} наименование скрипта (для протокола)
		 * @param {isok}  необязательный признак готовности документа (наименование события)
		 */
		InitScripts = nam => {
			const ready = C.page && C.page.pact && C.page.pact.ready,
				start = C.page.pact.start,
				head = ' ______ InitScripts _____   '

			if (debug > 1)
				console.log(`${head} ${nam} ${ready ? '' : ' не готово - выход'}`)

			if (!ready)
				return
			for (const scrpt of C.scrpts) {
				if (!scrpt.timera)
					scrpt.timera = new MyTimer(` инициирован `)
				if (start != scrpt.start && scrpt.W && !scrpt.W.incls)
					if (scrpt.need && scrpt.W.Init) {
						const depend = scrpt.depends.find(depend => (depend.act.need && depend.act.done != start))
						if (!depend) {
							if (debug > 1)
								console.log(`${head} начало нинициализации  ${scrpt.W.modul} `)
							scrpt.start = start
							scrpt.timera.Start(act.W.modul)
							scrpt.W.Init()
						}
					} else
						Object.assign(act, { start: start, done: start })
			}
		},
		ScriptDone = e => {	//  завершение инициализации очередного скрипта
			if (!e.detail || !e.detail.modul) {
				C.page.errs.push({ modul: '?', err: `для события '${e.type}' НЕ указан 'detail' или 'detail.modul'` })
				return
			}

			const modul = e.detail.modul.trim(),
				scrpt = C.scrpts.find(scrpt => scrpt.modul == modul),
				start = C.page.pact.start,
				lefts = []
			C.scrpts.forEach(scr => {
				if (scr.modul != modul && scr.act.done != start && scr.act.need)
					lefts.push(scr.modul)
			})
			if (debug > 1) {
				console.log(`- - > после инициализации '${modul}': ` +
					(lefts.length > 0 ? `осталось:  ${lefts.join(', ')}` : ` не осталось`))
			}
			if (scrpt) {
				const act = scrpt.act
				act.timera.Stop('')
				act.done = act.start

				if (lefts.length > 0) InitScripts(`инициирован '${modul}'`)
				else
					ScriptsFinish(C.page, 0)
			} else
				C.page.errs.push({ modul: modul, err: `для события '${e.type}' указан несуществующий модуль` })
		},
		ScriptLoad = e => {	// завершение загрузки очередного скрипта
			const start = C.page.pact.start,
				newloads = [],
				Included = modul => {
					const nam = `загружены включения для '${modul}'`,
						scrpt = C.scrpts.find(scrpt => scrpt.modul == modul)
					if (debug > 0)
						console.log(`ScriptLoad: '${nam}'`)

					scrpt.act.incls = ''
					// const debug = window.open("", "", "width=200,height=100");
					InitScripts(nam)
				}

			if (debug > 1)
				console.log('- - > после загрузки ' + (e ? ` '${e.detail.modul}'` : ` ядра`))
			for (const scrpt of C.scrpts) {
				const w = scrpt.act.W || window.o7.find(x => x.modul == scrpt.modul)
				if (w) {
					if (scrpt.act.start != start || !scrpt.act.W) {
						scrpt.act.W = w
						newloads.push(w.modul)
					}
					if (w.incls && scrpt.W.incls == null) {
						scrpt.W.incls = w.incls
						C.IncludeScripts({
							modul: w.modul,
							names: w.incls.names,
							curScript: W.curScript,
							iniFun: Included,
							args: [w.modul]
						})
					}
				}
			}
			if (debug > 1)
				console.log('    > ' + newloads.length ? ` (готовы к инициации: ${newloads.join(', ')})` : ' (но инициировать нечего)')

			if (newloads.length > 0)
				InitScripts(`загрузка [${newloads.join(', ')}]`)
		},
		ScriptsStart = () => {  // начало обработки страницы

			for (const scrpt of C.scrpts) { // делаем при каждой инициализации
				if (C.owners.length == 0) scrpt.act.need = true
				else {
					scrpt.act.need = false
					for (const owner of C.owners) {
						if (owner.modules.length == 0) scrpt.act.need = true
						else
							scrpt.act.need = !!owner.modules.find(modul => modul == scrpt.modul)
						if (scrpt.act.need) break
					}
				}
			}
			if (debug > 0) {
				const asknoneed = []
				for (const scrpt of C.scrpts)
					if (!scrpt.act.need)
						asknoneed.push(scrpt.modul)
				const l = asknoneed.length
				if (l > 0)
					C.ConsoleError(`В скриптах заданы ${l} 'ненужн${l > 1 ? 'ых' : 'ый'}' (см. квалиф. 'olga-start') модул${l > 3 ? 'ей' : (l > 1 ? 'я' : 'ь')}: `, asknoneed.join(', '))
			}

			if (C.consts.doscr) {  // запуск встроенных cкриптоав
				const scrs = C.GetTagsByTagNames('script'),
					o_doscr = C.consts.doscr,
					m = new RegExp('\\bdocument\\.currentScript\\.setAttribute\\s*\\(\\s*[\'`"]' + o_doscr + '.*?(;|\\n|$)', 'i')

				for (const scr of scrs) {
					const matchs = scr.innerText.match(m)
					if (matchs) {
						const atr = scr.attributes[o_doscr]
						if (!atr || atr.value != 1) {
							const s = scr.innerText.replace(matchs[0], '')
							if (debug > 0)
								console.log(`Выполняется скрипт: \n${s}`)
							eval(s)
							scr.setAttribute(o_doscr, 1)
						}
					}
				}
				C.page.scriptLoad.AddEvents(ScriptLoad)
				C.page.scriptDone.AddEvents(ScriptDone)

				ScriptLoad()  // проверка - а вдруг чё уже загружно
			}
		},
		ScriptsFinish = (page, bytimer) => { // конец инициализации страницы
			const pact = page.pact

			pact.timerp.Stop(bytimer ? 'таймер' : '')
			if (pact.timer > 0) {
				window.clearTimeout(pact.timer)
				pact.timer = 0
			}
			if (document.body.classList.contains(page.isLoading))
				document.body.classList.remove(page.isLoading)

			// console.log('%c%s', clrPage,
			// 	` Обработана страниица`, pact.url)

			if (bytimer) {
				for (const scrpt of C.scrpts) {
					const act = scrpt.act
					let err = ''
					if (!err) {
						if (!act.W) err = "не загружен файл "
						else if (act.start == 0) err = "инициализация не НАЧАТА ?"
						else if (act.start != act.done) err = "инициализация не закончилась"
					}
					if (err) page.errs.push({ modul: scrpt.modul, err: err })
				}
			}
			else {
				if (pact.mos) {
					const mos = page.pact.mos
					for (const mo of mos)
						mo.disconnect()
					// mo = null
					mos.splice(0, mos.length)
					// mos = null
				}
				page.scriptDone.RemEvents(ScriptDone)
				page.scriptLoad.RemEvents(ScriptLoad)
				window.o7.C.o5Inited = true
				C.DispatchEvent('o_isInited')
			}

			const errs = page.errs
			if (errs.length > 0) {
				C.ConsoleError(`Скрипты ${bytimer ? 'НЕ' : ''} завершились (есть ошибки)`, errs.length, errs)
				errs.splice(0, errs.length) //  могут еще завершиться и без ошибок
			}
		}

	class Page {
		pact = { url: '', ready: false, start: 0, timerp: new MyTimer(" КОНЕЦ  обработки  страницы"), timer: 0, mos: [] }
		errs = []

		PageHidden(e) { // закрытие всех новых элементов страницы

			const pact = this.pact
			if (!pact.ready) return

			let ac1 = 0,
				ac2 = 0
			pact.ready = false

			const n0 = this.childs.length
			if (debug > 0) console.log('%c%s', clrMy,
				`}=====< закрытие по '${e.type}' (n= ${n0}) страницы "${pact.url}"`)

			let n = n0
			while (n-- > 0) {
				const child = this.childs[n],
					owner = child.aO5_pageOwner
				for (const item of owner.children)
					if (item == child) {
						ac1++
						item.style.display = 'none'
						owner.removeChild(item)
						break
					}
			}
			this.childs.splice(0, n0);

			C.scrpts.forEach(scrpt => {
				const W = scrpt.W
				if (W && W.Done && pact.start == scrpt.start) {
					W.Done()
					ac2++
				}
			})

			this.pageDones.RemEvents(this.PageHidden.bind(this))
			if (ac1 || ac2)
				C.DispatchEvent('o_isHidden', `закрытие всех (${ac1}/${ac2}) элементов страницы`)
		}
		PageLoad(e) { 	// проверки и начало инициализации страницы !
			const
				iso5inc = e.type === 'o_incReady',
				url = document.URL.match(/[^?&#]*/)[0].trim(),
				pact = this.pact,
				isnew = pact.url != url || !pact.ready,
				head = ` PageLoad (${isnew ? 'новая' : 'повтор'}):  `,
				sinc = 'inc'

			if (iso5inc) {
				const hash = C.save.hash
				if (hash) { // делать именно после дозагрузок документа 
					const tag = document.getElementById(hash)
					if (tag) tag.scrollIntoView({ alignToTop: true, block: 'start', behavior: "auto" })
					else
						this.errs.push({ modul: '?', err: `при событии '${e.type}' НЕ определён hash= '${hash}' в адресной строке` })
				}
				if (!window.o7.C.o5Inited) {
					if (debug)
						console.log('%c%s', clrPage, head + ` после ${sinc} - игнорируется`, url)
					return
				}
			}

			let starts = document.querySelectorAll("[class *= '" + this.oStart + "']")
			if (!starts || !starts.length) {
				starts = [document.body]
				document.body.classList.add(this.oStart)
				console.error('%c%s', clrPage, head + ` нет тегов с ${this.oStart} - принят <body>`, url)
			}

			const
				meve = this.pageLoads.meves.find(meve => meve.eve == e.type),
				isU = meve.isu,
				isloaded = document.readyState == 'complete' ||
					(url.match(/\bolga5-tests\b/i) && document.readyState == 'interactive')

			if (!isU || (isnew && isloaded)) {
				if (debug > 0) {
					console.groupCollapsed('%c%s', clrPage,
						head + ` (${document.readyState})` + ` e= '${e.type}'`.padEnd(22),
						url)
					for (const nam in e)
						if (nam != 'type' && !(e[nam] instanceof Function)) console.log(nam.padEnd(24), e[nam])
					console.groupEnd()
				}

				const start = Number(new Date()) + Math.random()
				let w = null,
					o5include = null

				pact.start = start

				if (iso5inc) {
					const
						scrpt = C.scrpts.find(scrpt => scrpt.modul === sinc),
						act = scrpt.act

					act.start = start
					act.done = start
				} else {
					o5include = document.querySelector('[o5include]')
					w = window.o7.find(modul => modul.modul === sinc)

					if (!w && o5include) C.ConsoleError(`Имеется тег с атрибутом 'o5include' но отсутствует модуль '${sinc}'`)
					else
						if (w && !o5include && debug > 0)
							C.ConsoleInfo(`¿ Задан модуль '${sinc}' но отсутствует тег с атрибутом 'o5include' ?`)
				}

				Object.assign(pact, { url: url, ready: true })


				pact.mos.splice(0, pact.mos.length)

				this.starts.splice(0, this.starts.length, ...starts);

				if (debug > 0)
					console.log('%c%s', clrMy, " СТАРТ обработки страницы ", url)

				if (!document.body.classList.contains(this.isLoading))
					document.body.classList.add(this.isLoading) // это если есть такой класс

				pact.timerp.Start(url, iso5inc)
				if (C.consts.timLoad) {
					if (pact.timer > 0)
						window.clearTimeout(pact.timer)
					pact.timer = window.setTimeout(ScriptsFinish, 1000 * C.consts.timLoad, this, true)
				}

				this.pageDones.AddEvents(this.PageHidden.bind(this))

				this.errs.splice(0, this.errs.length)

				C.QuerySelectorInit(this.starts, this.oStart) //  чтобы пересчитало область определения

				// сброс событий
				window.o7.C.o5Inited = false
				// C.E.Clear()

				ScriptsStart()	// e.type == 'o_incReady'
			}
		}
		AppendChild(owner, child) {
			child.aO5_pageOwner = owner
			owner.appendChild(child)
			this.childs.push(child)
		}
		InsertBefore(owner, child, reference) {
			child.aO5_pageOwner = owner
			owner.insertBefore(child, reference)
			this.childs.push(child)
		}

		static pageLoads = new MyEvents(C.consts.pageLoads)
		static pageDones = new MyEvents(C.consts.pageDones)
		static scriptLoad = new MyEvents('o_modulLoad')
		static scriptDone = new MyEvents('o_scriptDone')

		static {
			Page.prototype.pageLoads = Page.pageLoads
			Page.prototype.pageDones = Page.pageDones
			Page.prototype.scriptLoad = Page.scriptLoad
			Page.prototype.scriptDone = Page.scriptDone
		}

		constructor() {
			this.oStart = 'olga-start'
			this.isLoading = 'o-isLoading' // 'olga5_isLoading'
			this.childs = []
			this.starts = []

			// this.pageLoads = new MyEvents(C.consts.pageLoads)
			// this.pageDones = new MyEvents(C.consts.pageDones)

			// this.scriptLoad = new MyEvents('o_modulLoad')
			// this.scriptDone = new MyEvents('o_scriptDone')

			this.pageLoads.AddEvents(this.PageLoad.bind(this))	//{ capture: true }

			Object.seal(this.pact)

			Object.freeze(this)
		}
	}

	const wshp = C.AddModuleSub(olga5_modul, modulname, () => {
		console.log('%c%s', "background: aqua; color: black;border: none;",
			` инициализация `,
			`${olga5_modul}/${modulname}.js`)
		if (C.consts.nomnu > 0)
			document.body.classList.add('o_nomnu')

		if (C.consts.noact > 0) {
			((C && debug > 0) ? C.ConsoleError : console.log)("}---> загружено `ядро библиотеки`, но инициализация ОТКЛЮЧЕНА по o_noact= '" + C.consts.noact + "'")
			return
		}

		if (C.scrpts.length > 0)
			C.page = new Page()
		else {
			// C.ConsoleInfo(`IniScripts.js: вообще нет скриптов для обработки`)
			// C.DispatchEvent('o_isInited')
		}
	})

	// if (wshp.AscInclude)
	// 	wshp.AscInclude()
})();/* global document, window, console,*/
/* exported olga5_menuPopDn_Click*/
/*jshint asi:true  */
/*jshint esversion: 6*/
/**
 *  исправление 'src', 'data-src' и 'href' в тегах html-заголовка
 **/
//
(function () {              // ---------------------------------------------- com/TagRefs ---
	'use strict'
	let wshp = {}

	const
		olga5_modul = 'com',
		modulname = 'TagsRef',
		C = window.o7.C,
		debug = C.consts.debug,
		ReplaceTag = (tagName, change, adrName, url, errs) => {
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
		ConvertScripts = () => {
			const errs = [],
				scrs = [],
				preloads = [],
				load_snm = {},
				Orig = (obj) => {
					const origs = obj.outerHTML.match(/\s(data-)?src\s*=\s*["*'][^"']*["*']/g)
					if (origs && origs.length > 0) {
						for (let i = 0; i < origs.length; i++)
							origs[i] = origs[i].replaceAll(/["'s*]/g, '')
						// origs.forEach(orig => {
						// 	orig = orig.replaceAll(/["'s*]/g, '')
						// })
						return origs.join(', ')
					} else
						return '-нету-'
				}

			for (const w in window.o7)
				preloads.push({ w: w, orig: Orig(C.o5script), script: C.o5script, isset: false, })

			/*				сначала из тегов <script>, пропуская те, которые в скомпилированном			*/

			const s = C.consts.incls.trim(),
				incls = s ? s.split(/\s*[,;]\s*/) : [],
				igns = [],
				needs = {}

			incls.forEach(incl => { if (incl) needs[incl] = 1 })
			for (const script of document.scripts) {

				if (script === C.o5script) // пропускаю ядро и модуль 'inc'
					continue

				if (script.dataset.oAdd) continue 		// это добавленный мною скрипт		
				if (script.innerText.trim()) continue	// это встроенный скрипт

				const td = C.TagDes(script, 'src', errs)
				// if (!td || !td.orig || !(td.orig[1] === '+' || (td.trans && !C.consts.o5only)))

				if (!td || !td.orig || td.orig[0] !== '+')
					continue

				if (incls.length > 0)
					if (needs[td.modul]) needs[td.modul] = 0
					else {
						igns.push(td.modul)
						continue
					}

				if (load_snm[td.modul])
					errs.push({ tag: td.modul, ref: td.orig, txt: 'повторная загрузка модуля' })
				load_snm[td.modul] = td.orig // перезаписываю!

				const w = window.o7.find(w => w.modul == td.modul),
					scrpt = {
						modul: td.modul, orig: td.orig, script: script,
						act: { W: w, need: false },
					}

				let dochg = ''

				if (!w || td.code == '_' || (td.trans && td.code != 'data-')) {
					dochg = !w ? 'новый  ' : 'замена '
					if (debug > 1) console.log(`тег <script>: id= '${script.id}' -> в обработку (${dochg}): orig=${td.orig}`)

					scrpt.act.W = null
					let url = td.orig
					if (td.trans) {
						const wref = C.DeCodeUrl(C.urlrfs, td.orig)
						if (wref.err)
							errs.push({ tag: td.modul, ref: td.from, txt: wref.err })
						url = wref.url
					}
					console.log(td.orig, url)
					if (!script.getAttribute('async') && !script.getAttribute('defer'))
						script.setAttribute('async', '')
					scrpt.script = ReplaceTag('script', script, 'src', url, errs)
				}

				if (scrpt.script.src.includes(C.urlrfs._olga)) {  // контроль только тех, кто на том же пути
					C.scrpts.push(scrpt)
					scrs.push({
						modul: scrpt.modul,
						orig: scrpt.orig,
						src: scrpt.script.src,
						txt: dochg + td.from
					})
				}
			}
			/*				дописываю те, которые в скомпилированном и отсутствуют в SCRIPT's			*/
			for (const w in window.o7) {
				const modul = w.modul
				if (!C.scrpts.find(scrpt => scrpt.modul == modul))
					// if (!igns(modul)) {
					if (!igns.includes(modul)) {
						C.scrpts.push({ modul: modul, orig: '', act: { W: w, need: false }, script: C.o5script })
						scrs.push({ modul: modul, orig: '', src: C.o5script.src, txt: `из скомпилированного` })
					}
			}

			/* строю зависимости cкриптов (сначала идут скомпилированные) - сначала по 'o_depends'*/
			const ss = C.consts['o_depends'].split(/\s*[;]+\s*/),
				sinc = 'inc',
				oinc = C.scrpts.find(scrpt => scrpt.modul == sinc)

			for (const s of ss) {
				const
					uu = s.trim().split(/\s*[:=]+\s*/),
					u = uu[0]
				if (u) {
					const scrpt = C.scrpts.find(scrpt => scrpt.modul == u)
					if (scrpt) {
						const rfs = uu[1] ? uu[1].split(/\s*,\s*/) : []
						scrpt.depends ||= (scrpt.modul != sinc && oinc) ? [oinc] : []
						for (const rf of rfs)
							if (rf != sinc) { // уже и так включено
								const scr = C.scrpts.find(scrpt => scrpt.modul == rf)
								if (scr && !scrpt.depends.includes(scr))
									scrpt.depends.push(scr)
							}
					}
				}
			}

			/* -"- тепер для остальны */
			const sdeps = [],
				cdeps = []
			/* eslint-disable no-prototype-builtins */
			for (const scrpt of C.scrpts) {
				if (!scrpt.depends)
					scrpt.depends = scrpt.script.attributes.hasOwnProperty('async') ? [] : cdeps.concat(sdeps)
				if (scrpt.orig) sdeps.push(scrpt)
				else cdeps.push(scrpt)
			}
			/* eslint-enable no-prototype-builtins */
			/* в отладочном режиме - делаю проверку*/
			if (debug > 0) {
				let scrpt = null
				const list = [],
					errs = [],
					ChectForRev = (modul, depends) => {
						let ok = true
						list.push(modul)
						for (const depend of depends)
							if (depend === scrpt) {
								errs.push({ scrpt: scrpt.modul, refs: list.join('-> ') })
								ok = false
							}
						if (depends.length > 0 && ok)
							for (const depend of depends)
								ChectForRev(depend.modul, depend.depends)
						list.pop()
					}
				for (scrpt of C.scrpts)
					ChectForRev(scrpt.modul, scrpt.depends)
				if (errs.length > 0)
					C.ConsoleError(`зацикленные ссылки в зависимостях модулей`, errs.length, errs)
			}

			const errneeds = []
			for (const need in needs) {
				if (needs[need]) errneeds.push(need)
			}
			if (errneeds.length > 0)
				C.ConsoleError(`Из заданных в 'o_incls' отсутствуют модули:`, errneeds.join(', '))
			// сюда проверь!?
			if (debug > 0) {
				if (scrs.length > 0) C.ConsoleInfo("Найденные olga5 SCRIPT'ы : ", scrs.length, scrs)
				else C.ConsoleInfo("Не найдены olga5 SCRIPT'ы ?")

				if (igns.length > 0)
					C.ConsoleError(`Проигнорированы скрипты, отсутствующие в 'o_incls': `, igns.join(', '))

				if (debug > 1) { // тестирование атрибутов
					const errs = []
					for (const scrpt of C.scrpts)
						for (const attr of scrpt.W.curScript.attributes)
							// eslint-disable-next-line no-useless-escape
							// делать проверку .src, })

							if (!attr.name || attr.name.match(/['"`\+\.,;]/))
								errs.push({ 'атрибут': attr.name, 'скрипт': scrpt.script.src, })
					if (errs.length > 0)
						C.ConsoleError(`${errs.length} странных атрибутов (м.б. перепутаны кавычки?) у скрипта`, s, errs)
				}
			}
			if (errs.length > 0)
				C.ConsoleError(`Ошибки в преобразовании SCRIPT `, errs.length, errs)

			for (const scrpt of C.scrpts) {
				Object.assign(scrpt.act, { done: 0, start: 0, timeout: 0, timera: null, incls: null, })  // finish:false, 
				Object.seal(scrpt.act)
				Object.freeze(scrpt.depends)
				Object.freeze(scrpt)
			}
			Object.freeze(C.scrpts)

			scrs.splice(0, scrs.length)
			errs.splice(0, errs.length)
		},
		ConvertLinks = () => {
			const links = [],
				errs = []
			for (const child of document.head.children)
				if (child.tagName.toLowerCase() == 'link') {
					const td = C.TagDes(child, 'href', errs)
					if (!td.orig) {
						C.ConsoleError(`обнаружен <link> без 'href', '_href' или 'data-href': `, child.outerHTML, null)
						continue
					}
					if (td.trans) {
						const wref = C.DeCodeUrl(C.urlrfs, td.orig)
						if (wref.err)
							errs.push({ tag: td.modul, ref: td.from, txt: wref.err })

						ReplaceTag('link', child, 'href', wref.url, errs)
						links.push({ orig: td.orig, src: wref.url, txt: td.from })
					}

					wshp.o5iniready ||= child.href.match(/\/o5ini\.css$/)
				}

			if (debug > 0)
				if (links.length > 0) C.ConsoleInfo("Скорректированные LINK'и : ", links.length, links)
				else C.ConsoleInfo("Скорректированных LINK'ов нет ")

			if (errs.length > 0)
				C.ConsoleError(`Ошибки в преобразовании LINK `, errs.length, errs)

			links.splice(0, links.length)
			errs.splice(0, errs.length)

		}

	// wshp = C.AddModuleSub(olga5_modul, modulname, () => {
	// 	ConvertScripts()
	// 	ConvertLinks()
	// })
		wshp = C.AddModuleSub(olga5_modul, modulname, [
		ConvertScripts,
		ConvertLinks
	])
})();
/* global document, window*/
/*jshint asi:true  */
/*jshint esversion: 6*/
(function () {              // ---------------------------------------------- snd ---
	'use strict';

	const
		C = window.o7.C,
		olgaSnd = 'olga_snd',
		W = {
				modul: 'snd',
				Init: SndInit,
				incls: ['AO5snd', 'Imgs', 'Prep'],
			consts: {
				needs: `		
						o5shift_speed=0.5 # при Shift - замедлять вдвое;
						o5return_time=0.3 # при возобновлении "отмотать" 0.3 сек ;
				`},
			urlrfs: { needs: 'btn_play=""; btn_stop=', },
		},
		wshp = (window.o7 ??= {})[W.modul] = { W },
		o5css = `
		.${olgaSnd}:not(.o-sndNone) {
			cursor: pointer;
		}
		.${olgaSnd}.o-sndPlay {
			cursor: progress;
			animation: olga5_viewTextWash 5s infinite linear;
		}
		.${olgaSnd}.o-sndPause {
			cursor: wait;
			animation: none;
		}
		.${olgaSnd}.o-sndError {
			opacity: 0.5;
			outline: 2px dotted black;
			cursor: help;
		}
		.${olgaSnd}.o-sndLoad {
			opacity: 0.5;
			outline: 1px dotted black;
			cursor: wait;
		}
		img.${olgaSnd}:not(.o-freeimg) {
			background-color: transparent;
			position: inherit;
			padding: 0 !important;
			vertical-align: bottom;
			border-radius: 50%;
			box-shadow: none !important;
			animation: none;
			max-height: 28px;
			max-width:  28px;
		}
		img.${olgaSnd}.o-sndPlay {
			animation: olga5_sndImgSwing 2s infinite linear;
		}
		@keyframes olga5_viewTextWash {
			100%,0% {background-color: white;color: aqua;}
			75%,25% {background-color: gold;}
			50% {background-color: coral;color: blue;    }
		}
		@keyframes olga5_sndImgSwing {
			100%,50%,0% {transform: rotateZ(0deg);}
			25% {transform: rotateZ(33deg);}
			75% {transform: rotateZ(-33deg);}
		}
	`

	// eslint-disable-next-line no-mixed-spaces-and-tabs

	function SndInit() {

		// wshp.css = css

		C.ParamsFill(W, o5css)

		const excls = document.getElementsByClassName('o-sndNone')
		for (const excl of excls) {
			const exs = excl.querySelectorAll('[class *=olga_snd]')
			for (const ex of exs)
				ex.classList.add('o-sndNone')
		}

		const mtags = C.SelectByClassName(olgaSnd, W.modul)
		wshp.Prep(mtags)

		C.DispatchEvent('o_scriptDone', W.modul)
	}

})();
/* global window, console, HTMLMediaElement, CustomEvent, Audio */
/*jshint asi:true  */
/*jshint strict:true  */
/*jshint esversion: 6 */

(function () {              // ---------------------------------------------- snd/AO5snd ---
    "use strict"
    const
        olga5_modul = 'snd',
        modulname = 'AO5snd',
        C = window.o7.C,
        wshp = C.AddModuleSub(olga5_modul, modulname, snd => {
            const
                ss = wshp.setClass,
                oSndError = 'o-sndError',
                W = window.o7.find(w => w.modul == olga5_modul), // так делать во всех подмодулях 
                debug = C.consts.debug,
                lognam = `${olga5_modul}/${modulname} `,
                o5shift_speed = W.consts.o5shift_speed < 0.2 ? 0.2 : W.consts.o5shift_speed,

                SetTitle = (aO5, txt) => {
                    aO5.snd.title = txt
                    if (aO5.image.play)
                        aO5.image.play.title = aO5.snd.title
                },
                setVolume = {
                    step: 0.1,
                    vmin: 0.2,
                    vmax: 1.0,
                    SetV: (aO5, add) => {
                        if (add == 0) SetTitle(aO5, ``)
                        else {
                            const audio = aO5.sound.audio,
                                v = audio.volume + add * setVolume.step,
                                txt = `громкость=${parseInt(v * 100)}%`

                            audio.volume = v > setVolume.vmax ? setVolume.vmax : (v < setVolume.vmin ? setVolume.vmin : v)
                            SetTitle(aO5, txt)
                            if (debug > 1)
                                console.log(`${lognam} Изменено: ${txt} для '${aO5.name}' }`)
                        }
                    }
                },
                errTypes = {
                    'неАктивир.': 'звук не проигрывалтся (автоматически) т.к. не активирована страница',
                    'неЗагружен': `ошибка в 'audio' (если еще не загружено - повторите)`,
                    'неРазрешен': 'прежде проигрывать - активируйтесь на странице (это требование браузера)',
                    'ошибкаКода': 'ошибка в коде',
                    'естьОшибка': 'ошибка проигрывания',
                    SetT: (aO5, mrk, err) => {
                        aO5.sound.errIs[mrk] = err
                        const t = aO5.title
                        SetTitle(aO5, err ? `Для тега ${t ? ("'" + t + "'") : ''} ошибка: ${errTypes[mrk]}` : t)
                    },
                    AddError: (aO5, mrk, txt) => {
                        if (!aO5.sound.errIs[mrk]) {
                            errTypes.SetT(aO5, mrk, true)
                            C.ConsoleError(`"${errTypes[mrk]}" (код=${mrk})` + (txt ? ` ${txt}` : '') + ` для '${aO5.name}'`)

                            aO5.sound.errIs.errs = true
                            if (!aO5.snd.classList.contains(oSndError))
                                aO5.snd.classList.add(oSndError)
                        }
                    },
                    RemError: (aO5, mrk) => {
                        if (aO5.sound.errIs[mrk]) {
                            errTypes.SetT(aO5, mrk, false)
                            console.log(`${lognam} Устранена ошибка: errTypes.${mrk}`)

                            const errIs = aO5.sound.errIs
                            for (const erri in errIs)
                                if (erri != 'errs' && errIs[erri])
                                    return

                            aO5.sound.errIs.errs = false
                            if (aO5.snd.classList.contains(oSndError))
                                aO5.snd.classList.remove(oSndError)
                        }
                    }
                },
                StartSound = (aO5) => {
                    const sound = aO5.sound,
                        audio = sound.audio,
                        Play = (aO5) => {
                            if (debug > 1) console.log(`${lognam}   > Play()`)

                            if (aO5.modis.over && !wshp.activated)
                                errTypes.AddError(aO5, 'неАктивир.')

                            if (sound.ison) { // если курсор не ушел
                                if (debug > 1) console.log(`${lognam} --> Play OK`)
                                try {
                                    const audio = sound.audio
                                    // audio.volume = aO5.sound.volume
                                    audio.playbackRate = sound.shiftKey != 0 ? o5shift_speed : 1.0
                                    if (sound.state != ss.pause) audio.currentTime = 0 // т.е. если перезапуск старого музона	
                                    else audio.currentTime = Math.max(audio.currentTime - W.consts.o5return_time, 0)

                                    audio.play()
                                }
                                catch (e) {
                                    console.error(`ошибка воспроизведения:`, e.message)
                                }
                            }
                            else
                                wshp.StopSound(aO5)
                        }

                    if (debug > 1) console.log(`${lognam} --> StartSound() из '${aO5.sound.state}'`)

                    if (wshp.actaudio && wshp.actaudio != audio)
                        wshp.StopSound(wshp.actaudio.aO5snd)

                    window.dispatchEvent(new CustomEvent('o5snd_stopSound', { detail: { tag: wshp.actaudio, type: 'audio(moe)', } }))

                    if (audio.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA)
                        Play(aO5)
                    else {
                        wshp.setClass.SetC(aO5, wshp.setClass.pause)
                        audio.addEventListener('canplay', () => Play(aO5), { capture: true, once: true })
                    }
                    // }
                },
                GetTargetObj = e => {
                    let obj = e.target
                    while (obj && !obj.aO5snd) obj = obj.parentElement
                    if (obj && obj.aO5snd) return obj
                },
                /*
    + mouseleave  когда курсор манипулятора (обычно мыши) перемещается за границы элемента.
    - mouseout    когда курсор покидает границы элемента или одного из его дочерних элементов
    + mouseenter  не отправляется никаким потомкам, когда указатель перемещается из пространства 
    - mouseover   отправляется в самый глубокий элемент дерева DOM, затем оно всплывает в иерархии
                */
                eFocus = ['mouseenter', 'focus'],
                eBlurs = ['mouseleave', 'blur'],
                // eFocus = ['pointerenter', 'focus'],
                // eBlurs = ['pointerleave', 'blur'],
                Activate = e => {
                    const snd = GetTargetObj(e),
                        aO5 = snd.aO5snd,
                        PlayError = (aO5, e) => {
                            if (debug > 0) console.error(`--> PlayError ${aO5.name}`, e)
                            if (e.name == 'TypeError') errTypes.AddError(aO5, 'ошибкаКода')
                            else if (e.name == 'NotAllowedError') errTypes.AddError(aO5, 'неРазрешен')
                            else if (e.code != 20) errTypes.AddError(aO5, 'естьОшибка',
                                `e.type='${e.type}'` + e.code ? `\n\tcode= '${e.code}': ${e.message}` : ``)
                        },
                        eAudios = [
                            {
                                type: 'error', Act: (snd, e) => {
                                    const aO5 = snd.aO5snd
                                    errTypes.AddError(aO5, 'неЗагружен',
                                        `\n${e.type}: (это при audio_play= '${aO5.parms.audio_play}', attrs.aplay= '${aO5.modis.aplay}') `)
                                }
                            },
                            {
                                type: ss.play, Act: snd => {
                                    const aO5 = snd.aO5snd,
                                        sound = aO5.sound,
                                        errIs = sound.errIs
                                    if (aO5.sound.errIs.errs)
                                        for (const mrk in errTypes)
                                            if (typeof mrk === 'string' && errIs[mrk])
                                                errTypes.RemError(aO5, mrk)

                                    wshp.setClass.SetC(aO5, wshp.setClass.play)
                                    wshp.actaudio = sound.audio
                                    wshp.activated = true
                                }
                            },
                            {
                                type: 'ended', Act: snd => {
                                    const aO5 = snd.aO5snd
                                    if (aO5.modis.loop) {
                                        const audio = aO5.sound.audio
                                        audio.currentTime = 0
                                        audio.play()
                                    } else
                                        wshp.StopSound(aO5)
                                }
                            },
                            { type: 'loadstart', Act: snd => snd.classList.add(wshp.css.olga5sndLoad) },
                            { type: 'loadeddata', Act: snd => snd.classList.remove(wshp.css.olga5sndLoad) },
                            { type: 'abort', Act: (snd, e) => PlayError(snd.aO5snd, e) },
                            { type: 'stalled', Act: (snd, e) => PlayError(snd.aO5snd, e) },
                        ],
                        OnPlayAct = (e, eacts, txt) => {
                            const type = e.type,
                                snd = GetTargetObj(e),
                                aO5 = snd.aO5snd

                            if (debug > 1) console.log(`${lognam}  OnPlayAct.${txt}  ${('' + e.timeStamp).padStart(8)}` +
                                ` для тега '${aO5.name}' с типом '${type}' при isOny= ${aO5.sound.ison}`)

                            eacts.find(eact => eact.type == type).Act(snd, e)
                        },
                        OnPlayActAudios = e => { OnPlayAct(e, eAudios, 'audio') },
                        StopBubble = e => {
                            e.stopPropagation()  // 
                            e.preventDefault()
                            e.cancelBubble = true
                            return false
                        },
                        CallStartSound = e => {
                            const snd = GetTargetObj(e),
                                aO5 = snd.aO5snd,
                                sound = aO5.sound

                            Object.assign(aO5.sound, { ison: true, shiftKey: e.shiftKey ? (e.location == 2 ? 1 : -1) : 0 })

                            if (e.type == 'click') {
                                const isA = snd.tagName.toUpperCase() == 'A'
                                switch (sound.state) {
                                    case ss.pause:
                                        if (isA) {
                                            wshp.StopSound(aO5)
                                            return // чтобы избежать StopBubble(e)
                                        }
                                        else sound.audio.play()
                                        break
                                    case ss.stop: StartSound(aO5)
                                        break
                                    case ss.play:
                                        sound.audio.pause()
                                        wshp.setClass.SetC(aO5, wshp.setClass.pause)
                                }

                                if (isA)
                                    return StopBubble(e)
                            }
                            else
                                if (eFocus.includes(e.type))
                                    switch (sound.state) {
                                        case ss.pause: sound.audio.play()
                                            break
                                        case ss.stop: if (aO5.modis.over) StartSound(aO5)
                                            break
                                        // default: return
                                    }
                        },
                        CallStopSound = e => {
                            const snd = GetTargetObj(e),
                                aO5 = snd.aO5snd

                            if (eBlurs.includes(e.type)) {
                                aO5.sound.ison = false
                            }
                            if (aO5.sound.state != ss.stop &&
                                snd.style.display != 'none' &&
                                (!aO5.modis.alive || aO5.sound.audio.paused)) {

                                wshp.StopSound(aO5)

                                SetTitle(aO5, '')
                                if (e.type == 'click') // для любых тегов - только лишь остановить музон
                                    return StopBubble(e)
                            }
                        },
                        DoKeyDown = e => {
                            const snd = GetTargetObj(e),
                                aO5 = snd.aO5snd,
                                sound = aO5.sound,
                                key = e.key.match(/ArrowUp|ArrowRight/) ? 1 :
                                    (e.key.match(/ArrowDown|ArrowLeft/) ? -1 : 0)
                            if (sound.ison && sound.audio.played && key != 0) {
                                setVolume.SetV(aO5, key)
                                return StopBubble(e)
                            }
                        },
                        SetEventListeners = snd => {
                            for (const eBlur of eBlurs)
                                snd.addEventListener(eBlur, CallStopSound, { capture: true })
                            snd.addEventListener('keydown', DoKeyDown, { capture: true })
                            snd.addEventListener('click', CallStartSound, { capture: true })
                            if (snd.aO5snd.modis.over)
                                StartSound(aO5)
                        },
                        audio = aO5.sound.audio = new Audio() // ocument.createElement('audio'),

                    if (debug > 1) 
                        console.log(`${lognam}  Activate тега '${aO5.name}' с типом '${e.type}'`)

                    setVolume.SetV(aO5, 0)

                    for (const eWait of eFocus) // убрал оба чтоб не срабатывали
                        snd.removeEventListener(eWait, Activate, { capture: true })

                    Object.assign(audio, { aO5snd: aO5, src: aO5.parms.audio_play, autoplay: false, controls: false, muted: false, loop: false, crossorigin: "" })
                    audio.load()

                    for (const eAudio of eAudios)
                        audio.addEventListener(eAudio.type, OnPlayActAudios, { capture: true })

                    Object.assign(aO5.sound, { ison: true, shiftKey: e.shiftKey ? (e.location == 2 ? 1 : -1) : 0 })
                    if (!aO5.image.play)
                        if (aO5.parms.image_play)
                            wshp.imgs.makeImgPlay(aO5, SetEventListeners)  // StartSound, 
                        else
                            aO5.image.play = aO5.image.stop

                    for (const eFocu of eFocus)                    
                        snd.addEventListener(eFocu, CallStartSound, { capture: true })
                    SetEventListeners(snd)

                },
                WaitActivate = snd => {
                    if (snd.aO5snd.modis.none ||
                        snd.aO5snd.modis.activated
                    )
                        return

                    if (debug > 1) console.log(`${lognam}  WaitActivate ${C.MakeObjName(snd)}`)

                    snd.aO5snd.modis.activated = true
                    for (const eWait of eFocus)
                        snd.addEventListener(eWait, Activate, { capture: true })
                    // snd.addEventListener('keydown', DoKeyDown, { capture: true })
                }

            class AO5snd {
                constructor(snd) {
                    const aO5 = this
                    aO5.snd = snd
                    aO5.title = snd.title
                    aO5.name = C.MakeObjName(snd)
                    aO5.attrs = C.GetAttrs(snd.attributes)
                    aO5.srcAtr = snd.hasAttribute('href') ? 'href' : (snd.hasAttribute('src') ? 'src' : '')

                    for (const errType in errTypes)
                        if (typeof errType === 'string') aO5.sound.errIs[errType] = false

                    Object.seal(aO5.attrs)  // freeze() дам в PrepareSnds
                    Object.seal(aO5.parms)  // -"-
                    Object.seal(aO5.sound)	// не замораживается 
                    Object.seal(aO5.image)	// -"-
                    Object.seal(aO5.modis)  //  -"-
                    Object.freeze(aO5)

                    if (snd.tagName.match(/img/i))
                        aO5.image.stop = snd

                    snd.aO5snd = aO5
                }

                // snd = null; title = ''; name = ''; o5attrs = null; srcAtr = null;

                modis = { over: false, alive: false, loop: snd.getAttribute('loop'), aplay: '', dspl: snd.style.display, none: false, activated: false }
                sound = { audio: null, errIs: { errs: false, }, state: ss.stop, eventsAreSet: false, ison: false, shiftKey: 0 }
                parms = { audio_play: '', image_play: '' }
                image = { stop: null, play: null }

                // для доступа из snd
                waitActivate = snd => WaitActivate(snd)
                asdf = 1
            }
            return new AO5snd(snd)

        })

})();
/* global window, document, console, alert, Promise, Map */
/*jshint asi:true  */
/*jshint strict:true  */
/*jshint esversion: 6 */

(function () {              // ---------------------------------------------- snd/Imgs ---
    "use strict"
    const
        C = window.o7.C,
		debug=C.consts.debug,
        olga5_modul = 'snd',
        modulname = 'Imgs',
        wshp = C.AddModuleSub(olga5_modul, modulname, () => {
            let imgs = null
            const
                a = document.createElement('a'),
                lognam = `${olga5_modul}/${modulname} `,
                FullUrl = (url) => {
                    if (C.IsFullUrl(url)) return url
                    else {
                        a.href = url
                        return a.href
                    }
                },
                GetImgForRef = (ref) => new Promise((Resolve, Reject) => {
                    if (!ref)
                        Reject(`Неопределённая 'ref'-ссылка`)

                    const url = FullUrl(ref),
                        maps = imgs.maps,
                        map = maps.get(url)

                    if (map) Resolve({ img: map.img, new: false })
                    else {
                        /*	https://codeengineered.com/blog/09/12/performance-comparison-documentcreateelementimg-vs-new-image/
                        For now I’m going to continue to use document.createElement('img'). 
                        Not only is this the w3c recommendation but it’s the faster method in IE8, the version users are slowly starting to adopt.
                        */
                        if (debug > 1)
                            console.log(`${lognam} olga5_Imgs создание нового для url=${url}`)

                        const nimg = document.createElement('img')
                        Object.assign(nimg, { src: url, importance: 'high', loading: 'eager', crossOrigin: null })
                        maps.set(url, { img: nimg, err: '' })

                        nimg.addEventListener('load', () => {
                            if (debug > 1)
                                console.log(`${lognam} GetImgForRef: загружен url= ${url}`)
                            if (url.trim() == '')
                                alert('url=?')
                            Resolve({ img: nimg, new: true })
                        }, { once: true })

                        nimg.addEventListener('error', e => {
                            // Reject(`GetImgForRef: для url=${url}- ошибка ${e.message ? e.message : 'не определен (?)'}`)
                            Reject({ err: `GetImgForRef ошибка: ${e.message ? e.message : 'не определен'}`, url: url })
                        }, { once: true })
                    }
                }),
                RegiBySrc = (maps, img) => new Promise(() => {  // Resolve, Reject) => {
                    if (img && img.src) {
                        const src = img.src,
                            url = FullUrl(src),
                            s = url == src ? '' : `(src=${src})`,
                            isinmap = maps.get(url)

                        if (!isinmap)
                            maps.set(url, { img: img.cloneNode(true), err: '' })
                        if (debug > 1)
                            console.log(`${lognam} olga5_Imgs ${isinmap ? 'повтор  ' : 'добавлен'} url=${url} для img.id='${img.id}' ${s}`)
                    }
                    else
                        console.error(`olga5_Imgs : попытка добавить` + (img ? ` пустой src для img.id='${img.id}'` : ` пустой  <img>`))
                }),
                CopyStyle = (img, newimg) => {
                    newimg.className = img.className
                    if (img.attributes.style) {
                        if (!newimg.attributes.style)
                            newimg.setAttribute('style', '')
                        newimg.attributes.style.nodeValue += img.attributes.style.nodeValue
                    }
                },
                MakeImgPlay = (aO5, SetEventListeners) => { //  StartSound, 
                    GetImgForRef(aO5.parms.image_play).then(nimg => {
                        console.log(`MakeImgPlay.GetImgForRef.then() для ='${aO5.name}' с image_play=${aO5.parms.image_play}`)
                        const img = aO5.image.stop,
                            newimg = nimg.new ? nimg.img : nimg.img.cloneNode(false)

                        Object.assign(newimg, {
                            id: (img.aO5snd.id ? img.aO5snd.id : C.MakeObjName(img.aO5snd)).replace('_stop', '') + '_play',
                            aO5snd: img.aO5snd, // тут НЕ делать новый, в создавать ссылку
                            title: img.aO5snd.title,
                        })
                        CopyStyle(img, newimg)
                        aO5.image.play = newimg

                        SetEventListeners(newimg)

                        newimg.style.display = 'none'
                        img.parentNode.insertBefore(newimg, img.nextSibling)
                        if (aO5.sound.state != 'stop') {
                            aO5.image.stop.style.display = 'none'
                            aO5.image.play.style.display = aO5.modis.dspl
                        }
                        // if (aO5.modis.over)
                        //     StartSound(aO5)
                    }).
                        catch(err => {
                            C.ConsoleError(`MakeImgPlay.${err}`)
                        })
                },
                SetImgByRef = (img, ref) => { // подставить новый nimg вместо img с 'недествительным' src	
                    GetImgForRef(ref).then(nimg => {
                        const newimg = nimg.new ? nimg.img : nimg.img.cloneNode(true)
                        Object.assign(newimg, {
                            // id: (img.id ? img.id : img.aO5snd.name) + '_stop',
                            id: img.id, // оставляю тот же id
                            aO5snd: Object.assign({}, img.aO5snd), // тут - НОВЫЙ aO5
                            title: img.aO5snd.title,
                        })
                        newimg.name = C.MakeObjName()
                        const aO5 = newimg.aO5snd

                        Object.assign(aO5, { snd: newimg, id: newimg.id })
                        CopyStyle(img, newimg)
                        aO5.image.stop = newimg

                        aO5.waitActivate(newimg)

                        img.parentNode.insertBefore(newimg, img.nextSibling)
                        img.parentNode.removeChild(img)
                        img = null
                    }).catch(reject => {
                        C.ConsoleError(reject.err, reject.url.replace(/https?:\/\//, ''))
                    })
                    // }).catch(err => {
                    //     C.ConsoleError(`SetImgByRef.${err}`)
                    // })
                },
                PrepImage = (aO5, btns, TryEncode) => {
                    const urlatr = {},
                        snd = aO5.snd,
                        iatr = 'image_play',
                        ori = wshp.OriForTag(snd, '', iatr)

                    if (ori.url) {
                        const url = TryEncode(ori, snd)
                        aO5.parms.image_play = url // а сам aO5.image.play будет (при задании 'image_play') создан лишь при обращении
                    }
                    else {
                        const iplay = snd.getAttribute(iatr)
                        if (iplay) {
                            const url = TryEncode({ atr: iatr, url: iplay }, snd)
                            aO5.parms.image_play = url
                        }
                        else
                            if (btns.play)
                                aO5.parms.image_play = btns.play
                    }

                    Object.assign(ori, wshp.OriForTag(snd, 'src', ''))

                    if (ori.url) {
                        const url = TryEncode(ori, snd),
                            src = snd.getAttribute('src')

                        if (url && src != url) {
                            SetImgByRef(aO5.snd, url)
                            Object.assign(urlatr, { snd: aO5.name, atr: 'src', url: url, 'ориг.': ori.url })

                        } else
                            aO5.waitActivate(aO5.image.stop)
                    }
                    else
                        if (btns.stop) SetImgByRef(aO5.snd, btns.stop)
                        else
                            console.error(aO5.name, 'PrepImage()', `тег <img>`, '', `Нет вариантов url'а и отсутствует 'btn_stop'`)

                    if (ori.atr == 'data-src' || ori.atr == '_src')
                        snd.removeAttribute(ori.atr)	// чтоб другие модули не повторяли

                    return urlatr
                }

            class Imgs {
                constructor() { this.maps = new Map() }
                makeImgPlay = (aO5, StartSound, CallStartSound, CallStopSound) => MakeImgPlay(aO5, StartSound, CallStartSound, CallStopSound)
                regiBySrc = img => RegiBySrc(this.maps, img)
                prepImage = (aO5, btns, TryEncode) => PrepImage(aO5, btns, TryEncode)
            }
            imgs = new Imgs()
            return imgs
        }
        )
})();
/* global window, document, console, CustomEvent, alert */
/*jshint asi:true  */
/*jshint strict:true  */
/*jshint esversion: 6 */

(function () {              // ---------------------------------------------- snd/Prep ---
    "use strict"

    const
        olga5_modul = 'snd',
        modulname = 'Prep',
        C = window.o7.C,
        debug = C.consts.debug,
        lognam = `${olga5_modul}/${modulname} `,
        StopSoundOnPage = () => {
            if (wshp.actaudio)
                wshp.StopSound(wshp.actaudio.aO5snd)
        },
        TryEncode = (ori, tag) => {
            const wref = C.DeCodeUrl(wshp.W.urlrfs, ori.url, tag ? tag.aO5snd.attrs : '')
            if (wref.err.length > 0)
                errs.Add(C.MakeObjName(tag), ori.url, "декодир. ссылки", ori.atr, wref.err)
            return wref.url
        },
        urlattrs = [],
        errs = [],
        wshp = C.AddModuleSub(olga5_modul, modulname, mtags => {
            const btns = { stop: '', play: '' },
                DecodeAttrs = (mtag) => {
                    const snd = mtag.tag,
                        scls = snd.className,
                        aO5 = snd.aO5snd,
                        modis = aO5.modis,
                        ers = []
                    for (const qual of mtag.quals) {
                        const c = qual.substring(0, 1).toUpperCase()

                        if ('AOLFN'.indexOf(c) >= 0)
                            switch (c) {
                                case 'A': modis.alive = true
                                    break
                                case 'O': modis.over = true
                                    break
                                case 'L': modis.loop = true
                                    break
                                case 'F': if (!snd.classList.contains('o-freeImg'))
                                    snd.classList.add('o-freeImg')
                                    break
                                case 'N': modis.none = true
                                    break
                                default: ers.push(qual)
                            }
                        else
                            modis.aplay = qual.replace(/^[`'"]?\s*|\s*[`'"]?$/g, '')
                    }

                    if (ers.length > 0)
                        errs.Add(aO5.name, scls, 'квалиф. класса', ers.join(', '), "ошибочные квалиф.")

                    if (!modis.aplay && !modis.none)
                        errs.Add(aO5.name, scls, `игнор остальных квалиф.`, 'audio_play', "нету аудио-квалиф.")

                    if (aO5.modis.none) snd.classList.add('o-sndNone')

                    if (!snd.alt || (snd.alt.trim() == '')) snd.alt = snd.title.trim()
                },
                PrepOther = aO5 => {
                    const snd = aO5.snd,
                        srcAtr = aO5.srcAtr,
                        ori = wshp.OriForTag(snd, srcAtr, '')

                    if (ori.url) {
                        const url = TryEncode(ori, snd)
                        if (url != snd[srcAtr]) {
                            snd.setAttribute(srcAtr, url)
                            urlattrs.push({ snd: aO5.name, atr: srcAtr, url: url, 'ориг.': ori.url })
                        }
                    }
                    else
                        errs.Add(aO5.name, 'PrepUrlsAudio()', `тег <${aO5.snd.tagName}>`, '', `Нет ${'data-' + srcAtr}, ${'_' + srcAtr} или ${srcAtr}`)

                    if (ori.atr == 'data-' + srcAtr || ori.atr == '_' + srcAtr)
                        snd.removeAttribute(ori.atr)	// чтоб другие модули не повторяли

                },
                GetBtnUrl = (atr) => {
                    const ori = { url: wshp.W.urlrfs[atr], atr: atr }

                    if (ori.url) {
                        const url = TryEncode(ori, null)
                        if (url != ori.url)
                            urlattrs.push({ snd: atr, atr: ori.atr, url: url, 'ориг.': ori.url })
                        return url
                    }
                }

            for (const mtag of mtags) {
                const snd = mtag.tag,
                    tagName = snd.tagName.toLowerCase()

                if (tagName.match(/audio/i)) continue

                const aO5 = wshp.AO5snd(snd)

                if (mtag.quals && mtag.quals.length > 0) {
                    DecodeAttrs(mtag)

                    const ori = { url: aO5.modis.aplay, atr: 'audio_play' }
                    if (ori.url) {
                        const url = TryEncode(ori, snd)
                        aO5.parms.audio_play = url
                        urlattrs.push({ snd: aO5.name, atr: ori.atr, url: url, 'ориг.': ori.url })
                    }
                }
                else if (!aO5.modis.none)
                    errs.Add(aO5.name, 'PrepUrlsSnd()', `для тега <${aO5.snd.tagName}> '${aO5.name}' `, '', `нет 'audio_play' или иных атрибутов url'а`)

                if (aO5.image.stop) {
                    if (!wshp.imgs) {
                        wshp.imgs = wshp.Imgs()
                        btns.stop = GetBtnUrl('btn_stop') || ''
                        btns.play = GetBtnUrl('btn_play') || ''
                    }
                    const urlatr = wshp.imgs.prepImage(aO5, btns, TryEncode)
                    if (urlatr.snd)
                        urlattrs.push(urlatr)

                    if (snd.src) wshp.imgs.regiBySrc(snd)
                }
                else
                    if (aO5.srcAtr) // если есть адрес - пробую перекодировать
                        PrepOther(aO5)

                aO5.waitActivate(snd)

                // Object.seal(aO5.modis) // м.б. изменено 'none'
                Object.freeze(aO5.parms)
            }

            // C.E.AddEventListener('o_isHidden', StopSoundOnPage)
            window.addEventListener('o_isHidden', StopSoundOnPage)
            for (const eve of ['blur', 'pagehide', 'dblclick'])
                document.addEventListener(eve, StopSoundOnPage)

            /*
                        PrepareAudios
            */
            const audios = C.GetTagsByTagNames('audio', wshp.W.modul),
                efirsts = ['mouseenter', 'focusin'],
                OnPlay = (audio) => {                    
					window.dispatchEvent(new CustomEvent('o5snd_stopSound', { detail: { tag: audio, type: 'audio(тег)', } }))
                    const a = wshp.actaudio
                    if (a && a != audio)
                        wshp.StopSound(a.aO5snd)

                    wshp.actaudio = audio
                },
                OnEnter = (e) => {
                    const audio = e.target
                    audio.setAttribute('src', audio.aO5snd.url)
                    efirsts.forEach(efirst => audio.removeEventListener(efirst, OnEnter))
                }

            for (const audio of audios) {
                const aO5 = audio.aO5snd = {
                    url: '',
                    audio: audio,
                    sound: { state: wshp.setClass.stop, },
                    name: C.MakeObjName(audio),
                    attrs: C.GetAttrs(audio.attributes),
                }

                const name = C.MakeObjName(audio),
                    ori = wshp.OriForTag(audio, 'src', 'audio_play')

                if (ori.url) {
                    const url = TryEncode(ori, audio),
                        src = audio.getAttribute('src')
                    if (ori.url != src) {
                        aO5.url = url
                        efirsts.forEach(efirst => audio.addEventListener(efirst, OnEnter))
                    }
                    if (url != src)
                        urlattrs.push({ snd: name, atr: 'src', url: url, 'ориг.': ori.url })

                    audio.addEventListener('play', e => { OnPlay(e.target) })
                }
                else
                    errs.Add(name, 'PrepUrlsAudio()', `тег 'audio'`, '', `Нет 'audio_play', 
                            ${'data-' + aO5.srcAtr}, ${'_' + aO5.srcAtr}, ${aO5.srcAtr}`)
            }

            if (urlattrs.length > 0)
                if (C.consts.debug > 0) C.ConsoleInfo(`Всего выполнено подстановок snd/audio`, urlattrs.length, urlattrs)

            if (errs.length > 0)
                C.ConsoleError(`${wshp.W.modul}: ошибки перекодировки тегов с ${wshp.W.class}`, errs.length, errs)
        })


    errs.Add = function (name, url, txt, atr, err) {
        this.push({ snd: name, 'источник': url, 'пояснение': txt, val: atr, 'ошибка': err })
    }

    Object.assign(wshp, {
        setClass: {
            stop: 'stop', play: 'play', pause: 'pause',
            SetC: (aO5, state) => {
                if (debug > 1) console.log(`${lognam} SetC (${aO5.name}, '${state}')`)
                const classList = (aO5.image.play ? aO5.image.play : aO5.snd).classList
                if (state == wshp.setClass.play) {
                    const image = aO5.image
                    if (image.play) {
                        image.stop.style.display = 'none'
                        image.play.style.display = aO5.modis.dspl
                    }
                    classList.add('o-sndPlay')
                    classList.remove('o-sndPause')
                }
                else if (state == wshp.setClass.pause) {
                    classList.remove('o-sndPlay')
                    classList.add('o-sndPause')
                }
                else if (state == wshp.setClass.stop) {
                    classList.remove('o-sndPlay')
                    classList.remove('o-sndPause')
                }
                else alert(`setClass.SetC: state='${state}'`)
                aO5.sound.state = state
            }
        },
        OriForTag: (tag, ref, atnam) => {
            const ori = { url: '', atr: '' },
                attr = atnam ? C.GetAttribute(tag.aO5snd.attrs, atnam) : ''
            if (attr)
                Object.assign(ori, { url: attr.value, atr: atnam })
            else
                if (ref) {
                    const td = C.TagDes(tag, ref)
                    if (td)
                        Object.assign(ori, { url: td.orig, atr: td.from })
                }
            return ori
        },
        StopSound: aO5 => {
            if (debug > 1) console.log(`${lognam}  StopSound (${aO5.name})`)

			// тут его НИЗЗЯ ! window.dispatchEvent(new CustomEvent('o5snd_stopSound', { detail: { tag: aO5.audio, type: 'audio', } }))

            wshp.actaudio = null

            const image = aO5.image,
                audio = aO5.audio ? aO5.audio : aO5.sound.audio

            audio.pause()
            audio.currentTime = 0
            aO5.sound.state = wshp.setClass.stop

            if (image && image.play) {
                image.play.style.display = 'none'
                image.stop.style.display = aO5.modis.dspl
            }

            if (audio !== aO5.audio)
                wshp.setClass.SetC(aO5, wshp.setClass.stop)
        },
    })

    window.addEventListener('o5snd_stopSound', e => {
        if (wshp.actaudio && wshp.actaudio != e.detail.tag)
            wshp.StopSound(wshp.actaudio.aO5snd)
        // console.log(act.id, 5, e.detail)
    })

})();
﻿/* global document, window */
/*jshint asi:true  */
/*jshint strict:true  */
/*jshint esversion: 6 */

(function () {              // ---------------------------------------------- shp ---
	"use strict";

	const
		C = window.o7.C,
		olgaShp = 'olga-shp',
		W = {
				modul: 'shp',
				Init: ShpInit,
				incls: ['DoInit', 'PBases', 'AO5shp', 'PO5shp', 'Frames', 'DoChgs'],
		},
		wshp = (window.o7 ??= {})[W.modul] = { W },
		o5css = `
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

	function ShpInit() {

		C.ParamsFill(W, o5css)

		const excls = document.getElementsByClassName('o-shpNone')
		for (const excl of excls) {
			const exs = excl.querySelectorAll(`[class *=${olgaShp}]`)
			for (const ex of exs)
				ex.classList.add('o-shpNone')
		}

		wshp.DoInit.Init()

		C.DispatchEvent('o_scriptDone', W.modul)

		wshp.activated = false 	// признак, что было одно из activateEvents 
		const activateEvents = ['click', 'keyup', 'resize'],
			wd = window, // document
			SetActivated = () => {
				wshp.activated = true
				activateEvents.forEach(activateEvent => wd.removeEventListener(activateEvent, SetActivated))
			}

		activateEvents.forEach(activateEvent => wd.addEventListener(activateEvent, SetActivated))
	}

	wshp.Map = class extends Map {
		constructor(cc = "|") {
			super()
			this.cc = cc
		}
		#normalizeKey(key) { return Array.isArray(key) ? key.join(this.cc) : key }
		set(key, value) { return super.set(this.#normalizeKey(key), value) }
		get(key) { return super.get(this.#normalizeKey(key)) }
		has(key) { return super.has(this.#normalizeKey(key)) }
		delete(key) { return super.delete(this.#normalizeKey(key)) }
	}

	wshp.IntersectionObserver = class extends IntersectionObserver {
		constructor(callback, options) {
			super(callback, options)
			this.tags = new Set() // Используем Set, чтобы не было дубликатов
			this.aO5s = new Set() // все контролируемые aO5
		}
		observe(tag) {
			if (!this.tags.has(tag)) {
				super.observe(tag)
				this.tags.add(tag)
				// const aO5s = tag.pO5.aO5xs.T
				// for (const aO5 of aO5s)
				// 	this.aO5s.add(aO5)
			}
		}
		unobserve(tag) {
			if (this.tags.has(tag)) {
				super.unobserve(tag)
				this.tags.delete(tag)

				this.aO5s.length = 0
				for (const tag of this.tags) {
					const aO5s = tag.pO5.aO5ps.T
					for (const aO5 of aO5s)
						this.aO5s.add(aO5)
				}
			}
		}
		disconnect() {
			super.disconnect()
			this.tags.length = 0
		}
	}
})();
/* global window, console, IntersectionObserver */
/*jshint asi:true  */
/*jshint strict:true  */
/*jshint esversion: 6 */
(function () {
    "use strict"

    /**
     * @module shp/DoInit
     * Инициализация скроллируемых объектов.
     *
     * Содержит функции:
     * - `Observe(entries)` — обработка появления элементов в области видимости.
     * - `Init()` — первичная инициализация обсерверов.
     */
    let observ;

    const
        olga5_modul = "shp",
        modulname = 'DoInit',
        C = window.o7.C,
        debug = C.consts.debug,
        state = {
            observer: null,
            elements: new Set,
        },
        DebugShowRez = oO5s => {
            const
                head = ` после "${Array.from(oO5s).map(aO5 => aO5.name).join(', ')}"`,
                rez = []

            for (const aO5 of oO5s)
                rez.push({
                    aO5: aO5.name,
                    tagCut: aO5.frms.tagCut.id,
                    base: aO5.pBase.pO5.name,
                    frms: Array.from(aO5.frms.frames).map(f => f.pO5.cnst.id).join(', ')
                })
            C.ConsoleInfo(`Обработка ${head}`, rez.length, rez)

            rez.length = 0
            for (const { bO5, pBase } of wshp.PBases.PBase)
                rez.push({
                    base: pBase.pO5.name,
                    pOuts: ' ' + (Array.from(pBase.pO5.pOuts)).map(p => p.name).join(', '),
                    // pIncs: ' ' + (Array.from(pBase.pO5.pIncs)).map(p => p.name).join(', '),
                    aAll: ' ' + pBase.aAll.map(tag => tag.id).join(', ')
                })
            C.ConsoleInfo(`Базы ${head}`, rez.length, rez)

            rez.length = 0
            for (const { bO5, pBase } of wshp.PBases.PBase)
                for (const pOut of pBase.pO5.pOuts)
                    rez.push({
                        base: pBase.pO5.name,
                        pOut: pOut.name,
                        pOuts: ' ' + (Array.from(pOut.pOuts)).map(p => p.name).join(', '),
                        // pIncs: ' ' + (Array.from(pOut.pIncs)).map(p => p.name).join(', ')
                    })
            C.ConsoleInfo(`pOuts ${head}`, rez.length, rez)


            rez.length = 0
            for (const { key, frame } of wshp.Frames.Frame) {
                rez.push({
                    key: key,
                    tcn: frame.typ + ':' + frame.cod + ':' + frame.num,
                    pO5: frame.pO5.name,
                    aO5fs: frame.aO5fs.map(a => a.name).join(', '),
                })
            }
            C.ConsoleInfo(`Фреймы ${head}`, rez.length, rez)
        },

        Init = () => {
            const mtags = C.SelectByClassName(wshp.W.class, olga5_modul)
            let found;

            for (const mtag of mtags) {
                if (
                    !mtag.tag.classList.contains('o-shpNone') &&
                    !mtag.quals.find(qual => !qual.includes('=') && qual.match(/n/i))
                ) {
                    if (!observ)
                        observ = CreateObserver({
                            root: null,
                            threshold: [0, 1],
                            rootMargin: '0px',
                            trackVisibility: false,
                        })
                    observ.observe(mtag.tag, mtag.quals)
                    found = true
                }
            }

            if (!found)
                console.log("%c%s", C.consts.fmtErr, `Контейнера с классом 'olga-start' не содержат '${wshp.W.class}'`,
                    `(либо вообще, либо без 'o-shpNone' и ':N')`)
        },

        ReadCls = (aO5, ss) => {
            const
                errs = [],
                cls = aO5.cls,
                puts = cls.puts,
                mselec = /[A-Z]|a-z]|[+-]?\d+/g

            Object.assign(cls, {           // для повторной инициализации (напр. в тестах)
                level: 0,
                pitch: 'S',
                nofx: false,
                alive: false,
            })
            puts.T = puts.L = puts.R = puts.B = false

            const cs = ss.toUpperCase().match(mselec)
            for (const c of cs)
                switch (c) {
                    case 'A': cls.alive = true
                        break
                    case 'C':                // сжимает предыдущий
                    case 'P':                // сталкивает предыдущий
                    case 'S':                // сдвигает предыдущий
                    case 'O': cls.pitch = c  // наезжает на предыдущий
                        break
                    case 'T':
                    case 'L':
                    case 'R':
                    case 'B': puts[c] = true
                        break
                    case 'N': cls.nofx = true; break    // не подвисает, но может сдвигать остальные
                    default:
                        if (!isNaN(c)) cls.level = Number(c)
                        else
                            errs.push(`c='${c}' в "${ss}"`)
                }
            if (!puts.T && !puts.L && !puts.R && !puts.B) puts.T = true

            if (errs.length)
                console.error("%c%s", C.consts.fmtErr, `Для ${aO5.name} не опр. квалиф.: ` + errs.join(', '))
        },

        ReadAttrs = aO5 => {
            const aquals = aO5.cls.quals.split(/[:;]/)
            let sclss = 'T', sdivs = '';
            switch (aquals.length) {
                case 0: break
                case 1:
                    if (aquals[0].indexOf('=') < 0) sclss = aquals[0]
                    else sdivs = aquals[0]
                    break
                case 2:
                    sclss = aquals[0]
                    sdivs = aquals[1]
                    break
                default:
                    sclss = aquals[0]
                    sdivs = aquals.slice(1).join(',')
            }

            ReadCls(aO5, sclss) // разделяющие запятые там просто игнорируются

            wshp.Frames.MakeFrames(aO5, sdivs.split(','))
        }

    const
        Observe = entries => {
            const newO5s = new Set(),
                reaO5s = new Set()

            for (const entry of entries) {
                const shp = entry.target
                let aO5 = shp.aO5shp,
                    ready = aO5 ? aO5.act.ready : 0

                if (entry.isIntersecting) {
                    if (!aO5) {
                        const el = observ.getel(shp)
                        aO5 = new wshp.AO5shp.AO5(shp, el.quals)
                        aO5.act.observer = state.observer
                        newO5s.add(aO5)
                    }

                    if (entry.intersectionRatio === 1)  //   && !aO5.act.isfix  (необязательно)
                        // if (!aO5.cls.badtag)
                        aO5.act.ready = true
                }
                else
                    if (aO5 && !aO5.act.isfix)
                        aO5.act.ready = false

                if (aO5) {
                    shp.classList.toggle('o-isready', aO5.act.ready)
                    if (ready !== aO5.act.ready)
                        reaO5s.add(aO5)
                }
            }

            if (newO5s.size > 0) {
                const bBases = new Set()
                let isNew = false
                for (const aO5 of newO5s) {
                    if (wshp.PBases.PBase.AddToBase(aO5))  // если добавилась новая база
                        isNew = true

                    ReadAttrs(aO5)
                    bBases.add(aO5.pBase)
                }

                for (const bBase of bBases)
                    bBase.ReorderAO5s()

                if (isNew)
                    for (const x of 'TL')
                        wshp.PBases.PBase.SetBorders(x, body.pO5)

                if (debug > 1)
                    DebugShowRez(newO5s)
            }

            if (newO5s.size > 0 || reaO5s.size > 0)     // для тестирования в frames.html
                window.dispatchEvent(new CustomEvent('o_activate', {
                    detail: { reaO5s: reaO5s, newO5s: newO5s }
                }))
            // oO5s.clear()
        }

    /**
     * создаёт наблюдателя за элементами
     * @function CreateObserver
     */
    function CreateObserver(options) {

        state.observer = new IntersectionObserver(Observe, options)

        function getel(tag) {
            for (const el of state.elements)
                if (el.tag === tag)
                    return el
        }

        return {
            observe: (tag, quals) => {
                state.elements.add({ tag: tag, quals: quals ? quals.join(':') : '' })
                state.observer.observe(tag)
            },
            unobserve: (tag) => {
                state.observer.unobserve(tag)
                const el = getel(tag)   // заменено!
                state.elements.delete(el)

                if (state.elements.length === 0) {
                    state.observer.disconnect()
                    state.observer = null
                    if (debug)
                        console.log("%c%s", C.consts.fmtOK, `observe: `, ` отключено полностью`)
                }
            },
            getel, // экспортируем в объект
            get observedElements() {
                return Array.from(state.elements)
            },
        }
    }
    const wshp = C.AddModuleSub(olga5_modul, modulname, [Init, ReadAttrs])
})();
/* global window, document, console, IntersectionObserver */
/*jshint asi:true  */
/*jshint strict:true  */
/*jshint esversion: 6 */
//!
(function () {              // ---------------------------------------------- shp/PBases ---
    "use strict"

    let wshp, ibase = 0

    const
        olga5_modul = "shp",
        modulname = 'PBases',
        C = window.o7.C,
        debug = C.consts.debug,
        opp = { T: 'B', L: 'R', R: 'L', B: 'T' },
        FindAndFill = (aO5, adds) => {
            let bO5, nst, scrls, tag = aO5.cnst.parent
            do {
                let p, c = ' ';
                if (tag.pO5) {               // уже был раньше создан
                    scrls = tag.pO5.scrls
                    if (scrls.V || scrls.H) {
                        p = tag.pO5
                        c = '+'
                    }
                }
                else {
                    nst = window.getComputedStyle(tag)
                    scrls = wshp.PO5shp.PO5.Scrls(tag, nst)
                    if (scrls.V || scrls.H) {
                        p = new wshp.PO5shp.PO5(tag, nst)
                        c = '~'
                    }
                }
                if (p && !bO5) bO5 = p

                if (debug)
                    adds.add(c + C.MakeObjName(tag))

                tag = tag.parentNode
            } while (tag && tag.nodeName !== 'HTML')

            return bO5
        },
        FillPOuts = bO5 => {
            let tag = bO5.cnst.tag, pTop = bO5, pO5;
            const pIncs = new Set([bO5])

            do {
                tag = tag.parentNode
                if (tag && (pO5 = tag.pO5)) {
                    for (const pOut of bO5.pOuts)
                        pOut.pOuts.add(pO5)

                    if (pO5.pOuts.done) {
                        for (const pOut of pO5.pOuts)
                            for (const pInc of pIncs)
                                pInc.pOuts.add(pOut)

                        break
                    }

                    pIncs.add(pO5)
                    pO5.pOuts.done = true

                    pTop = pO5
                }
            } while (tag && tag.nodeName !== 'HTML')
        },  
        GetMaxIndex = pbO5 => {
            let zIndex = 0
            for (const pOut of pbO5.pOuts) {
                const aO5 = pOut.cnst.el.aO5shp
                zIndex = Math.max(
                    zIndex,
                    pOut.cnst.zIndex,
                    (aO5 && aO5.act.isfix) ? aO5.cart.style.zIndex : 0)
            }
            return zIndex
        }
    /**
    * база - скроллируемый контейнер, содержащий общую информацию для подвисабельных объектов
    */
    class PBase {
        static #pbases = new Map()
        static #idn = 0
        tagCuts = new Set()
        aAll = []

        constructor(pO5) {
            this.pO5 = pO5
            this.idn = PBase.#idn++
            this.pBordss = { // список тех из pOut, которые оказались (соотв. стороной) внутри this.pO5
                T: [pO5], L: [pO5], R: [pO5], B: [pO5],
            }
            this.bChgs = { // въезжание вложенных контейнеров
                start: true,
                T: 0, L: 0, R: 0, B: 0,
                zIndex: GetMaxIndex(pO5)  
            }

            for (const nam of ['bChgs'])
                Object.seal(this[nam])

            this.bO5s = {}  // списки aO5 в порядке удалённости от соттв. края  (т.е. от 'TLRB')
            for (const m of 'TLRB') {
                this.bO5s[m] = new Set()
                Object.freeze(this.bO5s[m])
            }

            Object.freeze(this.pBordss)
            Object.freeze(this)

            PBase.#pbases.set(pO5, this)
        }
        static #sorters = {   // по возрастанию
            T: (a1, a2) => a1.posO.top - a2.posO.top,
            L: (a1, a2) => a1.posO.left - a2.posO.left,
            R: (a1, a2) => (a2.posO.left + a2.posO.width) - (a1.posO.left + a1.posO.width),
            B: (a1, a2) => (a2.posO.top + a2.posO.height) - (a1.posO.top + a1.posO.height),
        }
        ReorderAO5s() {
            for (const aO5 of this.aAll) {
                const p = aO5.shdw.getBoundingClientRect()
                Object.assign(aO5.posO, { top: p.top, left: p.left, height: p.height, width: p.width, right: p.right, bottom: p.bottom })
            }

            for (const m of 'TLRB') {
                this.aAll.sort(PBase.#sorters[m])

                this.bO5s[m].clear()
                for (const aO5 of this.aAll) {
                    aO5.aO5s[m].clear()

                    const aO = aO5.posO
                    let i = this.aAll.indexOf(aO5)

                    while (i-- > 0) {
                        const iO5 = this.aAll[i],
                            iO = iO5.posO

                        if ('TB'.includes(m) ? (
                            !(iO.right < aO.left || iO.left > aO.right) &&              // в стороне от aO5
                            (m === 'T' ? (aO.top > iO.bottom) : (aO.bottom < iO.top))   // перекрываются с aO5
                        ) : (
                            !(iO.bottom < aO.top || iO.top > aO.bottom) &&              // в стороне от aO5
                            (m === 'L' ? (aO.left > iO.right) : (aO.right < iO.left))   // перекрываются с aO5
                        ))
                            aO5.aO5s[m].add(iO5)
                    }

                    if (debug > 2)
                        console.log(`${aO5.cnst.id}[${m}]: ` + Array.from(aO5.aO5s[m]).map(a => a.id).join(', '))
                    this.bO5s[m].add(aO5)
                }
            }

            if (debug > 1) {
                const ra = []
                for (const aO5 of this.aAll) {
                    const r = { aO5: aO5.cnst.id }
                    for (const m of 'TLRB')
                        r[m] = Array.from(aO5.aO5s[m]).map(a => a.id).join(', ')
                    const i = aO5.cnst.id.substr(-1)
                    ra[i] = r
                }
                C.ConsoleInfo(`Теги, расположенные с соотв. стороны от aO5  (по удалённости)`, ra.length, ra)
                const rb = []
                for (const m of 'TLRB')
                    rb.push({ m: m, aO5s: Array.from(this.bO5s[m]).map(a => a.id).join(', ') })
                C.ConsoleInfo(`Теги, с соотв. стороны в контейнеры (по удалённости)`, rb.length, rb)
            }
        }
        static AddToBase(aO5) {
            let pTop, newPs = 0;
            const
                adds = new Set(),
                bO5 = FindAndFill(aO5, adds)

            if (!bO5) {
                console.error("%c%s", C.consts.fmtErr, ` Тегу ${aO5.name} не найден базовый контейнер — пропускаем`)
                return
            }

            if (debug > 1)
                console.log(`AddToBase: ${aO5.name}: ${Array.from(adds).join(', ')} `)

            // подключаем (и создаём) pbase
            let pBase = PBase.#pbases.get(bO5)
            if (!pBase) {
                pBase = new PBase(bO5)   // там же и set()
                FillPOuts(bO5)
                newPs++
            }

            for (const pOut of bO5.pOuts)
                pOut.pBases.add(pBase)

            aO5.pBase = pBase
            if (!pBase.aAll.includes(aO5))
                pBase.aAll.push(aO5)

            return newPs
        }
        static SetBorders(x, pcO5) {
            for (const m of [x, opp[x]]) {
                const isTL = 'TL'.includes(m)

                for (const pBase of pcO5.pBases) {
                    const
                        pbO5 = pBase.pO5,
                        pBords = pBase.pBordss[m],
                        tis0 = pbO5.scops.time === 0
                    let chg = ''
                    if (pbO5.scops.isVisible) {
                        const vb = pbO5.scops[m]

                        for (const pOut of pbO5.pOuts) {
                            if (pOut === pbO5)
                                continue

                            const
                                v = pOut.scops[m],
                                iOut = pBords.indexOf(pOut),
                                inside = isTL ? vb < v : vb >= v

                            // chg: либо было пересечение а теперь граница  pOut стала внутри pbO5; 
                            // либо пересечения не было а pOut вышло из-нутри pbO5
                            if (iOut >= 0) {
                                if (!inside) {
                                    chg = `"удалил  '${pOut.name}'"`
                                    pBords.splice(iOut, 1)
                                }
                            }
                            else
                                if (inside) {
                                    let i = pBords.length
                                    while (i-- > 0)
                                        if (isTL ? pBords[i].scops[m] >= v : pBords[i].scops[m] < v)
                                            break

                                    pBords.splice(i, 0, pOut)
                                    chg = `"добавил '${pOut.name}'"`
                                }
                        }
                        // не вылезла ли граница за пределы?
                        if (!chg) {
                            let v, i = 1, vi = pBords[0].scops[m]
                            while (!chg && i < pBords.length) {
                                v = vi
                                vi = pBords[i].scops[m]
                                if (isTL ? v < vi : v >= vi)
                                    chg = `"изменил '${pBords[i].name}'"`
                                i++
                            }
                        }

                        if (chg || tis0)
                            pBords.sort((b1, b2) =>	 // по возрастанию						
                                isTL ? (b2.scops[m] - b1.scops[m]) : (b1.scops[m] - b2.scops[m]))
                    }
                    pBase.bChgs[m] = chg

                    if (debug > 1 && (chg || tis0))
                        console.log(
                            `скролл. ${pcO5.name} по [${m}] для ${pBase.pO5.cnst.id} '${chg}'   ` +
                            `${pBase.pBordss[m].map(b => b.name + ':' + ('' + b.scops[m]).padStart(4)).join(', ')}`
                        )
                }
            }
        }
        // делаем класс итерируемым
        static *[Symbol.iterator]() {
            for (const [pO5, pBase] of this.#pbases.entries()) {
                yield { pO5, pBase };
            }
        }
    }

    wshp = C.AddModuleSub(olga5_modul, modulname, [PBase])
})();/* global window, document, console, CustomEvent */
/*jshint asi:true  */
/*jshint strict:true  */
/*jshint esversion: 6 */

(function () {              // ---------------------------------------------- shp/AO5shp ---
    "use strict"
    let wshp = {} //, debugnames = ['moe4'] 	//'shp1-2', 

    const
        olga5_modul = "shp",
        modulname = 'AO5shp',
        C = window.o7.C,
        debug = C.consts.debug,
        DblClick = e => {
            if (e.currentTarget !== e.target && e.target.ondblclick) {
                if (debug > 0)
                    console.error("%c%s", C.consts.fmtErr, C.MakeObjName(e.target), ` - тег имеет свой dblclick-обработчик — пропускаем`)
                return
            }

            const aO5 = e.currentTarget.aO5shp  // т.е. расфиксирую всё
            aO5.DoFix()

            e.stopImmediatePropagation()

            if (debug > 0)
                console.log("%c%s", C.consts.fmtOK, `расфиксация '${aO5.cnst.id}' по событию '${e.type}'`)
        },
        IsOnlyTranslate = nst => {
            const t = nst.transform;
            if (!t || t === 'none') {
                return { x: 0, y: 0 };
            }
            // --- 2D ---
            const eps = 1e-6,
                m2 = t.match(/^matrix\(([^)]+)\)$/)
            if (m2) {
                const v = m2[1].split(',').map(Number)
                /*    matrix2d:
                  [ 1  0  ]
                  [ 0  1  ]
                   tx ty 
                */  if (
                    Math.abs(v[0] - 1) < eps &&
                    Math.abs(v[1]) < eps &&
                    Math.abs(v[2]) < eps &&
                    Math.abs(v[3] - 1) < eps
                )
                    return { x: v[4], y: v[5] }
            }
            else {
                // --- 3D ---
                const m3 = t.match(/^matrix3d\(([^)]+)\)$/)
                if (m3) {
                    const v = m3[1].split(',').map(Number)
                    /*    matrix3d:
                      [ 1  0  0  0 ]
                      [ 0  1  0  0 ]
                      [ 0  0  1  0 ]
                      [ tx ty tz 1 ]
                    */
                    if (
                        Math.abs(v[0] - 1) < eps &&
                        Math.abs(v[1]) < eps &&
                        Math.abs(v[2]) < eps &&
                        Math.abs(v[3]) < eps &&

                        Math.abs(v[4]) < eps &&
                        Math.abs(v[5] - 1) < eps &&
                        Math.abs(v[6]) < eps &&
                        Math.abs(v[7]) < eps &&

                        Math.abs(v[8]) < eps &&
                        Math.abs(v[9]) < eps &&
                        Math.abs(v[10] - 1) < eps &&
                        Math.abs(v[11]) < eps &&

                        Math.abs(v[15] - 1) < eps
                    )
                        return { x: v[12], y: v[13] }
                }
            }
        },
        Init = aO5 => {
            const shp = aO5.cnst.shp,
                nst = window.getComputedStyle(shp),
                t = IsOnlyTranslate(nst),
                z = nst.zoom

            aO5.act.inited = true

            if (!t || !(z === "normal" || Number(z) === 1)) {
                const
                    err = !t ? `'transform'` : `'zoom'`,
                    add = !t ? `(кроме "translation")` : `(кроме "zoom = 1")`
                window.o7.C.ConsoleLog(aO5.name, ` - теги с ` + err + ` НЕ обрабатываются`, 1, 0, add)
                console.log(`DoFix ${aO5.name}: расфиксировалось (навсегда)`)
                aO5.act.observer.unobserve(shp)
                aO5.act.ready = false
                return true
            }

            Object.assign(aO5.transform, t)

            Object.assign(aO5.origin, {
                display: nst.display,
                overflowX: nst.overflowX,
                overflowY: nst.overflowY,
            })
            Object.assign(aO5.margin, {
                margin: nst.margin,
                marginTop: nst.marginTop,
                marginLeft: nst.marginLeft,
                marginRight: nst.marginRight,
                marginBottom: nst.marginBottom,
            })
            Object.assign(aO5.outline, {
                outlineWidth: nst.outlineWidth,
                outlineStyle: nst.outlineStyle,
                outlineColor: nst.outlineColor,
                outlineOffset: nst.outlineOffset,
            })

            const a = shp.style
            Object.assign(aO5.astyle, {
                top: a.top,
                left: a.left,
                width: a.width,
                height: a.height,
                margin: a.margin,
                border: a.border,
                outline: a.outline,
                position: a.position,
                overflowX: a.overflowX,
                overflowY: a.overflowY,
                boxSizing: a.boxSizing,
            })
        },
        ClearClone = clon => {
            const EVENTS = [
                'onclick', 'ondblclick',
                'onmousedown', 'onmouseup',
                'onmousemove', 'onmouseover', 'onmouseout',
                'onkeydown', 'onkeyup', 'onkeypress',
                'onchange', 'oninput', 'onsubmit',
                'onfocus', 'onblur',
                'oncontextmenu'
            ],
                all = [clon, ...clon.querySelectorAll('*')];

            for (const el of all) {
                for (const ev of EVENTS)
                    el.removeAttribute(ev)

                if (el.id) {
                    el.dataset.origId = el.id       ??
                    el.id = ''
                }
            }
        },
        RecalcIndex = (pBases, dIndex) => {
            for (const pBase of pBases) {
                pBase.bChgs.zIndex += dIndex
                for (const iO5 of pBase.aAll)
                    if (iO5.act.isfix)
                        iO5.cart.style.zIndex = parseInt(iO5.cart.style.zIndex) + dIndex
            }
        },
        T = ['T', 'L', 'R', 'B'],
        MakeT = (v) => Object.seal(
            Object.fromEntries(T.map(k => [k, typeof v === 'function' ? v() : v]))
        ),
        styleInChart = {
            top: 0, left: 0, width: '100%', height: '100%', margin: '0',
            outline: 'none', position: 'relative',
            transform: 'translate(0px, 0px, 0px)',
            boxSizing: 'border-box',
            // overflowX: 'visible',
            // overflowY: 'visible',
            transition: 'none',
        }

    class AO5 {
        static #nom = 0

        #state = Object.seal({ transition: '', scrollLeft: 0, scrollTop: 0, active: false, })
        name = ''       // вначале, чтобы было лучше "видно"

        transform = Object.seal({ x: 0, y: 0, })
        attachss = MakeT(() => [])  // список: которые зафиксированы на этом
        canFixs = MakeT(null)
        canCuts = MakeT(null)
        hidden = MakeT(0)
        scops = MakeT(0)      //   копия из pO5 - координаты рабочей зоны контейнера
        outline = {}
        astyle = {}
        margin = {}
        origin = {}
        aO5s = {}           // списки aO5 в порядке удалённости с соттв. стороны  (т.е. от 'TLRB')
        fixs = {}           // состояние фиксированности по сторонам 'TLRB'

        frms = Object.seal({ tagCut: null, frames: new Set() })

        cart = null
        clon = null
        pBase = null
        posS = Object.seal({ top: 0, left: 0 })
        posC = Object.seal({ top: 0, left: 0, height: 0, width: 0, })
        posO = Object.seal({ top: 0, left: 0, height: 0, width: 0, right: 0, bottom: 0 })

        act = Object.seal({ isfix: false, ready: false, inited: false, observer: null, })

        constructor(shp, quals) {
            shp.aO5shp = this
            this.name = window.o7.C.MakeObjName(shp)
            this.shdw = shp

            Object.assign(this, {
                cnst: Object.freeze({
                    parent: shp.parentElement,   // запоминаю исходное
                    nom: AO5.#nom++,
                    id: shp.id,
                    shp: shp,
                }),
                cls: Object.seal({
                    quals: quals,               // меняю в тестах для ReadAttrs         
                    puts: MakeT(false),             // инициализация puts будет в ReadCls(this, ss) 
                    zIndex: shp.style.zIndex,   // для PitchBy 
                    level: 0, pitch: 0, nofx: 0, alive: 0,
                }),
            })
            for (const m of 'TLRB') {
                this.aO5s[m] = Object.freeze(new Set())
                this.fixs[m] = Object.seal({ xO5: null, isP: '' })
            }
            Object.freeze(this.aO5s)
            Object.freeze(this.fixs)

            Object.seal(this)
        }
        IsP(x, isP) {
            const fix = this.fixs[x]
            if (fix.xO5)
                if (fix.isP === isP)
                    return fix.xO5
                else return false
            else return null
        }
        ShowFix() {
            const
                posC = this.posC,
                pw = (posC.width > 0) ? posC.width : 0,
                ph = (posC.height > 0) ? posC.height : 0

            Object.assign(this.cart.style, {
                display: (pw === 0 || ph === 0) ? 'none' : '',
                top: posC.top + 'px',
                left: posC.left + 'px',
                width: pw + 'px',
                height: ph + 'px',
            })

            const cart = this.cart,   // это вместо FixScrollbarGutter(cart, shp)
                dx = cart.offsetWidth - cart.clientWidth,
                dy = cart.offsetHeight - cart.clientHeight
            Object.assign(this.cnst.shp.style, {
                width: `${this.posO.width - dx}px`,
                height: `${this.posO.height - dy}px`,
                transform: `translate(${this.posS.left}px, ${this.posS.top}px)`
            })
        }
        StoreState() {
            const shp = this.cnst.shp
            const ae = document.activeElement
            Object.assign(this.#state, {
                transition: shp.style.transition,
                scrollLeft: shp.scrollLeft,
                scrollTop: shp.scrollTop,
                active: ae && ae !== document.body && shp.contains(ae) ? ae : null,
            })
        }
        RestoreState() {
            const
                shp = this.cnst.shp,
                state = this.#state

            requestAnimationFrame(() => {               // rAF #1 — после DOM/layout
                shp.scrollLeft = state.scrollLeft
                shp.scrollTop = state.scrollTop
                requestAnimationFrame(() => {           // rAF #2 — после scroll settle
                    shp.scrollLeft = state.scrollLeft
                    shp.scrollTop = state.scrollTop
                    if (state.active
                        && state.active.isConnected
                        && document.activeElement !== state.active)
                        try {
                            state.active.focus({ preventScroll: true })
                        } catch {
                            state.active.focus()
                        }
                    // восстанавливать - если усер НЕ сделал "Эффекты анимации → выкл"
                    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches)
                        shp.style.transition = state.transition
                })
            })
        }
        ApplyFix() {
            const
                shp = this.cnst.shp,
                nom = this.cnst.nom,
                clon = this.clon = shp.cloneNode(true)

            ClearClone(clon)

            clon.id = `${nom}.clon_${shp.id || ''}`
            clon.classList.add('o-shpClon')
            clon.aO5shp = this
            Object.assign(clon.style,
                {
                    opacity: debug ? 0.22 : 0,
                    transform: shp.style.transform,
                }
            )

            const cart = this.cart = document.createElement('div')
            cart.id = `${nom}.cart_${shp.id || ''}`
            cart.classList.add('o-shpCart')
            cart.aO5shp = this
            Object.assign(cart.style,           //   см. также o5css в shp.js
                {
                    zIndex: this.pBase.bChgs.zIndex + 1,
                    // overflowX: this.origin.overflowX,
                    // overflowY: this.origin.overflowY,
                },
                this.outline,
            )

            if (shp.pO5)
                RecalcIndex(shp.pO5.pBases, 1)

            requestAnimationFrame(() => {
                shp.parentNode.insertBefore(clon, shp)
                clon.style.display = this.origin.display

                document.body.appendChild(cart)
                cart.appendChild(shp)

                Object.assign(shp.style, styleInChart)

                shp.addEventListener('dblclick', DblClick, true)
                this.act.observer.unobserve(shp)
                this.act.observer.observe(clon)

                this.shdw = clon
            })
        }
        RemoveFix() {
            const shp = this.cnst.shp
            if (shp.pO5)
                RecalcIndex(shp.pO5.pBases, -1)

            requestAnimationFrame(() => {
                Object.assign(shp.style, this.astyle, this.margin)
                const t = this.transform
                shp.style.transform = `translate(${t.x}px, ${t.y}px)`

                this.clon.style.display = 'none'
                this.cnst.parent.insertBefore(shp, this.clon)
                this.clon.remove()
                this.cart.remove()
                this.shdw = shp

                shp.removeEventListener('dblclick', DblClick, true)
                this.act.observer.unobserve(this.clon)
                this.act.observer.observe(shp)
            })
        }
        DoFix(x, xO5) {
            const
                act = this.act,
                fixs = this.fixs
            let fold;
            if (debug) {
                const xOld = fixs[x].xO5
                fold = xOld ? xOld.name : ''
                if (this.act.isfix && !(fixs.T.xO5 || fixs.L.xO5 || fixs.R.xO5 || fixs.B.xO5))
                    console.log("%c%s", C.consts.fmtErr, `DoFix ${this.name} отмечено фиксированным`, ' хотя fixs пусто')

                if (x && xOld === xO5)
                    console.log("%c%s", C.consts.fmtErr,
                        `DoFix ${this.name}: повтор 'dofix' для  ${xO5 ? xO5.name : 'null'}[${x}]`)
            }
            if (x) {
                if (xO5)
                    Object.assign(fixs[x], { xO5: xO5, isP: xO5.constructor.name === 'PO5' })
                else
                    fixs[x].xO5 = null
            }
            else fixs.T.xO5 = fixs.L.xO5 = fixs.R.xO5 = fixs.B.xO5 = null

            const dofix = !!(fixs.T.xO5 || fixs.L.xO5 || fixs.R.xO5 || fixs.B.xO5)
            if (act.isfix !== dofix) {

                if (!act.inited)
                    if (Init(this))
                        return

                if (debug) {
                    const op = x ?
                        (xO5 ?
                            ((fold ? `перефиксация с '${fold}'` : `фиксация  `) + ` на '${xO5.name}'`)
                            : `расфиксация с '${fold || 'старт'}'`
                        ) : `полная расфиксация`
                    console.log(`DoFix ${this.name}: по [${x}] ${op}`)
                }

                this.StoreState()
                dofix ?
                    this.ApplyFix() :
                    this.RemoveFix()

                act.isfix = dofix
                this.RestoreState()

                Object.assign(this.hidden, { T: 0, L: 0, R: 0, B: 0 })
            }
            window.dispatchEvent(new CustomEvent('o_testActFix', { detail: { aO5: this, fix: dofix } }))
        }
    }

    wshp = C.AddModuleSub(olga5_modul, modulname, [AO5])
})();

/* global window, document, console, CustomEvent */
/*jshint asi:true  */
/*jshint strict:true  */
/*jshint esversion: 6 */

(function () {              // ---------------------------------------------- shp/PO5shp ---11
    "use strict"
    let wshp, observer;
    const
        olga5_modul = "shp",
        modulname = 'PO5shp',
        C = window.o7.C,
        debug = C.consts.debug,
        saved = {
            last: {
                top: 0, left: 0, height: 0, width: 0,
                sV: 0, sH: 0, rV: 0, rH: 0,
                pO5: null,
                time: 0
            },
            dm: { V: 2, H: 2, dt: 100 },
            Act: (pO5, typ) => {
                const
                    scrll = pO5.scrll,
                    sl = saved.last

                if (sl.pO5 && sl.pO5 !== pO5) { // заканчиваю предыдущую цепочку скроллингов
                    if (debug > 2)
                        console.log("%c%s", C.consts.fmtOK, `scroll ${sl.pO5.cnst.id}: `, ' закончил!')

                    Object.assign(scrll, {
                        time: sl.time,
                        top: sl.top, left: sl.left, height: 0, width: 0
                    })
                    wshp.DoChgs.MakeScroll(
                        sl.sV || sl.rV,
                        sl.sH || sl.rH,
                        sl.pO5,
                        true
                    )
                    sl.pO5 = null
                }

                const
                    el = pO5.cnst.el,
                    dm = saved.dm,
                    now = performance.now(),
                    sV = el.scrollTop - scrll.top,
                    sH = el.scrollLeft - scrll.left,
                    rH = el.clientWidth - scrll.width,
                    rV = el.clientHeight - scrll.height,
                    dt = now - scrll.time >= dm.dt,
                    strt = scrll.time <= 0,
                    typS = typ === 'S'

                if (
                    Math.abs(sV) >= dm.V ||
                    Math.abs(sH) >= dm.H ||
                    Math.abs(rV) >= dm.V ||
                    Math.abs(rH) >= dm.H ||
                    dt
                ) {
                    if (debug > 2)
                        console.log("%c%s", C.consts.fmtOK, `saved ${pO5.cnst.id}: ${typ === 'S' ? 'скроллинг' : 'размеры'} ` +
                            `sV=${sV}, sH=${sH}, rV=${rV}, rH=${rH}, sT=${el.scrollTop}, aT=${scrll.top}, sL=${el.scrollLeft}, aL=${scrll.left}`)

                    Object.assign(scrll, {
                        time: now,
                        top: el.scrollTop, left: el.scrollLeft, width: el.clientWidth, height: el.clientHeight
                    })
                    const
                        dV = strt ? 0.1 : (typS ? sV : (rV ? 0.1 : 0)),
                        dH = strt ? 0.1 : (typS ? sH : (rH ? 0.1 : 0))
                    let blks
                    if (debug) {
                        const blk = document.getElementById('blockScroll')
                        blks = blk && blk.checked
                    }
                    if (window.o7.canDoScroll) {
                        window.o7.canDoScroll = false
                        blks = false
                    }

                    if ((dV || dH) && !blks)
                        wshp.DoChgs.MakeScroll(dV, dH, pO5, true)

                    sl.pO5 = null
                }
                else
                    if (sV || sH || rV || rH) {
                        Object.assign(sl, {
                            pO5: pO5,
                            time: now,
                            sV: sV, sH: sH, rV: rV, rH: rH,
                            top: el.scrollTop, left: el.scrollLeft, height: el.clientHeight, width: el.clientWidth
                        })
                    }
            },
            Resize: entries => {
                let n, p;
                for (const e of entries) { // ищу самый внешний контейнер
                    const
                        pO5 = e.target.pO5,
                        z = pO5.pOuts.size
                    // console.log(`${pO5.name}: ${Array.from(pO5.pOuts).map(p=>p.name).join(', ')}`)                        
                    if (n >= z || !p) {
                        n = z
                        p = pO5
                    }
                }
                if (p)
                    saved.Act(p, 'R')
            }
        },
        ro = new ResizeObserver(saved.Resize),
        Observe = entries => {
            for (const entry of entries) {
                const pO5 = entry.target.pO5
                pO5.scops.isVisible = entry.isIntersecting
            }
        },
        IsFinal = tag => {
            return tag.aO5shp ||            // контейнер сам является подвисабельным тегом
                tag.nodeName == 'BODY' ||   // контейнер является конечным
                tag.classList.contains('olga-start')
        },
        AbsoluteZIndex = (el, nst) => {
            let current = el, zTotal = 0, multiplier = 1;

            while (current && current !== document) {
                const                           // nst = window.getComputedStyle(current),
                    z = nst.zIndex,
                    pos = nst.position,
                    hasContext =
                        (pos !== 'static' && z !== 'auto') ||
                        ['transform', 'opacity', 'filter', 'perspective', 'willChange'].some(p => {
                            const v = nst[p]
                            return v && v !== 'none' && v !== '1'
                        })

                if (hasContext) {
                    const zNum = isNaN(parseInt(z)) ? 0 : parseInt(z);
                    zTotal += zNum * multiplier;
                    multiplier *= 1000 // каждый новый контекст — «новый порядок» уровней
                }
                current = current.parentElement
            }

            return zTotal
        }

    class PO5 {
        static Scrls(tag, nst) {
            const oxy = tag.nodeName == 'BODY' || (nst.overflow === 'auto')
            return {
                H: oxy || nst.overflowX === 'auto' || nst.overflow === 'scroll' || nst.overflowX === 'scroll',
                V: oxy || nst.overflowY === 'auto' || nst.overflow === 'scroll' || nst.overflowY === 'scroll',
            }
        }
        static pBody;
        name = ''       // вначале, чтобы было лучше "видно"

        constructor(tag, nst) {
            if (tag.pO5)
                C.ConsoleAlert(`Повтор создания 'pO5' для контейнера id='${tag.id}' [${tag.className.trim()}]`)

            const
                ibody = tag.nodeName == 'BODY',
                classList = Array.from(tag.classList),
                el = ibody ? document.documentElement : tag

            el.pO5 = this
            tag.pO5 = this
            if (ibody)
                PO5.pBody = this

            this.name = tag.id ? tag.id : C.MakeObjName(tag)

            Object.assign(this, {
                pOuts: new Set(),  // д.б. Set() иначе в AddToBase будут повторы  (скроллируемые pO5) все скроллируемых внешних контейнеров
                pBases: new Set(),  //   -"-    (скроллируемые pO5) все скроллируемых вложенных контейнеров 

                cnst: Object.freeze({
                    el: el,     //   tag и el различаются только у1 тега body
                    tag: tag,
                    id: tag.id,
                    ibody: ibody,
                    classOrigs: classList,
                    zIndex: AbsoluteZIndex(el, nst),
                }),
                borders: Object.freeze({
                    bgColor: nst.backgroundColor,
                    top: parseFloat(nst.borderTopWidth),
                    left: parseFloat(nst.borderLeftWidth),
                    right: parseFloat(nst.borderRightWidth),
                    bottom: parseFloat(nst.borderBottomWidth),
                }),
                scrls: Object.freeze(PO5.Scrls(tag, nst)),

                scrll: Object.seal({ // позиции скроллинга, видимые границы , текущие границы,  изменение границ от предыдущего              
                    time: -1,
                    top: el.scrollTop,
                    left: el.scrollLeft,
                    width: el.clientWidth,
                    height: el.clientHeight,
                }),
                scops: Object.seal({    //   координаты рабочей зоны контейнера
                    time: -1,
                    isVisible: true,
                    T: 0, L: 0, R: 0, B: 0
                }),
                cuts: Object.seal({
                    T: tag.pO5, L: tag.pO5, R: tag.pO5, B: tag.pO5,
                })
            })

            this.pOuts.done = false
            this.pOuts.add(this)

            Object.seal(this)

            this.CalcScope(0)

            if (this.scrls.H || this.scrls.V) {
                ro.observe(el);
                (ibody ? window : el).addEventListener('scroll', e => {
                    saved.Act(this, 'S')
                })
            }
            if (!observer)
                observer = new IntersectionObserver(Observe, {
                    root: null,
                    threshold: [0, 1],
                    rootMargin: '0px',
                    trackVisibility: false,
                }
                )
            observer.observe(tag)

            if (debug > 1)
                console.log(`PO5 создано ${this.name}`)
        }
        // name = ''    // еще и тут - чтобы сразу видеть в отладчике
        CalcScope(time) {   // видимост,- пересчитывается при скроллине в DoChgsconst
            if (this.scops.time === time)
                return

            const
                tag = this.cnst.tag,
                de = document.documentElement,
                p = this.cnst.ibody ?
                    { top: 0, left: 0, right: de.clientWidth, bottom: de.clientHeight } :
                    tag.getBoundingClientRect(),
                b = this.borders,
                atTo = tag.clientTop > b.top,         // полоса - вверху
                atLe = tag.clientLeft > b.left,       // полоса - слев       
                top = p.top + b.top + (atTo ? (tag.offsetHeight - tag.clientHeight) : 0),
                left = p.left + b.left + (atLe ? (tag.offsetWidth - tag.clientWidth) : 0)

            Object.assign(this.scops, {
                time: time,
                T: top,
                L: left,
                R: left + (this.cnst.ibody ? de.clientWidth : tag.clientWidth),
                B: top + (this.cnst.ibody ? de.clientHeight : tag.clientHeight)
            })
        }
    }

    wshp = C.AddModuleSub(olga5_modul, modulname, [PO5])
})();
/* global window, document, console */
/*jshint asi:true  */
/*jshint strict:true  */
/*jshint esversion: 6 */
//!!
(function () {              // ---------------------------------------------- shp/Frames ---
    "use strict"

    let wshp;
    const
        olga5_modul = "shp",
        modulname = 'Frames',
        C = window.o7.C,
        debug = C.consts.debug,
        MakeFrames = (aO5, ss) => {
            const
                errs = [],
                typs = 'cins',
                frms = aO5.frms,
                pBase = aO5.pBase,
                tagBase = pBase.pO5.cnst.tag,
                TagCheck = (t, typ, cod) => {
                    switch (typ) {
                        case 'n': return t.nodeName === cod
                        case 'i': return t.id === cod
                        case 'c':
                            for (const c of t.classList)
                                if (c == cod)
                                    return true
                    }
                }

            // удаляю старое использование
            for (const [key, frame] of Frame.frames) {
                const i = frame.aO5fs.indexOf(aO5)
                if (i >= 0) {
                    frame.aO5fs.splice(i, 1)
                    if (frame.aO5fs.length === 0)
                        Frame.frames.delete(key)
                }
            }
            // pBase.tagCuts.clear()  // а вот и НЕ надо очищать!
            frms.frames.clear()
            frms.tagCut = null

            // добавляю aO5  к frames
            for (const s of ss) {
                if (!s) continue

                let typ = 'i', cuu = s.trim()
                if (s.includes('=')) {
                    const cc = s.split('=')
                    typ = cc[0].trim().toLowerCase()[0]
                    cuu = cc[1].trim()
                }

                const
                    uu = cuu.split('/'),
                    cod = (uu[0] || '').trim(),
                    par = (uu[1] || '').trim(),
                    iscut = !!par.match(/c/i),
                    isfix = !iscut || par.match(/f/i)

                let num = par.replace(/[fc]/gi, '') || 0 // 'f' уже не используется и игнорируется                    

                if (!typs.includes(typ)) {
                    errs.push(`тип ссылки '${typ}' не начинается одним из '${typs}' заменен на 'i'`)
                    typ = 'i'
                }
                if (!Number.isInteger(num) || isNaN(num)) {
                    errs.push(`непонятное значение для num='${uu[1]}' (после символа '/'). Взято 0`)
                    nim = 0
                }

                if (iscut) {
                    let tag = frms.tagCut
                    if (!tag) {
                        let own = aO5.cnst.parent, n = num
                        if (cod === 'b' || cod === 'B')
                            tag = tagBase
                        else if (cod === 'w' || cod === 'W')
                            tag = body
                        else {
                            do {                        // ищу среди вложенных
                                if (TagCheck(own, typ, cod)) {
                                    tag = own
                                    if (--n <= 0)
                                        break
                                }
                                if (own === tagBase)
                                    break

                                own = own.parentNode
                            }
                            while (own.nodeName !== 'HTML')

                            if (!tag) {
                                own = pBase.pO5.cnst.tag, n = num
                                do {                    // ищу среди  ВСЕХ внешних 
                                    if (TagCheck(own, typ, cod)) {
                                        tag = own
                                        if (--n <= 0)
                                            break
                                    }
                                    own = own.parentNode
                                }
                                while (own.nodeName !== 'HTML')

                                if (tag && tag !== pBase.pO5.cnst.tag)
                                    console.log("%c%s", C.consts.fmtErr, `cut-контейнер '${tag.pO5?tag.pO5.name:C.MakeObjName(tag)}' для '${aO5.name}' `, ` найден снаружи базового контейнера '${pBase.pO5.name}'`)
                            }

                            if (!tag) {
                                errs.push(`${aO5.name}: не найден контейнер 'владелец' для "${s}" . Взял '${tagBase.pO5.name}'`)
                                tag = tagBase
                            }
                            else if (n > 0)
                                errs.push(`взял ${n}-й тег (вместо ${n0} для  "${s}") `)
                        }
                        frms.tagCut = tag
                        if (!tag.pO5)
                            new wshp.PO5shp.PO5(tag, window.getComputedStyle(tag))
                    }
                    else
                        errs.push(`несколько cut-квалификаторов (т.е. содержащих '/c')`)
                }

                if (isfix) {
                    const key = pBase.idn + ':' + typ + ',' + cod + ',' + num
                    let frame = Frame.frames.get(key)
                    if (!frame) {
                        let own = pBase.pO5.cnst.tag, n = num, tag;
                        if (cod === 'b' || cod === 'B')
                            tag = tagBase
                        else if (cod === 'w' || cod === 'W')
                            tag = body
                        else {
                            do {
                                if (TagCheck(own, typ, cod)) {
                                    tag = own
                                    if (--n <= 0)
                                        break
                                }
                                own = own.parentNode
                            }
                            while (own.nodeName !== 'HTML')

                            if (!tag) {
                                let found;
                                switch (typ) {
                                    case 'n': found = !!document.getElementsByTagName(cod); break
                                    case 'i': found = !!document.getElementById(cod); break
                                    case 'c': found = !!document.getElementsByClassName(cod)
                                }
                                const txt = found ? `найден НЕ скроллируемый` : `не найден скроллируемый`
                                errs.push(`${aO5.name}: ${txt}` + //  (или хотя  бы overflow: auto; / scroll;)    
                                    ` контейнер 'оператор' для typ=${typ} и cod='${cod}'. Взял '${pBase.pO5.name}'`)
                                tag = pBase.pO5.cnst.tag
                            }
                            else if (n > 0)
                                errs.push(`взял ${n}-й тег (вместо ${n0} для typ=${typ} и cod=${cod}) `)
                        }
                        frame = new Frame(key, typ, cod, num, tag.pO5)

                        Frame.frames.set(key, frame)

                        if (debug)
                            console.log(`Определил (и добавил в base.frames) фрейм "${key} на ${frame.pO5.name}" `)
                    }

                    frame.aO5fs.push(aO5)
                    frms.frames.add(frame)
                }
            }
            if (!frms.tagCut)
                frms.tagCut = tagBase

            pBase.tagCuts.add(frms.tagCut)

            if (errs.length)
                C.ConsoleError(`Ошибки определения фреймов для ${aO5.name}:`, errs.length, errs)
        }

    class Frame {
        static frames = new Map()
        constructor(key, typ, cod, num, pO5) {
            Object.assign(this, {
                typ: typ,
                cod: cod,
                num: num,
                pO5: pO5,
                aO5fs: [], // кто его использует
            })
            Object.seal(this)
        }

        // делаем класс итерируемым
        static *[Symbol.iterator]() {
            for (const [key, frame] of this.frames.entries()) {
                yield { key, frame };
            }
        }
    }

    wshp = C.AddModuleSub(olga5_modul, modulname, [Frame, MakeFrames])
})();/*jshint asi:true          */
/* global window, console, document */
/*jshint strict:true  */
/*jshint esversion: 6 */
//!
// Configure desktop -> Mouse Action -> Right-Button
(function () {              // ---------------------------------------------- shp/DoChgs ---
	"use strict"

	let wshp, time, D,
		tstO5, tstId = 'shp4', tstNam = 'bottom', tstVal = 481;

	// ---- batching ShowFix() per frame ----
	const FixUpdateQueue = new Set()
	let fixUpdateScheduled = false

	function ScheduleShowFixed(aO5) {
		FixUpdateQueue.add(aO5)
		if (!fixUpdateScheduled) {
			fixUpdateScheduled = true
			requestAnimationFrame(() => {
				for (const o of FixUpdateQueue)
					o.ShowFix()
				FixUpdateQueue.clear()
				fixUpdateScheduled = false
			})
		}
	}

	const
		olga5_modul = "shp",
		modulname = 'DoChgs',
		C = window.o7.C,
		debug = C.consts.debug,
		opp = { T: 'B', L: 'R', R: 'L', B: 'T' },

		CanFixsOn = (aO5, pO5) => {
			for (const frame of aO5.frms.frames)
				if (frame.pO5 === pO5)
					return true
		},
		FindExternalFixCuts = (m, pBase) => {
			const pBords = pBase.pBordss[m]
			for (const aO5 of pBase.aAll) {
				let xO5 = null
				if (aO5.cls.puts[m])
					for (const p of pBords)
						if (CanFixsOn(aO5, p)) {
							xO5 = p
							break
						}

				aO5.canFixs[m] = xO5
				aO5.canCuts[m] = pBords[0]

				// const fix = aO5.fixs[m]
				// if (fix.xO5 && fix.isP)
				// 	fix.xO5 = xO5

				if (debug > 2) console.log(`FindExternalFixCuts ${aO5.name} :  ` +
					`canFixs[${m}] = ${xO5 ? xO5.name : ' -  '},   ` +
					`canCuts[${m}] = ${aO5.canCuts[m] ? aO5.canCuts[m].name : ' -  '}`)
			}
		},
		GetV = (m, aX) => {
			switch (m) {
				case 'T': return aX.top
				case 'L': return aX.left
				case 'R': return aX.left + aX.width
				case 'B': return aX.top + aX.height
			}
		},
		SetV = (m, aX, v) => {
			switch (m) {
				case 'T': aX.top = v; break
				case 'L': aX.left = v; break
				case 'R': aX.left = v - aX.width; break
				case 'B': aX.top = v - aX.height; break
			}
		},
		ReAttach = (x, xTL, aO5) => {
			const
				o = opp[x],
				vC = GetV(o, aO5.posC)
			/**
			 *   Перепозиционировать уже приаттачеенные
			 */
			for (const iO5 of aO5.attachss[o]) {
				SetV(x, iO5.posC, vC)
				InternalTagCuts(o, iO5, 0, 0)

				ReAttach(x, xTL, iO5)
			}
		},
		AttachTo = (x, xTL, aO5) => {
			const
				o = opp[x],
				level = aO5.cls.level,
				vC = GetV(o, aO5.posC)
			/**
			 *   Если прилеплен к "верхнему" [x] bord'у, то
			 * 		подсоединяем те, что "снизу" [o] 
			 */
			for (const iO5 of aO5.aO5s[o]) {
				if (!iO5.act.ready || iO5.cls.level >= level || iO5.fixs[x].xO5)
					continue

				const vI = GetV(x, iO5.posC)
				if (xTL ? vC >= vI : vC <= vI) {
					iO5.DoFix(x, aO5)
					SetV(x, iO5.posC, vC)
					InternalTagCuts(o, iO5, 0, 0)
					aO5.attachss[o].push(iO5)

					AttachTo(x, xTL, iO5)
				}
				else
					break
			}
		},
		UnAttach = (x, xTL, aO5) => {
			const
				o = opp[x],
				vC = GetV(x, aO5.posC),
				attachs = aO5.attachss[x]
			/**
			 *  Если прилеплен к "нижнему" [o] bord'у, то
			 * 	отсоединяем те, что "сверху" [x] 
			 */
			for (const iO5 of attachs) {
				if (iO5.attachss[x].length)
					UnAttach(x, xTL, iO5)

				const vI = GetV(o, iO5.posO)
				if (xTL ? vI < vC : vI > vC) {
					const j = attachs.indexOf(iO5)
					attachs.splice(j, 1)
					iO5.DoFix(o)
				}
			}
		},
		CheckHidden = (aO5) => {
			if (aO5.posC.height <= 0) aO5.hidden.T = aO5.hidden.B = 1
			if (aO5.posC.width <= 0) aO5.hidden.L = aO5.hidden.R = 1

			if (!aO5.cls.alive)
				for (const x of 'TLRB')
					if (aO5.hidden[x]
						&& aO5.fixs[x].xO5
						&& aO5.fixs[x].isP
					) {
						aO5.DoFix(x, null)

						const
							o = opp[x],
							xTL = 'TL'.includes(x),
							attachs = aO5.attachss[o]
						let j = attachs.length
						while (j-- > 0) {
							const iO5 = attachs[j]
							attachs.splice(j, 1)
							iO5.DoFix(x)
							if (!ToFix(x, iO5, xTL))
								UnAttach(x, xTL, iO5)
						}
					}
		},
		ExternalFixCuts = (x, aO5) => {
			const
				v = aO5.canCuts[x].scops[x],
				aC = aO5.posC
			let d;
			switch (x) {
				case 'T': d = v - aC.top; break
				case 'L': d = v - aC.left; break
				case 'R': d = (aC.left + aC.width) - v; break
				case 'B': d = (aC.top + aC.height) - v; break
			}

			if (d > 0) {
				switch (x) {
					case 'T': aC.height -= d; aC.top += d; aO5.posS.top -= d; break
					case 'L': aC.width -= d; aC.left += d; aO5.posS.left -= d; break
					case 'R': aC.width -= d; break
					case 'B': aC.height -= d; break
				}
				return true
			}
		},
		InternalTagCuts = (o, aO5, scV, scH) => {
			const
				pO5 = aO5.frms.tagCut.pO5,
				v = pO5.scops[o],
				aC = aO5.posC

			let d;
			switch (o) {
				case 'T': d = v - aC.top; break
				case 'L': d = v - aC.left; break
				case 'R': d = aC.left + aC.width - v; break
				case 'B': d = aC.top + aC.height - v; break
			}

			if (d > 0) {
				switch (o) {
					case 'T': aC.height -= d; aC.top += d; break
					case 'L': aC.width -= d; aC.left += d; break
					case 'R': aC.width -= d; aO5.posS.left -= d; break		//  - scH
					case 'B': aC.height -= d; aO5.posS.top -= d; break		//  - scV
				}
				return true
			}
		},
		PitchBy = (x, xTL, aO5) => {
			const
				o = opp[x],
				level = aO5.cls.level,
				vC = GetV(o, aO5.posC)
			/**
			 * 	ищу тех, которы согут сдвинуть/сжать aO5
			 *  среди тех, которые находятся со стороны 'o'
			 */
			const pitchs = new Map()
			let vX, xO5, pitch = '', n = aO5.pBase.aAll.length
			do {
				vX = vC
				xO5 = null
				for (const iO5 of aO5.aO5s[o])
					if (iO5.cls.level > level
						&& !pitchs.get(iO5)
					) {
						const vI = GetV(x, iO5.posC)
						if (xTL ? vX > vI : vX < vI) {
							xO5 = iO5
							vX = vI
						}
						iO5.cnst.shp.style.zIndex = parseInt(iO5.cls.zIndex)  // 'обнуляю' индексы
					}

				if (xO5) {
					pitch = xO5.cls.pitch
					pitchs.set(xO5, true)

					const d = xTL ? (vC - vX) : (vX - vC), aC = aO5.posC, aS = aO5.posS
					switch (pitch) {
						case 'C':
							switch (x) {	// сжимает предыдущий	
								case 'T': aC.height -= d; break
								case 'L': aC.width -= d; break
								case 'R': aC.width -= d; aC.left += d; aS.left -= d; break
								case 'B': aC.height -= d; aC.top += d; aS.top -= d; break
							}
							break
						case 'P':
							switch (x) {	// сталкивает предыдущий
								case 'T': aC.height = 0; break
								case 'L': aC.width = 0; break
								case 'R': aC.width = 0; aC.left += aC.width; break
								case 'B': aC.height = 0; aC.top += aC.height; break
							}
							break
						case 'S':
							switch (x) {	// сдвигает предыдущий
								case 'T': aC.height -= d; aS.top -= d; break
								case 'L': aC.width -= d; aS.left -= d; break
								case 'R': aC.width -= d; aC.left += d; break
								case 'B': aC.height -= d; aC.top += d; break
							}
							break
						default: 	//case 'O' - наезжает на предыдущий // ничего не даформируется
							xO5.shp.style.zIndex = parseInt(cart.style.zIndex) + 1
					}
					CheckHidden(aO5)

					ReAttach(x, xTL, aO5)
				}
			} while (xO5 && pitch === 'O' && n-- > 0)

			for (const iO5 of aO5.attachss[o])
				if (PitchBy(x, xTL, iO5))
					pitch = '*'

			return pitch
		},
		SetPos = (x, v, aC, aO) => {
			switch (x) {
				case 'T': aC.top = v; break
				case 'L': aC.left = v; break
				case 'R': aC.left = v - aO.width; break
				case 'B': aC.top = v - aO.height; break
			}
		},
		ToFix = (x, aO5, xTL) => {
			if (aO5.cls.puts[x]
				&& !aO5.IsP(x, false)
			) {
				const pF = aO5.canFixs[x] || aO5.fixs[x].xO5
				if (pF
					&& pF === aO5.pBase.pBordss[x][0]
					&& (aO5.IsP(x, true) !== pF)
				) {
					const vF = pF.scops[x],
						vO = GetV(x, aO5.posO)
					if ((xTL ? (vO < vF) : (vO > vF)))
						aO5.DoFix(x, pF)
				}

			}

			if (aO5.IsP(x, true)) {
				SetPos(x, aO5.fixs[x].xO5.scops[x], aO5.posC, aO5.posO)
				return true
			}
		},
		UnFix = (o, aO5, xTL) => {
			const pF = aO5.canFixs[o] || aO5.fixs[o].xO5
			if (pF
				&& aO5.fixs[o].xO5 === pF
			) {
				const vF = pF.scops[o],
					vO = GetV(o, aO5.posO)
				if (xTL ? (vO >= vF) : (vO <= vF)) {//	тут не надо расфиксировать приаттаченные - они "отъехали" раньше
					aO5.DoFix(o, null)
					return true
				}
			}

			SetPos(o, aO5.fixs[o].xO5.scops[o], aO5.posC, aO5.posO)
		},
		CalcCurPozs = aO5 => {
			const p = aO5.shdw.getBoundingClientRect()

			Object.assign(aO5.posO, { top: p.top, left: p.left, height: p.height, width: p.width, right: p.right, bottom: p.bottom })
			Object.assign(aO5.posC, { top: p.top, left: p.left, height: p.height, width: p.width })
			Object.assign(aO5.posS, { top: 0, left: 0 })

			for (const x of 'TLRB')
				aO5.hidden[x] = 0
		},
		CalcFixPozs = (x, aO5) => {
			const
				o = opp[x],
				fx = aO5.fixs[x],
				fo = aO5.fixs[o],
				xO5 = fx.xO5,
				oO5 = fo.xO5

			if (xO5 || oO5) {
				const
					aO = aO5.posO,
					aC = aO5.posC,
					isT = x === 'T',
					vx = xO5 ? (fx.isP ? xO5.scops[x] : GetV(o, xO5.posC)) : GetV(x, aO),
					vo = oO5 ? (fo.isP ? oO5.scops[o] : GetV(x, oO5.posC)) : GetV(o, aO)

				if (xO5 && oO5)
					Object.assign(aC, isT ? { top: vx, height: vo - vx } : { left: vx, width: vo - vx })
				else if (oO5)
					Object.assign(aC, isT ? { top: vo - aO.height } : { left: vo - aO.width })
				else if (xO5)
					Object.assign(aC, isT ? { top: vx } : { left: vx })
			}
		},
		CalcPozs = (pBase) => {			// Расчет позиций фиксированных
			for (const aO5 of pBase.aAll)
				CalcCurPozs(aO5)
			for (const x of 'TL')
				for (const aO5 of pBase.bO5s[x])
					CalcFixPozs(x, aO5)
		}

	function MakeScroll(scV, scH, pcO5, fromExt) {
		if (debug > 1 && !D && fromExt) {	//	постоянный доступ из отладчика
			D = {}
			for (const pBase of pcO5.pBases) {
				let b = D[pBase.pO5.name] = {}
				for (const aO5 of pBase.aAll)
					b[aO5.name] = aO5	// .substr(3)
			}
		}

		const GAll = i => pcO5.pBases.values().next().value.aAll[i]
		time = performance.now()
		// направление движения объектов в контейнере - обратное ползунку скроллинга	
		let xs = ''
		if (scV > 0) xs += 'T'; else if (scV < 0) xs += 'B'
		if (scH > 0) xs += 'L'; else if (scH < 0) xs += 'R'

		for (const pBase of pcO5.pBases)
			if (pBase.pO5.scops.isVisible) {
				for (const tagCut of pBase.tagCuts)
					tagCut.pO5.CalcScope(time)
				for (const pOut of pBase.pO5.pOuts)
					pOut.CalcScope(time)
			}

		for (const x of xs)
			wshp.PBases.PBase.SetBorders(x, pcO5)

		for (const pBase of pcO5.pBases) {
			if (!pBase.pO5.scops.isVisible) continue

			CalcPozs(pBase)

			for (const m of 'TLRB')  // вообще-то достаточно "for (const x of xs)" + "[x, opp[x]]"
				if (pBase.bChgs[m] || pBase.bChgs.start || fromExt)
					FindExternalFixCuts(m, pBase)

			pBase.bChgs.start = false

			for (const x of xs) {
				// прямой ход и фиксация	по 'x' 
				const o = opp[x]
				let xTL = 'TL'.includes(x)
			/**
			 * фиксации
			 */
				for (const aO5 of pBase.bO5s[x]) {
					if (aO5.act.ready
						&& !aO5.hidden[o]
					) {
						const oldIsP = aO5.IsP(x, true)
						ToFix(x, aO5, xTL)
						const newIsP = aO5.IsP(x, true)
						if (newIsP) {						// переопр. размеров внутри
							// 					const piO5=aO5.shp.pO5
							// 					if (!oldIsP && piO5){

							// for (const pBase of piO5.pBases)
							// 	if (pBase.pO5.scops.isVisible) {
							// 		for (const tagCut of pBase.tagCuts)
							// 			tagCut.pO5.CalcScope(time)
							// 		for (const pOut of pBase.pO5.pOuts)
							// 			pOut.CalcScope(time)
							// 	}

							// for (const x of xs)
							// 	wshp.PBases.PBase.SetBorders(x, piO5)

							// 						for (const iBase of piO5.pBases)
							// 							CalcPozs(iBase)}
						}
						else
							if (aO5.canFixs[x] === aO5.canCuts[x])
								break
					}
					// // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!					
					// const m1 = aO5.act.ready
					// const m2 = !aO5.hidden[o]
					// const m3 = !ToFix(x, aO5, xTL)
					// const m4 = aO5.canFixs[x] === aO5.canCuts[x]

					// if (aO5.act.ready
					// 	&& !aO5.hidden[o]
					// 	&& !ToFix(x, aO5, xTL)
					// 	&& aO5.canFixs[x] === aO5.canCuts[x]
					// )
					// 	break
				}

				// расфиксация по [o]
				xTL = 'TL'.includes(o)
				for (const aO5 of pBase.bO5s[o])
					if (aO5.act.ready
						&& aO5.IsP(o, true)
					)
						UnFix(o, aO5, xTL)
			}
			/**
			 * обрезания внутренним и внешним контейнерами
			 */
			for (const aO5 of pBase.aAll)
				if (aO5.act.ready && aO5.act.isfix) {
					for (const x of 'TLRB') {
						const o = opp[x]
						if (aO5.fixs[x].xO5)	//   aO5.IsP(x, true))
							if (InternalTagCuts(o, aO5, scV, scH))
								ReAttach(o, 'TL'.includes(o), aO5)

						if (aO5.canCuts[x]) 	//  && !aO5.IsP(x, false))  // && !aO5.fixs[x]
							if (ExternalFixCuts(x, aO5))
								ReAttach(x, 'TL'.includes(x), aO5)
					}
					CheckHidden(aO5)
				}
			/**
			 * прилипания и сталкивания
			 * динамическая фиксация остальных на зависших элементах
			 */
			for (const x of xs) {
				const o = opp[x], q = { [x]: 1, [o]: 1 }
				let n = 5
				do {
					for (const m of [x, o]) {
						if (!q[m]) continue

						const xTL = 'TL'.includes(x),
							mTL = m === x ? xTL : !xTL
						for (const aO5 of pBase.bO5s[m])
							if (aO5.IsP(m, true)) {		// Если прилеплен к "верхнему" [x] bord'у, то
								if (m === x)
									AttachTo(x, xTL, aO5)	//	подсоединяем те, что "снизу" [o] 
								else
									UnAttach(x, xTL, aO5)
							}
							else
								if (aO5.canFixs[n] === aO5.canCuts[m])
									break

						q[m] = 0
						for (const aO5 of pBase.bO5s[m])
							if (aO5.IsP(m, true)) {
								const pitch = PitchBy(m, mTL, aO5)
								if (pitch) {
									if (pitch !== 'O' && pitch !== 'P')
										q[m] = 1
								} else
									break
							}
					}
					n--
				} while ((q.x || q.o) && n > 0)

				if (n <= 0)
					console.error("%c%s", C.consts.fmtErr, `динамическая фиксация по [${m}]`, ` не завершилась за ${n} шагов`)
			}
			// отображение зафиксированых
			for (const aO5 of pBase.aAll)
				if (aO5.act.isfix)
					ScheduleShowFixed(aO5)

			//   -----------------------  ОСТАВЬ для примера -------------------------------
			// 		let dbgstrt = false
			// if (dbgstrt && GAll(1).posC.height > 20)
			// 	console.log('-15-')
			// if (GAll(1).posC.height < 20)
			// 	dbgstrt = true
		}
	}
	wshp = C.AddModuleSub(olga5_modul, modulname, [MakeScroll])
})();/* global document, window, console, CustomEvent*/
/*jshint asi:true  */
/*jshint esversion: 6*/
/*eslint no-useless-escape: 0*/
(function () {              // 3---------------------------------------------- ref ---
	'use strict';

	const
		C = window.o7.C,
		debug = C.consts.debug,
		currentScript = document.currentScript, // ??????????????????????
		W = {
			modul: 'ref',
			Init: RefInit,
			consts: { needs: 'o_attrs=;', },
		},
		wshp = (window.o7 ??= {})[W.modul] = { W },
		ParseTagAttrs = params => {
			const errs = [],
				otags = {}
			// aa=onYouTubeIframeAPIReady
			for (const pnam in params) {
				const param = params[pnam]
				if (!param)
					errs.push({ 'где': `nam='${pnam}'`, err: `пустой параметр` })
				else
					if (typeof param !== 'string')
						errs.push({ 'где': `nam='${pnam}'`, err: `тип '${typeof param}' (не присвоено значение?)` })
					else {
						const regexp = /\s*[,;]+\s*/g,
							nams = pnam.split(regexp),
							attrs = param.split(regexp)

						for (const attr of attrs)
							if (attr && attr.match(/\s+/)) {
								errs.push({ par: `в значении '${pnam}=${attr}'`, err: `пробелы заменены ','` })
								attr.replace(/\s+/g, ',')
							}

						for (const nam of nams) {
							if (!nam) {
								errs.push({ par: `nam='${nam}'`, err: `пустой 'тег' в параметре` })
								continue
							}
							if (!otags[nam]) otags[nam] = {}
							for (const attr of attrs) {
								if (attr)
									if (!otags[nam][attr]) otags[nam][attr] = 0// счетчик использования
							}
						}
					}
			}
			if (errs.length > 0)
				C.ConsoleError(`Ошибки в параметрах`, 'o_attrs', errs)
			return otags
		},
		ConvertUrls = otags => {
			let tagnams = ''
			for (const nam in otags)
				tagnams += (tagnams ? ',' : '') + nam

			const tags = C.GetTagsByTagNames(tagnams, W.modul),
				undefs = [],
				rez = []

			for (const tag of tags) {
				const nam = C.MakeObjName(tag),
					attrs = otags[(tag.tagName.toLowerCase())],
					o5attrs = C.GetAttrs(tag.attributes)

				for (const attr in attrs)
					if (attr) {
						const tagattr = tag.attributes[attr]
						if (tagattr) {
							const ori = tagattr.nodeValue,
								wref = C.DeCodeUrl(W.urlrfs || C.urlrfs, ori, o5attrs),
								anew = attr.replace(/(data-)|(_)/, '')
							// anew = (attr[0] == '_') ? attr.substring(1) : attr

							if (wref.err)
								undefs.push({ 'имя (refs)': nam, 'атрибут': attr, 'адрес': ori, 'непонятно': wref.err })

							if (wref.url && (ori != wref.url || attr != anew)) {
								if (attr != anew)     	// если обработано без ошибок, то удаляю - чтоб другие модули не повторяли
									tag.removeAttribute(attr)

								tag.setAttribute(anew, wref.url)

								rez.push({ nam: nam, attr: (attr + (anew != attr ? ` (${anew})` : ``)), src: ori, rez: wref.url })
								attrs[attr]++
							}
						}
					}
			}

			if (rez.length < 1) C.ConsoleError(`${W.modul}: не выполнено ни одной подстановки?`)
			else
				if (debug > 0) C.ConsoleInfo(`${W.modul}: выполнено подстановок для тегов:`, rez.length, rez)

			if (undefs.length > 0)
				C.ConsoleError(`${W.modul}: неопределённые адреса: `, undefs.length, undefs)
			// if (unreal.length > 0) C.ConsoleAlert(`${W.modul}: непонятные адреса: `, unreal.length, unreal)
		},
		PrepTubes = () => {
			let YT = null
			const sel = 'o5youtube',
				tags = C.GetTagsByQueryes('[' + sel + ']'),
				onPlayerReady = e => {
					const aO5 = e.target.g.aO5
					if (!aO5.ready) { // при первой установке статуса удаляю фон чтоб не выглядывал
						aO5.ready = true
						aO5.tag.removeAttribute('style')
						if (aO5.style)
							aO5.tag.setAttribute('style', aO5.style)
					}
					// console.log(1)
				},
				onPlayerStateChange = e => {
					const act = e.target.getPlayerState(),
						aO5 = e.target.g.aO5
					if (debug > 0) {
						let s = ''
						switch (act) {
							case 0: s = 'воспроизведение видео завершено'; break
							case 1: s = 'воспроизведение'; break
							case 2: s = 'пауза'; break
							case 3: s = 'буферизация'; break
							case 5: s = 'видео находится в очереди'; break
							default: s = 'воспроизведение видео не началось'
						}
						console.log(aO5.tag.id, 2, act, s)
					}
					if (act == 1) {
						window.dispatchEvent(new CustomEvent('o5ref_stopVideo', { detail: { tag: aO5.tag, type: 'yt', } }))
					}
				},
				onYtReady = () => {	//	
					YT = window.YT
					// console.log(4)
				},
				AddFrame = e => {
					if (YT === null) {
						YT = 0
						const script = document.createElement('script')
						script.src = "https://www.youtube.com/iframe_api"

						script.onload = function () {
							window.YT.ready(onYtReady)
						}
						script.onerror = function () {
							C.ConsoleError("ошибка загрузки YouTube API ", this.src)
						}

						// var firstScriptTag = document.getElementsByTagName('script')[0]
						// firstScriptTag.parentNode.insertBefore(script, firstScriptTag)
						currentScript.parentNode.insertBefore(script, currentScript)
					}

					const tag = e.target,
						aO5 = tag.aO5yt

					if (YT && YT.loaded) {
						const x = document.createElement('div'),	// кандидат на намену через iFrame
							div = tag.appendChild(x)

						if (aO5.chkmove) {
							if (aO5.chkmove == 'wait')
								tag.removeEventListener('mousemove', AddFrame)
							tag.aO5yt.chkmove = ''
						}

						aO5.player = new window.YT.Player(div, {
							height: 'inherit',
							width: 'inherit',
							videoId: aO5.videoId,
							events: {
								'onReady': onPlayerReady,
								'onStateChange': onPlayerStateChange
							}
						})
						aO5.iframe = aO5.player.getIframe()
						aO5.iframe.aO5 = aO5

						window.addEventListener('o5ref_stopVideo', e => {
							const act = e.detail.tag
							for (const tag of tags)
								if (tag !== act && tag.aO5yt.player)
									tag.aO5yt.player.stopVideo()
							// console.log(act.id, 5, e.detail)
						})
					}
					else
						if (aO5.chkmove == 'ask') {
							aO5.chkmove = 'wait'
							tag.addEventListener('mousemove', AddFrame)
						}
				}

			for (const tag of tags) {
				const videoId = tag.attributes[sel].nodeValue,
					style = tag.getAttribute('style') || ''

				if (style)
					tag.removeAttribute('style')
				tag.setAttribute('style', style + `background: url(//img.youtube.com/vi/${videoId}/hqdefault.jpg) 0% 0% / contain no-repeat;background-position: center;`)
				tag.aO5yt = { player: null, videoId: videoId, chkmove: 'ask', tag: tag, style: style, ready: false }

				tag.addEventListener('mouseover', AddFrame, { once: true })
			}
		}

	function RefInit() {

		C.ParamsFill(W)

		const o_attrs = 'o_attrs',
			s = W.consts[o_attrs]

		if (s) {
			const params = C.SplitParams(s, o_attrs, ';\n'),
				otags = ParseTagAttrs(params)
			if (debug > 0) C.ConsoleInfo(`${W.modul}: обрабатываемые атрибуты тегов`, o_attrs, otags)
			ConvertUrls(otags)
		}

		PrepTubes()
		// PrepTables()

		C.DispatchEvent('o_scriptDone', W.modul)

		// InitRPos()
	}

	// C.AddModule(W)
})();
/* global document, window, console, CustomEvent, XMLHttpRequest */
/*jshint asi:true  */
/*jshint esversion: 6*/
(function () {              // ---------------------------------------------- inc ---	
	'use strict'
	let
		incls = null
	const
		errs = [],
		m = window.location.search.match(/(?:\?|&)debug(?:=([^&?]*))?(?=[&?]|$)/),
		mdebug = !m ? 0 : (m[1] === undefined || m[1] === "") ? 1 : (isNaN(+m[1]) ? 3 : +m[1]),
		C = window.o7 ? window.o7.C : {
			consts: { debug: mdebug },
			avtonom: true,
		},
		debug = C.consts.debug,
		_div = document.createElement('div'),
		W = {
			modul: 'inc',
			Init: InclStart,
			consts: { needs: 'getall=true; isfinal=1' },
		},
		wshp = (window.o7 ??= {})[W.modul] = { W },
		o5include = 'o5include',
		msg = {
			clrs: {	//	копия из CConsole
				'E': "background: yellow; color: black;border: solid 1px gold;",
				'I': "background: beige;  color: black;border: solid 1px bisque;",
			},
			Head: src => `${W.modul}:  '${src}'`,
			Msg: (fmt, head, txt, rezs) => {
				if (rezs) {
					console.groupCollapsed("%c%s", fmt, head, txt)
					console.table(rezs)
					{
						console.groupCollapsed('')
						console.trace()
						console.groupEnd()
					}
					console.groupEnd()
				}
				else {
					console.groupCollapsed("%c%s", fmt, head, txt)
					console.trace()
					console.groupEnd()
				}
			},
			Info: (src, txt, rezs) => msg.Msg(msg.clrs['I'], msg.Head(src), txt, rezs),
			Error: (src, txt, rezs) => msg.Msg(msg.clrs['E'], msg.Head(src), txt, rezs),
		}
	InclFinish = () => {
		let ok = true
		for (const url in incls)
			if (incls[url].err) {
				ok = false
				break
			}
		if (!ok || debug > 0) {
			const src = `обработка 'CInclude'`,
				rezs = []

			for (const url in incls) {
				const incl = incls[url]
				rezs.push({ ori: incl.ori, url: incl.url, err: incl.err || 'OK', })
			}

			if (ok) msg.Info(src, 'всё загружено', rezs)
			else
				msg.Error(src, 'есть ошибки:', rezs)
		}

		if (C.avtonom) {
			const e = new CustomEvent('o_incReady', { modul: W.modul })
			window.dispatchEvent(e)
		}
		else
			// передавать имя "источника"			
			C.DispatchEvent('o_incReady', W.modul + "-источник")

		if (C.E && W.consts.o5isfinal)	// гененрировать ли сообщение 'o_scriptDone'
			C.DispatchEvent('o_scriptDone', W.modul)
	},
		AddIncls = tags => {
			// console.log(`INC_1 `)
			const
				IsDisplay = tag => {
					let div = tag
					while (div.tagName.match(/div/i)) {
						const nst = window.getComputedStyle(div),
							display = nst.getPropertyValue('display')
						if (display == 'none') {
							return false
						}
						div = div.parentNode
					}
					return true
				}
			for (const tag of tags) // группировка по url'ам, чтобы не грузить лишнее
				if (W.consts.o5getall || IsDisplay(tag)) {    // загружать со стиль "displa = 'none'"
					const ref = tag.getAttribute(o5include)

					tag.removeAttribute(o5include)
					tag.setAttribute('_' + o5include, ref)  // так... для истории

					const
						ss = ref.split(/[?!]/),
						ori = ss[0].trim(),
						wref = (C.DeCodeUrl) ? C.DeCodeUrl(C.urlrfs, ori, '') : { url: ori, err: '' }
					if (wref.err) {
						if (!errs.includes(ori)) errs.push(`Перекодир. url='${ori}' - ${wref.err}`)
						continue
					}

					const url = wref.url,
						sel = ss.length > 1 ? ss[ss.length - 1] : ''
					let incl = incls[url]
					if (!incl) {
						incl = {
							ori: ori,
							url: url,
							mtags: [], err: '', text: '', done: false, isent: false,
							xhr: new XMLHttpRequest(),
						}
						Object.seal(incl)
						incls[url] = incl

						Object.assign(incl.xhr, {
							incl: incl,
							onload: PageLoad,
							onerror: OnError,
							timeout: 10000,
							responseType: 'text',
							withCredentials: true,
						})
						incl.xhr.open("get", url, true)
					}
					incl.mtags.push({ tag: tag, sel: sel.trim(), outer: ref.indexOf('!') >= 0 }) // на случай если и '?' и '&'
				}

			// console.log(`INC_2 `, incls)
			let n = 0
			for (const url in incls) {
				const incl = incls[url]
				if (!incl.isent) {
					incl.isent = true
					incl.xhr.send()
				}
				else
					if (incl.done)	//	но если файл уже был загружен, то не надо ждать					
						DoLoad(incl)
				n++
			}
			return n
		},
		AskFinish = (incl, ok) => {
			let done = true

			for (const url in incls)
				if (!incls[url].done) {
					done = false
					break
				}

			if (!ok)
				msg.Error('AskFinish', `ошибка загрузки ${incl.xhr.status}   ${incl.xhr.responseURL}`)
			else
				if (debug > 1)
					msg.Info('AskFinish', `вставлен URL ${done ? '(последний!)' : ''}  ${incl.xhr.responseURL}`)

			// for (const url in incls)
			// 	if (!incls[url].done)
			// 		return
			if (done)
				InclFinish()
		},
		DoLoad = incl => {

			const es = [],
				mm = incl.xhr.responseText.match(/<body[^>]*>/),
				i = mm.index

			_div.innerHTML = incl.xhr.responseText.substring(i)

			msg.Info('DoLoad  ', `обрабатывается фрагмент ${i}`, _div.innerHTML)

			const tags = []
			for (const mtag of incl.mtags)
				if (!mtag.done) {
					mtag.done = true
					const
						sel = mtag.sel,
						tag = mtag.tag

					let srcs = null,
						outer = mtag.outer
					if (sel) {
						switch (sel[0]) {
							case '[': srcs = _div.querySelectorAll(sel)
								break
							case '#': srcs = _div.querySelectorAll(`[id='${sel.substring(1)}']`)
								break
							case '.': {
								const s = sel.substring(1),
									ss = s.split(/\s*:\s*/g),
									cc = ss[0],
									qs = _div.querySelectorAll("[class *= '" + cc + "']"),
									mcc = new RegExp('\\b' + cc + '\\b(:\\w*)*', 'g')
								if (qs)
									for (const q of qs) {
										const m = q.className.match(mcc)
										if (m) {
											const mm = m[0].split(/\s*:\s*/g)
											let kv = true
											for (let i = 1; i < ss.length; i++) {
												let ok = false
												for (let j = 1; j < mm.length; j++)
													if (mm[j] == ss[i]) {
														ok = true
														break
													}
												if (!ok) {
													kv = false
													break
												}
											}
											if (kv) {
												if (!srcs) srcs = []
												srcs.push(q)
											}
										}
									}
								break
							}
							default: srcs = _div.getElementsByTagName(sel)
						}
						if (!srcs || srcs.length == 0) {
							es.push(sel)
							continue
						}
					}
					else {
						srcs = [_div]  // для всего "тела" 1ищвн 2 не включаем
						outer = false
					}

					for (const src of srcs) {
						const s = outer ? src.outerHTML : src.innerHTML
						// div.insertAdjacentHTML('beforeEnd', 
						if (debug > 1)
							tag.insertAdjacentHTML('beforeEnd', `\n<!-- вставка с id='${src.id}' -->`)
						// tag.innerHTML += `\n<!-- вставка с id='${src.id}' -->`

						if (outer)
							tag.insertAdjacentHTML('beforeEnd', '\n')
						// tag.innerHTML += '\n'
						tag.insertAdjacentHTML('beforeEnd', s.trimRight() + '\n') // тут '\n' надо для "красоты" в тестах)
						// tag.innerHTML += s.trimRight() + '\n' // тут '\n' надо для "красоты" в тестах
					}
					tags.concat(tag.querySelectorAll("div[" + o5include + "]") || [])
				}
			if (es.length > 0) {
				incl.err = `не опр. '${es.join(', ')}'`
				errs.push(incl.err)
			}
			if (tags && tags.length > 0)
				AddIncls(tags)
		},
		PageLoad = function () {
			const
				xhr = this,
				incl = xhr.incl

			if (debug > 1)
				msg.Info('PageLoad', `загружена страница  (с рез.=${xhr.status})  ${incl.xhr.responseURL}`, xhr.responseText)
			// 	{
			// 	console.groupCollapsed(`${W.modul} : прочитан ((рез.=${xhr.status})) url='${xhr.responseURL}'`)
			// 	console.log(xhr.responseText)
			// 	console.groupEnd()
			// }
			incl.done = true


			if (xhr.status == 200)
				DoLoad(incl)
			else
				incl.err = `статус загрузки = (рез.=${xhr.status})`

			// delete incl.xhr  надо бы удалять, ео не получается

			AskFinish(incl, true)
		},
		OnError = function () {
			const incl = this.incl
			incl.err = 'ошибка загрузки (блокировано by CORS ?)'
			incl.done = true
			AskFinish(incl, false)
		}

	function InclStart(e) {
		if (debug > 0) {
			console.log('%c%s', "background: aqua; color: black;border: none;",
				` инициализация `,
				`${W.modul}.js`,
				` ${C.avtonom ? ('автономно по ' + e.type) : 'из библиотеки'} `)

			_div.style.display = 'none'
			_div.id = 'moe'
			// if (debug > 1) {
			// 	_div.title = "моя копия: чтобы посмотреть, чего загрузили"
			// 	document.body.appendChild(_div)
			// }
		}
		if (C.ParamsFill)
			C.ParamsFill(W)
		const tags = document.querySelectorAll("div[" + o5include + "]")
		let n = 0

		// console.log(`INC_0 `)
		if (tags && tags.length > 0) {
			incls = {}
			n = AddIncls(tags)
		}

		if (n == 0) {
			if (errs.length > 0)
				C.ConsoleError(`'inc' - ошибки`, errs.length, errs)
			InclFinish()
		}
	}

	window.addEventListener(o5include, InclStart)
	if (C.avtonom) {
		document.addEventListener('DOMContentLoaded', InclStart)

		if (C.consts.debug)
			console.log(`}---< ${document.currentScript.src.indexOf(`/${W.modul}.`) > 0 ? 'загружен  ' : 'включён   '}:  ${W.modul}.js`)
	}
	// else
	// 	C.AddModule(W)
})();
/* global document, window, console*/
/* exported olga5_menuPopDn_Click*/
/*jshint asi:true  */
/*jshint esversion: 6*/
(function () {              // ---------------------------------------------- mnu ---
	'use strict'
	const
		C = window.o7.C,
		debug = C.consts.debug,
		oMenu = 'o-menu',
		W = {
			modul: 'mnu',
			Init: Init,
			consts: { needs: 'menudef=; scrollY=-18', },
		},
		wshp = (window.o7 ??= {})[W.modul] = { W },
		class_empty = oMenu + '_empty',
		class_small = oMenu + '_small',
		o5css = `
.${oMenu} {
    margin: 0 !important;
    padding: 0 !important;
    font-size: small;
    height: min-content;
    width: max-content;
    z-index: 1111111;
    top: 1px;
    right: 1px;
    position: unset; /* будут присвоено ниже */
    display: initial; 
}
.${oMenu}.Left {left: 1px; right:''}

/*.${class_small} {
	width: 144px;
	text-align: center ! important;
	text-align: -moz-center;
	text-align: -webkit-center;
	font-size: smaller ! important;
	line-height: 11px ! important;
}*/

.${oMenu} ul {
    margin: 0;
    padding: 0;
    border-radius: 2px;
    display: grid;    /* иначе переносит строки последующего пункта при открытии подменю */
}

.${oMenu} li {
    display: block;
    color: white;
    background: gray;
    height: 1.5em;
    text-align: left;
	text-align: -webkit-left;
	text-align: -moz-left;
    border-bottom: 0.01em solid lightseagreen;
    padding: 1px 5px 1px 2px;
    cursor: pointer;
    font-family: sans-serif;
    font-size: small;
    margin-bottom: 0 !important;
    padding-top: 0 !important;
    padding-bottom: 0 !important;
}

.${oMenu} li>ul {
    position: absolute;
    top: unset;
    display: none;
    padding: 0;
    margin: 0;
    border: 1px solid darkgrey;
    outline: 1px solid white;
    float: right;
}
.${oMenu}.Left li>ul {float: left;}

.${oMenu}>li {
    background-color: white;
    border: none;
    border-radius: 8px;
    background-color: transparent;	
	text-align: right;
	text-align: -moz-right;
	text-align: -webkit-right;
	// text-align: -moz-left;
}

.${oMenu}.Left>li {
    text-align: left;
	text-align: -webkit-left;
	text-align: -moz-left;
}

.${oMenu}>li>ul {
    outline: 1px solid bisque;
    top: 0.5em;
    position: relative;
    right: 0.1em;
}

.${oMenu}>li>ul {left: 0.1em;}
.${oMenu}>li>ul>li>ul { right: 3.1em; margin-top: -4px;}
.${oMenu}>li>ul>li>ul>li>ul { right: 6.1em; margin-top: -3px;}
.${oMenu}>li>ul>li>ul>li>ul>li>ul { right: 9.1em; margin-top: -3px;}
.${oMenu}>li>ul>li>ul>li>ul>li>ul>li>ul { right: 12.1em; margin-top: -3px;}
.${oMenu}.Left>li>ul {left: 0.1em;}
.${oMenu}.Left>li>ul>li>ul { left: 3.1em; margin-top: -4px;}
.${oMenu}.Left>li>ul>li>ul>li>ul {left: 6.1em; margin-top: -3px;}
.${oMenu}.Left>li>ul>li>ul>li>ul>li>ul {left: 9.1em; margin-top: -3px;}
.${oMenu}.Left>li>ul>li>ul>li>ul>li>ul>li>ul {left: 12.1em; margin-top: -3px;}

.${oMenu} li>span {
    display: flex;
    padding-left: 6px;
    height: 100%;
    align-items: center;
    width: max-content;
    justify-content: flex-start;
    overflow: hidden;
}

.${oMenu}>li>span {
    border: 1px solid darkgray;
    border-radius: 8px;
    color: black;
    background-color: yellow;
    padding: 3px 4px 2px 4px;
    justify-content: center;
    height: min-content;
	// width: -moz-min-content;
	width: fit-content;
}

.${oMenu} li:hover {
    color: black;
    background-color: lavender;
}

.${oMenu}>li:hover {
    background: transparent;
    height: 3em;
}

.${oMenu}>li:hover>span {
    color: white;
    background: gray;
    border: 0.01em solid lightseagreen;
    padding-bottom: 4px;
}

.${oMenu} li:hover>ul,
.${oMenu} li>ul:hover {
    display: block;
}

.${oMenu} li:active>ul {    /* для корректного "гашения" - д.б. ПОСЛЕДНИМ ! */
    display: none;
}
.main-outer {
    background-color: ghostwhite;
    border: 1px solid navajowhite;
}

.${class_empty} {
    height: 2px ! important;
    background-color: aqua ! important;
}
`,

		// const phases = ['NONE', 'CAPTURING_PHASE', 'AT_TARGET', 'BUBBLING_PHASE',]
		win = { target: '_self', resize: true, scrollX: 0, scrollY: -18, }, // blockclick: false, timclick: 0 },
		Target = function (e) {
			let target = e.toElement || e.target
			while (target && !target.o5menus) target = target.parentElement
			return target
		},
		OnMnu = function (e) {
			const target = Target(e)
			if (target && !target.o5menus.ready) target.o5menus.ready = true
		},
		GoTo = function (o5menus) {
			const tag = document.getElementById(o5menus.ref)
			if (tag) {
				tag.scrollIntoView({ block: o5menus.block, behavior: "smooth" })
				return true
			} else
				C.ConsoleError("GoTo: не определён тег в текущем окне: ", o5menus.ref)
		},
		DoMnu = e => {
			if (debug)
				console.log('DoMnu: ' + e.type + ' ' + e.eventPhase + ' ' + e.timeStamp.toFixed(1).padEnd(6))
			const target = Target(e)
			if (target && target.o5menus.ready) {
				const o5menus = target.o5menus
				o5menus.ready = false

				let ok = true
				if (o5menus.isext) window.open(o5menus.ref, win.target)
				else
					ok = GoTo(o5menus)

				if (ok && win.resize) {
					if (window.o7.shp)
						window.o7.shp.Bords.InitAllBords(0)
				}
				win.blockclick = true
				e.cancelBubble = true
			}
		},
		Clear = e => {
			if (debug)
				console.log('Clear: ' + e.type + ' ' + e.eventPhase + ' ' + e.timeStamp.toFixed(1).padEnd(6) +
					' ' + (win.blockclick ? 'очищаю' : ''))
			if (win.blockclick) {
				win.blockclick = false
				e.cancelBubble = true
			}
			// // win.timclick = e.timeStamp
			// e.cancelBubble = true
		},
		MnuInit = function (items) {
			if (C.consts.nomnu > 0) return

			const proc = 'MnuInit',
				errs = []
			if (!items || !items[0]) errs.push(`${proc}: не определеныа структура меню`)
			if (errs.length == 0) {
				const uls = [],
					item0 = items[0],
					base = item0.base || ''

				const id = item0.id || ''
				if (id && document.getElementById(id)) errs.push(`${proc}: повтор создания меню с id='${id}'`)

				if (item0.target) {
					win.target = item0.target
					win.resize = false
				}
				const scrollY = W.consts.scrollY
				if (scrollY) win.scrollY = parseInt(scrollY)

				let ul = document.createElement("ul")

				ul.id = id
				ul.className = oMenu
				if (item0.right) ul.style.right = item0.right
				else if (item0.left) {
					ul.style.left = item0.left
					ul.classList.add('Left')
				}
				if (item0.top) ul.style.top = item0.top

				let owner = document.body
				if (item0.owner) {
					if (typeof item0.owner === 'object') owner = item0.owner
					else {
						const own = item0.owner.trim(),
							xwner = (!own || own.match(/\.body\b/)) ? document.body : document.querySelector(own)

						if (xwner) owner = xwner
						else
							C.ConsoleError(`${proc}: нет owner'а для '${own}'`)
					}
				}
				if (item0.position) ul.style.position = item0.position
				else if (!item0.owner) ul.style.position = 'fixed'
				else ul.style.position = 'absolute'

				if (ul.style.position == 'absolute') {
					const nst = window.getComputedStyle(owner),
						position = nst.getPropertyValue('position')
					if (position != 'absolute')
						C.ConsoleError(`${proc}: контейнер ${C.MakeObjName(owner)} для меню '${C.MakeObjName(ul)}' имеет position='${position}' (не ''absolute)`)
				}
				if (item0.noremov) owner.insertBefore(ul, owner.firstChild)  // НЕ удаляется по закрытии страницы (owner.appendChild(ul))				
				else
					C.page.InsertBefore(owner, ul, owner.firstChild)

				ul.addEventListener('mousedown', DoMnu, true)
				ul.addEventListener('click', DoMnu, true)
				// window.addEventListener('click', Clear, true)
				// C.E.AddEventListener('click', Clear, true)
				window.addEventListener('click', Clear)

				uls[0] = ul
				const blc = (item0.block || 's')[0].toLowerCase(),
					block = blc == 's' ? 'start' : (blc == 'e' ? 'end' : (blc == 'n' ? 'nearesr' : 'center'))

				let m = 0
				for (const item of items) {
					const li = document.createElement('li')

					// li.addEventListener('click', Clear, true) 
					li.style.zIndex = 99999
					li.o5menus = { isext: true, block: block }
					if (item.ref) {
						const ref = item.ref || '',
							wl = window.location
						if (ref.length == 0) li.o5menus.ref = wl.origin + wl.pathname
						else if (C.IsFullUrl(ref)) li.o5menus.ref = ref // (ref.match(/^\s*(https?:)\/\//)) li.o5menus.ref = ref
						else if (ref.match(/\.html?($|\?|&|#)/)) li.o5menus.ref = base + ref
						else {
							li.o5menus.ref = ref[0] == '#' ? ref.substr(1) : ref
							li.o5menus.isext = false
						}
					}

					if (item.title) li.title = item.title
					if (item.class) li.classList.add(item.class)
					if (item.style) li.style = item.style

					if (m == 0)
						li.onmouseover = OnMnu

					ul.appendChild(li)

					if (item.span && item.span != '') {
						const span = document.createElement('span')
						span.innerText = item.span
						li.appendChild(span)
					} else
						li.classList.add(class_empty)

					if (item.add) {
						ul = document.createElement("ul")
						ul.style.width = item.add
						li.appendChild(ul)
						uls[++m] = ul
					} else if (item.ret) {
						m = m - item.ret
						if (m < 0) {
							errs.push('m: item.ret=' + item.ret + ', ')
							m = 0
						}
						ul = uls[m]
					}
				}
			}
			if (errs.length > 0)
				C.ConsoleError("${proc}: ошибки создания меню: ", errs.length, errs)
		}

	function Init() {
		const
			InitByText = menu => {// если есть такой атрибут}
				const regval = /^["'`;{\s]*|["'`},\s]*$/g,
					lis = menu.match(/{[^}]*}/g) || [],
					items = [],
					errs = []

				for (const li of lis) {
					const pairs = li.match(/[^,]+(,|})/g),
						item = {}
					for (const pair of pairs) {
						try {
							const i = pair.indexOf(':'),
								nam = pair.substr(0, i).replaceAll(regval, ''),
								val = pair.substr(i + 1).replaceAll(regval, '')
							item[nam] = val
						} catch (err) {
							errs.push({ li: li, pair: pair, err: err.message })
						}
					}
					items.push(item)
				}
				if (errs.length > 0)
					C.ConsoleError("Init: ошибки в строках атрибута 'menudef': ", errs.length, errs)

				MnuInit(items)
			}

		if (C.consts.nomnu > 0) C.ConsoleInfo(`Меню отключено по o_nomnu=${C.consts.nomnu}`)
		else {
			if (!W.isReady) {
				C.ParamsFill(W, o5css)
				window.o7.Menu = MnuInit
			}

			if (W.consts.menudef)	// если есть такой атрибут}
				InitByText(W.consts.menudef)

			const tags = C.GetTagsByClassNames('o-menuHidden', W.modul)
			if (tags)
				tags.forEach(tag => {
					InitByText(tag.innerText.trim())	//, tag)
				})
		}
		C.DispatchEvent('o_scriptDone', W.modul)
	}

	// C.AddModule(W)
})();
/* global document, window, console  */
/* exported olga5_menuPopDn_Click    */
/* jshint asi:true                   */
/* jshint esversion: 6               */
/* eslint-disable no-prototype-builtins */
(function () { // ---------------------------------------------- pop ---
    'use strict'
    let focusTime = 0

    const
        CAvtonom = () => {
            const
                m = window.location.search.match(/(?:\?|&)debug(?:=([^&?]*))?(?=[&?]|$)/),
                debug = !m ? 0 : (m[1] === undefined || m[1] === "") ? 1 : (isNaN(+m[1]) ? 3 : +m[1])

            return { // заменитель библиотечного
                consts: {
                    debug: debug
                },
                // repQuotes: /^\s*((\\')|(\\")|(\\`)|'|"|`)?\s*|\s*((\\')|(\\")|(\\`)|'|"|`)?\s*$/g,
                ConsoleError: (msg, name, errs) => {
                    const txt = msg + (name ? ' ' + name + ' ' : '')
                    console.groupCollapsed('%c%s', clrs.E, txt)
                    if (errs && errs.length > 0) console.table(errs)
                    else console.error(txt)
                    console.trace("трассировка вызовов :")
                    console.groupEnd()
                },
                MakeObjName: obj => (obj ? (
                    // (obj.id && obj.id.length > 0) ? ('#' + obj.id) : (
                    (obj.id && obj.id.length > 0) ? obj.id : (
                        ('[' + obj.tagName ? obj.tagName : (obj.nodeName ? obj.nodeName : '?') + ']') +
                        '.' + (obj.className ? obj.className : '?'))) : 'НЕОПР?'),
                GetTagsByQueryes: query => document.querySelectorAll(query), // второй аргумент - игнорится
                avtonom: true,
            }
        },
        RepQuotes = s => {
            return s.replace(/^(['"`])([\s\S]*)\1$/, '$2')
        },
        C = window.olga7?.C || CAvtonom(),
        mids = [],
        wopens = [],
        oPopup = 'o-popup',
        oContents = 'o-contents',
        DClosePops = () => ClosePops(null),
        W = {
            modul: 'pop',
            Init: Popups,
            Done: DClosePops,
            consts: {
                needs: `o5nocss=0;  // 0 - подключаются CSS'ы;
                            o5timer=0.7 // интервал мигания ;
                            o5params=''  // умалчиваемые для mos, sizs, wins;`
            },
        },
        wshp = (window.o7 ??= {})[W.modul] = { W },
        attrs = document.currentScript.attributes,
        timerms = 1000 * ((attrs && attrs.o5timer) ? parseFloat(attrs.o5timer.value) : 2.1),

        eclr = 'background: yellow; color: black;',
        clrs = { //	копия из CConsole
            'E': `${eclr}border: solid 1px gold;`,
        },
        cls_Act = oPopup + '-Act',
        cls_errArg = oPopup + '-errArg',
        namo5css = oPopup + '_internal',
        dflts = { // тут все названия дб. в нижнем ренистре !!!
            moes: { text: '', group: '', head: '', },
            sizs: { width: 588, height: 345, left: -22, top: 11, innerwidth: null, innerheight: null, screenx: null, screeny: null, },
            wins: { alwaysraised: 1, alwaysontop: 1, menubar: 0, toolbar: 0, status: 0, resizable: 1, scrollbars: 0, },
        },
        o5css = `
.${oPopup},
.${oPopup + 'C'},
.${cls_Act} {
    cursor: pointer;
}        
.${oPopup}{    
	cursor: pointer;
	color: black;
	background-color: lavender;
	border-radius: 4px;
	border: 1px dashed gray;
}
b.${oPopup},
i.${oPopup},
u.${oPopup},
span.${oPopup},
 .${oPopup} {
    padding-left: 4px;				
    padding-right: 3px;
}
img.${oPopup} {
    border: none;
    background-color: transparent;
    position: relative;
}
.${cls_errArg} {
    opacity:0.5;
}
    /*  мигание вызвавшего тега
    */
.${cls_Act} {
    outline-offset: 2x;
    animation: blink ${timerms}ms infinite linear;
}
@keyframes blink {
    99% {outline: 2px dashed  black;outline-offset: 2x;}
    66% {outline: 3px dashed  white;}
    33% {outline: 2px dashed  black;}
    0% {outline: 3px dashed white;outline-offset: -2x;}
}
.${oContents}.o-popup,
.${oContents}{
    font-size: 1.6vw;
    color: blue;
    background-color: white;
    min-width: 2.3vw;
    display: inline-block;
    align-items: self-start;
    text-align: center;
    height: 1.9vw;
    line-height: 1.9vw;
    font-weight: bold;
}
        `,
        ClosePop = wopen => {
            if (debug > 1) console.log(`${W.modul}: ClosePop`.padEnd(22) +
                `${wopen.name}`.padEnd(22))
            if (wopen.time + 444 > (new Date()).getTime()) return

            const act = wopen.pops.act
            if (wopen.text)
                act[act.value ? 'value' : 'innerHTML'] = wopen.text

            if (act.classList.contains(cls_Act)) act.classList.remove(cls_Act)

            if (wopen.win.window && !wopen.win.window.closed) wopen.win.close()

            const i = wopens.indexOf(wopen)
            if (i > -1)
                wopens.splice(i, 1)

            if (wopens.length === 0) {
                window.clearInterval(wopens.tBlink)
                wopens.tBlink = 0
            }
        },
        CloseCloseds = () => {
            let i = wopens.length
            while (i-- > 0) {
                const wopen = wopens[i]
                if (wopen.win && wopen.win.closed) ClosePop(wopen)
            }
        },
        // DoBlinks = isnew => {
        DoBlinks = () => {
            CloseCloseds()
            if (wopens.length === 0) return

            for (const wopen of wopens)
                if (!wopen.noact && wopen.head !== '')
                    try { // тут м.б. ошибку по доступу из другого домена
                        const doc = wopen.win.document
                        if (doc) { // окно наконец-то загрузилось
                            const title = doc.title.trim()
                            if (!wopen.titlD && title) {
                                if (debug > 1) console.log(`${W.modul}: DoBlinks загрузилось`)
                                wopen.titlD = title
                                wopen.titlB = wopen.head ? wopen.head : title.replaceAll(/./g, '*') + '*'
                            }
                            doc.title = wopen.titlD == title ? wopen.titlB : wopen.titlD
                        }
                    } catch (e) {
                        wopen.noact = e.message
                        C.ConsoleError('DoBlink: прекращено по причине: "' + e.message + '"')
                    }
            wopens.tBlink = window.setTimeout(DoBlinks, timerms)
        },
        GetCSS = () => {
            const chs = document.head.children
            // let i = 0
            for (const ch of chs) {
                // if (i==14)
                // i=i
                // console.log(i++, ch.nodeName, ch.id, ch.id==namo5css)
                if (ch.nodeName.toUpperCase() == "STYLE" && ch.id == namo5css)
                    return ch
            }
        },
        IncludeCSS = () => { // подключение CSS'ов, встроенных в скрипт  (копия из com!.js)                
            let css = GetCSS()
            if (!css) {
                if (debug > 0)
                    console.log(`>>  СОЗДАНИЕ CSS   ${oPopup} (для модуля ${W.modul})`)
                const styl = document.createElement('style')
                styl.setAttribute('type', 'text/css')
                styl.id = namo5css
                css = document.head.appendChild(styl)
            } else
                if (debug > 0)
                    console.log(`>>  ИНЗМЕНЕНИЕ CSS   ${oPopup} (для модуля ${W.modul}) `)
            css.innerHTML = o5css.replace(/(\/\/.*($|\n))|(\s*($|\n))/g, '\n')
        },
        ClosePops = grp => { // закрыть все с такой группой и анонимные ('группа' типа 0)
            // 'use strict'
            if (wopens.length === 0) return
            let n = 0,
                i = wopens.length
            while (i-- > 0) {
                const wopen = wopens[i],
                    group = wopen.pops.moes.group

                if (grp == group || grp === null || !group) {      //|| typeof grp == 'event') {
                    ClosePop(wopen)
                    n++
                }
            }
            if (debug > 0)
                console.log(`${W.modul}: закрыты ${n} окон группы '${grp === null ? 'всё' : grp}'`)
        },
        CalcSizes = (sizs, errs, tagname) => {
            // 'use strict'
            const screen = window.screen,
                she = screen.height,
                swi = screen.width,
                GetVal = nam => {
                    const u = sizs[nam] // м.б. как строка так и число
                    if (u) {
                        const isw = nam == 'width' || nam == 'left' || nam == 'innerwidth' || nam == 'screenx',

                            v = parseFloat(u),
                            // va = Math.abs(v),   mperc = /\s*[\d.,]*%\s*/
                            val = (u.match && u.match(/\s*[\d.,]+%\s*/)) ? (0.01 * v * (isw ? swi : she)) : v // размер в пикселах]
                        // val= (u.match && u.match(mperc))?( 0.01 * val * (isw ? swi : she) - 0.5 * (isw ? wi : he)):va
                        return { isw: isw, val: val, }
                    }
                }
            const ss = [],
                dtps = { w: false, h: false, l: false, t: false },
                CheckDubl = (nam, m1, m2, x, txt) => {
                    if (nam.match(m1) || nam.match(m2)) {
                        if (dtps[x]) errs.push(`для  '${tagname}' дублирование ` + txt)
                        dtps[x] = true
                    }
                }

            let wi = 0, he = 0

            for (const nam of ['width', 'height', 'innerwidth', 'innerheight']) {
                const z = GetVal(nam)
                if (z) {
                    const val = Math.abs(z.val)

                    if (z.isw) wi = val
                    else he = val
                    ss.push(nam + '=' + parseInt(val))
                    if (errs) {
                        CheckDubl(nam, /width/, /innerwidth/, 'w', 'ширины окна')
                        CheckDubl(nam, /height/, /innerheight/, 'h', 'высоты окна')
                        if (val < 100) errs.push(`для  '${tagname}' значение '${nam}' меньше 100`)
                    }
                }
            }

            const aW = screen.availWidth,
                aH = screen.availHeight,
                RePos = (val, actW, maxW, minL) => {
                    let x = val
                    if (x > maxW) x = maxW - actW
                    if (x > -1) x = minL + x
                    else x = minL // + x + maxW - actW - 4
                    return x
                }
            for (const nam of ['left', 'top', 'screenx', 'screeny']) {
                const z = GetVal(nam)
                if (z) {
                    const isw = z.isw,
                        v = z.val < 0 ? (isw ? aW + z.val - wi : aH - z.val - he) : z.val,
                        val = RePos(v, isw ? wi : he, isw ? aW : aH, isw ? screen.availLeft : screen.availTop)

                    ss.push(nam + '=' + parseInt(val))
                    if (errs) {
                        CheckDubl(nam, /left/, /screenx/, 'l', 'левой позиции')
                        CheckDubl(nam, /top/, /screeny/, 't', 'верхней позиции')
                    }
                }
            }
            return ss.join(',')
        },
        optsFocus = {
            capture: true,
            moja: 'fignia'
        },
        Focus = e => {
            if (wopens.length === 0 || focusTime == e.timeStamp) return

            focusTime = e.timeStamp
            window.setTimeout(() => {
                for (const wopen of wopens)
                    wopen.win.focus()
            }, 1)
            if (debug > 1)
                console.log(`${W.modul}: Focus для ${wopens.length} тегов (${e.eventPhase}, ${e.isTrusted ? 'T' : 'f'}, ${e.timeStamp.toFixed(1).padEnd(6)}, ${e.type})`)
        },
        AskRefTag = (tag0, params) => {
            const mcc = params[0].match(/^\s*id=\s*\w+\b/i)
            if (!mcc) return

            const ss = mcc[0],
                id = ss.split('=')[1].trim(),
                mid = mids.find(mid => mid.mtag && mid.mtag.id == id),
                errid = `========  ссылочный id='${id}'`

            if (!o5c) o5c = document.getElementById(oContents)
            if (!o5c)
                return `${errid} не найден контент id=${oContents} <li>`

            let mtag = mid ? mid.mtag : null

            if (!mtag) {
                for (let i = 0; i < o5c.children.length; i++) {
                    const child = o5c.children[i]
                    let tag = null
                    if (child.id == id) tag = child
                    else tag = child.querySelector('#' + id)
                    if (tag) {
                        mtag = { i: i + 1, tag: tag, id: id }
                        break
                    }
                }
                if (!mtag)
                    return `${errid} отсутствует в '${oContents}'`

                mids.push(mtag)
            }

            const tag = mtag.tag

            //     mpopup = tag.attributes.o5popup
            // if (!mpopup)
            //     return `${errid} не содержит 'o5popup'`

            // const mparams = mpopup.nodeValue.split(/[;,]/)
            // let mli = tag.parentNode

            // while (mli.nodeName != 'LI')
            //     mli = mli.parentNode

            // if (!mli)
            //     return `${errid} не принадлежит <li>`

            tag0.classList.add(oContents)
            tag0.title = tag0.title + (tag0.title ? ' ' : '') + tag.innerText
            // let s1 = tag0.innerText,
            //     s2 = (tag0.innerText ? '+' : ''),
            //     s3 = tag0.innerText + (tag0.innerText ? ' ' : '') + `[  ${mtag.i} ]`
            tag0.innerHTML = tag0.innerText + (tag0.innerText ? ' ' : '') + `[&#8202;${mtag.i}&#8202;]`
            tag0.a5pop = { mtag: mtag }
            // tag.attributes.o5popup+=',' + id
        },
        SetTagError = (tag, txt, errs) => { // добавление и протоколирование НОВЫХ ошибок для тегов
            const
                isnew = tag.title.indexOf(txt) < 0,
                first = tag.title == tag.aO5pop.title // .trim().indexOf('?') != 0

            if (first) tag.title = tag.aO5pop.title + ' ?-> ' + txt
            else if (isnew) tag.title = tag.title + '; ' + txt

            if (isnew) C.ConsoleError(`${txt} для тега : `, C.MakeObjName(tag), errs)
            if (!tag.classList.contains(cls_errArg))
                tag.classList.add(cls_errArg)
        },
        RemoveTagErrors = tag => { // добавление и протоколирование НОВЫХ ошибок для тегов            
            if (tag.classList.contains(cls_errArg)) {
                tag.title = tag.aO5pop.title
                tag.classList.remove(cls_errArg)
            }
        },
        AddPars = (pars, dests, errs, force) => {
            for (const _par in pars) {
                const par = _par.toLowerCase()
                let isp = false
                for (const nam in dflts) { // ['moes', 'sizs', 'wins']
                    const dflt = dflts[nam],
                        dest = dests[nam]
                    if (dflt.hasOwnProperty(par)) {
                        if (force || !dest.hasOwnProperty(par))
                            dest[par] = pars[_par]
                        isp = true
                        break
                    }
                }
                if (!isp)
                    errs.push(`неопределённый параметр '${par}' `)
            }
        },
        CopyPars = (pars, dests, errs, force) => {
            for (const nam in dflts) { // ['moes', 'sizs', 'wins']
                const srcs = pars[nam],
                    dest = dests[nam]
                for (const _par in srcs) { // например 'sizs'
                    const par = _par.toLowerCase()
                    if (force || !dest.hasOwnProperty(par))
                        dest[par] = srcs[_par]
                }
            }
        },
        dlmattr = /[\s'"`]*[,;][\s'"`]*/,
        dlmpar = /[\s'"`]*[:=][\s'"`]*/,
        SplitPars = (spar, pars, refs, errs, tagname) => {
            const ss = spar.split(dlmattr)
            for (const s of ss)
                if (s.trim()) {
                    const uu = s.split(dlmpar),
                        u0 = RepQuotes(uu[0])   //.replace(C.consts.repQuotes, '')

                    if (uu.length == 1) refs[u0] = null
                    else {
                        const u1 = RepQuotes(uu[1]) // .replace(C.consts.repQuotes, '')
                        let nam = u0.toLowerCase()
                        if (nam == 'id') refs[u1] = null
                        else {
                            if (nam.length == 1) {
                                if (nam == 'g') nam = 'group'
                                if (nam == 'n') nam = 'nocss'
                                else if (nam == 'w') nam = 'width'
                                else if (nam == 'h') nam = 'height'
                                else if (nam == 't') nam = 'top'
                                else if (nam == 'l') nam = 'left'
                            }
                            if (!pars.hasOwnProperty(nam))
                                pars[nam] = u1
                            else
                                errs.push(`для  '${tagname}' повтор параметра '${u0}' (без учета регистра и сокращения)`)
                        }
                    }
                }
                else if (ss.length > 0)
                    errs.push(`для  '${tagname}' отсутствие параметра в массиве параметров`)

            if (errs.length > 0)
                C.ConsoleError(`для  '${tagname}' ошибки при разборе строки аргументов`, spar, errs)
        }

    function Popups(e) {

        if (!C.avtonom)
            if (o5nocss || GetCSS()) C.ParamsFill(W) // CSS сохранилось после автономного создания
            else // иначе - никак, т.к. не известно, кто раньше загрузится
                C.ParamsFill(W, o5css) // CSS пересоздаётся (для Blogger'а)

        if (debug > 0)
            console.log('%c%s', "background: aqua; color: black;border: none;",
                ` инициализация `,
                `${W.modul}.js`,
                ` ${C.avtonom ? ('автономно по ' + e.type) : 'из библиотеки'} `)
        const
            o5nocss = attrs && attrs.o5nocss && attrs.o5nocss.value,
            doneattr = W.modul + '-done',
            tags = C.GetTagsByQueryes(`[${oPopup}]`)

        focusTime = 0

        let o5c = null

        if (tags)
            for (const tag of tags) {
                if (tag.getAttribute(doneattr)) {
                    console.error('%c%s', eclr, `(========  повтор инициализации для id='${tag.id}'`)
                    continue
                }
                tag.setAttribute(doneattr, 'OK')
                const params = W.consts[oPopup] ? W.consts[oPopup].split(/[;,]/) : ''
                if (params.length > 0) {
                    const err = AskRefTag(tag, params)
                    if (err) {
                        console.error('%c%s', eclr, err + ` (для id='${tag.id}')`)
                        continue
                    }

                    if (!o5nocss && !tag.classList.contains(oPopup) && !params.find(param => param.match(/\bnocss\b/i)))
                        tag.classList.add(oPopup)

                    tag.addEventListener('click', PopUp)
                }
            }

        for (const eve of ['focus', 'click'])
            window.addEventListener(eve, Focus, optsFocus) // т.е. e.eventPhase ==1

        window.addEventListener('click', ClosePops)

        document.addEventListener('visibilitychange', DClosePops) // для автономной работы

        if (!o5nocss) // т.е. если явно НЕ запрещено    
            IncludeCSS()

        const errs = []
        if (attrs && attrs.o5params) {
            const pars = {},
                refs = {} // тут - refs не нуже
            SplitPars(attrs.o5params, pars, refs, errs)
            AddPars(pars, dflts, errs, false, 'конфиг.')
        }
        if (errs.length > 0)
            C.ConsoleError(`Ошибки формирования параметров окна (из url'а):`, errs.length, errs)

        if (C.E)  // если не автономно
            C.DispatchEvent('o_scriptDone', W.modul)
    }

    function GetPops(e, args) {
        // 'use strict'
        const tag = e.currentTarget,
            eve = e.type,
            CalcTagPars = (eve, tag, args, errs) => {
                if (!tag.aO5pop) {
                    tag.aO5pop = Object.assign({}, {
                        name: C.MakeObjName(tag),
                        title: tag.title,
                        tag: tag,
                        apops: {}
                    })
                    Object.freeze(tag.aO5pop)
                }

                const ap = W.consts[oPopup],
                    pops = tag.aO5pop.apops[eve] = {
                        tag: tag,
                        eve: eve, //для обратного поиска
                        url: '',
                        act: tag,
                        spar: '', // это просто для истории
                        key: tag.aO5pop.name + '(' + eve + ')' + e.timeStamp, // наименование окна
                        wins: {},
                        moes: {},
                        sizs: {},
                        swins: null,
                        smoes: null, // будут доопределены позже
                    }

                if (eve == 'click' && ap) { // при клике 'o5popup' приоритетнее
                    const mm = ap.match(/\s*[;,]\s*/),
                        i = mm ? mm.index : 9999
                    // ss = ap.split(/\s*;\s*/)
                    pops.spar = ap.substring(i + 1)
                    if (tag.a5pop) {
                        const mtag = tag.a5pop.mtag,
                            popup = mtag.tag.attributes.o5popup
                        let url = ''
                        if (popup) {
                            const pars = mtag.tag.attributes.o5popup.nodeValue.split(/[;,]/)
                            url = pars[0].trim()
                            // if (!mtag.match())
                            pops.spar += ',' + mtag.id
                        }
                        pops.url = url ? url : mtag.tag.getAttribute('href')
                    }
                    else
                        pops.url = ap.substring(0, i).trim()
                } else {
                    const l = args.length,
                        nam = l > 0 ? args[0] : '' // имя объекта, на котором д.б. мигание,
                    pops.url = (l > 1) ? args[1] : ''
                    pops.spar = (l > 2) ? args[2] : ''
                    if (nam) {
                        const istr = typeof nam === 'string',
                            act = istr ? document.getElementById(nam) : nam

                        if (act) pops.act = act
                        else
                            errs.push(`для  '${tag.aO5pop.name}' не найден тег мигания '${istr ? nam : C.MakeObjName(nam)}'`)
                    }
                }

                if (C.DeCodeUrl) {
                    const o5attrs = tag ? C.GetAttrs(tag.attributes) : '',
                        ori = RepQuotes((pops.url || '')),      // .replace(C.consts.repQuotes, '')
                        // eslint-disable-next-line no-useless-escape
                        url = (ori.trim() && !ori.match(/[\/.\\#]/)) ? (document.URL + '?o_nomnu#' + ori) : ori,
                        wref = C.DeCodeUrl(W.urlrfs || C.urlrfs, url, o5attrs)

                    if (wref.err)
                        errs.push(`Ошибка перекодирования url='${pops.url}':  ${wref.err}`)
                    pops.url = wref.url
                }

                Object.seal(pops)

                if (pops.spar) {
                    const refs = {},
                        pars = {}

                    SplitPars(pops.spar, pars, refs, errs, tag.aO5pop.name)
                    AddPars(pars, pops, errs, false)

                    for (const ref in refs) {
                        let itag = refs[ref]
                        if (!itag) {
                            if (itag !== '') {
                                itag = document.getElementById(ref)
                                if (itag) refs[ref] = itag
                                else {
                                    refs[ref] = '' // чтл бы больше не пытать
                                    errs.push(`для  '${tag.aO5pop.name}' в '${eve}' не найден ссылочный тег с id='${ref}'`)
                                }
                            }
                            if (!itag) continue
                        }
                        let iargs = null,
                            ieve = 'click'
                        const iap = itag.getAttribute(o5popup)
                        if (iap) {
                            const ss = ap ? iap.split(/\s*;\s*/) : ['']
                            iargs = [''].concat(ss)
                        } else
                            for (const iattr of itag.attributes)
                                if (iattr.value.match(/\.*PopUp\s*\(/)) {
                                    iargs = iattr.value.match(/(['"])(.*?)\1/g) // внутри парных кавычек

                                    for (let i = 0; i < iargs.length; i++)
                                        iargs[i] = RepQuotes(iargs[i])      // .replace(C.consts.repQuotes, '')
                                    ieve = iattr.name.replace('on', '').toLocaleLowerCase()
                                    break
                                }
                        if (iargs) {
                            CalcTagPars(ieve, itag, iargs, errs)
                            CopyPars(itag.aO5pop.apops[ieve], pops, errs, false)
                        } else {
                            errs.push(`для  '${tag.aO5pop.name}' в '${eve}' у тега с id='${ref}' отсутствует атрибут '${o5popup}'`)
                            refs[ref] = '' // чтл бы больше не пытать
                        }
                    }
                }
                return pops
            }

        let pops = null
        const errs = []

        if (tag.aO5pop && tag.aO5pop.apops && tag.aO5pop.apops[eve]) pops = tag.aO5pop.apops[eve]
        else
            pops = CalcTagPars(eve, tag, args, errs)

        if (pops.swins === null) {
            const doubles = {
                left: 'screenx',
                top: 'screeny',
                width: 'innerwidth',
                height: 'innerheight',
            },
                CalcSummString = nam => {
                    const pars = pops[nam],
                        ss = []
                    for (const par in pars) {
                        const v = ('' + pars[par]).trim(),
                            val = v.match(/[\d.,]+/) ? v : `'${v}'`
                        ss.push(par + '=' + val)
                    }
                    return ss.join(',')
                }

            for (const nam in dflts) { // ['moes', 'sizs', 'wins']
                const pars = dflts[nam],
                    dest = pops[nam]
                for (const _par in pars) { // например 'sizs'
                    const par1 = _par.toLowerCase(),
                        par2 = (nam === 'sizs') ? doubles[par1] : ''
                    if (!dest.hasOwnProperty(par1) && !(par2 && dest.hasOwnProperty(par2))) {
                        const v = pars[_par]
                        if (v !== null) dest[par1] = v
                    }
                }
            }

            CalcSizes(pops.sizs, errs, tag.aO5pop.name) //  для проверки корректности

            pops.swins = CalcSummString('wins')
            pops.smoes = CalcSummString('moes')

            Object.freeze(pops)
            for (const nam in dflts)
                if (dflts.hasOwnProperty(nam))
                    Object.freeze(pops[nam])
        }

        if (errs.length > 0)
            C.ConsoleError(`Ошибки обработки (цепочки) ссылок для тега `, C.MakeObjName(tag), errs)
        return pops
    }

    function WindowOpen(pops, s) {
        const url = pops.url
        if (url && url.length > 1) {
            // let isref = false
            if (url[0] == '#') {
                const id = url.substring(1),
                    tag = document.getElementById(id)
                if (!tag) {
                    C.ConsoleError(`PopUp: ссылка на отсутствующие внутренний тег:`, id)
                    return
                }
            }
            return window.open(url, pops.key, s)
        }
    }

    function ShowWin(pops) {
        // 'use strict'
        if (debug > 1) console.log(`${W.modul}: ShowWin`.padEnd(22) +
            `${C.MakeObjName(pops.tag)}`.padEnd(22) +
            `${C.MakeObjName(pops.act)}, '${pops.eve}') `)

        const tag = pops.tag,
            wopen = wopens.find(wopen => wopen.pops.tag == tag && wopen.pops.eve == pops.eve)

        if (wopen) { // повтор события на теге - закрываю всплытое окно!
            ClosePop(wopen)
            return
        }

        ClosePops(pops.moes.group)

        const sizs = CalcSizes(pops.sizs),
            s = sizs + ',' + pops.swins,
            win = WindowOpen(pops, s)
        if (win) {
            const wopen = {
                pops: pops,
                win: win,
                head: pops.moes.head,
                text: '',
                titlD: '',
                titlB: '',
                noact: '',
                name: tag.aO5pop.name,
                time: (new Date()).getTime() // отстройка от "дребезжания" oContents
            }
            const act = pops.act

            if (pops.moes.text) { // для анонимных - не менять текст
                wopen.text = act.value ? act.value : act.innerHTML
                act[act.value ? 'value' : 'innerHTML'] = pops.moes.text
            }
            RemoveTagErrors(tag)

            wopens.push(wopen)

            if (timerms > 99 && tag.classList.contains(oPopup)) {
                act.classList.add(cls_Act)
                if (wopens.tBlink)
                    window.clearInterval(wopens.tBlink)
                DoBlinks(true)
            }
        } else
            if (!['click', 'keyup', 'keydown', 'keypress'].includes(pops.eve))
                SetTagError(tag, `создание окна по событию '${pops.ve}'`, [`вероятно следует снять запрет на всплытие окон в браузере`])

        return sizs + ',\n' + pops.swins + ',\n' + pops.smoes
    }

    function PopUp() {
        if (arguments.length < 0 || arguments.length > 3) {
            C.ConsoleError(`PopUp: ошибочное к-во аргументов='${arguments.length}'`, [` у PopUp() их д.б. от 1 до 3)`])
            return '?'
        }

        let caller = arguments.callee
        while (caller.caller)
            caller = caller.caller

        const e = caller.arguments[0],
            pops = GetPops(e, arguments)

        if (e.target.nodeName != "A" || !e.target.hasAttribute('href')) {
            e.cancelBubble = true
            return ShowWin(pops)
        }

    }

    function PopShow() { //  устарешая обёртка  ---- width, height, url
        if (arguments.length == 3 && !isNaN(arguments[0]) && !isNaN(arguments[1])) {
            let caller = arguments.callee
            while (caller.caller)
                caller = caller.caller

            const e = caller.arguments[0],
                pops = GetPops(e, ['', arguments[2], `width=${arguments[0]}, height=${arguments[1]}`])
            e.cancelBubble = true
            return ShowWin(pops)
        } else {
            C.ConsoleError(`PopShow: ошибочно к-во или тип аргументов [${arguments.join(', ')}]`)
            return '?'
        }
    }

    // if (C)
    //     C.AddModule(W)
    // else {
        const Find = (scripts, nam) => {
            const mnam = new RegExp('\\b' + nam + '\\b')
            for (const script of scripts) {
                const attributes = script.attributes
                for (const attribute of attributes) {
                    if (attribute.value.match(mnam)) return true
                }
            }
        }
        if (Find(document.scripts, 'inc.js'))
            window.addEventListener('o_incReady', W.Init)
        else
            document.addEventListener('DOMContentLoaded', W.Init)

        // if (!window.olga7) window.olga7 = []

        if (!window.olga7) window.olga7 = { C: {}, pop: {} }

        if (C.consts.debug)
            console.log(`}---< ${document.currentScript.src.indexOf(`/${W.modul}.`) > 0 ? 'загружен  ' : 'включён   '}:  ${W.modul}.js`)
    // }

    // ??????????????????????????????????????????????????????????????????????????
    // Object.assign(window.olga7, {
    //     PopUp: PopUp,
    //     PopShow: PopShow
    // })

})();/* global document, window, console, */
/*jshint asi:true  */
/*jshint esversion: 6*/
/*eslint no-useless-escape: 0*/
(function () { // 3---------------------------------------------- tab ---
	'use strict';

	const
		m = window.location.search.match(/(?:\?|&)debug(?:=([^&?]*))?(?=[&?]|$)/),
		debug = !m ? 0 : (m[1] === undefined || m[1] === "") ? 1 : (isNaN(+m[1]) ? 3 : +m[1]),
		o5tagTable = "§¶▸▹↢⇔↣ₔᐞ⇅¿",
		C = window.o7 ? window.o7.C : { // заменитель библиотечного
			consts: {
				debug: debug,
				o5tag_table: o5tagTable
			},
			avtonom: true,
			incdone: false,
			GetTagsByQueryes: query => document.querySelectorAll(query), // второй аргумент - игнорится			
		},
		// currentScript = document.currentScript,
		W = {
			modul: 'tab',
			Init: TabInit,
			consts: { needs: `o5tag_table= ${o5tagTable}`, },
		},
		wshp = (window.o7 ??= {})[W.modul] = { W },
		cc_span = 'o-tabSpan',
		cc_odd = 'o-tabOdd',
		SortTab = e => {
			let up = 0
			const th = e.target,
				cc_Up = 'o-tabSortUp',
				cc_Dn = 'o-tabSortDn',
				aO5 = th.aO5tab,
				tr = th.parentElement,
				trpa = tr.parentElement,
				table = trpa.tagName == 'TABLE' ? trpa : trpa.parentElement,
				m = th.getAttribute('issort') - 1, // столбцы нумеруют от 1
				mm2 = Number.MAX_SAFE_INTEGER,
				mm1 = mm2 - 1,
				NumsSort = (v1, v2) => {
					return (v1.v == v2.v) ? 0 : ((up && v1.v > v2.v) || (!up && v1.v < v2.v) ? 1 : -1)
				}
			for (const tbody of table.tBodies) {
				const nums = []
				for (let i = 0; i < tbody.rows.length; i++) {
					const r = tbody.rows[i],
						c = r.cells[m],
						u = c ? c.innerText : mm1,
						v = isNaN(u) ? mm2 : parseFloat(u)
					nums.push({
						i: i,
						v: v,
						r: r
					})
				}

				for (const cell of tr.cells)
					if (cell.aO5tab) {
						cell.classList.remove(cc_Up)
						cell.classList.remove(cc_Dn)
					}
				up = aO5.up
				th.classList.add(up ? cc_Up : cc_Dn)

				aO5.up = !aO5.up

				nums.sort(NumsSort)

				let odd = false,
					dec = -1

				for (const num of nums) {
					const r = num.r
					if (!r.classList.contains(cc_span)) {
						const d = Math.trunc(num.v)
						if (dec != d) {
							dec = d
							odd = !odd
						}
					}

					if (odd) r.classList.add(cc_odd)
					else
						if (r.classList.contains(cc_odd))
							r.classList.remove(cc_odd)
					tbody.appendChild(r)
				}
			}
		},
		PrepTables = () => {
			const sel = 'o5table',
				tags = C.GetTagsByQueryes('[' + sel + ']'),
				d = W.consts.o5tag_table,

				d_head = d[0] ? d[0] : '§',
				d_line = d[1] ? d[1] : '¶',
				cellD = d[2] ? d[2] : '▸',
				cellC = d[3] ? d[3] : '▹',
				aligL = d[4] ? d[4] : '↢',
				aligC = d[5] ? d[5] : '⇔',
				aligR = d[6] ? d[6] : '↣',
				schwa = d[7] ? d[7] : 'ₔ',
				cellV = d[8] ? d[8] : 'ᐞ',
				csort = d[9] ? d[9] : '⇅',
				ctitl = d[10] ? d[10] : '¿',
				m_line = new RegExp('\\s*[\\n' + d_line + ']+\\s*', 'gm'), // разделитель строк
				m_cell = new RegExp('\\s+\\w*(' + cellD + '|' + cellC + ')\\s*', 'g'), // разделитель ячеек (для '▸' - с числом)
				m_clsR = new RegExp('^\\s*\\w*' + cellD),      				// проверка класса в начале рядка
				m_clsC = new RegExp('\\s*\\w+' + cellD + '\\s*$'),      				// проверка класса в ячейке				
				m_sort = new RegExp('\\s*\\d*' + csort + '\\s*', 'g'), // целочисл. сортировка ( с необязательным номером столбца (начиная с 1))
				m_Cell = new RegExp('[^' + cellC + cellD + ']*([' + cellC + cellD + ']|$)', 'g'), // содержимое ячейки
				m_alig = new RegExp('\\s*[' + aligL + aligC + aligR + cellV + csort + ']\\s*', 'g'), // признак выравнивания и объединения
				mschwa = new RegExp(schwa + '.{1}', 'g'),
				m_titl = new RegExp('\\s*\\d+\\s*' + ctitl + '\\s*', ''), // целочисл. сортировка ( с необязательным номером столбца (начиная с 1))
				titles = [],
				Schwa = s => '<sup>' + s.substring(1) + '</sup>'

			for (const tag of tags) {
				const ss = tag.innerHTML.split(m_line),
					rows = [],
					ncs = []
				for (let k = 0; k < ss.length; k++) {
					let s = ss[k]
					if (!s || s.match(/^\s*#/)) continue

					const mT = s.match(m_titl)
					if (mT && mT.length > 0) {
						const j = s.indexOf(ctitl),
							s1 = s.substring(0, j - 1).trim(),
							s2 = s.substring(j + 1).trim()
						titles.push({ k: parseInt(s1), s: s2 })
						continue
					}
					// if (s.indexOf('33	▸10      ▸2.5    ▸0.1   ▸12.1  ▸9.3')>=0)
					// 	console.log()

					if (s[s.length - 1] == d_line) s[s.length - 1] = ' '

					const tds = []
					tds.clsR = ''
					tds.isth = s[0] == d_head

					if (!tds.isth) {		// проверка первым символом разделитель ячеек - берём класс рядка
						const mR = s.match(m_clsR)
						if (mR) {
							const len = mR[0] ? mR[0].length - 1 : 0
							if (len > 0) {
								// tds.clsR = ` class="tab-tr_${parseInt(mR[0].substring(0, len))}" `
								tds.clsR = ` class="tab-tr_${mR[0].substring(0, len)}" `
								s = s.substring(len + 1)
							}
						}
					}

					const cells = (tds.isth ? s.substring(1) : s).match(m_Cell),
						nc = cells.length

					if (!ncs.includes(nc)) {
						if (ncs.length > 0)
							console.error(`tab, тег id='${tag.id}': изменено к-во (${ncs[0]}=>${nc}) ячеек в строке ${k}: "${s.substring(0, 33) + (s.length > 33 ? ' ...' : '')}"`)
						ncs.push(nc)
					}
					let txt = '',
						cspan = 0

					for (let i = 0; i < cells.length; i++) {
						const cell = cells[i],
							mcs = cell.match(m_cell),
							mc = mcs && mcs.length > 0 ? mcs[0].trim() : null,
							mC = cell.match(m_clsC),
							u = cell.replace(mC ? m_clsC : m_cell, '') // в объединённой ячейке объединяем отдельные слова. Чтобы раздельно - через &nbsp;						

						if (!mc && !u) continue // это пустая (незакрытая) ячейка в конце строки справа

						txt += u

						if (mc && mc[0] == cellC) cspan++
						else {
							let align = '',
								isspan = false,
								issort = -1,
								stitle = ''

							if (tds.isth) {
								const mS = txt.match(m_sort)
								if (mS) {
									txt = txt.replace(m_sort, '')
									const s = mS[0].trim()
									if (s.length > 1) issort = parseInt(s.substring(0, s.length - 1))
									else issort = i + 1
									const j = s.indexOf(csort)
									if (j >= 0)
										stitle = s.substring(j + 1).trim()
								}
							}
							const mA = txt.match(m_alig)
							if (mA) {
								for (const ma of mA) {
									switch (ma.trim()) {
										case aligL:
											align = 'left';
											break
										case aligC:
											align = 'center';
											break
										case aligR:
											align = 'right';
											break
										case cellV:
											isspan = true;
											break
									}
								}
								txt = txt.replace(m_alig, '') //все вычистил, сработал лишь первый							
							}

							// const len = mC ? mC.length - 1 : 0
							tds.push({
								txt: txt.replace(mschwa, Schwa).trim() + (issort ? ' ' : ''),
								isspan: isspan,
								issort: issort,
								stitle: stitle,
								vspan: '',
								cspan: cspan,
								align: align ? ` style="text-align:${align};"` : '',
								class: mC ? ` tab-td_${mC[0].substring(0, mC[0].length - 1).trim()}` : '',
								// class: (len > 0 && mC.indexOf(cellD)>0) ? ` tab-td_${mC.substring(0, len)}` : '',
							})
							txt = ''
							cspan = 0
						}
					}
					rows.push(tds)
				}
				let n = 0 // самый длинный рядок
				for (const tds of rows)
					if (n < tds.length) n = tds.length
				n = n - 1

				for (const tds of rows)
					if (n > tds.length) {
						let cspan = 0
						for (let i = 0; i < tds.length; i++)
							if (tds[i].cspan > 0)
								cspan += tds[i].cspan

						for (let i = tds.length + cspan; i < n; i++)
							tds.push({
								txt: '',
								isspan: false,
								issort: -1,
								stitle: '',
								vspan: '',
								cspan: 0,
								align: '',
								class: '',
							})
					}

				for (let i = 0; i < n; i++) { // перебо сначала по столбцам
					let cell = null,
						vspan = 0
					for (const tds of rows)
						if (i < tds.length) {
							const td = tds[i]
							if (td.isspan && cell) {
								cell.txt += ' ' + td.txt
								vspan++
							} else {
								if (vspan) {
									cell.vspan = ` rowspan=${vspan + 1}`
									vspan = 0
								}
								cell = td
							}
						}
				}

				const table = document.createElement('table')

				for (const attr of tag.attributes)
					if (attr.name != sel)
						table.setAttribute(attr.name, attr.value)

				let html = '<thead>\n',
					isbody = false
				for (const tds of rows) {
					let row = '',
						rcls = ''
					const head = tds.isth ? 'th' : 'td'
					if (!tds.isth && !isbody) {
						isbody = true
						html += '</thead>\n  <tbody>\n'
					}

					let k = 0
					for (const td of tds) {
						if (tds.isth) k++
						if (td.isspan) {
							if (td === tds[0])
								rcls = cc_span
						} else {
							const cls = td.class ? ` class="${td.class}"` : '',
								sort = td.issort >= 0 ? ` issort=${td.issort}` : '',
								cspan = td.cspan > 0 ? ` colspan=${td.cspan + 1}` : ''
							let titl = ''
							if (tds.isth && sort)
								for (const title of titles)
									if (title.k == k) {
										titl = ` title="${title.s}"`
										break
									}
							row += '<' + head + cls + sort + cspan + td.vspan + td.align + titl + '>' + td.txt + '</' + head + '>'
						}
					}
					html += '<tr' + tds.clsR + (rcls ? ` class="${rcls}"` : ``) + '>' + row + '</tr>\n'
				}
				if (isbody) html += '</tbody>\n'
				else html += '</thead>\n'

				html += '<tfoot>  </tfoot>\n'

				table.innerHTML = html

				table.style.opacity = 1

				const atag = tag.parentNode.insertBefore(table, tag)
				tag.parentNode.removeChild(tag)

				const thead = atag.tHead
				for (const row of thead.rows)
					for (const cell of row.cells)
						if (cell.hasAttribute('issort')) {
							cell.aO5tab = {
								up: true
							}
							cell.addEventListener('click', SortTab)
						}

				let odd = false
				for (const tbody of table.tBodies)
					for (const r of tbody.rows) {
						if (!r.classList.contains(cc_span))
							odd = !odd

						if (odd) r.classList.add(cc_odd)
					}
			}
		}

	function TabInit(e) {
		if (C.incdone) return // т.е. уже отработало после inc

		if (!C.avtonom)
			C.ParamsFill(W)

		if (debug > 0)
			console.log('%c%s', "background: aqua; color: black;border: none;",
				` инициализация `,
				`${W.modul}.js`,
				` ${C.avtonom ? ('автономно по ' + e.type) : 'из библиотеки'} `)

		PrepTables()

		if (!C.avtonom)
			C.DispatchEvent('o_scriptDone', W.modul)
	}

	if (C.avtonom) {
		const Find = (scripts, nam) => {
			const mnam = new RegExp('\\b' + nam + '\\b')
			for (const script of scripts) {
				const attributes = script.attributes
				for (const attribute of attributes) {
					if (attribute.value.match(mnam)) return true
				}
			}
		}
		if (Find(document.scripts, 'inc.js'))
			window.addEventListener('o_incReady', W.Init)
		else
			document.addEventListener('DOMContentLoaded', W.Init)

		// if (!window.o7) window.o7 = []
		if (!window.o7) window.o7 = { C: {}, tab: {} }
		W.consts = C.consts

		PrepTables()
		if (debug)
			console.log(`}---< ${document.currentScript.src.indexOf(`/${W.modul}.`) > 0 ? 'загружен  ' : 'включён   '}:  ${W.modul}.js`)
	}
	// else
	// 	C.AddModule(W)

	Object.assign(window.o7, { PrepTables: PrepTables, })

})();/* global document, window, console*/
/* exported olga5_menuPopDn_Click*/
/*jshint asi:true  */
/*jshint esversion: 6*/
(function () {              // ---------------------------------------------- o7 ---    
    'use strict';
    let debug = 1
    const
        fmtOK = "background: cornsilk; color: black;",
        fmtErr = "background: yellow; color: black;"

    class LoadMI {         //  контроль загрузки подмодулей модуля - элелменты LoMod.incls[] 
        /**
         *  Общий Загрузчик
         *  таймер не нужен - контролируется общим таймером  
         */
        done = false   // завершена/не-требуется загрузка подмодулей
        name = '?'            // условное имя "для протоколу"
        src = '?'            // путь загрузки 
        Fun          // функция после загрузки 

        Done(err = null) {
            this.done = true
            if (this.Fun && !err) { // иначе callback-функции игнорирутся
                this.Fun()
                this.Fun = null
            }
            Object.freeze(this)     // контроль,- чтобы больше не трогали

            if (debug)
                console.log(`${this.name} загружен: ${this.src}`)
        }
        LoadScript() {
            if (debug > 1)
                console.log(`Загружаю ${this.name}`)

            const script = document.createElement('script')
            script.addEventListener('load', () => this.Done(), { once: true })
            script.addEventListener('error', () => this.Done(true), { once: true })

            script.src = this.src
            document.head.append(script)
        }
        constructor(name, src, Fun) {
            this.name = name
            this.src = src
            this.Fun = Fun
            if (src)
                this.LoadScript()
            else
                this.done = true
        }
    }

    class LoIncl extends LoadMI {         //  контроль загрузки подмодулей модуля - элелменты LoMod.incls[]        
        constructor(name, src, Fun) {
            super(name, src, Fun)
        }
    }

    const loMods = {}       // загрузчики - для каждого модуля
    class LoMod extends LoadMI {        //  контроль загрузки модулей
        loIncls = {}            // подгружаемые Incls
        constructor(name, src, Fun) {
            super(name, src, Fun)

            // this.modul = name

            if (!loMods[name]) loMods[name] = this
            else
                console.error('%c%s', this.fmtErr, `Повторная загрузка модуля '${name}'`, orig)
        }
        get modul() {
            alert('modul')
        }
    }

    const
        IsUnDefined = c => typeof c === 'undefined',
        TryToDigit = x => {
            if (IsUnDefined(x)) return 1
            const
                val = ('' + x).replace(/^(['"`])([\s\S]*)\1$/, '$2'),
                vf = parseFloat(val)
            if (vf == val) {
                const vc = parseInt(val)
                if (vc == val) return vc
                return vf
            }
            else
                switch (val) {
                    case '': return 1
                    case 'true': return true
                    case 'false': return false
                    default:
                        return val
                            .replace(/\s*\n+\s*/g, ';')
                            .replace(/\t+/g, ' ')
                            .trim();
                }
        },
        CurScr = () => {
            const
                curScript = document.currentScript,
                src = curScript?.src ?? '',
                path = src.replace(/[^/]+$/, ''),
                name = src.match(/([^/]+)\.[^.]+$/)?.[1] ?? '',
                isComp = name[name.length - 1] === '!'

            return {
                dataset: curScript ? { ...curScript.dataset } : {},
                src: src,
                path: path,
                name: name,
                isComp: isComp,
                // modul: isComp ? name.slice(0, name.length - 1) : name
            }
        },
        FillFromScript = (Z, _dataset, _consts) => {  //  здесь Z м.б. W или C, а _dataset, _consts - из C  
            const
                dataset = (Z.load && Z.load.dataset) ? Z.load.dataset : _dataset,
                ForNeedData = z => {      // поиск констант, заявленных в needs
                    const needs = z.needs.replace(/[^\p{L}\p{N}+.,;_]+/gu, '').split(';')
                    for (const need of needs) {
                        const
                            ss = need.split('='),
                            nam = ss[0]
                        if (nam && !z[nam]) {
                            z[nam] = ss[1]  // не был найден среди name (consts или urlrfs)
                            for (const name in dataset)
                                if (nam === name)
                                    z[nam] = dataset[name]  // перебираю все - беру последний
                        }
                    }
                },
                FromNamedData = z => {      // доминирования заявленых индивидуально
                    for (const name in dataset)
                        if (!IsUnDefined(z[name]))
                            z[name] = dataset[name]
                },
                FromCommonData = (z, name) => {   // обработка data-consts и data-urlrfs
                    const
                        cnsts = dataset[name]?.split(';') ?? [],
                        isconst = name === 'consts'
                    for (const cns of cnsts) {
                        const
                            ss = cns.split('='),
                            c = ss[0].trim()
                        if (c && c[0] !== '#') {
                            const v = ss[1].trim()
                            if (isconst) z[c] = TryToDigit(v)
                            else
                                if (v && v[0] !== '#')
                                    z[c] = v
                        }
                    }
                }

            for (const name of ['consts', 'urlrfs']) {
                const z = Z[name]
                FromCommonData(z, name)
                FromNamedData(z)
                if (z.needs)
                    ForNeedData(z)
            }

            // "полировка" константами адресной строки
            for (const c in _consts)
                Z['consts'][c] = _consts[c]
        },
        cc = {
            urlcns: {},     // константы из адресной строки
            curScr: Object.freeze(CurScr()),
            timer: 0, // будет задан и установлен в constructor после FillFromScript
        },
        C = new class {
            consts = {
                debug: 0, nomnu: 0, noact: 0, timLoad: 3,
                fmtOK: fmtOK, fmtErr: fmtErr,
                doscr: 'olga5_sdone',
                pageDones: 'beforeunload, o_unloadPage',
                pageLoads: 'readystatechange:d, message:u, inc_ready',
                depends: "inc; pop:ref,snd; ref= inc; snd:ref; shp=snd, ref; mnu; tab",
            }
            constructor() {
                const url = new window.URL(window.location)
                this.urlrfs = {
                    _root: url.origin + '/',
                    _olga: cc.curScr.src.match(/\S*\//)?.[0],
                    _html: url.origin + url.pathname.substring(0, url.pathname.lastIndexOf('/') + 1),
                }

                // сохраняю константы из адресной строки
                const params = Object.fromEntries(new URLSearchParams(window.location.search))
                for (const nam in params)
                    cc.urlcns[nam] = TryToDigit(params[nam])

                FillFromScript(this, cc.curScr.dataset, cc.urlcns);

                cc.timer = setTimeout(this.Finish, this.consts.timLoad * 1000)
                debug = this.consts.debug
            }
            AddModuleSub(modul, submod, funcs) {
                /**
                 * subscript м.б. либо подгруженным, либо скомпилированным в тело модуля
                 * вызывается еще до фиксации в классе
                 */
                const
                    // modul = m[m.length - 1] === '!' ? m.slice(0, m.length - 1) : m,
                    omod = window.o7[modul],
                    errs = []
                if (!omod)
                    console.log()
                if (omod[submod])
                    errs.push(`Повтор подгрузки '${modul}/${submod}'`)

                if (funcs)  // м.б. либо объект {name, obj}, либо массивом функций [f1, f2...]  
                    if (Array.isArray(funcs)) {
                        for (const func of funcs) {
                            const name = func.name
                            if (omod[name]) errs.push(`Повтор функции '${name}'`)
                            else
                                omod[name] = func
                        }
                    }
                    else {
                        const name = funcs.name
                        if (!name)  // тупо сразу исполнить
                            funcs()
                        else
                            if (omod[name]) errs.push(`Повтор объекта '${name}'`)
                            else
                                omod[name] = funcs.obj
                    }

                if (errs.length)
                    console.error('%c%s', this.fmtErr, `Ошибки добавления субмодуля ${submod} в `, modul, errs)

                if (debug > 2) {
                    const names = Array.isArray(funcs)
                        ? funcs.map(f => f.name)
                        : [funcs.name];
                    console.log(`подключён ${modul}.${submod}: ${names.join(',')}`)
                }

                return omod
            }
            RegisterModul(modul) {
                const W = window.o7[modul]?.W
                if (W) {
                    if (W.ready) return

                    Object.assign(W, CurScr(), { consts: {}, urlrfs: {}, ready: true })

                    for (const name of ['consts', 'urlrfs']) // копируем из корневого модуля
                        for (const c in C[name])
                            W[name][c] = C[name][c]

                    FillFromScript(W, cc.curScr.dataset, cc.urlcns)
                    Object.freeze(W)
                }

                // loMods[modul].done = true

                let ready = true
                for (const modul in loMods)
                    if (modul !== cc.curScr.name && !loMods[modul].done) {
                        ready = false
                        break
                    }

                if (ready)
                    this.Finish()

                // информация для запускальщика программ инициализации модулей
                const e = new CustomEvent('o_modulLoad', modul ? { detail: { modul: modul } } : {})
                window.dispatchEvent(e)
            }
            OnLoadIncl(modul) {
                const loIncls = loMods[modul].loIncls
                for (const incl in loIncls)
                    if (!loIncls[incl].done)
                        return

                C.RegisterModul(modul)
            }
            OnLoadModul(modul) {
                const
                    // modul = m[m.length - 1] === '!' ? m.slice(0, m.length - 1) : m,
                    W = window.o7[modul]?.W,
                    loMod = loMods[modul]

                if (!W) {
                    const fs = [], ms = []
                    for (const name in loMods) fs.push((name))
                    for (const name in window.o7) ms.push((name))
                    console.error('%c%s', this.fmtErr, `Отсутствует добавляемый модуль '${modul}'  `,
                        `(несовпадение имен файла и W.modul ?)`,
                        `\n\t файлы : ` + fs.join(', '),
                        `\n\t модули: ` + ms.join(', '),
                    )
                    return
                }

                if (W.isComp || !W.incls)    // C.DispatchEvent('o_modulLoad', modul)
                    C.RegisterModul(modul)
                else {
                    const path = C.urlrfs._olga + modul + '/'

                    for (const incl of W.incls)
                        loMod.loIncls[incl] =
                            new LoIncl(`${loMod.name}.${incl}`,
                                path + incl + '.js',
                                () => C.OnLoadIncl(modul)
                            )
                }

                if (debug > 1) {
                    const incls = [], orig = loMods[modul].orig
                    for (const incl in loMod.loIncls)
                        incls.push(incl)
                    console.log('%c%s', fmtOK, modul, '(' + orig ? `загружен из ${orig} ` : `взят из 'o7'` + ')',
                        incls.length ? `подмодули: ${incls.join(', ')}` : `без подмодулей`
                    )
                }
            }

            Finish(e) {
                if (!cc.timer) return

                clearTimeout(cc.timer)
                cc.timer = 0

                if (C.consts.debug > 1)
                    OutDebug()

                const errs = []
                for (const modul in loMods) {
                    const loMod = loMods[modul],
                        ers = []
                    for (const incl in loMod.loIncls) {
                        const loIncl = loMod.loIncls[incl]
                        if (!loIncl.done)
                            ers.push(incl)

                        if (!loMod.done || ers.length)
                            errs.push((loMod.done ? `?` : modul) + (ers.length ? ` [${ers.join(', ')}]` : ``))
                    }
                    // loMod.loIncls = null
                    delete (loMods[modul])
                }

                if (errs.length > 0)
                    console.error('%c%s', fmtOK, `Незавершены загрузки: `, errs.join('; '))
                else
                    if (debug)
                        console.log('%c%s', fmtOK, `Загружены все модули !`)
            }
        };

    /**
     *  этот модуль в скомпилированном д.б. последним - выполниться после всех остальных
     *  а его скрипт должен находиться после всех скриптов в заголовке
     */
    (window.o7 ??= {}).C = C
// Object.freeze(window.o7)
    // в loMod добавляю модули, которые уже находятся в скомпилированном
    for (const modul in window.o7)
        new LoMod(modul)
    // new LoMod(cc.curScr.name, modul)

    // перебор всех описаний скриптов и создание loMod  если не был добавлен
    // Загрузчики - одноразовые, повторные вызовы не поддерживаются
    for (const script of document.scripts) {
        if (script === document.currentScript) break // этот - д.б. последним

        const orig = script.dataset?.src?.trim()
        if (!(orig && orig[0] === '+')) continue

        const
            name = orig.substring(1),
            src = C.urlrfs._olga + name,
            // modul2 = orig.match(/[^\/ +]+(?=\.[^.]*$)/)[0],
            // modul1 = orig.match(/([^\/]+?)(?:!\.|\.)(?=[^\/]*$)/)[0],  //(/[^\/ +]+(?=\.[^.]*$)/)[0]
            // modul = orig.match(/[^\/ +](?:!\.|\.)(?=[^\/]*$)/)[0]  //(/[^\/ +]+(?=\.[^.]*$)/)[0]
            // (/[^\/ +]+(?=\.[^.]*$)/)[0]
            modul = orig
                .split('/')
                .pop()
                .trim()
                .replace(/^\+/, '')
                .replace(/!\./, '.')
                .replace(/\.[^.]+$/, '')

        if (!loMods[modul])
            new LoMod(modul, src, () => C.OnLoadModul(modul))

        // // for (const [key, val] of Object.entries(script.dataset))
        // //     loMod.dataset[key] = val

        // if (!readyMod)
        //         loMod.LoadScript(() => C.OnLoadModul(modul))
    }

    // for (const modul in loMods) {
    //     const loMod = loMods[modul]
    //     if (loMod.done)
    //         C.OnLoadModul(modul)    // после копиравания соотв. dataset
    //     else
    //         if (loMod.src)
    //             loMod.LoadScript(() => C.OnLoadModul(modul))
    // }

    // отладка - убрать ---------------------------------------------------------
    function OutDebug() {
        const Fill = (name, omod) => {
            const arr = [],
                aomod = omod.W[name]
            if (!aomod)
                console.error(`? нету aomod для '${name}'`)
            else
                for (const [key, val] of Object.entries(aomod))
                    arr.push({ key, val })
            return arr
        }
        for (const modul in window.o7)
            if (modul !== 'C') {
                const
                    omod = window.o7[modul],
                    loMod = loMods[modul]
                if (loMod) {
                    const
                        incls = [],
                        consts = Fill('consts', omod),
                        urlrfs = Fill('urlrfs', omod),
                        src = omod.W?.dataset?.src || '??'

                    for (const incl in loMod.loIncls)
                        incls.push(`${incl}${loMod.loIncls[incl].done ? '' : '=false'}`)
                    console.groupCollapsed("%c%s", fmtOK, modul, incls.join(', '),
                        `\n\t  W...src= ${src.padEnd(12)}, done= '${loMod.done}', orig='${loMod.orig}'`
                    )
                    console.table(consts)
                    console.table(urlrfs)
                    console.groupEnd()
                }
                else
                    console.error(`? нету loMod для '${modul}'`)
            }
        console.log('==============================================')
    }

})();