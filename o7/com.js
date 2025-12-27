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


	const olga5_modul = "com"
	if (!window.olga5) window.olga5 = []
	if (!window.olga5.C) window.olga5.C = {}
	if (!window.olga5[olga5_modul]) window.olga5[olga5_modul] = {}

	const
		modnames = ['CConsole', 'CEncode', 'CApi', 'CParams', 'TagsRef', 'IniScripts'], // 'IniScripts' д.б. ПОСЛЕДНИМ
		/*
		нафига тут был , 'CPops' ?????????????????????????????????????????????
		*/
		wshp = window.olga5[olga5_modul],
		C = window.olga5.C,
		strt_time = Number(new Date()),
		IncludeScripts = ({ modul = '', names = [], actscript = C.o5script, iniFun = {}, args = [] }) => {
			const
				nams = {},
				load = { is_set: false, timeout: 0, path: '' },
				actpath = actscript.src.match(/\S*\//)[0],
				OnTimer = () => {
					let s = ''
					for (const nam in nams)
						if (!nams[nam]) s += (s ? ', ' : '') + nam

					if (s)
						console.error(`Для ${modul} недозагрузились скрипты: ${s} (таймер o_timLoad=${C.consts.o_timLoad}с.)`)
					load.timeout = 0
				},
				ScriptLoad = name => {
					const lefts = []
					nams[name] = true
					for (const nam in nams)
						if (!nams[nam]) lefts.push(nam)

					if (C.consts.o_debug > 2)
						console.log(`загружено включение '${name}' осталось [${lefts.join(', ')}]`)
					if (lefts.length == 0) {
						if (load.timeout > 0) {
							window.clearTimeout(load.timeout)
							load.timeout = 0
						}
						// Object.freeze(C.urlrfs)
						iniFun(args)
					}
				},
				OnError = (name, e) => {
					console.error(`Для ${name} ошибка дозагрузки '${name}' (из ${e.target.src})`)
					// ScriptLoad(name)
				}

			for (const name of names)
				nams[name] = false

			for (const name of names) { // в очерёдности размещения	
				const wshp = window.olga5[modul]

				if (!wshp) {
					C.ConsoleError(`В скрипте, выполняющем дозагрузку скриптов, не создан объект 'window.olga5.${modul}'`)
					continue
				}
				if (wshp[name]) ScriptLoad(name)
				else {
					if (!load.is_set)
						Object.assign(load, {
							is_set: true,
							path: actpath + modul + '/',
							timeout: window.setTimeout(OnTimer, 1000 * C.consts.o_timLoad),
						})

					const script = document.createElement('script')

					// if (script.readyState) script.onreadystatechange = () => { ScriptLoad(name); }
					// else script.onload = () => { ScriptLoad(name); }
					script.onload = () => ScriptLoad(name)
					if (script.dataset.loaded)
						ScriptLoad(name)

					script.onerror = function (e) { OnError(name, e); }

					script.src = load.path + name + '.js'
					script.dataset.o5add = modul
					// script.setAttribute('async', '')

					if (C.consts.o_debug > 1) {
						const MakeObjName = obj => obj ? (
							// (obj.id && obj.id.length > 0) ? ('#' + obj.id) : (
							(obj.id && obj.id.length > 0) ? obj.id : (
								('[' + obj.tagName ? obj.tagName : (obj.nodeName ? obj.nodeName : '?') + ']') +
								'.' + (obj.className ? obj.className : '?'))) : 'НЕОПР.'
						console.log(`вставка ${(name + '.js').padEnd(15)}  перед  ${modul + '.js'} (в parentNode=${MakeObjName(actscript.parentNode)})`)
					}

					if (actscript.parentNode)
						actscript.parentNode.insertBefore(script, actscript)
					else // это ватще-то заплатка. по-хорошему надо бы убрать 'actscript' оставив 'module'	
						for (const scr of document.scripts)
							if (scr.src.lastIndexOf('/' + modul + '.js') > 0) {
								scr.parentNode.insertBefore(script, scr.nextSibling)   // т.е. тут insertAfter
								break
							}
				}
			}
		},
		RunO5com = () => {
			const
				DoneO5com = (e) => {
					if (e)
						document.removeEventListener('readystatechange', DoneO5com)

					const _url_olga5 = C.o5script.src.match(/\S*\//)[0],
						dt = ('' + (Number(new Date()) - strt_time)).padStart(4) + ' ms',
						name = dt + `        ${olga5_modul}`,
						errs = []

					console.log('%c%s', "background: blue; color: white;border: none;",
						' инициализировано ядро      ',
						name)

					for (const modname of modnames)
						if (wshp[modname]) wshp[modname](_url_olga5)
						else
							errs.push(modname)

					if (errs.length > 0)
						console.error('%c%s', "background: yellow; color: black;border: none;",
							`Не найдены [${errs.join(', ')}] в ${olga5_modul}.js ( где-то синтаксическая ошибка ?)`)
				}

			if (document.body) DoneO5com()
			else
				document.addEventListener('readystatechange', DoneO5com)
		},
		GetBaseHR = root => { // функции определения адреса текущиещей страницы и корня сайта
			const url = new window.URL(window.location) 
			if (root == 'root') return url.origin + '/'
			else return url.origin + url.pathname.substring(0, url.pathname.lastIndexOf('/') + 1)
		},
		TryToDigit = x => {
			// if (x.indexOf && x.indexOf('182')>=0)			
			// console.log()
			if (typeof x === 'undefined') return 1		// true
			if (x === !!x) return x
			const val = ('' + x).replace(C.repQuotes, '')

			if (val == 'true') return true
			if (val == 'false') return false

			const i = parseInt(val)
			if (i == val) return i
			const f = parseFloat(val)
			if (f == val) return f
			const rez = val.replace(/\s*;\s*\n+\s*/g, ';').replace(/\s*\n+\s*/g, ';')
			return rez.replace(/\t+/g, ' ').trim()
		},
		HasProperty = (foo, nam) => {
			return Object.prototype.hasOwnProperty.call(foo, nam)
			// return  foo.hasOwnProperty(nam)
		},
		GetAttribute = (attrs, name) => { // нахождение значения 'attr' в массиве атрибутов 'attrs'
			for (const nam of [name, 'data-' + name, '_' + name])
				if (HasProperty(attrs, nam)) return attrs[nam]
		},
		GetAttrs = attributes => {
			const attrs = {}
			for (const attribute of attributes)
				attrs[Repname(attribute.name)] = TryToDigit(attribute.value)
			return attrs
		},
		Repname = name => {
			return name.trim().replaceAll('-', '_').toLowerCase()
		},
		ConstsFillFromUrl = (xs) => {  // параметры адресной строки,- м.б. (т.е. интерпретируются) только константы
			const hash = window.location.hash
			if (hash)
				C.save.hash = hash ? hash.substring(1).trim() : ''

			const smatchs = window.location.search.match(/[?&]\S+?(#|$)/) || []
			for (const smatch of smatchs) {
				const match = smatch.replaceAll(/(%20|\s)/g, '').trim()
				if (match) {
					const params = match.split(/[,;?&#]/)
					for (const param of params) {
						const u = param.trim()
						if (u.length > 0) {
							const prms = u.split(/[=:]/)
							let nam = Repname(prms[0])
							if (nam == 'o5nomenu' || nam == 'nomenu') nam = 'o_nomnu'
							if (nam == 'debug') nam = 'o_debug'
							if (HasProperty(C.consts, nam)) {
								const val = TryToDigit(prms[1])
								xs[nam] = { val: val, source: C.save.urlName }
								C.constsurl[nam] = val
							}
						}
					}
				}
			}
		},
		ParamsFillFromScript = (xs, defs, attrs, p) => {
			const stradd = '(добавлен)'
			for (const name in attrs) {
				const nam = Repname(name)
				if (HasProperty(defs, nam) && !HasProperty(xs, nam)) {
					const add = HasProperty(defs, nam) ? '' : stradd
					xs[nam] = { val: TryToDigit(attrs[name]), source: `атрибут${add}` }
				}
			}

			let partype = 'data-o_' + p  // тут в частности o5consts
			if (!attrs[partype]) partype = 'o_' + p
			if (attrs[partype]) {
				const params = attrs[partype].split(/[;]/)  // параметры в атрибуте разделяются только ';'
				for (const param of params) {
					const u = param.replace(/\s*#.*$/, ''), // trim()
						i = u.indexOf('=')
					if (i > 0) {
						const nam = Repname(u.substring(0, i).trim())
						if (!xs[nam]) {
							const add = HasProperty(defs, nam) ? '' : stradd,
								val = TryToDigit(u.substring(i + 1).trim())
							xs[nam] = { val: val, source: `параметр${add}` }
							// console.log(`${nam} = '${val}'`)
						}
					}
				}
			}

			let n = 0	// подсчет к-ва 'стандартных' параметров
			for (const nam in defs) {
				n++
				if (!xs[nam])
					xs[nam] = { val: TryToDigit(defs[nam]), source: 'default' }
			}
			return n
		}

	Object.assign(C, {
		repQuotes: /^\s*((\\')|(\\")|(\\`)|'|"|`)?\s*|\s*((\\')|(\\")|(\\`)|'|"|`)?\s*$/g,
		// olga5ignore: 'olga5-ignore',
		TryToDigit: TryToDigit,
		ParamsFillFromScript,
		GetAttrs: GetAttrs,
		GetAttribute: GetAttribute,
		Repname: Repname,
		IncludeScripts: IncludeScripts,
		E: {
			DispatchEvent: (eve, modulx, canrep) => {
				if (C.consts.o_debug > 1 && !canrep) {
					console.groupCollapsed(`DispatchEvent: '${eve}' ${modulx ? (' из  ' + modulx) : ''} `)
					console.trace()
					console.groupEnd()
				}
				const modul = modulx ? modulx : '',
					e = new CustomEvent(eve, modul ? { detail: { modul: modul } } : {})
				window.dispatchEvent(e)
			}
		},
		o5script: document.currentScript,
		o5attrs: GetAttrs(document.currentScript.attributes),
		cstate: {	 			// общее состояние 
			depends: null,  	// только для подключенных скриптов, но с учетом как o_depends, так и очередности в задании и атрибута async
		},
		urlrfs: {
			_url_html: GetBaseHR('href'),
			_url_root: GetBaseHR('root'),
			_url_olga5: '' // будет задан при инициализации (document.currentScript.src.match(/\S*\//)[0],)
		},
		consts: {
			o_timLoad: 3, 	//mtiml ? (mtiml[5] ? mtiml[5] : 1) : (C.o5script.attributes['o_timLoad'] || 3),
			o_debug: 0, 	// mdebug ? (mdebug[5] ? mdebug[5] : 1) : (C.o5script.attributes['o_debug'] || 0),
			o_nomnu: 0,
			o_noact: 0,
			o_incls: '',
			o_doscr: 'olga5_sdone',
			o_depends: "inc; pop:ref,snd; ref= inc; snd:ref; shp=snd, ref; mnu; tab",
			o_pageLoads: 'readystatechange:d, message:u, inc_ready',
			o_pageDones: 'beforeunload, o5_unloadPage',
		},
		constsurl: {},
		save: { hash: null, xs: null, p: '', n1: -1, urlName: 'url', libName: 'ядро', }, // сохранение для "красивой" печати - потом удалю
		ModulAddSub: (modul, p1, p2, funcs) => {
			if (!window.olga5[modul])
				window.olga5[modul] = {}

			const
				wshp = window.olga5[modul],
				sub = p2 ? p1 : p1.name,
				Fun = p2 ? p2 : p1

			if (C.consts.o_debug > 1) {
				console.log(`${document.currentScript.src.indexOf(`/${modul}.`) > 0 ? 'дозагружен' : 'подключён '}:  ${modul}/${sub}.js`)
			}

			if (wshp && wshp[sub]) {
				console.groupCollapsed('%c%s', "background: yellow; color: black;border: solid 2px red;",
					`Повтор подгрузки '${modul}/${sub}'`)
				console.log(`Fun_old=${wshp[sub]})`)
				console.log(`Fun_new=${Fun})`)
				console.groupEnd()
			}

			wshp[sub] = Fun

			if (funcs)
				for (const func of funcs)
					wshp[sub][func.name] = func

			return wshp
		},
		AddModuleSub: (modul, sub, funcs) => {
			if (!window.olga5[modul])
				window.olga5[modul] = {}

			const
				wshp = window.olga5[modul]

			if (wshp && wshp[sub]) C.ConsoleError(`Повтор подгрузки '${modul}/${sub}'`)
			else
				if (C.consts.o_debug > 1)
					console.log(`${document.currentScript.src.indexOf(`/${modul}.`) > 0 ? 'дозагружен' : 'подключён '}:  ${modul}/${sub}.js`)

			wshp[sub] = {}

			if (funcs)
				for (const func of funcs)
					wshp[sub][func.name] = func

			return wshp
		},
		ModulAdd: W => {
			const modul = W.modul
			if (window.olga5.find(w => w.modul == modul))
				console.error('%c%s', "background: yellow; color: black;border: solid 2px red;",
					`Повтор загрузки '${modul}`)
			else {
				if (C.consts.o_debug)
					console.log(`${document.currentScript.src.indexOf(`/${modul}.`) > 0 ? 'загружен  ' : 'включён   '}:  ${modul}.js`)

				if (!window.olga5[modul])
					window.olga5[modul] = {}

				const wshp = window.olga5[modul]

				wshp.W = W
				if ('name' in wshp )
					console.log(`ModulAdd: wshp есть ф-я '${wshp.name}'`)
				else
					wshp.name = modul // просто для облегченияидентификации
				window.olga5.push(W)

				C.E.DispatchEvent('o5_scriptLoad', W.modul)

				return wshp
			}
		},
		// MyJoinO5s: aO5s => {
		// 	let s = ''
		// 	for (const aO5 of aO5s) s += (s ? ', ' : '') + aO5.name
		// 	return s
		// },
	})

	const xs = {}, // временное хранилилище для считываемых параметров
		p = 'consts',
		defs = C[p]

	Object.assign(C.save, { xs: xs, p: p, n1: -1 })

	ConstsFillFromUrl(xs)
	C.save.n1 = ParamsFillFromScript(xs, defs, C.o5attrs, p)

	for (const nam in xs) defs[nam] = xs[nam].val

	const
		mm = document.currentScript.src.match(/(!\.js)|(\bo5.js)\s*$/),
		AscInclude = () =>
			IncludeScripts({ modul: olga5_modul, names: modnames, actscript: C.o5script, iniFun: RunO5com, })

	if (mm) wshp.AscInclude = AscInclude  // формальный вызов чтобы всё поотмечать и вызвать iniFun()
	else
		AscInclude()

	if (!C.Debug) {
		const
			errors = [],
			Error = nam => {
				if (!errors.includes(nam)) {
					errors.push(nam)
					const err = C.Debug.loaded ? `отсутствует ф-я '${nam}' в модуле 'dbg'` :
						`не подключен модуль 'dbg' (для вызова '${nam}')`
					console.error("%c%s", "background: yellow; color: black;", err)
				}
			}

		C.Debug = { // тут д.б.  пустышки для всех из dbg.Utils
			loaded: false,
			ShowBounds: () => Error('ShowBounds'),
		}
	}

	console.log(`=======  загружено ядро библиотеки  =======`)
})();
