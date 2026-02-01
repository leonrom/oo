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
import { init } from './init.js'
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
	act:{
		audio:null, 
		ready:false
	},
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
	getUrlForTag: (tag, from, atnam) => {
		const attr = atnam ? getAttribute(tag.aO7snd.attrs, atnam) : ''
		if (attr)
			return { url: attr.value, atr: atnam }

		if (ref) {
			const
				attrs = tag.attributes,
				froms = [`${from}`, `data-${from}`, `_${from}`],
				str = attrs[froms[0]] ? '' : attrs[froms[1]] || attrs[froms[2]]
			if (str) {
				const url = C.decodeUrl(str)
				if (url)
					return { url: url, atr: from }
			}
		}
	},
	execute:()=> {

    // C.fillCss(W.clasn, W.makeCss())
    init(W)
},
}