/* global window */
/* exported _srcEmpty */
/*jshint asi:true  */
/*jshint esversion: 6*/
(function () {              // ---------------------------------------------- pusto ---
	'use strict';
	const
		C = window.o7.C,	// если нужна ссылка на ядро библиотеки для использования её API
		W = Object.seal({			// freeze - защита от собстенной дурости
			cls: Object.freeze({
				modul: 'pusto', 		// уникальное имя модуля 'W' для регистрации
				Init: WndInit,      	// функция, вызываемая при инициализации 'W'
				curScript: document.currentScript,		// обязательно для "на потом"
				/* необязательные параметры  */
				Done: null,				// функция, вызываемая по завершении работы		
				incls: [],				// список подгружаемых модулей
			}),
			/* необязательные изменяемые (наполняемые) поля  */
			consts: {					// список констант модуля - для задания атрибутами
				needs: 'xyz=3.14; moe-attr=?',
			},
			urlrfs: { needs: '' },			// список именованных ссылок -"-
		}),

		/*  Константы, функции и обработчики событий - требуемые в "WndInit(c)" */
		o5css = ` 	// необязательный встраиваемый CSS-класс для модуля 
        	.${W.class} { cursor: pointer; animation: none; }
        	// ... иные CSS-описания
     	`,			// eslint-disable-next-line no-unused-vars
		_srcEmpty = 'about:blank'  	// пример некоей константы

	function WndInit() { 		// определение парамеров модуля и заморозка 'W'
		if (C) {				// 'C' м.б. не определено при автономном вызове 
			C.ParamsFill(W, o5css) 	// при отсутствии 'o5css' - C.ParamsFill(W)
		}
		// ... иные функции/операторы инициализации заданные внутри  "WndInit(c)"

		/* информирование ядра библиотеки о завершении инициализации */
		C.DispatchEvent('o_scriptDone', W.cls.modul)
	}

	/* Информирование ядра библиотеки об окончании загрузки модуля */
	C.AddModule(W)
})();
