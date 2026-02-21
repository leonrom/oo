
import { C } from '../index.js'

const
	clrPage = "background: green;color:white;",
	clrMy = "background: blue; color: white;border: none;",
	checkForInclude = () => {
		const incs =
			document.querySelector(`[data-o_include]`)
			|| document.querySelector(`[o_include]`)
		if (C.modules.inc) {
			if (!incs) C.ConsoleInfo(`¿ Задан модуль 'inc' но отсутствует тег с атрибутом '(data-)${W.consts.o_include}' ?`)
		}
		else
			if (incs) C.ConsoleError(`Имеется тег с атрибутом '(data-)o_include' но отсутствует модуль 'inc'`)
	},
	showIncError = n => {
		if (document.querySelector('[data-inc-error]')) return

		const el = document.createElement('div')
		el.textContent = `⚠ были ошибки,- см. log'и`
		el.title = `Есть ${n} ошибок инициализации страницы. Откройте (по F12) консоль.`
		el.setAttribute(C.myInclude, '')
		el.dataset.incError = ''
		el.style.cssText = `ы
        position:fixed;
        bottom:8px;
        left:8px;
        z-index:2147483647;
        padding:6px 10px;
        background:#222;
        color:#f5c542;
        font:12px/1.4 sans-serif;
        border-radius:4px;

		    opacity: 0.75;
    height: fit-content;
    overflow: hidden;
    border-radius: 8px;
    font-size: smaller;
    width: fit-content;
    cursor: pointer;
	position: fixed;
    `
		el.onclick = function () {
			this.remove()
		}
		document.body.append(el)
	}

let iPage = 0

export const Page = {
	hasBeenInitialized: false,
	timer: 0,
	url: '',
	reset: function () {
		clearInterval(this.timer)
		for (const name in C.modules) {
			const W = C.modules[name].mod.W
			if (W && W.reset)
				W.reset()
		}
		document.querySelectorAll(`[${C.myInclude}]`).forEach(n => n.remove())

		C.E.clearAll()

		for (const fn of C.cleanup) {
			try { fn() }
			catch (e) {
				console.error(e)
			}
		}
		C.cleanup.length = 0

		// 			Даже если DOM очищен — утечки могут быть из-за:
		// addEventListener на window/document
		// setInterval
		// MutationObserver
		// Ты уже идёшь правильным путём с close() модулей 👍
		// Туда же:
		// observer.disconnect()
		// clearInterval
		// removeEventListener

		// appendChild(node)
		// parent.append(node, 'текст')		//можно несколько аргументов
		// parent.prepend(node)
		// insertBefore
		// el.before(node)
		// el.after(node)
		// insertAdjacentElement / HTML / Tex
		// innerHTML += ...			// удаляет обработчики, ломает состояние, медленно
	},
	executeModules: function (e) {
		/** 
		 * попытка исполнить некоторые модули на загруженной странице
		 */
		const modulDone = e.detail.modul
		if (C.consts.debug) {
			console.log(`executeModules: '${e.detail.act}' модуля='${e.detail.modul}'`)
		}
		let level = C.modLevels.mi - 1, levelDone;
		while (level++ < C.modLevels.ma) {
			levelDone = true
			const modNames = C.modLevels[level]
			if (modNames)
				for (const modName of modNames) {
					const
						module = C.modules[modName]

					if (!module.mod) levelDone = false   // модуль еще не загружен	
					else {
						const W = module.mod.W
						if (W && W.init && !module.executed) {	// загружен, но еще не выполнялся
							if (C.consts.debug > 0)
								console.log('%c%s', C.consts.fmtOK, ` ${modName} `, ` - исполняется `)

							module.executed = true
							W.init()

							// // начало тестовый прогон
							// // перед snapshot - 2 раза кнопку Memory → Collect garbage 	
							// debugger;
							// let count = 133
							// const id = setInterval(
							// 	() => {
							// 		W.reset()
							// 		performance.clearResourceTimings()
							// 		W.init()
							// 		console.log(`------------------------   `, count)
							// 		if (count-- < 0) {
							// 			console.log(`перед snapshot - 2 раза кнопку Memory → Collect garbage    `)
							// 			clearInterval(id)
							// 			console.clear()
							// 			performance.clearResourceTimings()											
							// 			debugger;
							// 		}
							// 	},
							// 	900
							// )
							// // W.reset()
							// // конец тестовый прогон	
						}
					}
				}
			if (!levelDone) break	//	еще не все выполнились на этом уровне
		}
		if (levelDone)
			this._finishPage(encodeURI)
	},
	_finishPage: function (e) {
		if (e)
			console.log('%c%s', clrPage, ` Обработана страница`, this.url, ++iPage)
		else
			C.ConsoleAlert(` Обработка страницы прервана по таймеру`, this.url)
		clearInterval(this.timer)

		if (C.consoleErrs.count)
			showIncError(C.consoleErrs.count)
	},
	setNewPage: function () {
		const url = document.URL.match(/[^?&#]*/)[0].trim()
		// if (this.url && this.url !== url) {
		if (this.url !== url) {

			if (this.hasBeenInitialized)
				this.reset()

			this.hasBeenInitialized = true
			if (C.consts.debug > 0) console.log('%c%s', clrMy, " СТАРТ обработки страницы ", url)

			this.url = url
			// this.beginExecute()
			for (const name in C.modules)
				C.modules[name].executed = false

			if (C.consts.debug)
				checkForInclude()
			C.pagedef.olga = document.getElementsByClassName('olga-start')


			this.timer = window.setTimeout(() => this._finishPage(), 1000 * C.consts.timLoad)
			C.cleanup.push(() => clearInterval(this.timer))

			return true
		}
	},
	addLoaded: function (name) {
		if (C.consts.debug) {
			let s = ''
			for (const [name, module] of Object.entries(C.modules))
				if (!module.mod && name !== name)
					s += name + ', '

			console.log('%c%s', C.consts.fmtOK, `Загружен '${name}'`,
				s ? `осталось [${s}]` : ' зашружены ВСЕ')
		}

		if (document.readyState !== 'loading') {
			if (!this.hasBeenInitialized)
				this.setNewPage()

			this.executeModules({ detail: { modul: name, act: 'load' } })
		}
	},
	initPage: function () {
		if (this.setNewPage())
			this.executeModules({ detail: { act: 'init', modul: 'this.initPage' } })

		C.consoleErrs.count = 0
		return this
	}
}
