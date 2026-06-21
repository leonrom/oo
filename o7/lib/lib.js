/**
 * lib.js
 * 
 * Подключение модулей как компонентов библиотеки
 * Архитектура: scheduler driven by state transitions
 * 
 * Инициирует загрузку модулей-скриптов библиотеки
 * Запускает котроль обновления страницы
 * Очищает (а зачем?) память перед выгрузкой
 */

import { Prep } from './Prep.js'
import { Page } from './Page.js'
import { Mods } from './Mods.js'

const actEvents = act => {
	const namf = act ? 'addEventListener' : 'removeEventListener'

	// варианты событий обновления странницы
	for (const eve of ['DOMContentLoaded', 'readystatechange', 'visibilitychange', 'blur'])
		document[namf](eve, Page.setNewPage)

	window[namf]('o_done', Page.markDone)
}

let C;

export const lib = {
	reset: function () {
		Prep.reset()
		document.querySelectorAll(`[${C.myInclude}]`).forEach(n => n.remove())

		for (const fn of C.cleanup) {
			try { fn() }
			catch (e) {
				console.error(e)
			}
		}
		C.cleanup.length = 0
		actEvents(false)
	},

	prepare: function (c) {
		C = c

		Mods.prepare(C)
		Page.prepare(C)
		Prep.prepare(C)

		if (document.readyState !== 'loading')
			Page.setNewPage()

		actEvents(true)
	}
}
