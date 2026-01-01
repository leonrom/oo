/*jshint asi:true          */
/* global window, console, document */
/*jshint strict:true  */
/*jshint esversion: 6 */
//!
// Configure desktop -> Mouse Action -> Right-Button
(function () {              // ---------------------------------------------- shp/DoChgs ---
	"use strict"

	let wshp, time, D,
		tstO5, tstId = 'shp4', tstNam = 'bottom', tstVal = 481;

	// ---- batching ShowFix() per frame ----
	const FixUpdateQueue = new Set()
	let fixUpdateScheduled = false

	function ScheduleShowFixed(aO5) {
		FixUpdateQueue.add(aO5)
		if (!fixUpdateScheduled) {
			fixUpdateScheduled = true
			requestAnimationFrame(() => {
				for (const o of FixUpdateQueue)
					o.ShowFix()
				FixUpdateQueue.clear()
				fixUpdateScheduled = false
			})
		}
	}

	const
		olga5_modul = "shp",
		modulname = 'DoChgs',
		C = window.olga7.C,
		debug = C.consts.debug,
		opp = { T: 'B', L: 'R', R: 'L', B: 'T' },

		CanFixsOn = (aO5, pO5) => {
			for (const frame of aO5.frms.frames)
				if (frame.pO5 === pO5)
					return true
		},
		FindExternalFixCuts = (m, pBase) => {
			const pBords = pBase.pBordss[m]
			for (const aO5 of pBase.aAll) {
				let xO5 = null
				if (aO5.cls.puts[m])
					for (const p of pBords)
						if (CanFixsOn(aO5, p)) {
							xO5 = p
							break
						}

				aO5.canFixs[m] = xO5
				aO5.canCuts[m] = pBords[0]

				// const fix = aO5.fixs[m]
				// if (fix.xO5 && fix.isP)
				// 	fix.xO5 = xO5

				if (debug > 2) console.log(`FindExternalFixCuts ${aO5.name} :  ` +
					`canFixs[${m}] = ${xO5 ? xO5.name : ' -  '},   ` +
					`canCuts[${m}] = ${aO5.canCuts[m] ? aO5.canCuts[m].name : ' -  '}`)
			}
		},
		GetV = (m, aX) => {
			switch (m) {
				case 'T': return aX.top
				case 'L': return aX.left
				case 'R': return aX.left + aX.width
				case 'B': return aX.top + aX.height
			}
		},
		SetV = (m, aX, v) => {
			switch (m) {
				case 'T': aX.top = v; break
				case 'L': aX.left = v; break
				case 'R': aX.left = v - aX.width; break
				case 'B': aX.top = v - aX.height; break
			}
		},
		ReAttach = (x, xTL, aO5) => {
			const
				o = opp[x],
				vC = GetV(o, aO5.posC)
			/**
			 *   Перепозиционировать уже приаттачеенные
			 */
			for (const iO5 of aO5.attachss[o]) {
				SetV(x, iO5.posC, vC)
				InternalTagCuts(o, iO5, 0, 0)

				ReAttach(x, xTL, iO5)
			}
		},
		AttachTo = (x, xTL, aO5) => {
			const
				o = opp[x],
				level = aO5.cls.level,
				vC = GetV(o, aO5.posC)
			/**
			 *   Если прилеплен к "верхнему" [x] bord'у, то
			 * 		подсоединяем те, что "снизу" [o] 
			 */
			for (const iO5 of aO5.aO5s[o]) {
				if (!iO5.act.ready || iO5.cls.level >= level || iO5.fixs[x].xO5)
					continue

				const vI = GetV(x, iO5.posC)
				if (xTL ? vC >= vI : vC <= vI) {
					iO5.DoFix(x, aO5)
					SetV(x, iO5.posC, vC)
					InternalTagCuts(o, iO5, 0, 0)
					aO5.attachss[o].push(iO5)

					AttachTo(x, xTL, iO5)
				}
				else
					break
			}
		},
		UnAttach = (x, xTL, aO5) => {
			const
				o = opp[x],
				vC = GetV(x, aO5.posC),
				attachs = aO5.attachss[x]
			/**
			 *  Если прилеплен к "нижнему" [o] bord'у, то
			 * 	отсоединяем те, что "сверху" [x] 
			 */
			for (const iO5 of attachs) {
				if (iO5.attachss[x].length)
					UnAttach(x, xTL, iO5)

				const vI = GetV(o, iO5.posO)
				if (xTL ? vI < vC : vI > vC) {
					const j = attachs.indexOf(iO5)
					attachs.splice(j, 1)
					iO5.DoFix(o)
				}
			}
		},
		CheckHidden = (aO5) => {
			if (aO5.posC.height <= 0) aO5.hidden.T = aO5.hidden.B = 1
			if (aO5.posC.width <= 0) aO5.hidden.L = aO5.hidden.R = 1

			if (!aO5.cls.alive)
				for (const x of 'TLRB')
					if (aO5.hidden[x]
						&& aO5.fixs[x].xO5
						&& aO5.fixs[x].isP
					) {
						aO5.DoFix(x, null)

						const
							o = opp[x],
							xTL = 'TL'.includes(x),
							attachs = aO5.attachss[o]
						let j = attachs.length
						while (j-- > 0) {
							const iO5 = attachs[j]
							attachs.splice(j, 1)
							iO5.DoFix(x)
							if (!ToFix(x, iO5, xTL))
								UnAttach(x, xTL, iO5)
						}
					}
		},
		ExternalFixCuts = (x, aO5) => {
			const
				v = aO5.canCuts[x].scops[x],
				aC = aO5.posC
			let d;
			switch (x) {
				case 'T': d = v - aC.top; break
				case 'L': d = v - aC.left; break
				case 'R': d = (aC.left + aC.width) - v; break
				case 'B': d = (aC.top + aC.height) - v; break
			}

			if (d > 0) {
				switch (x) {
					case 'T': aC.height -= d; aC.top += d; aO5.posS.top -= d; break
					case 'L': aC.width -= d; aC.left += d; aO5.posS.left -= d; break
					case 'R': aC.width -= d; break
					case 'B': aC.height -= d; break
				}
				return true
			}
		},
		InternalTagCuts = (o, aO5, scV, scH) => {
			const
				pO5 = aO5.frms.tagCut.pO5,
				v = pO5.scops[o],
				aC = aO5.posC

			let d;
			switch (o) {
				case 'T': d = v - aC.top; break
				case 'L': d = v - aC.left; break
				case 'R': d = aC.left + aC.width - v; break
				case 'B': d = aC.top + aC.height - v; break
			}

			if (d > 0) {
				switch (o) {
					case 'T': aC.height -= d; aC.top += d; break
					case 'L': aC.width -= d; aC.left += d; break
					case 'R': aC.width -= d; aO5.posS.left -= d; break		//  - scH
					case 'B': aC.height -= d; aO5.posS.top -= d; break		//  - scV
				}
				return true
			}
		},
		PitchBy = (x, xTL, aO5) => {
			const
				o = opp[x],
				level = aO5.cls.level,
				vC = GetV(o, aO5.posC)
			/**
			 * 	ищу тех, которы согут сдвинуть/сжать aO5
			 *  среди тех, которые находятся со стороны 'o'
			 */
			const pitchs = new Map()
			let vX, xO5, pitch = '', n = aO5.pBase.aAll.length
			do {
				vX = vC
				xO5 = null
				for (const iO5 of aO5.aO5s[o])
					if (iO5.cls.level > level
						&& !pitchs.get(iO5)
					) {
						const vI = GetV(x, iO5.posC)
						if (xTL ? vX > vI : vX < vI) {
							xO5 = iO5
							vX = vI
						}
						iO5.cnst.shp.style.zIndex = parseInt(iO5.cls.zIndex)  // 'обнуляю' индексы
					}

				if (xO5) {
					pitch = xO5.cls.pitch
					pitchs.set(xO5, true)

					const d = xTL ? (vC - vX) : (vX - vC), aC = aO5.posC, aS = aO5.posS
					switch (pitch) {
						case 'C':
							switch (x) {	// сжимает предыдущий	
								case 'T': aC.height -= d; break
								case 'L': aC.width -= d; break
								case 'R': aC.width -= d; aC.left += d; aS.left -= d; break
								case 'B': aC.height -= d; aC.top += d; aS.top -= d; break
							}
							break
						case 'P':
							switch (x) {	// сталкивает предыдущий
								case 'T': aC.height = 0; break
								case 'L': aC.width = 0; break
								case 'R': aC.width = 0; aC.left += aC.width; break
								case 'B': aC.height = 0; aC.top += aC.height; break
							}
							break
						case 'S':
							switch (x) {	// сдвигает предыдущий
								case 'T': aC.height -= d; aS.top -= d; break
								case 'L': aC.width -= d; aS.left -= d; break
								case 'R': aC.width -= d; aC.left += d; break
								case 'B': aC.height -= d; aC.top += d; break
							}
							break
						default: 	//case 'O' - наезжает на предыдущий // ничего не даформируется
							xO5.shp.style.zIndex = parseInt(cart.style.zIndex) + 1
					}
					CheckHidden(aO5)

					ReAttach(x, xTL, aO5)
				}
			} while (xO5 && pitch === 'O' && n-- > 0)

			for (const iO5 of aO5.attachss[o])
				if (PitchBy(x, xTL, iO5))
					pitch = '*'

			return pitch
		},
		SetPos = (x, v, aC, aO) => {
			switch (x) {
				case 'T': aC.top = v; break
				case 'L': aC.left = v; break
				case 'R': aC.left = v - aO.width; break
				case 'B': aC.top = v - aO.height; break
			}
		},
		ToFix = (x, aO5, xTL) => {
			if (aO5.cls.puts[x]
				&& !aO5.IsP(x, false)
			) {
				const pF = aO5.canFixs[x] || aO5.fixs[x].xO5
				if (pF
					&& pF === aO5.pBase.pBordss[x][0]
					&& (aO5.IsP(x, true) !== pF)
				) {
					const vF = pF.scops[x],
						vO = GetV(x, aO5.posO)
					if ((xTL ? (vO < vF) : (vO > vF)))
						aO5.DoFix(x, pF)
				}

			}

			if (aO5.IsP(x, true)) {
				SetPos(x, aO5.fixs[x].xO5.scops[x], aO5.posC, aO5.posO)
				return true
			}
		},
		UnFix = (o, aO5, xTL) => {
			const pF = aO5.canFixs[o] || aO5.fixs[o].xO5
			if (pF
				&& aO5.fixs[o].xO5 === pF
			) {
				const vF = pF.scops[o],
					vO = GetV(o, aO5.posO)
				if (xTL ? (vO >= vF) : (vO <= vF)) {//	тут не надо расфиксировать приаттаченные - они "отъехали" раньше
					aO5.DoFix(o, null)
					return true
				}
			}

			SetPos(o, aO5.fixs[o].xO5.scops[o], aO5.posC, aO5.posO)
		},
		CalcCurPozs = aO5 => {
			const p = aO5.shdw.getBoundingClientRect()

			Object.assign(aO5.posO, { top: p.top, left: p.left, height: p.height, width: p.width, right: p.right, bottom: p.bottom })
			Object.assign(aO5.posC, { top: p.top, left: p.left, height: p.height, width: p.width })
			Object.assign(aO5.posS, { top: 0, left: 0 })

			for (const x of 'TLRB')
				aO5.hidden[x] = 0
		},
		CalcFixPozs = (x, aO5) => {
			const
				o = opp[x],
				fx = aO5.fixs[x],
				fo = aO5.fixs[o],
				xO5 = fx.xO5,
				oO5 = fo.xO5

			if (xO5 || oO5) {
				const
					aO = aO5.posO,
					aC = aO5.posC,
					isT = x === 'T',
					vx = xO5 ? (fx.isP ? xO5.scops[x] : GetV(o, xO5.posC)) : GetV(x, aO),
					vo = oO5 ? (fo.isP ? oO5.scops[o] : GetV(x, oO5.posC)) : GetV(o, aO)

				if (xO5 && oO5)
					Object.assign(aC, isT ? { top: vx, height: vo - vx } : { left: vx, width: vo - vx })
				else if (oO5)
					Object.assign(aC, isT ? { top: vo - aO.height } : { left: vo - aO.width })
				else if (xO5)
					Object.assign(aC, isT ? { top: vx } : { left: vx })
			}
		},
		CalcPozs = (pBase) => {			// Расчет позиций фиксированных
			for (const aO5 of pBase.aAll)
				CalcCurPozs(aO5)
			for (const x of 'TL')
				for (const aO5 of pBase.bO5s[x])
					CalcFixPozs(x, aO5)
		}

	function MakeScroll(scV, scH, pcO5, fromExt) {
		if (debug > 1 && !D && fromExt) {	//	постоянный доступ из отладчика
			D = {}
			for (const pBase of pcO5.pBases) {
				let b = D[pBase.pO5.name] = {}
				for (const aO5 of pBase.aAll)
					b[aO5.name] = aO5	// .substr(3)
			}
		}

		const GAll = i => pcO5.pBases.values().next().value.aAll[i]
		time = performance.now()
		// направление движения объектов в контейнере - обратное ползунку скроллинга	
		let xs = ''
		if (scV > 0) xs += 'T'; else if (scV < 0) xs += 'B'
		if (scH > 0) xs += 'L'; else if (scH < 0) xs += 'R'

		for (const pBase of pcO5.pBases)
			if (pBase.pO5.scops.isVisible) {
				for (const tagCut of pBase.tagCuts)
					tagCut.pO5.CalcScope(time)
				for (const pOut of pBase.pO5.pOuts)
					pOut.CalcScope(time)
			}

		for (const x of xs)
			wshp.PBases.PBase.SetBorders(x, pcO5)

		for (const pBase of pcO5.pBases) {
			if (!pBase.pO5.scops.isVisible) continue

			CalcPozs(pBase)

			for (const m of 'TLRB')  // вообще-то достаточно "for (const x of xs)" + "[x, opp[x]]"
				if (pBase.bChgs[m] || pBase.bChgs.start || fromExt)
					FindExternalFixCuts(m, pBase)

			pBase.bChgs.start = false

			for (const x of xs) {
				// прямой ход и фиксация	по 'x' 
				const o = opp[x]
				let xTL = 'TL'.includes(x)
			/**
			 * фиксации
			 */
				for (const aO5 of pBase.bO5s[x]) {
					if (aO5.act.ready
						&& !aO5.hidden[o]
					) {
						const oldIsP = aO5.IsP(x, true)
						ToFix(x, aO5, xTL)
						const newIsP = aO5.IsP(x, true)
						if (newIsP) {						// переопр. размеров внутри
							// 					const piO5=aO5.shp.pO5
							// 					if (!oldIsP && piO5){

							// for (const pBase of piO5.pBases)
							// 	if (pBase.pO5.scops.isVisible) {
							// 		for (const tagCut of pBase.tagCuts)
							// 			tagCut.pO5.CalcScope(time)
							// 		for (const pOut of pBase.pO5.pOuts)
							// 			pOut.CalcScope(time)
							// 	}

							// for (const x of xs)
							// 	wshp.PBases.PBase.SetBorders(x, piO5)

							// 						for (const iBase of piO5.pBases)
							// 							CalcPozs(iBase)}
						}
						else
							if (aO5.canFixs[x] === aO5.canCuts[x])
								break
					}
					// // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!					
					// const m1 = aO5.act.ready
					// const m2 = !aO5.hidden[o]
					// const m3 = !ToFix(x, aO5, xTL)
					// const m4 = aO5.canFixs[x] === aO5.canCuts[x]

					// if (aO5.act.ready
					// 	&& !aO5.hidden[o]
					// 	&& !ToFix(x, aO5, xTL)
					// 	&& aO5.canFixs[x] === aO5.canCuts[x]
					// )
					// 	break
				}

				// расфиксация по [o]
				xTL = 'TL'.includes(o)
				for (const aO5 of pBase.bO5s[o])
					if (aO5.act.ready
						&& aO5.IsP(o, true)
					)
						UnFix(o, aO5, xTL)
			}
			/**
			 * обрезания внутренним и внешним контейнерами
			 */
			for (const aO5 of pBase.aAll)
				if (aO5.act.ready && aO5.act.isfix) {
					for (const x of 'TLRB') {
						const o = opp[x]
						if (aO5.fixs[x].xO5)	//   aO5.IsP(x, true))
							if (InternalTagCuts(o, aO5, scV, scH))
								ReAttach(o, 'TL'.includes(o), aO5)

						if (aO5.canCuts[x]) 	//  && !aO5.IsP(x, false))  // && !aO5.fixs[x]
							if (ExternalFixCuts(x, aO5))
								ReAttach(x, 'TL'.includes(x), aO5)
					}
					CheckHidden(aO5)
				}
			/**
			 * прилипания и сталкивания
			 * динамическая фиксация остальных на зависших элементах
			 */
			for (const x of xs) {
				const o = opp[x], q = { [x]: 1, [o]: 1 }
				let n = 5
				do {
					for (const m of [x, o]) {
						if (!q[m]) continue

						const xTL = 'TL'.includes(x),
							mTL = m === x ? xTL : !xTL
						for (const aO5 of pBase.bO5s[m])
							if (aO5.IsP(m, true)) {		// Если прилеплен к "верхнему" [x] bord'у, то
								if (m === x)
									AttachTo(x, xTL, aO5)	//	подсоединяем те, что "снизу" [o] 
								else
									UnAttach(x, xTL, aO5)
							}
							else
								if (aO5.canFixs[n] === aO5.canCuts[m])
									break

						q[m] = 0
						for (const aO5 of pBase.bO5s[m])
							if (aO5.IsP(m, true)) {
								const pitch = PitchBy(m, mTL, aO5)
								if (pitch) {
									if (pitch !== 'O' && pitch !== 'P')
										q[m] = 1
								} else
									break
							}
					}
					n--
				} while ((q.x || q.o) && n > 0)

				if (n <= 0)
					console.error("%c%s", C.fmtErr, `динамическая фиксация по [${m}]`, ` не завершилась за ${n} шагов`)
			}
			// отображение зафиксированых
			for (const aO5 of pBase.aAll)
				if (aO5.act.isfix)
					ScheduleShowFixed(aO5)

			//   -----------------------  ОСТАВЬ для примера -------------------------------
			// 		let dbgstrt = false
			// if (dbgstrt && GAll(1).posC.height > 20)
			// 	console.log('-15-')
			// if (GAll(1).posC.height < 20)
			// 	dbgstrt = true
		}
	}
	wshp = C.AddModuleSub(olga5_modul, modulname, [MakeScroll])
})();