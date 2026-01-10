/* global document, window, console */
/*jshint asi:true  */
/*jshint esversion: 6*/
(function () {               // ---------------------------------------------- dbg o5dbgx ---
	'use strict'
	const
		C = window.o7.C,
		W = {
			modul: 'dbg',
			Init: DbgInit,
			curScript: document.currentScript,
			incls: ['Pos', 'Ccss', 'Logs', 'Utils', 'Events'],
		},
		wshp = (window.o7 ??= {})[W.modul] = { W },

	function DbgInit() {
		if (wshp.Pos) wshp.Pos()
		if (wshp.Ccss) wshp.Ccss()
		if (wshp.Logs) wshp.Logs()
		if (wshp.Utils) wshp.Utils()
		if (wshp.Events) wshp.Events()

		C.DispatchEvent('o_scriptDone', W.modul)
	}

	if (C.consts.nomnu || C.consts.noact)
		console.error(`DbgInit не выполняется, т.к. задано:` +
			C.consts.nomnu ? `  o_nomnu=${C.consts.nomnu}` : '' +
				C.consts.noact ? `  o_noact=${C.consts.noact}` : '')
	else {
		const nms = W.consts.load ? W.consts.load.toUpperCase() : 'U'

		if (nms.includes('P')) W.incls.names.push('Pos')
		if (nms.includes('C')) W.incls.names.push('Ccss')
		if (nms.includes('L')) W.incls.names.push('Logs')
		if (nms.includes('U')) W.incls.names.push('Utils')
		if (nms.includes('E')) W.incls.names.push('Events')
	}
})();/* global document, window, console */
/*jshint asi:true  */
/*jshint esversion: 6*/
(function () {              // ---------------------------------------------- dbg/pos ---
	'use strict'

	let // wshp = {},
		mposPos = null, // объект, в котором позиция мыши
		mposAct = null // текущий двигаемый объект (тот же самый)

	const
		olga5_modul = "dbg",
		modulname = 'Pos',
		C = window.o7.C,
		id = "olga5_mousePos",
		m_borderColorOff = 'lightgray',
		m_borderColorOn = 'red',
		m_borderRadius = '3px',
		m_cursor = 'grab',
		fmt1 = '     ',
		fmt2 = '    ',
		viewport = { wp: null, W: 0, H: 0 },
		LeftPad = function (mask, text) {
			const m = mask.length,
				s = text + '',
				j = s.length
			if (m <= j) return text
			else return mask.substr(0, m - j) + text
		},
		ShowPos = (e) => {
			if (e) {
				mposPos.pre.innerHTML =
					'B=' + LeftPad(fmt1, e.offsetX.toFixed(0)) + ' ' + LeftPad(fmt2, e.offsetY.toFixed(0)) + ' blck<br/>' +
					'P=' + LeftPad(fmt1, e.pageX.toFixed(0)) + ' ' + LeftPad(fmt2, e.pageY.toFixed(0)) + ' page<br/>' +
					'C=' + LeftPad(fmt1, e.clientX.toFixed(0)) + ' ' + LeftPad(fmt2, e.clientY.toFixed(0)) + ' wndw<br/>' +
					'S=' + LeftPad(fmt1, e.screenX.toFixed(0)) + ' ' + LeftPad(fmt2, e.screenY.toFixed(0)) + ' scrn<br/>' +
					'<span style="font-size: xx-small;font-family: serif;position: relative; top: -7px;">' +
					'чтобы перетащить - захват курсором </span>'
				mposPos.x = e.pageX
				mposPos.y = e.pageY
			} else
				mposPos.x = mposPos.y = 0
		},
		StopMoveAct = (e) => {
			if (mposAct) {
				mposAct.div.style.cursor = m_cursor
				mposAct = null
			}
			ShowPos(e)
		},
		SetVP = () => {
			const wp = window.visualViewport,
				W = wp ? wp.width : window.innerWidth,
				H = wp ? wp.height : window.innerHeight
			Object.assign(viewport, { wp, W, H })
		},
		MyMouseMove = (e) => {
			if (mposAct) mposAct.MoveAct(e.pageX, e.pageY)
			ShowPos(e)
		}

	class Mdiv {
		constructor(div) {
			this.div = div;
			div.style = `
				padding-left:0.5px;
				width: 150px;
				height: 80px;
				background-color: antiquewhite;
				position: fixed;
				bottom: 7px;
				right: 122px;
				opacity: 0.9;
				line-height: 18px;
				z-index: 9999999;
				border: 1px solid ${m_borderColorOff};
				border-radius: ${m_borderRadius};
				cursor: ${m_cursor};
				`;
			this.x = 0;
			this.y = 0;
			this.old = { x: 0, y: 0, L: 0, T: 0 };

			div.addEventListener('mousedown', (e) => {
				const mpos = e.currentTarget.aO5mpos;
				mpos.MoveStart(e.pageX, e.pageY);
			});
			div.addEventListener('mouseenter', (e) => {
				e.currentTarget.style.borderColor = m_borderColorOn;
			});
			div.addEventListener('mouseleave', (e) => {
				e.currentTarget.style.borderColor = m_borderColorOff;
			});
			this.MoveStart = (x, y) => {
				const mpos = this; // e.currentTarget.aO5mpos,
				div = mpos.div;
				div.style.cursor = 'grabbing';
				mpos.old.L = div.offsetLeft;
				mpos.old.T = div.offsetTop;
				mpos.old.x = x;
				mpos.old.y = y;
				mposAct = mpos;
			};
			this.MoveAct = (x, y) => {
				const mpos = this, div = mpos.div, old = mpos.old, dw = 33, dh = 25, w = div.offsetWidth, h = div.offsetHeight;

				let L = old.L + (x - old.x), T = old.T + (y - old.y);

				if (L + w < dw) L = dw - w;
				if (T + h < dh) T = dh - h;
				if (L + dw > viewport.W) L = viewport.W - dw;
				if (T + dh > viewport.H) T = viewport.H - dh;
				div.style.left = L + 'px';
				div.style.top = T + 'px';
			};
		}
	}

	class Mpos {
		constructor(div) {
			Object.setPrototypeOf(this, Object.assign({}, new Mdiv(div)));
			this.pre = document.createElement('pre');
			this.pre.style = `
				font-family: monospace;
				font-size: 14px;
				display: block;
				white-space: pre;
				margin: 1px;
				margin-left: 3px;
				`;
			div.appendChild(this.pre);
			div.id = "olga5_mousePos";
		}
	}

	C.AddModuleSub(olga5_modul, modulname, () => {
		const isInitiated = document.getElementById(id)
		// console.log(`${olga5_modul}.${modulname} : ` + (isInitiated ? 'игнорируется' : ''))
		if (isInitiated) return

		const div = document.createElement('div')

		document.body.appendChild(div)

		div.aO5mpos = new Mpos(div)
		mposPos = div.aO5mpos

		window.addEventListener('resize', SetVP)
		document.addEventListener('mouselive', StopMoveAct)
		document.addEventListener('mouseup', StopMoveAct)
		document.addEventListener('mousemove', MyMouseMove)

		SetVP()
		ShowPos()
	})
})();
/* global window, document, console */
/*jshint asi:true  */
/*jshint esversion: 6*/
(function () {              // ---------------------------------------------- dbg/Ccss ---
	'use strict'
	let isInitiated = false
	const
		olga5_modul = "dbg",
		modulname = 'Ccss',
		C = window.o7.C,
		lognam = olga5_modul + '.' + modulname + ': '

		C.AddModuleSub(olga5_modul, modulname, () => {
			console.log(`${lognam}: CheckCSS()` + isInitiated ? 'игнорируется' : '')
			if (isInitiated) return

			isInitiated = true
			const csss = document.styleSheets, // подгруженные классы
				errCSS = [],
				cssAlls = [], // список селекторов в подгруженных классах, наичинающихся точкой и без псевдоклассов
				CheckToAdd = function (val, vals, txt) {
					if (val.length == 0) return
					const L = vals.length
					let add = -1
					for (let i = 0;
						(i < L) && (add < 0); i++) {
						if (val == vals[i].val) add = i
					}
					if (add < 0) vals[vals.length] = { val: val, txt: txt }
				},
				CompareVals = function (v1, v2) {
					if (v1.val > v2.val) return 1
					if (v1.val < v2.val) return -1
					return 0
				}
			let errs = ""
			for (let i = 0; i < csss.length; i++) {
				const css = csss[i]
				try {
					const rules = css.cssRules || css.rules
					// rules.forEach(rule => {
					for (const rule of rules) {
						if (rule.type == 1) {
							const defs = rule.selectorText.split(',')
							for (let k = 0; k < defs.length; k++) {
								const nams = defs[k].trim().split('.')
								for (let l = 0; l < nams.length; l++) {
									const u = nams[l].trim().split(' ')[0].trim(),
										v = u.split(':')[0].trim()
									if (v.length > 0)
										CheckToAdd(v, cssAlls)
								}
							}
						}
					}
				} catch (e) {
					errs += (errs.length == 0 ? '' : ', ') + i + ': ' + e.message
				}
			}

			if (errs.length > 0)
				console.error(`${lognam} ошибка проверки cssRules в CSS'ах для i= [ ` + errs + " ]")
			cssAlls.sort(CompareVals)

			const clsNs = [], // список классов в HTML-файле
				clss = document.querySelectorAll("[class]") // тегов,использующих  классы

			for (let i = 0; i < clss.length; i++) {
				if (clss[i].tagName != 'HTML') {
					const L = 77,
						nams = clss[i].classList,
						stags = clss[i].outerHTML.substr(0, 222).split('\n')
					let stag = stags[0].substr(0, L)
					if ((stags.length > 1) || (stags[0].length > L)) stag = stag + ' ...'
					for (let j = 0; j < nams.length; j++) {
						CheckToAdd(nams[j].split(':')[0], clsNs, stag)
					}
				}
			}
			clsNs.sort(CompareVals)

			clsNs.forEach(clsN => {
				if (!cssAlls.find(cssAll => { return cssAll.val == clsN.val }))
					if (clsN.val != 'o-isLoading')//может отсутствовать css/ini.css
						errCSS.push({ css: clsN.val, used: clsN.txt })
			})
			const s0 = `  ==${lognam}== конец  проверки - `
			if (errCSS.length > 0) {
				const s = s0 + "были неопределёные CSS-селекторы "
				console.groupCollapsed(s)
				for (const err of errCSS) console.log(err.css.padEnd(32), err.used);
				console.groupEnd()
			} else {
				const s = s0 + "OK"
				console.log(s)
				return true
			}
		})
})();
/* global window, console */
/*jshint asi:true  */
/*jshint esversion: 6*/
(function () {              // ---------------------------------------------- dbg/Logs ---
	'use strict'
	const
		olga5_modul = "dbg",
		modulname = 'Logs',
		C = window.o7.C

	C.AddModuleSub(olga5_modul, modulname, () => {
		const oldLog = console.log,
			oldwin = window
		let rez = '-НАШЁЛ',
			err = ''
		try {
			const debug = window.open("", "", "width=200,height=100");
			if (!debug) {
				console.error(`ошибка создания всплывающенго окна (возможно дан 'http' а не  'httpS') ?- см. настроки безопасности браузера`)
				return
			}
			const o5log = debug.document.body

			if (debug.document.title == '') {
				debug.document.title = modulname
				// o5log.innerText = ''
				o5log.innerHTML = `
<style>
body{
	background-color: oldlace;
	font-family: monospace;
	font-style: normal;
	font-size: small;
}
pre{
	line-height: 12px;
	margin: 0 !important;
}
pre span{
	margin-left: calc(100% - 7em);
	background-color: gold;
}
</style>
`
				rez = 'Создал'
			}
			if (o5log) console.log = function () {
				oldLog.apply(console, arguments) // так точнее совпадение временных меток
				const s = Array.prototype.join.call(arguments, ' '),
					dt = new Date(),
					ds = s.trim() == '' || s[0] == '\n' ? '' : (
						(dt.getHours() + ':').padStart(3, '0') +
						(dt.getMinutes() + ':').padStart(3, '0') +
						(dt.getSeconds() + '.').padStart(3, '0') +
						(dt.getMilliseconds() + '').padEnd(3, '0'))
				// o5log.innerText += '\n' + ds + ' ' + s
				o5log.insertAdjacentHTML('beforeEnd', '<pre>' + ds + ' ' + s + '</pre>')
			}
			else err = 'Не удалось инициировать ' + modulname + ' ?'
		} catch (e) {
			err = 'Ошибка инициализации ' + modulname + ' по причине: "' + e.message + '"'
		}
		if (err) console.error(err)
		else console.log('\n<span>' + rez + ' ' + modulname + '</span>')

		oldwin.focus()
	})

})();
/* global window,  document */
/*jshint asi:true  */
/*jshint esversion: 6*/
/* eslint-disable */
(function () {              // ---------------------------------------------- dbg/Utils ---
	'use strict'
	const
		olga5_modul = "dbg",
		modulname = 'Utils',
		C = window.o7.C,
		utils = {
			ShowBounds: (aO5s) => {
				return  // исправить! 
				// const fmt = [12, 26, 18, 12, 1],
				// 	nms = ['shp', 'asks', 'bords', ' to..bo', '',],
				// 	MyRound4 = s => { return ('' + Math.round(parseFloat(s))).padStart(4) },
				// 	Store = (blng, name) => {
				// 		const aa = [],
				// 			a2 = blng.asks.length,
				// 			Addaa = (a) => {
				// 				if (!aa[a]) aa[a] = { bb: [] }
				// 				if (!aa[a].bb[0]) aa[a].bb[0] = []
				// 			}

				// 		Addaa(0)
				// 		aa[0].bb[0][0] = name
				// 		for (let a = 0; a < a2; a++) {
				// 			const ask = blng.asks[a],
				// 				b2 = ask.bords.length // Math.max(ask.bords.length, 2)

				// 			Addaa(a)
				// 			aa[a].b2 = b2
				// 			aa[a].bb[0][1] = ask.typ + ':' + ask.cod + ':' + ask.num + (ask.fix ? 'F' : '') // rez[a][1]
				// 			for (let b = 0; b < b2; b++) {
				// 				const bord = ask.bords[b]
				// 				if (!aa[a].bb[b]) aa[a].bb[b] = []
				// 				if (bord) {
				// 					aa[a].bb[b][2] = bord.tag.pO5.name
				// 					aa[a].bb[b][3] = '=' + MyRound4(bord.tag.pO5.scope.pos.top) + '..' + MyRound4(bord.tag.pO5.scope.pos.bottom)
				// 				}
				// 			}
				// 		}
				// 		aa[0].bb[0][4] = '  to= ' + blng.to.name.padEnd(10) + ' ' + MyRound4(blng.to.pos.top) +
				// 			',  bo= ' + blng.bo.name.padEnd(10) + ' ' + MyRound4(blng.bo.pos.bottom)

				// 		for (let a = 0; a < a2; a++) {
				// 			const b2 = aa[a].b2
				// 			for (let b = 0; b < b2; b++) {
				// 				let s = ''
				// 				for (let j = 0; j < 5; j++)
				// 					s += (aa[a].bb[b][j] || '').padEnd(fmt[j])

				// 				if (s.trim())
				// 					console.log(lognam + s)
				// 			}
				// 		}
				// 	},
				// 	AskBounds = (aO5s, checkonly) => {
				// 		let names = ''
				// 		for (const aO5 of aO5s)
				// 			if (aO5.act.dspl)
				// 				for (const blng of [aO5.ofram, aO5.owner]) {
				// 					const ish = blng === aO5.ofram,
				// 						old = ish ? aO5.old.ofram : aO5.old.owner,
				// 						name = aO5.name + (ish ? '/H' : '/L')

				// 					if (old.to != blng.to || old.bo != blng.bo) { // показывать только для изменённых
				// 						if (checkonly)
				// 							names += (names ? ', ' : '') + name
				// 						else {
				// 							old.to = blng.to
				// 							old.bo = blng.bo
				// 							Store(blng, name)
				// 						}
				// 					}
				// 				}
				// 		return names
				// 	},
				// 	names = AskBounds(aO5s, 'checkonly')

				// if (names) {
				// 	let s = '   '
				// 	for (let j = 0; j < 5; j++)
				// 		s += (' ' + nms[j]).padEnd(fmt[j])
				// 	s += ' --> ' + names + '  (t= ' + (Date.now() - datestart) + ')'
				// 	const clr = "background: beige; color: black;border: solid 1px bisque;"
				// 	console.groupCollapsed('%c%s', clr, s)
				// 	console.groupEnd()
				// }
				// else {
				// 	let s = ''
				// 	for (const aO5 of aO5s)
				// 		s += (s ? ', ' : '') + aO5.name
				// 	console.error(`Не могу определить names в ShowBounds для "${s}"`)
				// }
			}
		},
		Utils = () => {
			const errs = []

			for (const util in utils) {
				let ok = false
				for (const nam in C.Debug)
					if (nam === util) {
						C.Debug[nam] = utils[util]
						ok = true
						break
					}
				if (!ok)
					errs.push({ nam: util, err: 'нету в C.Debug' })
			}

			for (const nam in C.Debug)
				if (nam !== 'loaded') {
					let ok = false
					for (const util in utils)
						if (nam === util) {
							ok = true
							break
						}
					if (!ok)
						errs.push({ nam: nam, err: 'нету в dbg' })
				}

			if (errs.length > 0)
				C.ConsoleError(`Проверка взаимного соответствия ф-й dbg и C.Debug`, errs.length, errs)
		}
?????

        Debug = { // тут д.б.  пустышки для всех из dbg.Utils
            loaded: false,
            errors:[],
        Error:nam=> {
            if (!errors.includes(nam)) {
                errors.push(nam)
                const err = C.Debug.loaded ? `отсутствует ф-я '${nam}' в модуле 'dbg'` :
                    `не подключен модуль 'dbg' (для вызова '${nam}')`
                console.error("%c%s", this.fmtErr, err)
            }
        },
            ShowBounds: () => Error('ShowBounds'),
        }

		C.AddModuleSub(olga5_modul, modulname, Utils)

})();
/* global document, window, console*/
/* exported olga5_menuPopDn_Click*/
/*jshint asi:true  */
/*jshint esversion: 6*/
(function () {              // ---------------------------------------------- Events ---
	'use strict'

	const
		C = window.o7.C,
		olga5_modul = "dbg",
		modulname = 'Events'

	C.AddModuleSub(olga5_modul, modulname, () => {
		const
			excls = `key*, mouse*, pointer*`.replace(/[\s\n]/g, '').split(','),
			addocevs = `DOMContentLoaded`,
			phases = ['NONE', 'CAPTURING', 'AT_TARGET', 'BUBBLING',],
			myclr = "background: aqua; color: black;",
			lognam = olga5_modul + '.' + modulname + ': ',
			// const excls = `key*, device*,pointer*, animati*,*screen*`.replace(/[\s\n]/g, '').split(','),
			docs = {},
			wins = {},
			alls = {},
			Act = (e, key) => { // сообщение о наступлении события 'e'
				if (oldT == e.timeStamp) return
				oldT = e.timeStamp
				// if (e.type == 'load')
				// console.log('1')
				const o = e.type,
					ep0 = e.target,
					id = (ep0 && ep0.id) ? ('#' + ep0.id) : '',
					name = (!ep0 || o != 'load') ? o : (o + ` (${ep0.nodeName + id})`),
					// eslint-disable-next-line no-useless-escape
					doc = document.URL.match(/\/[^\/]*$/)[0].substring(1);
				(window.opener ? window.opener : window).
					console.log('%c%s', myclr, `${lognam} ---> ` + name.padEnd(20) +

						'[ ' + (wins[o] ? 'win' : '').padEnd(3) +
						', ' + (docs[o] ? 'doc' : '').padEnd(3) + ' ] ' +
						'  ' + key.toUpperCase() + ' ' +
						' ' + e.timeStamp.toFixed(1).padEnd(6) +
						`  ${e.eventPhase}=${phases[e.eventPhase].padEnd(10)}` +
						'  ' + doc +
						``)
			},
			acts = [
				{ src: document, eves: docs, key: 'doc' },
				{ src: window, eves: wins, key: 'win' },
			]

		let // mybody = null,
			i = excls.length
		while (i-- > 0)
			if (excls[i])
				excls[i] = new RegExp('\\b' + excls[i].replaceAll('*', '.*'))

		let oldT = 0
		for (const act of acts)
			for (const nam in act.src)
				if (nam.match(/^on.*/)) {

					const o = nam.substring(2).trim(),
						all = alls[o] || { win: ' - ', doc: ' - ', exl: '', }
					let ok = true

					all[act.key] = ' ' + act.key.substring(0, 1) + ' '
					for (const e of excls)
						if (e && o.match(e)) {
							all.exl = '  ---'
							ok = false
							break
						}
					alls[o] = all

					if (ok) {
						act.eves[o] = 1
						act.src.addEventListener(o, e => { Act(e, act.key) }, { capture: true })
						// document.head.addEventListener(o, e => { Act(e, act.key) }, { capture: true })
					}
				}

		addocevs.split(',').forEach(addocev => {
			const act = acts[0],
				o = addocev.trim(),
				all = alls[o] || { win: ' - ', doc: ' + ', exl: '  +++', }
			alls[o] = all
			act.eves[o] = 1
			act.src.addEventListener(o, e => { Act(e, act.key) })
		})

		const salls = Object.keys(alls).sort().reduce( // сортированный объект
			(obj, key) => {
				obj[key] = alls[key];
				return obj
			},
			{}
		)
		// let s = `${'событие: '.padEnd(33)}  win doc искл.`
		console.groupCollapsed('обрабатываемые события')
		for (const nam in salls) {
			const all = salls[nam]
			console.log(`${nam.padEnd(33)}  ${all.win}  ${all.doc} ${all.exl}`)
		}
		console.groupEnd()
	})

})();
