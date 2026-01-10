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
                o-sndError = 'o-sndError',
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
                            if (!aO5.snd.classList.contains(o-sndError))
                                aO5.snd.classList.add(o-sndError)
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
                            if (aO5.snd.classList.contains(o-sndError))
                                aO5.snd.classList.remove(o-sndError)
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
            const audios = C.GetTagsByTagNames('audio', wshp.W.cls.modul),
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
                C.ConsoleError(`${wshp.W.cls.modul}: ошибки перекодировки тегов с ${wshp.W.class}`, errs.length, errs)
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
/* global document, window*/
/*jshint asi:true  */
/*jshint esversion: 6*/
(function () {              // ---------------------------------------------- snd ---
	'use strict';

	const
		C = window.o7.C,
		olgaSnd = 'olga_snd',
		W = Object.seal({
			cls: Object.freeze({
				modul: 'snd',
				Init: SndInit,
				curScript: document.currentScript,
				incls: ['AO5snd', 'Imgs', 'Prep'],
			}),
			consts: {
				needs: `		
						o5shift_speed=0.5 # при Shift - замедлять вдвое;
						o5return_time=0.3 # при возобновлении "отмотать" 0.3 сек ;
				`},
			urlrfs: { needs: 'btn_play=""; btn_stop=', },
		}),
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
	`,
		wshp = C.AddModule(W)

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

		const mtags = C.SelectByClassName(olgaSnd, W.cls.modul)
		wshp.Prep(mtags)

		C.DispatchEvent('o_scriptDone', W.cls.modul)
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
})();﻿/* global document, window */
/*jshint asi:true  */
/*jshint strict:true  */
/*jshint esversion: 6 */

(function () {              // ---------------------------------------------- shp ---
	"use strict";

	const
		C = window.o7.C,
		olgaShp = 'olga-shp',
		W = Object.seal({
			cls: Object.freeze({
				modul: 'shp',
				Init: ShpInit,
				curScript: document.currentScript,
				incls: ['DoInit', 'PBases', 'AO5shp', 'PO5shp', 'Frames', 'DoChgs'],
			}),
		}),
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
	    `,
		wshp = C.AddModule(W)

	function ShpInit() {

		C.ParamsFill(W, o5css)

		const excls = document.getElementsByClassName('o-shpNone')
		for (const excl of excls) {
			const exs = excl.querySelectorAll(`[class *=${olgaShp}]`)
			for (const ex of exs)
				ex.classList.add('o-shpNone')
		}

		wshp.DoInit.Init()

		C.DispatchEvent('o_scriptDone', W.cls.modul)

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
