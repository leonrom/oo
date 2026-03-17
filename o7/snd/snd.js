/**
 * snd.js
 * Модуль обработки аудио на странице
 *
 * - подключение аудио-файлов к 'любым' тегам страницы (не только <audio>)
 * - использование именованных ссылок на файлы с их 'ленивой' загрузкой (и для <audio> тегов, идля любых иных)
 * - синхронизация звучания всех тегов аудиио
 * - визуализация звучания как 'любых' тегов, так и <audio> при задани им класса 'olga-snd'
 * 
 * Предусмотрено подключение как в составе библиотеки o7, так и автономно (с динамичесой подгрузкой необязательного файла Cmim.js)
 * 
 * Предусмотрены константы (в data-consts)
		shift_speed - (0.5) изменяет скорость звучания
		back_time - (0.3) продолжает с прерванного места с обратным сдвигом на указанную величину
 * Обе константы работают для тегов с классом 'olga-snd' при нажатой клавише Shift: 
 * первая - при запуске звучания, вторая - при его остановке.
 * 
 * Пояснение: если не нажимать Shift и остановить звучане кликом, а потом, не уводя курсор, 
 * снова кликнуть - звучание будет продолжено (с обратным сдвигом). 
 * Если же курсор покидал тег, то после клика звучание  будет с нуля.
 * Но если был нажат Shift (в момент остановки), то при последущей активации звучания  оно начнётся с прерванного места
 * (это справедливо при остановках как кликом, так и уводом курсора,- т.е. потерей фокуса).
 */

import { AO7 } from './AO7.js'
import { CAO7 } from './CAO7.js'
import { TAO7 } from './TAO7.js'
import { Play } from './Play.js'
import { Init } from './Init.js'
import { Urls } from './Urls.js'
import { Pick } from './Pick.js'

const modul = 'snd'
let C;
export const W = {
	modul: modul,	
	clasn: 'olga-' + modul, // 'modul' и 'clasn' м.б. необязательны
	autonom: false,
	consts: {
		shift_speed: 0.5, // при Shift - замедлять вдвое;
		back_time: 0.3, // при возобновлении "отмотать" 0.3 сек ;
	},
	prepare: function (c) {
		C = c
		AO7.prepare(C, W.clasn)
		CAO7.prepare(C, W.clasn)
		TAO7.prepare(C)
		Init.prepare(C, W.clasn)
		Pick.prepare(C, W.clasn)
		Play.prepare(C, W)	
		Urls.prepare(C)
	},
	init: function () {
		Play.init()
		Pick.init()
		Init.init()
	},
	finish: function () {
		window.dispatchEvent(new CustomEvent(C.E.o_done, { detail: { modul: W.modul, act: 'done' } }))
	},
	reset: function () {
		Play.reset()
		Init.reset()
		CAO7.reset()
		TAO7.reset()
	},
	// ----------------------------
	makeCss: () => `
		.${W.clasn} ,
		.${W.clasn} * {
			cursor: pointer;
    		user-select: none;
		}
		.${W.clasn}.${CAO7.oSWING} {
            display: inline-block;
		}
		.${W.clasn}.${Play.oWAIT} {
			cursor: wait;
			outline: 2px solid blue;
		}
		.${W.clasn}.${Play.oSOUND}{
			cursor: progress;
		}
		.${W.clasn}.${Play.oERROR}{
			opacity: 0.5;
			outline: 2px dotted black;
			cursor: help;
		}

		/* Пульсирующий ореол */
		.${W.clasn}.${Play.oSOUND}:not(${CAO7.oNONE}) {
  			animation: sndGlow 1.4s ease-in-out infinite;
		}
		@keyframes sndGlow {
		  	0% {    filter: drop-shadow(0 0 4px yellow);  }
		  	50% {    filter: drop-shadow(0 0 8px blue);  }
		  	100% {    filter: drop-shadow(0 0 4px red);  }
		}

		/* покачивание - только inline-block (например <img>) */
		.${W.clasn}.${CAO7.oSWING}.${Play.oSOUND}:not(${CAO7.oNONE}) {    
			will-change: transform;
    		transform: rotate(3deg) translateZ(0.001px);
    		transform-origin: 50% 50%;
    		animation: sndSwing 1.6s cubic-bezier(.45, .05, .55, .95) infinite;
		}
        @keyframes sndSwing {
            0%,
            100% { transform: rotate(0deg) translateZ(0); }
            25% {  transform: rotate(13deg) translateZ(0); }
            75% {  transform: rotate(-13deg) translateZ(0); }
        }	
			/* оставил "на потом" для отмечания скорости. Доделать через позцию мыши 
		.olga-snd[data-speed]::after {
    content: attr(data-speed);
    position: absolute;
    font-size: 0.7em;
    top: -1.2em;
    left: 50%;
    transform: translateX(-50%);
    opacity: 0.8;


    background: yellow;
    color: black;
    z-index: 9999;
	*/
}
	`,
};

// проверка автономности. не надо try/catch,- и так выдаст "Uncaught (in promise) TypeError: Failed to fetch"
(async function loadCmin() { (await import(`./Cmin.js`)).Cmin(W, modul) })()
