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
import { Eve } from './Eve.js'
import { AO7 } from './AO7.js'
import { Init } from './Init.js'
import { Imgs } from './Imgs.js'

const
	hasProperty = (foo, nam) => {
		'use strict'
		return Object.prototype.hasOwnProperty.call(foo, nam)
		// return  foo.hasOwnProperty(nam)
	},
	getAttribute = (attrs, name) => { // нахождение значения 'attr' в массиве атрибутов 'attrs'
		for (const nam of [name, 'data-' + name, '_' + name])
			if (hasProperty(attrs, nam)) return attrs[nam]
	}

export const W = {
	needs: {
		shift_speed: 0.5, // при Shift - замедлять вдвое;
		return_time: 0.3, // при возобновлении "отмотать" 0.3 сек ;
		btn_play: '',
		btn_stop: '',
	},
	act: Object.seal({
		audio: null,
		ready: false,
		errs: [],
		found: [],
		urlattrs: [],
	}),
	state: Object.freeze({ stop: 'stop', play: 'play', pause: 'pause' }),
	prepare: function () {
		const shm = { name: '?', ref: '', url: '', ori: '' },
		err={name: '?', 'источник': '?', 'пояснение': '', val: '', 'ошибка': '' }

		this.act.errs.Push = function (obj) { C.shmPush(this, obj, shm) }
		this.act.found.Push = function (obj) { C.shmPush(this, obj, shm) }
		this.act.urlattrs.Push = function (obj) { C.shmPush(this, obj, shm) }
		Init.prepare()
	},
	execute: function () {
		this.erase()

		C.makeForTypName(tag => Init.initByClass(tag), 'myclass', this.clasn)
		C.makeForTypName(tag => Init.initForAudio(tag), 'node', 'audio')

		const act = this.act
		if (act.found.length) {
			if (act.errs.length > 0)
				C.ConsoleError(`${W.modul}: ошибки перекодировки тегов с ${W.clasn}`, act.errs.length, act.errs)
			// console.table(act.errs)

			C.ConsoleInfo(`Найдены snd/audio `, act.found.length, act.found)
			// if (C.consts.debug > 0) {
			// 	if (act.urlattrs.length)
			// 		C.ConsoleInfo(`и  выполнены подстановки snd/audio`, act.urlattrs.length, act.urlattrs)
			// }
Eve.waitForStop()
		} else
			console.log("%c%s", W.consts.fmtErr, `Нет объектов с class='${W.clasn}' или тегов <audio>`,
				`в документе или в его тегах с 'olga-start' (либо вообще, либо без 'o-none' и ':N')`)
	},
	finish: function () {
		window.dispatchEvent(new CustomEvent(C.E.o_done, { detail: { modul: W.modul, act: 'done' } }))
	},
	erase: function () {
		const act = this.act
		Object.assign(act, { audio: null, ready: false })
		act.urlattrs.length = 0
		act.found.length = 0
		act.errs.length = 0
		
		Eve.stopForStop()

		Imgs.clear()
		AO7.clear()
	},
	// ----------------------------

	clsError: `sndError`, clsLoad: `sndLoad`, clsPause: `sndPause`,
	clsPlay: `sndPlay`, clsNone: `sndNone`, olga5freeimg: `freeimg`,
	makeCss: () => `
		.${W.clasn}:not(.${W.clsNone}) {
			cursor: pointer;
		}
		.${W.clasn}.${W.clsPlay} {
			cursor: progress;
			animation: o-viewTextWash 5s infinite linear;
		}
		.${W.clasn}.${W.clsPause} {
			cursor: wait;
			animation: none;
		}
		.${W.clasn}.${W.clsError} {
			opacity: 0.5;
			outline: 2px dotted black;
			cursor: help;
		}
		.${W.clasn}.${W.clsLoad} {
			opacity: 0.5;
			outline: 1px dotted black;
			cursor: wait;
		}
		img.${W.clasn}:not(.${W.olga5freeimg}) {
			background-color: transparent;
			position: inherit;
			padding: 0 !important;
			vertical-align: bottom;
			border-radius: 50%;
			box-shadow: none !important;
			animation: none;
			max-height: 28px;
			max-width:  28px;
		}
		img.${W.clasn}.${W.clsPlay} {
			animation: o-sndImgSwing 2s infinite linear;
		}
		@keyframes o-viewTextWash {
			100%,0% {background-color: white;color: aqua;}
			75%,25% {background-color: gold;}
			50% {background-color: coral;color: blue;    }
		}
		@keyframes o-sndImgSwing {
			100%,50%,0% {transform: rotateZ(0deg);}
			25% {transform: rotateZ(33deg);}
			75% {transform: rotateZ(-33deg);}
		}
	`,
	getAddrForTag: (tag, ref, atnam) => {
		const attr = atnam ? getAttribute(tag.aO7snd.attrs, atnam) : ''

		if (attr)
			return { url: attr.value, atr: atnam }
		else
			if (ref) {
				const attrs = tag.attributes
				for (const from of [`_${ref}`, `data-${ref}`, `${ref}`])
					for (const atr of attrs)
						if (atr.name === from) {
							const ori = atr.value,
								url = C.decodeUrl(ori, tag.id)
							return { ref, ori, url }
						}
			}
		return null
	},
}