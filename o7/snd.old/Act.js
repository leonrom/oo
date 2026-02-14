import { C } from '../index.js'
import { W } from './snd.js'
import { Imgs } from './Imgs.js'
import { Eve } from './Eve.js'
/*
+ mouseleave  когда курсор манипулятора (обычно мыши) перемещается за границы элемента.
- mouseout    когда курсор покидает границы элемента или одного из его дочерних элементов
+ mouseenter  не отправляется никаким потомкам, когда указатель перемещается из пространства 
- mouseover   отправляется в самый глубокий элемент дерева DOM, затем оно всплывает в иерархии
*/
// eFocus = ['pointerenter', 'focus'],
// eBlurs = ['pointerleave', 'blur'],

let sndAct, debug;
const
    eFocus = ['mouseenter', 'focus'],
    eBlurs = ['mouseleave', 'blur'],
    GetTargetObj = e => {
        let obj = e.target
        while (obj && !obj.aO7snd) obj = obj.parentElement
        if (obj && obj.aO7snd) return obj
    },
    waitAct = (snd, start) => {
        for (const eve of eFocus)
            snd[(start ? 'add' : 'remove') + 'EventListener']
                (eve, Activate, { capture: true })
    },
    setVolume = {
        step: 0.1,
        vmin: 0.2,
        vmax: 1.0,
        SetV: (aO7, add) => {
            if (add == 0) aO7.SetTitle(``)
            else {
                const audio = aO7.sound.audio,
                    v = audio.volume + add * setVolume.step,
                    txt = `громкость=${parseInt(v * 100)}%`

                audio.volume = v > setVolume.vmax ? setVolume.vmax : (v < setVolume.vmin ? setVolume.vmin : v)
                aO7.SetTitle( txt)
                if (debug > 1)
                    console.log(`${lognam} Изменено: ${txt} для '${aO7.name}' }`)
            }
        }
    },
    Activate = e => {
        const snd = GetTargetObj(e),
            aO7 = snd.aO7snd,
            PlayError = (aO7, e) => {
                if (debug > 0) console.error(`--> PlayError ${aO7.name}`, e)
                if (e.name == 'TypeError') aO7.AddError('ошибкаКода')
                else if (e.name == 'NotAllowedError') aO7.AddError('неРазрешен')
                else if (e.code != 20) aO7.AddError('естьОшибка',
                    `e.type='${e.type}'` + e.code ? `\n\tcode= '${e.code}': ${e.message}` : ``)
            },
            StopBubble = e => {
                e.stopPropagation()  // 
                e.preventDefault()
                e.cancelBubble = true
                return false
            },
            CallstartSound = e => {
                const snd = GetTargetObj(e),
                    aO7 = snd.aO7snd,
                    sound = aO7.sound

                Object.assign(aO7.sound, { ison: true, shiftKey: e.shiftKey ? (e.location == 2 ? 1 : -1) : 0 })

                if (e.type == 'click') {
                    const isA = snd.tagName.toUpperCase() == 'A'
                    switch (sound.state) {
                        case W.state.pause:
                            if (isA) {
                                aO7.stopSound()
                                return // чтобы избежать StopBubble(e)
                            }
                            else sound.audio.play()
                            break
                        case W.state.stop: aO7.startSound(); break
                        case W.state.play:
                            sound.audio.pause()
                            setState(aO7, W.state.pause)
                    }

                    if (isA)
                        return StopBubble(e)
                }
                else
                    if (eFocus.includes(e.type))
                        switch (sound.state) {
                            case W.state.pause: sound.audio.play(); break
                            case W.state.stop: if (aO7.modis.over) aO7.startSound(); break
                            // default: return
                        }
            },
            CallstopSound = e => {
                const snd = GetTargetObj(e),
                    aO7 = snd.aO7snd

                if (eBlurs.includes(e.type)) {
                    aO7.sound.ison = false
                }
                if (aO7.sound.state != W.state.stop &&
                    snd.style.display != 'none' &&
                    (!aO7.modis.alive || aO7.sound.audio.paused)) {

                    aO7.stopSound()

                    aO7.SetTitle( '')
                    if (e.type == 'click') // для любых тегов - только лишь остановить музон
                        return StopBubble(e)
                }
            },
            DoKeyDown = e => {
                const snd = GetTargetObj(e),
                    aO7 = snd.aO7snd,
                    sound = aO7.sound,
                    key = e.key.match(/ArrowUp|ArrowRight/) ? 1 :
                        (e.key.match(/ArrowDown|ArrowLeft/) ? -1 : 0)
                if (sound.ison && sound.audio.played && key != 0) {
                    setVolume.SetV(aO7, key)
                    return StopBubble(e)
                }
            },
            audio = aO7.sound.audio = new Audio() // ocument.createElement('audio'),

        if (debug > 1)
            console.log(`${lognam}  Activate тега '${aO7.name}' с типом '${e.type}'`)

        setVolume.SetV(aO7, 0)


        waitAct(snd, false)

        Object.assign(audio, { aO7snd: aO7, src: aO7.aplay.url, autoplay: false, controls: false, muted: false, loop: false, crossorigin: "" })
        audio.load()

Eve.addEvents(audio)
        Object.assign(aO7.sound, { ison: true, shiftKey: e.shiftKey ? (e.location == 2 ? 1 : -1) : 0 })
        if (!aO7.image.play)
            //                             не удалять! проверить!!  
            if (aO7.aplay.image)
                Imgs.makeImgPlay(aO7, SetEventListeners)  
            else
                aO7.image.play = aO7.image.stop

        Eve.SetEventListeners(snd)
    }

export const Act = {
    waitActivate: snd => {
        debug = C.consts.debug

        if (snd.aO7snd.modis.none || snd.aO7snd.act.activated)
            return

        if (C.consts.debug > 1)
            console.log(`${lognam}  WaitActivate ${C.getObjName(snd)}`)

        snd.aO7snd.act.activated = true
        sndAct = snd
        waitAct(snd, true)
        // snd.addEventListener('keydown', DoKeyDown, { capture: true })
    },
}