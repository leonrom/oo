/* global  window, console, Map, NamedNodeMap*/
/* exported olga_menuPopDn_Click*/
/*jshint asi:true  */
/*jshint esversion: 6*/
/**
 * расширение логирования
 */
import { C } from '../index.js'

const
	padd = "padding-left:0.5rem;",
	MSG = { ALERT: 'A', ERROR: 'E', SIGN: 'S', INFO: 'I' },
	clrtypes = {
		A: "background: yellow; color: black;border: solid 3px red;",
		E: "background: yellow; color: black;border: solid 1px gold;",
		S: "background: blue;   color: white;border: solid 1px bisque;",
		I: "background: beige;  color: black;border: solid 1px bisque;",
	},
	normalizeTab = tab => {
		const rows = []

		const toStr = o => {
			if (o instanceof NamedNodeMap)
				return [...o].map(a => `${a.name}=${a.value}`).join(',')
			if (o instanceof Map)
				return [...o].map(([k, v]) => `${k}:${v}`).join(', ')
			if (Array.isArray(o))
				return o.join(', ')
			if (o && typeof o === 'object')
				return Object.keys(o).map(k => `${k}=${o[k]}`).join(', ')
			if (o == null) return '`null`'
			if (typeof o === 'undefined') return '`undef`'
			return o.toString()
		}

		if (tab instanceof Map) {
			tab.forEach((v, k) => {
				rows.push({ nam: k, val: toStr(v) })
			})
			return rows
		}

		if (Array.isArray(tab)) {
			tab.forEach((v, i) => {
				rows.push({ nam: i, val: toStr(v) })
			})
			return rows
		}

		if (tab && typeof tab === 'object') {
			for (const k in tab) {
				if (typeof tab[k] !== 'function')
					rows.push({ nam: k, val: toStr(tab[k]) })
			}
		}

		return rows
	},
	ConsoleMsg = (type, txt, add, tab) => {
		const clr1 = clrtypes[type]
		// const clr2 = "margin-left:0.4rem; background: white; color: black; border: solid 1px bisque;"

		if (add == null || add === '')
			console.groupCollapsed('%c%s', padd + clr1, txt)
		else
			console.groupCollapsed('%c%s', padd + clr1, txt, String(add))
		// console.groupCollapsed('%c%s%c%s', padd + clr1, txt, padd + clr2, String(add))

		if (tab) {
			const rows = normalizeTab(tab)
			if (rows.length) console.table(rows)
		}

		{	// вложенная трассировка
			console.groupCollapsed('трассировка вызова')
			console.trace()
			console.groupEnd()
		}
		console.groupEnd()

		if (type === MSG.ERROR || type === MSG.ALERT)
			C.consoleErrs.count++
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

		console.log("%c%s", fmt, head, text, add || '')

		if (err) {
			const div = document.createElement('div')
			Object.assign(div.style, {
				top: (pos.y - 12) + 'px',
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

			const timer = setTimeout(() => { div.remove(); }, duration)
			C.cleanup.push(() => clearInterval(timer))
		}
	}

export function CConsol() {
	Object.assign(C, {
		consoleErrs: { count: 0 },
		ConsoleAlert: (txt, add, tab) => ConsoleMsg(MSG.ALERT, txt, add, tab),
		ConsoleError: (txt, add, tab) => ConsoleMsg(MSG.ERROR, txt, add, tab),
		ConsoleSign: (txt, add, tab) => ConsoleMsg(MSG.SIGN, txt, add, tab),
		ConsoleInfo: (txt, add, tab) => ConsoleMsg(MSG.INFO, txt, add, tab),
		ConsoleLog: (head, text, err, xy, add) => ConsoleLog(head, text, err, xy, add),
	})
	return true
} 