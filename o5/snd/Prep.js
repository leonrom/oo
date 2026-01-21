/* global window, document, console, CustomEvent, alert */
/*jshint asi:true  */
/*jshint strict:true  */
/*jshint esversion: 6 */

import { C } from '../index.js'
import { AO5snd } from './AO5snd.js'
import { sndAct } from './sndAct.js'
import { Imgs } from './Imgs.js'
const
    modul = 'snd',
    // modulname = 'Prep',
    debug = C.consts.debug,
    // lognam = `${olga_modul}/${modulname} `,

		 mtags = C.SelectByClassName('olga5-snd', modul),
    StopSoundOnPage = () => {
        if (wshp.actaudio)
            wshp.StopSound(wshp.actaudio.aO5snd)
    },
    TryEncode = (ori, tag) => {
        const wref = C.DeCodeUrl(wshp.W.urlrfs, ori.url, tag ? tag.aO5snd.attrs : '')
        if (wref.err.length > 0)
            errs.Add(C.MakeObjName(tag), ori.url, "декодир. ссылки", ori.atr, wref.err)
        return wref.url
    },
    urlattrs = [],
    errs = [],
    btns = { stop: '', play: '' },
            DecodeAttrs = (mtag) => {
                const snd = mtag.tag,
                    scls = snd.className,
                    aO5 = snd.aO5snd,
                    modis = aO5.modis,
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
                    errs.Add(aO5.name, scls, 'квалиф. класса', ers.join(', '), "ошибочные квалиф.")

                if (!modis.aplay && !modis.none)
                    errs.Add(aO5.name, scls, `игнор остальных квалиф.`, 'audio_play', "нету аудио-квалиф.")

                if (aO5.modis.none) snd.classList.add('o-sndNone')

                if (!snd.alt || (snd.alt.trim() == '')) snd.alt = snd.title.trim()
            },
            PrepOther = aO5 => {
                const snd = aO5.snd,
                    srcAtr = aO5.srcAtr,
                    ori = wshp.OriForTag(snd, srcAtr, '')

                if (ori.url) {
                    const url = TryEncode(ori, snd)
                    if (url != snd[srcAtr]) {
                        snd.setAttribute(srcAtr, url)
                        urlattrs.push({ snd: aO5.name, atr: srcAtr, url: url, 'ориг.': ori.url })
                    }
                }
                else
                    errs.Add(aO5.name, 'PrepUrlsAudio()', `тег <${aO5.snd.tagName}>`, '', `Нет ${'data-' + srcAtr}, ${'_' + srcAtr} или ${srcAtr}`)

                if (ori.atr == 'data-' + srcAtr || ori.atr == '_' + srcAtr)
                    snd.removeAttribute(ori.atr)	// чтоб другие модули не повторяли

            },
            GetBtnUrl = (atr) => {
                const ori = { url: wshp.W.urlrfs[atr], atr: atr }

                if (ori.url) {
                    const url = TryEncode(ori, null)
                    if (url != ori.url)
                        urlattrs.push({ snd: atr, atr: ori.atr, url: url, 'ориг.': ori.url })
                    return url
                }
            }

        for (const mtag of mtags) {
            const snd = mtag.tag,
                tagName = snd.tagName.toLowerCase()

            if (tagName.match(/audio/i)) continue

            const aO5 = AO5snd(snd)

            if (mtag.quals && mtag.quals.length > 0) {
                DecodeAttrs(mtag)

                const ori = { url: aO5.modis.aplay, atr: 'audio_play' }
                if (ori.url) {
                    const url = TryEncode(ori, snd)
                    aO5.parms.audio_play = url
                    urlattrs.push({ snd: aO5.name, atr: ori.atr, url: url, 'ориг.': ori.url })
                }
            }
            else if (!aO5.modis.none)
                errs.Add(aO5.name, 'PrepUrlsSnd()', `для тега <${aO5.snd.tagName}> '${aO5.name}' `, '', `нет 'audio_play' или иных атрибутов url'а`)

            if (aO5.image.stop) {
                // if (!wshp.imgs) {                ???????
                //     wshp.imgs = wshp.Imgs()
                    btns.stop = GetBtnUrl('btn_stop') || ''
                    btns.play = GetBtnUrl('btn_play') || ''
                // }
                const urlatr = Imgs.prepImage(aO5, btns, TryEncode)
                if (urlatr.snd)
                    urlattrs.push(urlatr)

                if (snd.src) Imgs.regiBySrc(snd)
            }
            else
                if (aO5.srcAtr) // если есть адрес - пробую перекодировать
                    PrepOther(aO5)

            sndAct.waitActivate(snd)

            // Object.seal(aO5.modis) // м.б. изменено 'none'
            Object.freeze(aO5.parms)
        }

        // C.E.AddEventListener('o_isHidden', StopSoundOnPage)
        window.addEventListener('o_isHidden', StopSoundOnPage)
        for (const eve of ['blur', 'pagehide', 'dblclick'])
            document.addEventListener(eve, StopSoundOnPage)

        /*
                    PrepareAudios
        */
        const audios = C.GetTagsByTagNames('audio', modul),
            efirsts = ['mouseenter', 'focusin'],
            OnPlay = (audio) => {
                window.dispatchEvent(new CustomEvent('o5snd_stopSound', { detail: { tag: audio, type: 'audio(тег)', } }))
                const a = wshp.actaudio
                if (a && a != audio)
                    wshp.StopSound(a.aO5snd)

                wshp.actaudio = audio
            },
            OnEnter = (e) => {
                const audio = e.target
                audio.setAttribute('src', audio.aO5snd.url)
                efirsts.forEach(efirst => audio.removeEventListener(efirst, OnEnter))
            }

        for (const audio of audios) {
            const aO5 = audio.aO5snd = {
                url: '',
                audio: audio,
                sound: { state: Act.stop, },
                name: C.MakeObjName(audio),
                attrs: C.GetAttrs(audio.attributes),
            }

            const name = C.MakeObjName(audio),
                ori = wshp.OriForTag(audio, 'src', 'audio_play')

            if (ori.url) {
                const url = TryEncode(ori, audio),
                    src = audio.getAttribute('src')
                if (ori.url != src) {
                    aO5.url = url
                    efirsts.forEach(efirst => audio.addEventListener(efirst, OnEnter))
                }
                if (url != src)
                    urlattrs.push({ snd: name, atr: 'src', url: url, 'ориг.': ori.url })

                audio.addEventListener('play', e => { OnPlay(e.target) })
            }
            else
                errs.Add(name, 'PrepUrlsAudio()', `тег 'audio'`, '', `Нет 'audio_play', 
                            ${'data-' + aO5.srcAtr}, ${'_' + aO5.srcAtr}, ${aO5.srcAtr}`)
        }

        if (urlattrs.length > 0)
            if (C.consts.debug > 0) C.ConsoleInfo(`Всего выполнено подстановок snd/audio`, urlattrs.length, urlattrs)

        if (errs.length > 0)
            C.ConsoleError(`${modul}: ошибки перекодировки тегов с ${wshp.W.class}`, errs.length, errs)
    


errs.Add = function (name, url, txt, atr, err) {
    this.push({ snd: name, 'источник': url, 'пояснение': txt, val: atr, 'ошибка': err })
}

export const Prep = {
    init:()=>{
console.log('Prep.init')
    },
    OriForTag: (tag, ref, atnam) => {
        const ori = { url: '', atr: '' },
            attr = atnam ? C.GetAttribute(tag.aO5snd.attrs, atnam) : ''
        if (attr)
            Object.assign(ori, { url: attr.value, atr: atnam })
        else
            if (ref) {
                const td = C.TagDes(tag, ref)
                if (td)
                    Object.assign(ori, { url: td.orig, atr: td.from })
            }
        return ori
    },
}

window.addEventListener('o5snd_stopSound', e => {
    if (wshp.actaudio && wshp.actaudio != e.detail.tag)
        wshp.StopSound(wshp.actaudio.aO5snd)
    // console.log(act.id, 5, e.detail)
})
