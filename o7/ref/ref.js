/* global document, window, console, CustomEvent*/
/*jshint asi:true  */
/*jshint esversion: 6*/
/*eslint no-useless-escape: 0*/

let debug, C;
const
	ParseTagAttrs = params => {
		const errs = [],
			otags = {}
		// aa=onYouTubeIframeAPIReady
		for (const pnam in params) {
			const param = params[pnam]
			if (!param)
				errs.push({ 'где': `nam='${pnam}'`, err: `пустой параметр` })
			else
				if (typeof param !== 'string')
					errs.push({ 'где': `nam='${pnam}'`, err: `тип '${typeof param}' (не присвоено значение?)` })
				else {
					const regexp = /\s*[,;]+\s*/g,
						nams = pnam.split(regexp),
						attrs = param.split(regexp)

					for (const attr of attrs)
						if (attr && attr.match(/\s+/)) {
							errs.push({ par: `в значении '${pnam}=${attr}'`, err: `пробелы заменены ','` })
							attr.replace(/\s+/g, ',')
						}

					for (const nam of nams) {
						if (!nam) {
							errs.push({ par: `nam='${nam}'`, err: `пустой 'тег' в параметре` })
							continue
						}
						if (!otags[nam]) otags[nam] = {}
						for (const attr of attrs) {
							if (attr)
								if (!otags[nam][attr]) otags[nam][attr] = 0// счетчик использования
						}
					}
				}
		}
		if (errs.length > 0)
			C.ConsoleError(`Ошибки в параметрах`, 'o_attrs', errs)
		return otags
	},
	ConvertUrls = otags => {
		let tagnams = ''
		for (const nam in otags)
			tagnams += (tagnams ? ',' : '') + nam

		const tags = C.GetTagsByTagNames(tagnams, W.modul),
			undefs = [],
			rez = []

		for (const tag of tags) {
			const nam = C.getObjName(tag),
				attrs = otags[(tag.tagName.toLowerCase())]

			for (const attr in attrs)
				if (attr) {
					const tagattr = tag.attributes[attr]
					if (tagattr) {
						const ori = tagattr.nodeValue,
							url = C.decodeUrl(ori) 	// || ori,
							anew = attr.replace(/(data-)|(_)/, '')
						// anew = (attr[0] == '_') ? attr.substring(1) : attr

						// if (wref.err)
						// 	undefs.push({ 'имя (refs)': nam, 'атрибут': attr, 'адрес': ori, 'непонятно': wref.err })

						if (url && (ori != url || attr != anew)) {
							if (attr != anew)     	// если обработано без ошибок, то удаляю - чтоб другие модули не повторяли
								tag.removeAttribute(attr)

							tag.setAttribute(anew, url)

							rez.push({ nam: nam, attr: (attr + (anew != attr ? ` (${anew})` : ``)), src: ori, rez: url })
							attrs[attr]++
						}
					}
				}
		}

		if (rez.length < 1) C.ConsoleError(`${W.modul}: не выполнено ни одной подстановки?`)
		else
			if (debug > 0) C.ConsoleInfo(`${W.modul}: выполнено подстановок для тегов:`, rez.length, rez)

		if (undefs.length > 0)
			C.ConsoleError(`${W.modul}: неопределённые адреса: `, undefs.length, undefs)
		// if (unreal.length > 0) C.ConsoleAlert(`${W.modul}: непонятные адреса: `, unreal.length, unreal)
	},
	PrepTubes = () => {
		let YT = null
		const sel = 'o_youtube',
			tags = C.GetTagsByQueryes('[' + sel + ']'),
			onPlayerReady = e => {
				const aO7 = e.target.g.aO7
				if (!aO7.ready) { // при первой установке статуса удаляю фон чтоб не выглядывал
					aO7.ready = true
					aO7.tag.removeAttribute('style')
					if (aO7.style)
						aO7.tag.setAttribute('style', aO7.style)
				}
				// console.log(1)
			},
			onPlayerStateChange = e => {
				const act = e.target.getPlayerState(),
					aO7 = e.target.g.aO7
				if (debug > 0) {
					let s = ''
					switch (act) {
						case 0: s = 'воспроизведение видео завершено'; break
						case 1: s = 'воспроизведение'; break
						case 2: s = 'пауза'; break
						case 3: s = 'буферизация'; break
						case 5: s = 'видео находится в очереди'; break
						default: s = 'воспроизведение видео не началось'
					}
					console.log(aO7.tag.id, 2, act, s)
				}
				if (act == 1) {
					window.dispatchEvent(new CustomEvent('o_stopVideo', { detail: { tag: aO7.tag, type: 'yt', } }))
				}
			},
			onYtReady = () => {	//	
				YT = window.YT
				// console.log(4)
			},
			AddFrame = e => {
				if (YT === null) {
					YT = 0
					const script = document.createElement('script')
					script.src = "https://www.youtube.com/iframe_api"

					script.onload = function () {
						window.YT.ready(onYtReady)
					}
					script.onerror = function () {
						C.ConsoleError("ошибка загрузки YouTube API ", this.src)
					}

					// var firstScriptTag = document.getElementsByTagName('script')[0]
					// firstScriptTag.parentNode.insertBefore(script, firstScriptTag)

					script.setAttribute(C.myInclude, '1')
					currentScript.parentNode.insertBefore(script, currentScript)
				}

				const tag = e.target,
					aO7 = tag.aYT

				if (YT && YT.loaded) {
					const x = document.createElement('div'),	// кандидат на намену через iFrame
						div = tag.appendChild(x)

					if (aO7.chkmove) {
						if (aO7.chkmove == 'wait') {
							tag.removeEventListener('mousemove', AddFrame)
						}
						tag.aYT.chkmove = ''
					}

					aO7.player = new window.YT.Player(div, {
						height: 'inherit',
						width: 'inherit',
						videoId: aO7.videoId,
						events: {
							'onReady': onPlayerReady,
							'onStateChange': onPlayerStateChange
						}
					})
					aO7.iframe = aO7.player.getIframe()
					aO7.iframe.aO7 = aO7

					window.addEventListener( 'o_stopVideo', e => {
						const act = e.detail.tag
						for (const tag of tags)
							if (tag !== act && tag.aYT.player)
								tag.aYT.player.stopVideo()
						// console.log(act.id, 5, e.detail)
					})
				}
				else
					if (aO7.chkmove == 'ask') {
						aO7.chkmove = 'wait'
						tag.addEventListener('mousemove', AddFrame)
					}
			}

		for (const tag of tags) {
			const videoId = tag.attributes[sel].nodeValue,
				style = tag.getAttribute('style') || ''

			if (style)
				tag.removeAttribute('style')
			tag.setAttribute('style', style + `background: url(//img.youtube.com/vi/${videoId}/hqdefault.jpg) 0% 0% / contain no-repeat;background-position: center;`)
			tag.aYT = { player: null, videoId: videoId, chkmove: 'ask', tag: tag, style: style, ready: false }

			tag.addEventListener('mouseover', AddFrame, { once: true })
		}
	}


export const W = {
	needs: { o_attrs: '', },
	prepare: (c) => {
		C = c
		debug = C.consts.debug
	},
	init: () => {
		PrepTubes()
	},
}
