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
		// W1 = Object.seal({
		// 	cls: Object.freeze({
		// 		modul: 'com',
		// 		Init: ComInit,
		// 		// curScript: document.currentScript,
		// 		curScr: C.CurScr(document.currentScript),
		// 		incls: ['CApi', 'CConsole', 'CEncode', 'CParams', 'CPops', 'IniScripts', 'TagsRef'],
		// 	}),
		// }),
		W=Object.assign(
			{
				Init: ComInit,
				incls: ['CApi', 'CConsole', 'CEncode', 'CParams', 'CPops', 'IniScripts', 'TagsRef'],
			},
			C.CurScr(document.currentScript),
		),
		wshp = C.AddModule(W),
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
				// const wshp = window.o7[modul]

				if (!wshp) {
					console.error('%c%s', fmtErr,
						`В скрипте, выполняющем дозагрузку скриптов, не создан объект 'window.o7.${modul}'`)
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

function ComInit(){
	/**
	 * переподключает добавленные функции на модуль C
	 */
	for (const name in wshp)
		C[name]= wshp[name]
}

	// addEventListener('o_modulLoad', LoadModuleScripts)
	// wshp = C.AddModule(W)	

})();
