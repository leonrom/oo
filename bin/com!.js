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
						err = `Стиль id='${id}' (модуль: '${W.cls.modul}', класс: '${W.class}) уже определён в документе`
						break
					}
			} else
				if (cmodul != W.cls.modul) err = `Класс '${W.class}' повторяется в модулях '${cmodul}' и '${W.cls.modul}. '`

			if (err) C.ConsoleError('>>  создание CSS  ' + err, 'InitCSS')
			else {
				if (debug > 1)
					console.log(`>>  СОЗДАНИЕ CSS   ${W.class} (для модуля ${W.cls.modul}) с id='${id}'`)
				csslist[W.class] = W.cls.modul

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

			const scrpt = C.scrpts.find(scrpt => scrpt.modul == W.cls.modul)

			if (!scrpt) {
				C.ConsoleError(`В 'C.scrpts' не наден модуль `, W.cls.modul)
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
						DeCodeUrlRfs(urls, `${W.cls.modul}: `)
						for (const nam in xs)
							xs[nam].url = urls[nam]
					}
					else
						// for (const nam in C.constsurl)
						// 	if (xs[nam].source != C.save.urlName)
						// 		Object.assign(xs[nam], { val: C.constsurl[nam], source: `${C.save.urlName}(восстановил)` })

					for (const nam in xs)
						W[p][nam] = xs[nam].val

					if (debug > 0) PrintParams(W.cls.modul, xs, p, n1)
				}
				else
					if (debug > 0) C.ConsoleInfo(`${W.cls.modul}: параметры и ссылки берутся только из скрипта ядра библиотеки`)
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
					if (scrpt.need && scrpt.W.cls.Init) {
						const depend = scrpt.depends.find(depend => (depend.act.need && depend.act.done != start))
						if (!depend) {
							if (debug > 1)
								console.log(`${head} начало нинициализации  ${scrpt.W.cls.modul} `)
							scrpt.start = start
							scrpt.timera.Start(act.W.cls.modul)
							scrpt.W.cls.Init()
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
							curScript: w.cls.curScript,
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
