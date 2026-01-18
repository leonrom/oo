/**
 * обработка ссылок на аудио
 *
 * Подключение аудио к любым тегамстраницы
 * Синхронизация звучания
 * Визуализация звучания иконками и/или миганием на тегах
 *
 * @exports C
 */

import { C } from '../index.js'
import { AO5snd } from './AO5snd.js'
import { prepAudio } from './Prep.js'
import { prepareImgs } from './Imgs.js'
export const C = {}

export function init() {
  C.log('snd:init')

  prepareImgs()
  prepAudio()

  return AO5snd.init?.()
}
