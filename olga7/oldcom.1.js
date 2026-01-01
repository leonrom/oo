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
		C = window.olga7.C,
		debug = C.consts.debug,
		W = Object.seal({
			cls: Object.freeze({
				modul: 'com',
				Init: ComInit,
				curScript: document.currentScript,
				incls: ['CApi', 'CConsole', 'CEncode', 'CParams', 'CPops', 'IniScripts', 'TagsRef'],
			}),
		}),
		AddSubScripts = ({ modul = '', names = [], curScript = C.o5script, iniFun = {}, args = [] }) => {
			const
				nams = {},
				load = { is_set: false, timeout: 0, path: '' },
				actpath = curScript.src.match(/\S*\//)[0],
				OnTimer = () => {
					let s = ''
					for (const nam in nams)
						if (!nams[nam]) s += (s ? ', ' : '') + nam

					if (s)
						console.error(`Для ${modul} недозагрузились скрипты: ${s} (таймер o_timLoad=${C.consts.timLoad}с.)`)
					load.timeout = 0
				},
				ScriptLoad = name => {
					const lefts = []
					nams[name] = true
					for (const nam in nams)
						if (!nams[nam]) lefts.push(nam)

					if (debug > 2)
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
				const wshp = window.olga7[modul]

				if (!wshp) {
					console.error('%c%s', fmtErr,
						`В скрипте, выполняющем дозагрузку скриптов, не создан объект 'window.olga7.${modul}'`)
					continue
				}
				if (wshp[name]) ScriptLoad(name)
				else {
					if (!load.is_set)
						Object.assign(load, {
							is_set: true,
							path: actpath + modul + '/',
							timeout: window.setTimeout(OnTimer, 1000 * C.consts.timLoad),
						})

					const script = document.createElement('script')
					script.onload = () => ScriptLoad(name)
					if (script.dataset.loaded)
						ScriptLoad(name)

					script.onerror = function (e) { OnError(name, e); }

					script.src = load.path + name + '.js'
					script.dataset.oAdd = modul

					if (debug > 1) {
						const MakeObjName = obj => obj ? (
							(obj.id && obj.id.length > 0) ? obj.id : (
								('[' + obj.tagName ? obj.tagName : (obj.nodeName ? obj.nodeName : '?') + ']') +
								'.' + (obj.className ? obj.className : '?'))) : 'НЕОПР.'
						console.log(`вставка ${(name + '.js').padEnd(15)}  перед  ${modul + '.js'} (в parentNode=${MakeObjName(curScript.parentNode)})`)
					}

					if (curScript.parentNode)
						curScript.parentNode.insertBefore(script, curScript)
					else // это ватще-то заплатка. по-хорошему надо бы убрать 'curScript' оставив 'module'	
						for (const scr of document.scripts)
							if (scr.src.lastIndexOf('/' + modul + '.js') > 0) {
								scr.parentNode.insertBefore(script, scr.nextSibling)   // т.е. тут insertAfter
								break
							}
				}
			}
		},
		FilldModuleScrip=()=>{
			for (const scrpt of C.scrpts){
// тут проверить нужно ли оно еще
				const nams =( scrpt.W?.incls||'').split(/\s*[;,]\s*/)
				for (const nam of nams){
			AddSubScripts = ({ modul = '', names = [], curScript = C.o5script, iniFun = {}, args = [] }) => {
				}
// а если не нужно, то проверять очередность и Init()				
			}
		},
		ParamsFillFromScript = (xs, defs, attrs, p) => {
			const stradd = '(добавлен)'
			for (const name in attrs) {
				const nam = Repname(name)
				if (C.HasProperty(defs, nam) && !C.HasProperty(xs, nam)) {
					const add = C.HasProperty(defs, nam) ? '' : stradd
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
							const add = C.HasProperty(defs, nam) ? '' : stradd,
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
		},
		AddModuleSub = (modul, submod, funcs) => {
			const wshp = window.olga7[modul],
				errs = []
			if (!wshp)
				errs.push(`Отсутствует модуль '${W.cls.modul}`)
			else
				if (wshp && wshp[submod]) errs.push(`Повтор подгрузки '${modul}/${submod}'`)
				else {
					if (debug > 1)
						console.log(`${document.currentScript.src.indexOf(`/${modul}.`) > 0 ? 'дозагружен' : 'подключён '}:  ${modul}/${submod}.js`)

					if (Array.isArray(funcs))
						for (const func of funcs) {
							const name = func.name
							if (wshp[submod][name]) errs.push(`Повтор функции '${name}' в '${modul}/${submod}'`)
							else
								wshp[submod][name] = func
						}
					else {
						// const name = funcs.name||submod
						// wshp[submod][name] = funcs
						wshp[submod] = funcs
					}
				}
			if (errs.length)
				console.error('%c%s', fmtErr,
					`Ошибки добавления субмодуля в `, W.cls.modul, errs)
			return wshp
		}
	// AscInclude = () =>
	// 	IncludeScripts({ modul: olga5_modul, names: modnames, curScript: C.o5script, iniFun: RunO5com, })


	const
		modnames = ['CConsole', 'CEncode', 'CApi', 'CParams', 'TagsRef', 'IniScripts'], // 'IniScripts' д.б. ПОСЛЕДНИМ

		strt_time = Number(new Date()),
		RunO5com = () => {
			const
				DoneO5com = (e) => {
					if (e)
						document.removeEventListener('readystatechange', DoneO5com)

					const
						// _olga = C.o5script.src.match(/\S*\//)[0],
						dt = ('' + (Number(new Date()) - strt_time)).padStart(4) + ' ms',
						modul = 'com', // olga5_modul,
						name = dt + `        ${modul}`,
						errs = []

					console.log('%c%s', "background: blue; color: white;border: none;",
						' инициализировано ядро      ',
						name)

					for (const modname of modnames)
						if (wshp[modname]) wshp[modname](_olga)
						else
							errs.push(modname)

					if (errs.length > 0)
						console.error('%c%s', "background: yellow; color: black;border: none;",
							`Не найдены [${errs.join(', ')}] в ${modul}.js ( где-то синтаксическая ошибка ?)`)
				}

			if (document.body) DoneO5com()
			else
				document.addEventListener('readystatechange', DoneO5com)
		}

 	addEventListener ('o_scriptLoad',  FilldModuleScrip)
	wshp = C.AddModule(W)

	// function ComInit() {
	// 	console.log(`=======  загружено ядро библиотеки  =======`)
	// 	const xs = {}, // временное хранилилище для считываемых параметров
	// 		p = 'consts',
	// 		defs = C[p]

	// 	const hash = window.location.hash
	// 	Object.assign(C.save, { xs: xs, p: p, n1: -1, hash: hash ? hash.substring(1).trim() : '' })

	// 	ConstsFillFromUrl(xs)
	// 	C.save.n1 = ParamsFillFromScript(xs, defs, C.o5attrs, p)

	// 	// for (const nam in xs) defs[nam] = xs[nam].val

	// 	// const		mm = document.currentScript.src.match(/(!\.js)|(\bo5.js)\s*$/)
	// 	// // 	AscInclude = () =>
	// 	// // 		IncludeScripts({ modul: olga5_modul, names: modnames, curScript: C.o5script, iniFun: RunO5com, })

	// 	// // if (mm) wshp.AscInclude = AscInclude  // формальный вызов чтобы всё поотмечать и вызвать iniFun()
	// 	// // else
	// 	// if (!mm)		
	// 	// 	IncludeScripts({ modul: 'com', names: modnames, curScript: C.o5script, iniFun: RunO5com, })
	// }
})();

const cnsts = script.dataset.consts?.split(';') ?? [];
10️⃣ document.currentScript может быть null
нет обработки onerror