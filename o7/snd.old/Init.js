/* global window, document, console, CustomEvent, alert */
/*jshint asi:true  */
/*jshint strict:true  */
/*jshint esversion: 6 */

import { C } from '../index.js'
import { W } from './snd.js'
import { AO7 } from './AO7.js'
import { Act } from './Act.js'
import { Imgs } from './Imgs.js'

const
    PrepOther = aO7 => {
        const snd = aO7.snd,
            ref = aO7.srcAtr,
            addr = W.getAddrForTag(snd, ref, '')

        if (addr) {
            const url = C.decodeUrl(addr.ori, aO7.name) 
            if (url != snd[ref]) {
                snd.setAttribute(ref, url)
                W.act.urlattrs.Push({ name: aO7.name, ref, url, ori: addr.ori })
            }
        }
        else
            addErr(aO7.name, 'PrepUrlsAudio()', `тег <${aO7.snd.tagName}>`, '', `Нет ${'data-' + ref}, ${'_' + ref} или ${ref}`)

        if (addr.atr == 'data-' + ref || addr.atr == '_' + ref)
            snd.removeAttribute(addr.atr)	// чтоб другие модули не повторяли
    },
    efirsts = ['mouseenter', 'focusin'],
    OnPlay = (audio) => {
        window.dispatchEvent(new CustomEvent('o_stopSound', { detail: { tag: audio, type: 'audio(тег)', } }))
        const a = W.act.audio
        if (a && a != audio)
            a.aO7snd.stopSound()

        W.act.audio = audio
    },
    // addErr = function (name, url, txt, atr, err) {
    addErr = (name, url, txt, atr, err) => {
        W.act.errs.Push({ name: name, 'источник': url, 'пояснение': txt, val: atr, 'ошибка': err })
    }

export const Init = {
    initByClass: function (tag) {
        if (
            tag.tagName.match(/audio/i) ||       //  эти пойдут отдельно
            tag.classList.contains('o-none') 
        )
            return


        const quals = C.extractQuals(tag, W.clasn)
        if (quals.length===0){
            addErr(aO7.name, 'initByClass()', `тег '${C.makeObjName(tag)}' `, '', `отсутствуют квалификаторы для class=${W.clasn}`)
            return
}

        const aO7 = new AO7(tag, quals)

        // act ??= W.act
        W.act.urlattrs.Push({ name: aO7.name,  url: aO7.aplay.url, ori: aO7.aplay.ori })            
       
        if (aO7.image.stop) {
            // if (!act.imgs) {
            //     act.imgs = Imgs()


            if (tag.src) Imgs.regiBySrc(tag)
        }
        else
            if (aO7.srcAtr) // если есть адрес - пробую перекодировать
                PrepOther(aO7)

        Act.waitActivate(tag)

        W.act.found.Push({name:aO7.name, ref:W.clasn, ori:aO7.aplay.ori,  url:aO7.aplay.url})
    },
    initForAudio: function (tag) {
        const
            ref = 'src',
            name = C.getObjName(tag),
            aO7 = tag.aO7snd = {
                url: '',
                audio: tag,
                name: name,
                sound: { state: W.state.stop, },
                attrs: C.getAttrs(tag.attributes),
            },
            addr = W.getAddrForTag(tag, ref, 'audio_play')

        // W.act ??= W.act
        if (addr) {
            const url = addr.url,
                src = tag.getAttribute(ref)
            if (url !== src) {
                aO7.url = url
                waitForMouseOver(tag)
                // W.act.urlattrs.Push({  name, ref, url, ori: addr.ori })
                // for (const efirst of efirsts)
                //     tag.addEventListener(efirst, OnEnter, { capture: true, once: true })
            }

            tag.addEventListener('play', e => { OnPlay(e.target) })
        }
        else
            addErr(name, 'PrepUrlsAudio()', `тег 'audio'`, '',
                `нет ни 'audio_play', ни ['_${ref}', 'data-${ref}', '${ref}']`)

        W.act.found.Push({ name, ref: addr.ref, ori: addr.ori, url: addr.url })
    },
    prepare: function () {
        C.E.AddEventListener(window, 'o_stopSound', e => {
            const audio = W.act.audio
            if (audio && audio != e.detail.tag)
                audio.aO7snd.stopSound()
        })
    }
}