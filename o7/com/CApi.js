/* global document, window, console*/
/* exported olga_menuPopDn_Click*/
/*jshint asi:true  */
/*jshint esversion: 6*/

const
	getForName = (parent, typ, name) => {
		switch (typ) {
			case 'myclass':
				const
					tags = parent.querySelectorAll(`[class*="${name}"]`),
					list = []
				if (tags)
					for (const tag of tags)
						if (Array.from(tag.classList).find(cls =>
							cls === name || cls.startsWith(`${name}:`)
						))
							list.push(tag)
				return list
			case 'class': return parent.getElementsByClassName(name)
			case 'node': return parent.getElementsByTagName(name)
		}
		throw new Error(`Неопределен тип '${typ}' для выборки name='${name}'`)
		return []
	},
	csslist = {}, // перечень наименований создаваемых классов
	fillCss = W => {
		const css = W.makeCss ? W.makeCss() : ''

		if (!css)
			return

		const
			chs = document.head.children,
			clasn = 'olga-' + W.modul,
			id = clasn + '_internal'

		csslist[clasn] = css

		for (const ch of chs)
			if (ch.nodeName == "STYLE" && ch.id == id) {
				C.ConsoleError(head, `стиль id='${id}' для модуль: '${W.modul}' (класс: '${clasn}) уже определён в документе`)
				return
			}

		const styl = document.createElement('style')
		styl.setAttribute('type', 'text/css')
		styl.id = id

		const moeCSS = document.head.appendChild(styl)
		moeCSS.innerHTML = css.replace(/(\/\/.*($|\n))|(\s*($|\n))/g, '\n')
		// (\/\/.*$)           мои коменты '//' до конца строки
		// (\/\*(.|\s)*?\*\/)  стандартные коменты (проверить!!! поему-то переносит строки правил)
		// (\s*$)              пустое до конца строки       
		return true
	}

export function CApi(C) {
	C.extractClassAttr = (tag, clasn) => {
		/**
		 * Поиск класса, начинающегося с clasn и его парсинг на quals и ori которые м.б. пустыми
		 * 
		 * quals начинается после первого (необязательного) ':' и до конца строки или следующего ':'		 
		 *       и может содержать только цифры и латинские букы
		 * ori начинается после второго (необязательного) ':'
		 *     и может содержать любэ
		 */
		for (const cls of tag.classList)
			// if (cls.startsWith(clasn)) {
			if (cls === clasn || cls.startsWith(clasn + ':')) {
				let quals = '', ori = ''
				// if (cls !== clasn) {
				const
					i1 = cls.indexOf(':'),
					i2 = cls.indexOf(':', i1 + 1)
				// if (i1 < 0 || i1 > clasn.length) // не моё: за clasn есть еще символы
				// 	continue

				tag.classList.remove(cls)
				tag.classList.add(clasn)

				if (i2 < 0)
					quals = cls.slice(i1 + 1)
				else {
					quals = cls.slice(i1 + 1, i2)
					ori = cls.slice(i2 + 1)
				}
				const name = C.getObjName(tag)
				if (quals.includes('#'))
					tag.classList.add('o-none')

				if (tag.classList.contains('o-none')) {
					C.ConsoleInfo(`'${name}' - тег игнорируется`, ` имеется класс 'o-none' или в квалификаторе '#' - "${cls}"`)
					return null
				}
				else {
					if (!/^[A-Za-z0-9-]*$/.test(quals))
						C.ConsoleError(`У '${name}' квалификатор содержит символ не из [A-Za-z0-9-]`, `  в "${cls}"`)

					return { quals, ori, cls }
				}
			}
	}
	C.shmPush = (arr, obj, shm) => {
		arr.push(Object.freeze(
			Object.assign(shm ? Object.seal({ ...shm }) : {}, obj)
		))
	}
	C.pagedef = { olga: null },        // описание загруженной страницы	
		C.makeForTypName = (make, typ, name, only1) => {
			const olga = C.pagedef.olga ??= document.getElementsByClassName('olga-start')
			if (olga?.length) {	// если есть — ищем только внутри них
				for (let r = 0; r < olga.length; r++) {
					const list = getForName(olga[r], typ, name)
					for (let i = 0; i < list.length; i++) {
						make(list[i])
						if (only1)
							return
					}
				}
			}
			else {
				const list = getForName(document, typ, name)
				for (let i = 0; i < list.length; i++) {
					make(list[i])
					if (only1)
						return
				}
			}
		}
	C.getObjName = function (obj, len) { // моё формирование имени объекта
		if (obj) {
			const nam = Object.is(obj, window) ? '#window' : (
				Object.is(obj, document) ? '#document' : (
					// (obj.id && obj.id.length > 0) ? ('#' + obj.id) : (
					(obj.id && obj.id.length > 0) ? obj.id : (
						(obj.tagName ? obj.tagName : '?') + '.' + obj.className.replace(/\s+/, '.')
					)
				))
			return nam.padEnd(len ? len : 0);
		}
		else
			return 'null';
	}

	C.p_ref = '_ref'
	C.propagate = function (tag, aO7, key, old) {
		// Проблема: если делаю для tag1 и tag2 (и tag3, tag4) а tag2 вложен в  tag1 то 
		// требуется чтобы всё, что в tag2 - ссылалось на его aO7, а то, 
		// что выше и до tag1 (включительно) ссылалось на aO7 от tag1.

		// Причем propagate хочу делать по мере создания aO7 для тега, 
		// т.е. когда еще неизвестно, есть там еще вложенные, или нет. 
		// Если сначала сделать для tag1 а потом для tag2 - нет проблем. 
		// А вот если наоборот? - надо чтобы tag1 не полез дальше!

		// // вызов
		// const 
		//     key = 'aO7shp',
		//     old = tag[key+'_ref'] ?? null    // вначале там undefined, но потом м.б. null
		// C.propagate(tag, tag[key], key, old)

		tag[key + C.p_ref] = aO7
		for (const ch of tag.children)
			if ((ch[key + C.p_ref] ?? null) === old)
				C.propagate(ch, aO7, key, old)
	}

	// C.getAttrs = attributes => {
	// 	const attrs = {}
	// 	for (const attribute of attributes)
	// 		attrs[attribute.name] = C.tryToDigit(attribute.value)
	// 	// attrs[C.Repname(attribute.name)] = C.tryToDigit(attribute.value)
	// 	return attrs
	// }
	C.fillW = (W, name) => {
		if (!W) {
			if (C.consts.debug)
				console.log('%c%s', C.consts.fmtErr, ` ${name} `, ` для модуля не задан 'W'`)
			return
		}
		if (!name)
			name = W.modul
		if (W.modul !== name) {
			C.ConsoleError(`Имя модуля '${name}' не совпадает с W.modul='${W.modul ? W.modul : 'не определена'}'`, `взято '${name}'`)
		}
		if (W.act?.auto >= 0) {
			console.error('%c%s', C.consts.fmtErr, `модуль '${name}' `,
				`уже был  запущен ${W.act.auto ? 'автономно' : 'в составе библиотеки'}`)
			return
		}

		if (C.consts.debug > 1)
			console.log(`Регистрируется модуль '${name}'`)

		if (W.consts) {
			// копируем значения заданных констант из корневого модуля
			for (const [key, val] of Object.entries(C.consts))
				if (C.isDefined(W.consts[key]))
					W.consts[key] = val

			Object.freeze(W.consts)
		}

		if (W.prepare)
			W.prepare(C)

		const
			head = `>>  СОЗДАНИЕ '${name}'`,
			clasn = 'olga-' + name

		if (C.isDefined(csslist[clasn])) 	// т.е. класс уже был создан
			console.error('%c%s', C.consts.fmtErr, head, `классы уже были созданы`)
		else
			if (fillCss(W))
				if (C.consts.debug > 1)
					console.log('%c%s', C.consts.fmtOK, head, `(для модуля ${name}) '`)

		return true
	}
	C.ASSERT = (cond, msg, ctx) => {
		if (!cond) {
			console.error(
				'%cASSERT FAILED:%c ' + msg,
				'color:red;font-weight:bold',
				'color:inherit',
				ctx ?? ''
			)
			debugger   // ← очень полезно
			throw new Error(msg)
		}
	}
}