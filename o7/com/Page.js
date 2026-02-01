
import { C } from '../index.js'

const
	clrPage = "background: green;color:white;",
	clrMy = "background: blue; color: white;border: none;",
	checkForInclude = () => {
		const incs = document.querySelector('[o_include]')
		if (C.modules.inc) {
			if (!incs) C.ConsoleInfo(`¿ Задан модуль 'inc' но отсутствует тег с атрибутом 'o_include' ?`)
		}
		else
			if (incs) C.ConsoleError(`Имеется тег с атрибутом 'o_include' но отсутствует модуль 'inc'`)
	}

class Page {
	hasBeenInitialized = false
	timer = 0
	url = ''
	constructor() {
		this.clear = function () {
			clearInterval(this.timer)
			for (const name in C.modules) {
				const W = C.modules[name].mod.W
				if (W && W.clear)
					W.clear()
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
		}

		this.executeModules = function () {
			/** 
			 * попытка исполнить некоторые модули на загруженной странице
			 */
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
							if (W && W.execute && !module.executed) {	// загружен, но еще не выполнялся
								if (C.consts.debug > 0)
									console.log('%c%s', C.consts.fmtOK, ` ${modName} `, ` - исполняется `)

								module.executed = true
								W.execute()
							}
						}
					}
				if (!levelDone) break	//	еще не все выполнились на этом уровне
			}
			if (levelDone)
				this.finishPage(true)
		}
		this.finishPage = function (ok) {
			if (ok)
				console.log('%c%s', clrPage, ` Обработана страница`, this.url)
			else
				console.error('%c%s', C.consts.fmtErr, ` Обработка страницы прервана по таймеру`, this.url)
			clearInterval(this.timer)

		}
		this.setNewPage = function () {
			const url = document.URL.match(/[^?&#]*/)[0].trim()
			// if (this.url && this.url !== url) {
			if (this.url !== url) {

				if (this.hasBeenInitialized)
					this.clear()

				this.hasBeenInitialized = true
				if (C.consts.debug > 0) console.log('%c%s', clrMy, " СТАРТ обработки страницы ", url)

				this.url = url
				// this.beginExecute()
				for (const name in C.modules)
					C.modules[name].executed = false
				checkForInclude()
				// this.timer = window.setTimeout(finishPage, 1000 * C.consts.timLoad, this, true)
				this.timer = window.setTimeout(() => this.finishPage(), 1000 * C.consts.timLoad)
				C.cleanup.push(() => clearInterval(this.timer))

				return true
			}
		}

		this.addLoaded = function (e) {
			if (C.consts.debug) {
				let s = ''
				for (const [name, module] of Object.entries(C.modules))
					if (!module.mod && name !== e.detail.name)
						s += name + ', '

				console.log('%c%s', C.consts.fmtOK, `Загружен '${e.detail.name}'`,
					s ? `осталось [${s}]` : ' зашружены ВСЕ')
			}

			if (document.readyState !== 'loading') {
				if (!this.hasBeenInitialized)
					this.setNewPage()

				this.executeModules()
			}
		}

		this.initPage = function () {
			if (this.setNewPage())
				this.executeModules()
			return this
		}
	}
}

export const page = new Page()