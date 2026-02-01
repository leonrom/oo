/*jshint asi:true          */
/* global window, console, document */
/*jshint strict:true  */
/*jshint esversion: 6 */
//!
// Configure desktop -> Mouse Action -> Right-Button

import { C } from '../index.js'
import { PBases } from './PBases.js'
	let time, D,
		tstO5, tstId = 'shp4', tstNam = 'bottom', tstVal = 481;

	// ---- batching ShowFix() per frame ----
	const FixUpdateQueue = new Set()
	let fixUpdateScheduled = false

	function ScheduleShowFixed(aO7) {
		FixUpdateQueue.add(aO7)
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
		opp = { T: 'B', L: 'R', R: 'L', B: 'T' },

		CanFixsOn = (aO7, pO5) => {
			for (const frame of aO7.frms.frames)
				if (frame.pO5 === pO5)
					return true
		},
		FindExternalFixCuts = (m, pBase) => {
			const pBords = pBase.pBordss[m]
			for (const aO7 of pBase.aAll) {
				let xO5 = null
				if (aO7.cls.puts[m])
					for (const p of pBords)
						if (CanFixsOn(aO7, p)) {
							xO5 = p
							break
						}

				aO7.canFixs[m] = xO5
				aO7.canCuts[m] = pBords[0]

				// const fix = aO7.fixs[m]
				// if (fix.xO5 && fix.isP)
				// 	fix.xO5 = xO5

				if (C.consts.debug > 2) console.log(`FindExternalFixCuts ${aO7.name} :  ` +
					`canFixs[${m}] = ${xO5 ? xO5.name : ' -  '},   ` +
					`canCuts[${m}] = ${aO7.canCuts[m] ? aO7.canCuts[m].name : ' -  '}`)
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
		ReAttach = (x, xTL, aO7) => {
			const
				o = opp[x],
				vC = GetV(o, aO7.posC)
			/**
			 *   Перепозиционировать уже приаттачеенные
			 */
			for (const iO5 of aO7.attachss[o]) {
				SetV(x, iO5.posC, vC)
				InternalTagCuts(o, iO5, 0, 0)

				ReAttach(x, xTL, iO5)
			}
		},
		AttachTo = (x, xTL, aO7) => {
			const
				o = opp[x],
				level = aO7.cls.level,
				vC = GetV(o, aO7.posC)
			/**
			 *   Если прилеплен к "верхнему" [x] bord'у, то
			 * 		подсоединяем те, что "снизу" [o] 
			 */
			for (const iO5 of aO7.aO7s[o]) {
				if (!iO5.act.ready || iO5.cls.level >= level || iO5.fixs[x].xO5)
					continue

				const vI = GetV(x, iO5.posC)
				if (xTL ? vC >= vI : vC <= vI) {
					iO5.DoFix(x, aO7)
					SetV(x, iO5.posC, vC)
					InternalTagCuts(o, iO5, 0, 0)
					aO7.attachss[o].push(iO5)

					AttachTo(x, xTL, iO5)
				}
				else
					break
			}
		},
		UnAttach = (x, xTL, aO7) => {
			const
				o = opp[x],
				vC = GetV(x, aO7.posC),
				attachs = aO7.attachss[x]
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
		CheckHidden = (aO7) => {
			if (aO7.posC.height <= 0) aO7.hidden.T = aO7.hidden.B = 1
			if (aO7.posC.width <= 0) aO7.hidden.L = aO7.hidden.R = 1

			if (!aO7.cls.alive)
				for (const x of 'TLRB')
					if (aO7.hidden[x]
						&& aO7.fixs[x].xO5
						&& aO7.fixs[x].isP
					) {
						aO7.DoFix(x, null)

						const
							o = opp[x],
							xTL = 'TL'.includes(x),
							attachs = aO7.attachss[o]
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
		ExternalFixCuts = (x, aO7) => {
			const
				v = aO7.canCuts[x].scops[x],
				aC = aO7.posC
			let d;
			switch (x) {
				case 'T': d = v - aC.top; break
				case 'L': d = v - aC.left; break
				case 'R': d = (aC.left + aC.width) - v; break
				case 'B': d = (aC.top + aC.height) - v; break
			}

			if (d > 0) {
				switch (x) {
					case 'T': aC.height -= d; aC.top += d; aO7.posS.top -= d; break
					case 'L': aC.width -= d; aC.left += d; aO7.posS.left -= d; break
					case 'R': aC.width -= d; break
					case 'B': aC.height -= d; break
				}
				return true
			}
		},
		InternalTagCuts = (o, aO7, scV, scH) => {
			const
				pO5 = aO7.frms.tagCut.pO5,
				v = pO5.scops[o],
				aC = aO7.posC

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
					case 'R': aC.width -= d; aO7.posS.left -= d; break		//  - scH
					case 'B': aC.height -= d; aO7.posS.top -= d; break		//  - scV
				}
				return true
			}
		},
		PitchBy = (x, xTL, aO7) => {
			const
				o = opp[x],
				level = aO7.cls.level,
				vC = GetV(o, aO7.posC)
			/**
			 * 	ищу тех, которы согут сдвинуть/сжать aO7
			 *  среди тех, которые находятся со стороны 'o'
			 */
			const pitchs = new Map()
			let vX, xO5, pitch = '', n = aO7.pBase.aAll.length
			do {
				vX = vC
				xO5 = null
				for (const iO5 of aO7.aO7s[o])
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

					const d = xTL ? (vC - vX) : (vX - vC), aC = aO7.posC, aS = aO7.posS
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
					CheckHidden(aO7)

					ReAttach(x, xTL, aO7)
				}
			} while (xO5 && pitch === 'O' && n-- > 0)

			for (const iO5 of aO7.attachss[o])
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
		ToFix = (x, aO7, xTL) => {
			if (aO7.cls.puts[x]
				&& !aO7.IsP(x, false)
			) {
				const pF = aO7.canFixs[x] || aO7.fixs[x].xO5
				if (pF
					&& pF === aO7.pBase.pBordss[x][0]
					&& (aO7.IsP(x, true) !== pF)
				) {
					const vF = pF.scops[x],
						vO = GetV(x, aO7.posO)
					if ((xTL ? (vO < vF) : (vO > vF)))
						aO7.DoFix(x, pF)
				}

			}

			if (aO7.IsP(x, true)) {
				SetPos(x, aO7.fixs[x].xO5.scops[x], aO7.posC, aO7.posO)
				return true
			}
		},
		UnFix = (o, aO7, xTL) => {
			const pF = aO7.canFixs[o] || aO7.fixs[o].xO5
			if (pF
				&& aO7.fixs[o].xO5 === pF
			) {
				const vF = pF.scops[o],
					vO = GetV(o, aO7.posO)
				if (xTL ? (vO >= vF) : (vO <= vF)) {//	тут не надо расфиксировать приаттаченные - они "отъехали" раньше
					aO7.DoFix(o, null)
					return true
				}
			}

			SetPos(o, aO7.fixs[o].xO5.scops[o], aO7.posC, aO7.posO)
		},
		CalcCurPozs = aO7 => {
			const p = aO7.shdw.getBoundingClientRect()

			Object.assign(aO7.posO, { top: p.top, left: p.left, height: p.height, width: p.width, right: p.right, bottom: p.bottom })
			Object.assign(aO7.posC, { top: p.top, left: p.left, height: p.height, width: p.width })
			Object.assign(aO7.posS, { top: 0, left: 0 })

			for (const x of 'TLRB')
				aO7.hidden[x] = 0
		},
		CalcFixPozs = (x, aO7) => {
			const
				o = opp[x],
				fx = aO7.fixs[x],
				fo = aO7.fixs[o],
				xO5 = fx.xO5,
				oO5 = fo.xO5

			if (xO5 || oO5) {
				const
					aO = aO7.posO,
					aC = aO7.posC,
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
			for (const aO7 of pBase.aAll)
				CalcCurPozs(aO7)
			for (const x of 'TL')
				for (const aO7 of pBase.bO5s[x])
					CalcFixPozs(x, aO7)
		}

	export const DoChgs={	
	MakeScroll:(scV, scH, pcO5, fromExt) =>{
		if (C.consts.debug > 1 && !D && fromExt) {	//	постоянный доступ из отладчика
			D = {}
			for (const pBase of pcO5.pBases) {
				let b = D[pBase.pO5.name] = {}
				for (const aO7 of pBase.aAll)
					b[aO7.name] = aO7	// .substr(3)
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
			PBases.SetBorders(x, pcO5)

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
				for (const aO7 of pBase.bO5s[x]) {
					if (aO7.act.ready
						&& !aO7.hidden[o]
					) {
						const oldIsP = aO7.IsP(x, true)
						ToFix(x, aO7, xTL)
						const newIsP = aO7.IsP(x, true)
						if (newIsP) {						// переопр. размеров внутри
							// 					const piO5=aO7.shp.pO5
							// 					if (!oldIsP && piO5){

							// for (const pBase of piO5.pBases)
							// 	if (pBase.pO5.scops.isVisible) {
							// 		for (const tagCut of pBase.tagCuts)
							// 			tagCut.pO5.CalcScope(time)
							// 		for (const pOut of pBase.pO5.pOuts)
							// 			pOut.CalcScope(time)
							// 	}

							// for (const x of xs)
							// 	PBases.SetBorders(x, piO5)

							// 						for (const iBase of piO5.pBases)
							// 							CalcPozs(iBase)}
						}
						else
							if (aO7.canFixs[x] === aO7.canCuts[x])
								break
					}
					// // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!					
					// const m1 = aO7.act.ready
					// const m2 = !aO7.hidden[o]
					// const m3 = !ToFix(x, aO7, xTL)
					// const m4 = aO7.canFixs[x] === aO7.canCuts[x]

					// if (aO7.act.ready
					// 	&& !aO7.hidden[o]
					// 	&& !ToFix(x, aO7, xTL)
					// 	&& aO7.canFixs[x] === aO7.canCuts[x]
					// )
					// 	break
				}

				// расфиксация по [o]
				xTL = 'TL'.includes(o)
				for (const aO7 of pBase.bO5s[o])
					if (aO7.act.ready
						&& aO7.IsP(o, true)
					)
						UnFix(o, aO7, xTL)
			}
			/**
			 * обрезания внутренним и внешним контейнерами
			 */
			for (const aO7 of pBase.aAll)
				if (aO7.act.ready && aO7.act.isfix) {
					for (const x of 'TLRB') {
						const o = opp[x]
						if (aO7.fixs[x].xO5)	//   aO7.IsP(x, true))
							if (InternalTagCuts(o, aO7, scV, scH))
								ReAttach(o, 'TL'.includes(o), aO7)

						if (aO7.canCuts[x]) 	//  && !aO7.IsP(x, false))  // && !aO7.fixs[x]
							if (ExternalFixCuts(x, aO7))
								ReAttach(x, 'TL'.includes(x), aO7)
					}
					CheckHidden(aO7)
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
						for (const aO7 of pBase.bO5s[m])
							if (aO7.IsP(m, true)) {		// Если прилеплен к "верхнему" [x] bord'у, то
								if (m === x)
									AttachTo(x, xTL, aO7)	//	подсоединяем те, что "снизу" [o] 
								else
									UnAttach(x, xTL, aO7)
							}
							else
								if (aO7.canFixs[n] === aO7.canCuts[m])
									break

						q[m] = 0
						for (const aO7 of pBase.bO5s[m])
							if (aO7.IsP(m, true)) {
								const pitch = PitchBy(m, mTL, aO7)
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
					console.error("%c%s", C.consts.fmtErr, `динамическая фиксация по [${m}]`, ` не завершилась за ${n} шагов`)
			}
			// отображение зафиксированых
			for (const aO7 of pBase.aAll)
				if (aO7.act.isfix)
					ScheduleShowFixed(aO7)

			//   -----------------------  ОСТАВЬ для примера -------------------------------
			// 		let dbgstrt = false
			// if (dbgstrt && GAll(1).posC.height > 20)
			// 	console.log('-15-')
			// if (GAll(1).posC.height < 20)
			// 	dbgstrt = true
		}
	}
}