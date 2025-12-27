/*
            при необходимости - доделать подключения
*/
(function () {              // ---------------------------------------------- E ---
	'use strict';

	const olga5_modul = "com"
	if (!window.olga5) window.olga5 = []
	if (!window.olga5.C) window.olga5.C = {}
	if (!window.olga5[olga5_modul]) window.olga5[olga5_modul] = {}

const
		E = { 
			Err: err => {
				console.error("%c%s", "background: yellow; color: black;border: solid 1px gold;", 'E: ' + err)
			},
			Msg: (txt, eve, nFun) => {
				if (C.consts.o_debug > 1) {
					console.groupCollapsed("%c%s", "background: lightblue; color: black;border: solid 1px gold;",
						`${txt} для eve='${eve}'`)
					console.log(`для вызова:\n${nFun}`)
					{
						console.groupCollapsed(`Трассировка вызова`)
						console.trace()
						console.groupEnd()
					}
					console.groupEnd()
				}
			},
			NFun: (Fun) => Fun.name || Fun,
			events: [],
			donets: [],
			HasEventListener: (eve, Fun) => {
				const nFun = E.NFun(Fun),
					has = E.events.find(event => event.eve === eve && event.nFun === nFun)
				return has
			},
			/**
 * Добавить слушатель с поддержкой кастомных опций
 * @param {string} eve - имя события
 * @param {Function} Fun - callback-функция
 * @param {Object|boolean} opts - опции addEventListener и свои кастомные параметры
 *        допустимые native опции: capture, once, passive
 *        кастомные: couldRepeat (boolean, default true)
 */
			// AddEventListener: (eve, Fun, opts) => {
			AddEventListener: function AddEventListener(eve, Fun, opts) {
				const nFun = E.NFun(Fun)

				if (typeof opts === 'boolean')
					opts = { capture: opts };

				if (E.events.find(event => event.eve == eve && event.nFun == nFun)) {	//  && event.opts == opts)) {
					if (!opts || !opts.couldRepeat)
						E.Err(`повторная регистрация  '${eve}' для ф-ии "${nFun}"`)
				}
				else {
					E.Msg('AddEventListener', eve, nFun)

					// const						caller = arguments.callee
					const caller = AddEventListener
					for (const donet of E.donets)
						if (donet.eve == eve)
							if (donet.callers.includes(caller))
								E.Err(`Повторное выполнение '${eve}' для ф-ии "${nFun}"`)
							else {
								donet.callers.push(caller)
								Fun(donet.e)
							}

					const opts2 = { capture: false, once: false, passive: false }
					for (const opt in opts)
						if (['capture', 'once', 'passive'].includes(opt))
							if (typeof opts[opt] === 'boolean')
								opts2[opt] = opts[opt]
							else E.Err(`значение одной из опций - не булево а '${typeof opts[opt]}'`)

					E.events.push({ eve: eve, nFun: nFun, opts: opts2 })
					window.addEventListener(eve, Fun, opts2)
				}
			},
			RemoveEventListener: (eve, Fun) => {
				const nFun = E.NFun(Fun)
				E.Msg('RemoveEventListener', eve, nFun)
				let i = E.events.length,
					k = -1
				while (i-- > 0 && k < 0)
					if (E.events[i].eve == eve && E.events[i].nFun == nFun)
						k = i

				if (k < 0)
					E.Err(`удаление неприсвоенного события '${eve}' функции "${nFun}" `)
				else {
					E.events.splice(k, 1)
					window.removeEventListener(eve, Fun)
				}
			},
			DispatchEvent: (eve, modulx, canrep) => {
				if (C.consts.o_debug > 1 && !canrep) {
					console.groupCollapsed(`DispatchEvent: '${eve}' ${modulx ? (' из  ' + modulx) : ''} `)
					console.trace()
					console.groupEnd()
				}
				const
					modul = modulx ? modulx : '',
					donet = E.donets.find(donet => donet.eve == eve && donet.modul == modul)
				let e = null

				if (donet) {
					e = donet.e
					if (!canrep)
						E.Err(`повторная генерация события '${eve}' modul="${modul}"`)
				}
				else {
					const e2 = new CustomEvent(eve, modul ? { detail: { modul: modul } } : {})
					E.donets.push({ eve: eve, modul: modul, callers: [], e: e2, })
					e = e2
				}
				// console.log('---n3= '+n3)
				// if (n3===8) // 4,6
				// 				console.log(eve, '----------------------------------------------------')
				// 				console.log(eve, e)
				// 		n3++
				window.dispatchEvent(e)
			},
			Clear: () => {
				E.events.splice(0, E.events.length)
				E.donets.splice(0, E.donets.length)
			},
			IsDone: eve => { // не используется (думал для замены проверок 'window.olga5.C.o5_isInited',- решил не менять)
				E.donets.find(donet => donet.eve == eve)
			},
		}


	console.log(`=======  загружено ядро библиотеки  =======`)
})();