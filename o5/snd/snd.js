/**
 * обработка ссылок на аудио
 *
 * Подключение аудио к любым тегамстраницы
 * Синхронизация звучания
 * Визуализация звучания иконками и/или миганием на тегах
 *
 * @exports C
 */

// import { C } from '../index.js'
// import { AO5snd } from './AO5snd.js'
import { Prep } from './Prep.js'

export function init(C) {

  Prep.init(C)

		if (C.consts.debug)
console.log(`Загружен 'snd'`)
}
