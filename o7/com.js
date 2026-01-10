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
			incls: ['CApi', 'CConsole', 'CEncode', 'CParams', 'IniScripts', 'TagsRef'],
		}

	function InitCom() {
		if (debug)
			console.log(`Загружен 'com'. Начинается проверка загрузки и исполнение остальных модулей`)
		Object.assign(C.scrpts, {})
		Object.seal(C.scrpts)			// финализация структуры описания модулей
	}
	// window.addEventListener('o_modulReady', InitCom)

	window.addEventListener('o_allIsReady', () => {
		if (document.readyState === 'loading')
			document.addEventListener('DOMContentLoaded', InitCom)
		else
			InitCom()
	});
	
	(window.o7 ??= {})[W.modul] = { W }

})();
