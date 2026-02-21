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
import { AO7 } from './AO7.js'
import { Curr } from './Curr.js'
import { EveTags } from './EveTags.js'
import { Init } from './Init.js'
import { Imgs } from './Imgs.js'
import { Show } from './Show.js'
import { Urls } from './Urls.js'

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
	}),
	state: Object.freeze({ stop: 'stop', play: 'play', pause: 'pause' }),
	prepare: function () {
		AO7.prepare(C)
		Init.prepare(C)
		EveTags.prepare(C)
		Show.prepare(C)
		Curr.prepare(C)
		Urls.prepare(C)
	},
	init: function () {
		Init.init(W)
		Imgs.init()
		EveTags.init()
		Show.init(W)	// д.б. последним
	},
	finish: function () {
		window.dispatchEvent(new CustomEvent(C.E.o_done, { detail: { modul: W.modul, act: 'done' } }))
	},
	reset: function () {
		const act = this.act
		Object.assign(act, { audio: null, ready: false })
		
		Show.reset()  // д.б. первым
		EveTags.reset()  
		Imgs.reset()
		Init.reset()
		Curr.reset()
		// AO7.reset()
	},
	// ----------------------------
	makeCss: () => `
		.${W.clasn}:not(.o-none) {
			cursor: pointer;
		}
		.${W.clasn}.o-${Show.playing} {
			cursor: wait;
			animation: o-viewTextWash 5s infinite linear;
		}
		.${W.clasn}.o-${Show.play} {
			cursor: progress;
			animation: o-viewTextWash 5s infinite linear;
		}
		.${W.clasn}.o-${Show.pause} {
			cursor: wait;
			animation: none;
		}
		.${W.clasn}.o-${Show.error} {
			opacity: 0.5;
			outline: 2px dotted black;
			cursor: help;
		}
		img.${W.clasn}:not(.freeimg) {
			/* background-color: transparent; */
			position: inherit;
			padding: 0 !important;
			vertical-align: bottom;
			border-radius: 50%;
			box-shadow: none !important;
			animation: none;
			max-height: 28px;
			max-width:  28px;
		}
		img.${W.clasn}.o-${Show.playing} {
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
}
