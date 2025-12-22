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
		C = window.olga5.C,
		padd = "padding-left:0.5rem;",
		clrtypes = {
			'A': "background: yellow; color: black;border: solid 3px red;",
			'E': "background: yellow; color: black;border: solid 1px gold;",
			'S': "background: blue;   color: white;border: solid 1px bisque;",
			'I': "background: beige;  color: black;border: solid 1px bisque;",
		},
		TableNoIndex = data => {
			if (!Array.isArray(data)) {
				console.table(data);
				return;
			}

			const keys = Object.keys(data[0] || {});
			const header = keys.join('\t');
			console.log(header);
			for (const row of data) {
				console.log(keys.map(k => row[k]).join('\t'));
			}
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
					// TableNoIndex(tt)
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

	C.ModulAddSub(olga5_modul, modulname, () => {
		Object.assign(C, {
			ConsoleMsg: ConsoleMsg,
			ConsoleAlert: (txt, add, tab) => ConsoleMsg('alert', txt, add, tab),
			ConsoleError: (txt, add, tab) => ConsoleMsg('error', txt, add, tab),
			ConsoleSign: (txt, add, tab) => ConsoleMsg('sign', txt, add, tab),
			ConsoleInfo: (txt, add, tab) => ConsoleMsg('info', txt, add, tab),
			ConsoleLog: (head, text, err, xy, add) => ConsoleLog(head, text, err, xy, add),
		})
		return true
	}
	)
})();
