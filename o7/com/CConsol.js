let C;

// import { CMsg } from './CMsg.js'
let div, timer;
function show(text, xy, err = false) {
	const pos = xy ? xy : {
		x: window.innerWidth / 2,
		y: window.innerHeight / 2,
	}
	Object.assign(div.style, {
		backgroundColor: err ? 'greenyellow' : ' lightyellow',
		top: (pos.y - 12) + 'px',
		left: pos.x + 'px',
		display: '',
	})
}
function hide() {
	if (timer) {
		clearTimeout(timer)
		timer = 0
	}
	div.style.display = 'none'
}

const
	padd = "padding-left:0.5rem;",
	MSG = { ALERT: 'A', ERROR: 'E', SIGN: 'S', INFO: 'I' },
	clrtypes = {
		A: "background: yellow; color: black;border: solid 3px red;",
		E: "background: yellow; color: black;border: solid 1px gold;",
		S: "background: blue;   color: white;border: solid 1px bisque;",
		I: "background: beige;  color: black;border: solid 1px bisque;",
	},
	// consoleErrs = { count: 0 },
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
	ConsoleMsg = (type, text, add, tab) => {
		const clr1 = clrtypes[type]

		if (add == null || add === '') console.groupCollapsed('%c%s', padd + clr1, text)
		else
			console.groupCollapsed('%c%s', padd + clr1, text, String(add))

		if (tab)
			console.table(tab)
		// if (tab) {
		// 	const rows = normalizeTab(tab)
		// 	if (rows.length) console.table(rows)
		// }

		// вложенная трассировка
		console.groupCollapsed('трассировка вызова')
		console.trace()
		console.groupEnd()

		console.groupEnd()

		// if (type === MSG.ERROR || type === MSG.ALERT)
		// 	consoleErrs.count++
	},
	displayMsg = (text, add, tab, err = false, xy, duration = 2222) => {
		if (!div) {
			div = document.createElement('div')
			Object.assign(div.style, {
				boxShadow: 'rgba(0, 0, 0, 0.3) 0px 2px 6px',
				border: '1px solid rgb(204, 204, 204)',
				transform: 'translateX(-50%)',
				fontFamily: 'sans-serif',
				borderRadius: '5px',
				padding: '10px 20px',
				position: 'fixed',
				color: 'black',
				zIndex: 9999,
				display: 'none',
				maxWidth: '60%',
				fontSize: '14px',
				whiteSpace: 'pre-line',
			})
			div.addEventListener('click', hide)

			document.body.appendChild(div)
		}
		ConsoleMsg(err ? MSG.ERROR : MSG.INFO, text, add, tab)
		// console.log("%c%s", C.consts[err ? 'fmtErr' : 'fmtOK'], text, add)

		div.textContent = text + '\n(см. console.log)'
		timer = setTimeout(hide, duration)
		show(text, xy, err)

		C.cleanup.push(() => {
			if (timer){
			clearTimeout(timer)}
			div.removeEventListener('click', hide)
			div.remove()
			div = null
		})
	}

export function CConsol(c) {
	// C.consoleErrs = consoleErrs
	C = c
	C.ConsoleAlert = (text, add, tab) => {
		ConsoleMsg(MSG.ALERT, text, add, tab)
		debugger
	}
	C.ConsoleError = (text, add, tab) => {
		// ConsoleMsg(MSG.ERROR, text, add, tab)
		C.DisplayErrMsg(text, add, tab)
	}
	C.ConsoleSign = (text, add, tab) => ConsoleMsg(MSG.SIGN, text, add, tab)
	C.ConsoleInfo = (text, add, tab) => ConsoleMsg(MSG.INFO, text, add, tab)
	C.DisplayLogMsg = (text, add, tab) => {
		displayMsg(text, add, false, 0, 3222)
	}
	C.DisplayErrMsg = (text, add, tab) => {
		displayMsg(text, add, tab, true, 0, 3222)
	}
} 