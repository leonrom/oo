/* global document, window, console*/
/* exported o-menuPopDn_Click*/
/*jshint asi:true  */
/*jshint esversion: 6*/

let C;

const
	// const phases = ['NONE', 'CAPTURING_PHASE', 'AT_TARGET', 'BUBBLING_PHASE',]
	state = { target: '_self', resize: true, scrollX: 0, scrollY: -18, }, // blockclick: false, timclick: 0 },	
	clasn = 'olga-' + W.modul,
	Target = e => {
		const t = e.target.closest('li')
		return t && t.o_menus ? t : null
	},
	OnMnu = function (e) {
		const target = Target(e)
		if (target && !target.o_menus.ready) target.o_menus.ready = true
	},
	GoTo = function (o_menus) {
		const tag = document.getElementById(o_menus.ref)
		if (tag) {
			tag.scrollIntoView({ block: o_menus.block, behavior: "smooth" })
			return true
		} else
			C.ConsoleError("GoTo: не определён тег в текущем окне: ", o_menus.ref)
	},
	DoMnu = e => {
		if (debug)
			console.log('DoMnu: ' + e.type + ' ' + e.eventPhase + ' ' + e.timeStamp.toFixed(1).padEnd(6))
		const target = Target(e)
		if (target && target.o_menus.ready) {
			const o_menus = target.o_menus
			o_menus.ready = false

			let ok = true
			if (o_menus.isext) window.open(o_menus.ref, state.target)
			else
				ok = GoTo(o_menus)

			if (ok && state.resize) {
				if (window.o7.shp)
					window.o7.shp.Bords.InitAllBords(0)
			}
			state.blockclick = true
			e.cancelBubble = true
		}
	},
	Clear = e => {
		if (C.consts.debug)
			console.log('Clear: ' + e.type + ' ' + e.eventPhase + ' ' + e.timeStamp.toFixed(1).padEnd(6) +
				' ' + (state.blockclick ? 'очищаю' : ''))
		if (state.blockclick) {
			state.blockclick = false
			e.cancelBubble = true
		}
		// // state.timclick = e.timeStamp
		// e.cancelBubble = true
	},
	MnuInit = function (items) {
		if (C.consts.nomnu) return

		const proc = 'MnuInit',
			errs = []
		if (!items || !items[0]) errs.push(`${proc}: не определеныа структура меню`)
		if (errs.length == 0) {
			const uls = [],
				item0 = items[0],
				base = item0.base || ''

			const id = item0.id || ''
			if (id && document.getElementById(id)) errs.push(`${proc}: повтор создания меню с id='${id}'`)

			if (item0.target) {
				state.target = item0.target
				state.resize = false
			}
			const scrollY = C.consts.scrollY
			if (scrollY) state.scrollY = parseInt(scrollY)

			let ul = document.createElement("ul")

			ul.id = id
			ul.className = clasn
			if (item0.right) ul.style.right = item0.right
			else if (item0.left) {
				ul.style.left = item0.left
				ul.classList.add('Left')
			}
			if (item0.top) ul.style.top = item0.top

			let owner = document.body
			if (item0.owner) {
				if (typeof item0.owner === 'object') owner = item0.owner
				else {
					const own = item0.owner.trim(),
						xwner = (!own || own.match(/\.body\b/)) ? document.body : document.querySelector(own)

					if (xwner) owner = xwner
					else
						C.ConsoleError(`${proc}: нет owner'а для '${own}'`)
				}
			}
			if (item0.position) ul.style.position = item0.position
			else if (!item0.owner) ul.style.position = 'fixed'
			else ul.style.position = 'absolute'

			if (ul.style.position == 'absolute') {
				const nst = window.getComputedStyle(owner),
					position = nst.getPropertyValue('position')
				if (position != 'absolute')
					C.ConsoleError(`${proc}: контейнер ${C.getObjName(owner)} для меню '${C.getObjName(ul)}' имеет position='${position}' (не ''absolute)`)
			}

			ul.setAttribute(C.myInclude, '1')
			if (item0.noremov) owner.insertBefore(ul, owner.firstChild)  // НЕ удаляется по закрытии страницы (owner.appendChild(ul))				
			else
				owner.insertBefore(ul, owner.firstChild)
			// C.page.InsertBefore(owner, ul, owner.firstChild)

			// C.E.AddEventListener(ul, 'mousedown', DoMnu, true)
			ul.addEventListener( 'click', DoMnu, true)
			windowa.ddEventListener( 'click', Clear)

			uls[0] = ul
			const blc = (item0.block || 's')[0].toLowerCase(),
				block = blc == 's' ? 'start' : (blc == 'e' ? 'end' : (blc == 'n' ? 'nearesr' : 'center'))

			let m = 0
			for (const item of items) {
				const li = document.createElement('li')

				// li.addEventListener('click', Clear, true) 
				li.style.zIndex = 99999
				li.o_menus = { isext: true, block: block }
				if (item.ref) {
					const ref = item.ref || '',
						wl = window.location
					if (ref.length == 0) li.o_menus.ref = wl.origin + wl.pathname
					else if (C.getFullUrl(ref)) li.o_menus.ref = ref // (ref.match(/^\s*(https?:)\/\//)) li.o_menus.ref = ref
					else if (ref.match(/\.html?($|\?|&|#)/)) li.o_menus.ref = base + ref
					else {
						li.o_menus.ref = ref.startsWith('#') ? ref.substr(1) : ref
						li.o_menus.isext = false
					}
				}

				if (item.title) li.title = item.title
				if (item.class) li.classList.add(item.class)
				if (item.style) li.style = item.style

				if (m == 0)
					li.onmouseover = OnMnu

				ul.appendChild(li)

				if (item.span && item.span != '') {
					const span = document.createElement('span')
					span.innerText = item.span
					li.appendChild(span)
				} else
					li.classList.add(W.clsEmpty)

				if (item.add) {
					ul = document.createElement("ul")
					ul.style.width = item.add
					li.appendChild(ul)
					uls[++m] = ul
				} else if (item.ret) {
					m = m - item.ret
					if (m < 0) {
						errs.push('m: item.ret=' + item.ret + ', ')
						m = 0
					}
					ul = uls[m]
				}
			}
		}
		if (errs.length > 0)
			C.ConsoleError("${proc}: ошибки создания меню: ", errs.length, errs)
	},
	InitByText = (menu, txt) => {// если есть такой атрибут}
		if (C.consts.debug)
			console.log('mnu\n', menu)
		// const items1 = JSON.parse(`[${menu}]`)
		const regval = /^["'`;{\s]*|["'`},\s]*$/g,
			lis = menu.match(/{[^}]*}/g) || [],
			items = [],
			errs = []

		for (const li of lis) {
			const pairs = li.match(/[^,]+(,|})/g),
				item = {}
			for (const pair of pairs) {
				try {
					const i = pair.indexOf(':'),
						nam = pair.substr(0, i).replaceAll(regval, ''),
						val = pair.substr(i + 1).replaceAll(regval, '')
					item[nam] = val
				} catch (err) {
					errs.push({ li: li, pair: pair, err: err.message })
				}
			}
			items.push(item)
		}
		// console.log('items\n',items)
		// console.log('items1\n',items1)

		MnuInit(items)
		return errs
	}

export const W = {
	needs: { o_menudef: 'o_menudef', },
	modul: 'mnu',
	makeCss: () => `
		.${clasn} {
		    margin: 0 !important;
		    padding: 0 !important;
		    font-size: small;
		    height: min-content;
		    width: max-content;
		    z-index: 1111111;
		    top: 1px;
		    right: 1px;
		    position: unset; /* будут присвоено ниже */
		    display: initial; 
		}
		.${clasn}.Left {left: 1px; right:''}

		.${clasn} ul {
		    margin: 0;
		    padding: 0;
		    border-radius: 2px;
		    display: grid;    /* иначе переносит строки последующего пункта при открытии подменю */
		}

		.${clasn} li {
		    display: block;
		    color: white;
		    background: gray;
		    height: 1.5em;
		    text-align: left;
			text-align: -webkit-left;
			text-align: -moz-left;
		    border-bottom: 0.01em solid lightseagreen;
		    padding: 1px 5px 1px 2px;
		    cursor: pointer;
		    font-family: sans-serif;
		    font-size: small;
		    margin-bottom: 0 !important;
		    padding-top: 0 !important;
		    padding-bottom: 0 !important;
		}

		.${clasn} li>ul {
		    position: absolute;
		    top: unset;
		    display: none;
		    padding: 0;
		    margin: 0;
		    border: 1px solid darkgrey;
		    outline: 1px solid white;
		    float: right;
		}
		.${clasn}.Left li>ul {float: left;}

		.${clasn}>li {
		    background-color: white;
		    border: none;
		    border-radius: 8px;
		    background-color: transparent;	
			text-align: right;
			text-align: -moz-right;
			text-align: -webkit-right;
			// text-align: -moz-left;
		}

		.${clasn}.Left>li {
		    text-align: left;
			text-align: -webkit-left;
			text-align: -moz-left;
		}

		.${clasn}>li>ul {
		    outline: 1px solid bisque;
		    top: 0.5em;
		    position: relative;
		    right: 0.1em;
		}

		.${clasn}>li>ul {left: 0.1em;}
		.${clasn}>li>ul>li>ul { right: 3.1em; margin-top: -4px;}
		.${clasn}>li>ul>li>ul>li>ul { right: 6.1em; margin-top: -3px;}
		.${clasn}>li>ul>li>ul>li>ul>li>ul { right: 9.1em; margin-top: -3px;}
		.${clasn}>li>ul>li>ul>li>ul>li>ul>li>ul { right: 12.1em; margin-top: -3px;}
		.${clasn}.Left>li>ul {left: 0.1em;}
		.${clasn}.Left>li>ul>li>ul { left: 3.1em; margin-top: -4px;}
		.${clasn}.Left>li>ul>li>ul>li>ul {left: 6.1em; margin-top: -3px;}
		.${clasn}.Left>li>ul>li>ul>li>ul>li>ul {left: 9.1em; margin-top: -3px;}
		.${clasn}.Left>li>ul>li>ul>li>ul>li>ul>li>ul {left: 12.1em; margin-top: -3px;}

		.${clasn} li>span {
		    display: flex;
		    padding-left: 6px;
		    height: 100%;
		    align-items: center;
		    width: max-content;
		    justify-content: flex-start;
		    overflow: hidden;
		}

		.${clasn}>li>span {
		    border: 1px solid darkgray;
		    border-radius: 8px;
		    color: black;
		    background-color: yellow;
		    padding: 3px 4px 2px 4px;
		    justify-content: center;
		    height: min-content;
			// width: -moz-min-content;
			width: fit-content;
		}

		.${clasn} li:hover {
		    color: black;
		    background-color: lavender;
		}

		.${clasn}>li:hover {
		    background: transparent;
		    height: 3em;
		}

		.${clasn}>li:hover>span {
		    color: white;
		    background: gray;
		    border: 0.01em solid lightseagreen;
		    padding-bottom: 4px;
		}

		.${clasn} li:hover>ul,
		.${clasn} li>ul:hover {
		    display: block;
		}

		.${clasn} li:active>ul {    /* для корректного "гашения" - д.б. ПОСЛЕДНИМ ! */
		    display: none;
		}
		.main-outer {
		    background-color: ghostwhite;
		    border: 1px solid navajowhite;
		}

		.${clasn}.${W.clsEmpty} {
		    height: 2px ! important;
		    background-color: aqua ! important;
		}
	`,
	prepare: (c) => {
		C = c
		C.ConsoleInfo(`Mnu prepare: ${C.consts.nomnu ? 'отключено (по nomnu)' : 'включено'} `)
	},
	init: () => {
		const o_menudef = W.consts.o_menudef
		let errs;
		if (C.dataset[o_menudef])	// если есть такой атрибут}
			errs = InitByText(C.dataset[o_menudef], `атрибут 'data-${o_menudef}'`)
		else
			// C.makeByClassName(o_menudef,
			C.makeForTypName(tag => {
				errs = InitByText(tag.innerText.trim(), `тег с классом '${o_menudef}'`)
			},
				'class', o_menudef, '1 раз'
			)

		if (errs?.length > 0)
			C.ConsoleError(`Init: ошибки в строках атрибута '${o_menudef}': `, errs.length, errs)
	},
	finish: function () {
		const errs = I.getErrs()
		if (errs)
			C.ConsoleError(`'inc' - загрузка окончена с ошибками:`, errs)
		else
			if (C.consts.debug)
				console.log('%c%s', C.consts.fmtOK, `'inc' - загрузки окончены: `, I.listIncls())

		_clear()

		window.dispatchEvent(new CustomEvent(C.E.o_done, { detail: { module: W.modul, err: errs } }))
	},
	// ----------------------------
	reset: () => {
		I.abortLoads()
		_clear()

		if (C.consts.debug)
			console.log('%c%s', C.consts.fmtOK, `'inc' - загрузка прервана новым запуском`)

		T.removeInserts()
	},
}
