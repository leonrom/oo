/* global window, document, console, CustomEvent, alert */
/*jshint asi:true  */
/*jshint strict:true  */
/*jshint esversion: 6 */

import { C } from '../index.js'
import { W } from './snd.js'
import { AO7 } from './AO7.js'
import { doAct } from './doAct.js'
import { Imgs } from './Imgs.js'

const
    modul = 'snd',
    // modulname = 'init',
    debug = C.consts.debug,
    // lognam = `${olga_modul}/${modulname} `,
    StopSoundOnPage = () => {
        if (W.act.audio)
            doAct.stopSound(W.act.audio.aO7snd)
    },

    urlattrs = [],
    errs = [],
    btns = { stop: '', play: '' },
    DecodeAttrs = (mtag) => {
        const snd = mtag.tag,
            scls = snd.className,
            aO7 = snd.aO7snd,
            modis = aO7.modis,
            ers = []
        for (const qual of mtag.quals) {
            const c = qual.substring(0, 1).toUpperCase()

            if ('AOLFN'.indexOf(c) >= 0)
                switch (c) {
                    case 'A': modis.alive = true
                        break
                    case 'O': modis.over = true
                        break
                    case 'L': modis.loop = true
                        break
                    case 'F': if (!snd.classList.contains('o-freeImg'))
                        snd.classList.add('o-freeImg')
                        break
                    case 'N': modis.none = true
                        break
                    default: ers.push(qual)
                }
            else
                modis.aplay = qual.replace(/^[`'"]?\s*|\s*[`'"]?$/g, '')
        }

        if (ers.length > 0)
            errs.Add(aO7.name, scls, 'квалиф. класса', ers.join(', '), "ошибочные квалиф.")

        if (!modis.aplay && !modis.none)
            errs.Add(aO7.name, scls, `игнор остальных квалиф.`, 'audio_play', "нету аудио-квалиф.")

        if (aO7.modis.none) snd.classList.add('o-none')

        if (!snd.alt || (snd.alt.trim() == '')) snd.alt = snd.title.trim()
    },
    PrepOther = aO7 => {
        const snd = aO7.snd,
            srcAtr = aO7.srcAtr,
            ori = W.getUrlForTag(snd, srcAtr, '')

        if (ori.url) {
            const url = C.decodeUrl(ori) || ori
            if (url != snd[srcAtr]) {
                snd.setAttribute(srcAtr, url)
                urlattrs.push({ snd: aO7.name, atr: srcAtr, url: url, 'ориг.': ori.url })
            }
        }
        else
            errs.Add(aO7.name, 'PrepUrlsAudio()', `тег <${aO7.snd.tagName}>`, '', `Нет ${'data-' + srcAtr}, ${'_' + srcAtr} или ${srcAtr}`)

        if (ori.atr == 'data-' + srcAtr || ori.atr == '_' + srcAtr)
            snd.removeAttribute(ori.atr)	// чтоб другие модули не повторяли

    }
// GetBtnUrl = (atr) => {
//     const ori = { url: wshp.W.urlrfs[atr], atr: atr }

//     if (ori.url) {
//         const url = C.decodeUrl(ori) || ori
//         if (url != ori.url)
//             urlattrs.push({ snd: atr, atr: ori.atr, url: url, 'ориг.': ori.url })
//         return url
//     }
// }
export function init(W) {
    console.log('snd.init')

    const mtags = C.SelectByClassName(W.clsn, W.modul)
    let found=0;
    for (const mtag of mtags)
        if (
            !mtag.tag.classList.contains('o-none') &&
            !mtag.quals.find(qual => !qual.includes('=') && qual.match(/n/i))
        ) {
            const snd = mtag.tag,
                tagName = snd.tagName.toLowerCase()

            if (tagName.match(/audio/i)) continue

            const aO7 = new AO7(snd)

            if (mtag.quals && mtag.quals.length > 0) {
                DecodeAttrs(mtag)

                const ori = { url: aO7.modis.aplay, atr: 'audio_play' }
                if (ori.url) {
                    const url = C.decodeUrl(ori) || ori
                    aO7.parms.audio_play = url
                    urlattrs.push({ snd: aO7.name, atr: ori.atr, url: url, 'ориг.': ori.url })
                }
            }
            else if (!aO7.modis.none)
                errs.Add(aO7.name, 'PrepUrlsSnd()', `для тега <${aO7.snd.tagName}> '${aO7.name}' `, '', `нет 'audio_play' или иных атрибутов url'а`)

            if (aO7.image.stop) {
                // if (!wshp.imgs) {                ???????
                //     wshp.imgs = wshp.Imgs()
                for (const name of ['stop', 'play']) {
                    const ori = W.consts[`btn-${name}`],
                        url = C.decodeUrl(ori) || ori

                    btns[name].src = url
                }
                // btns.stop = getBtnUrl('btn_stop') 
                // btns.play = getBtnUrl('btn_play') 
                // // }
                const urlatr = Imgs.prepImage(aO7, btns)
                if (urlatr.snd)
                    urlattrs.push(urlatr)

                if (snd.src) Imgs.regiBySrc(snd)
            }
            else
                if (aO7.srcAtr) // если есть адрес - пробую перекодировать
                    PrepOther(aO7)

            doAct.waitActivate(snd)

            // Object.seal(aO7.modis) // м.б. изменено 'none'
            Object.freeze(aO7.parms)
            found++
        }

            
        if (!found){
            console.log("%c%s", W.consts.fmtErr, `Отсутствует '${W.clasn}'`,
                `в документе или в его тегах с 'olga-start' (либо вообще, либо без 'o-none' и ':N')`)
                return
                }
                
    for (const eve of ['o_isHidden', 'blur', 'pagehide', 'dblclick'])
        C.E.AddEventListener(document, eve, StopSoundOnPage)

    /*
                PrepareAudios
    */
    const audios = C.GetTagsByTagNames('audio', modul),
        efirsts = ['mouseenter', 'focusin'],
        OnPlay = (audio) => {
            window.dispatchEvent(new CustomEvent('o_stopSound', { detail: { tag: audio, type: 'audio(тег)', } }))
            const a = W.act.audio
            if (a && a != audio)
                doAct.stopSound(a.aO7snd)

            W.act.audio = audio
        },
        OnEnter = (e) => {
            const audio = e.target
            audio.setAttribute('src', audio.aO7snd.url)
            efirsts.forEach(efirst => audio.removeEventListener(efirst, OnEnter))
        }

    for (const audio of audios) {
        const aO7 = audio.aO7snd = {
            url: '',
            audio: audio,
            sound: { state: Act.stop, },
            name: C.MakeObjName(audio),
            attrs: C.getAttrs(audio.attributes),
        }

        const name = C.MakeObjName(audio),
            ori = W.getUrlForTag(audio, 'src', 'audio_play')

        if (ori.url) {
            const url = C.decodeUrl(ori) || ori
            src = audio.getAttribute('src')
            if (ori.url != src) {
                aO7.url = url
                efirsts.forEach(efirst => audio.addEventListener(efirst, OnEnter))
            }
            if (url != src)
                urlattrs.push({ snd: name, atr: 'src', url: url, 'ориг.': ori.url })

            audio.addEventListener('play', e => { OnPlay(e.target) })
        }
        else
            errs.Add(name, 'PrepUrlsAudio()', `тег 'audio'`, '', `Нет 'audio_play', 
                            ${'data-' + aO7.srcAtr}, ${'_' + aO7.srcAtr}, ${aO7.srcAtr}`)
    }

    if (urlattrs.length > 0)
        if (C.consts.debug > 0) C.ConsoleInfo(`Всего выполнено подстановок snd/audio`, urlattrs.length, urlattrs)

    if (errs.length > 0)
        C.ConsoleError(`${modul}: ошибки перекодировки тегов с ${wshp.W.clasn}`, errs.length, errs)



    errs.Add = function (name, url, txt, atr, err) {
        this.push({ snd: name, 'источник': url, 'пояснение': txt, val: atr, 'ошибка': err })
    }
}

C.E.AddEventListener(window, 'o_stopSound', e => {
    if (W.act.audio && W.act.audio != e.detail.tag)
        doAct.stopSound(W.act.audio.aO7snd)
    // console.log(act.id, 5, e.detail)
})
