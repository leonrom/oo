/* global document, window*/
/*jshint asi:true  */
/*jshint esversion: 6*/
(function () {              // ---------------------------------------------- snd ---
	'use strict';

	const
		C = window.o7.C,
		olgaSnd = 'olga_snd',
		W = {
				modul: 'snd',
				Init: SndInit,
				incls: ['AO5snd', 'Imgs', 'Prep'],
			consts: {
				needs: `		
						o5shift_speed=0.5 # при Shift - замедлять вдвое;
						o5return_time=0.3 # при возобновлении "отмотать" 0.3 сек ;
				`},
			urlrfs: { needs: 'btn_play=""; btn_stop=', },
		},
		wshp = (window.o7 ??= {})[W.modul] = { W },
		o5css = `
		.${olgaSnd}:not(.o-sndNone) {
			cursor: pointer;
		}
		.${olgaSnd}.o-sndPlay {
			cursor: progress;
			animation: olga5_viewTextWash 5s infinite linear;
		}
		.${olgaSnd}.o-sndPause {
			cursor: wait;
			animation: none;
		}
		.${olgaSnd}.o-sndError {
			opacity: 0.5;
			outline: 2px dotted black;
			cursor: help;
		}
		.${olgaSnd}.o-sndLoad {
			opacity: 0.5;
			outline: 1px dotted black;
			cursor: wait;
		}
		img.${olgaSnd}:not(.o-freeimg) {
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
		img.${olgaSnd}.o-sndPlay {
			animation: olga5_sndImgSwing 2s infinite linear;
		}
		@keyframes olga5_viewTextWash {
			100%,0% {background-color: white;color: aqua;}
			75%,25% {background-color: gold;}
			50% {background-color: coral;color: blue;    }
		}
		@keyframes olga5_sndImgSwing {
			100%,50%,0% {transform: rotateZ(0deg);}
			25% {transform: rotateZ(33deg);}
			75% {transform: rotateZ(-33deg);}
		}
	`

	// eslint-disable-next-line no-mixed-spaces-and-tabs

	function SndInit() {

		// wshp.css = css

		C.ParamsFill(W, o5css)

		const excls = document.getElementsByClassName('o-sndNone')
		for (const excl of excls) {
			const exs = excl.querySelectorAll('[class *=olga_snd]')
			for (const ex of exs)
				ex.classList.add('o-sndNone')
		}

		const mtags = C.SelectByClassName(olgaSnd, W.modul)
		wshp.Prep(mtags)

		C.DispatchEvent('o_scriptDone', W.modul)
	}

})();
