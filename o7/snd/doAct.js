
import { W } from './snd.js'

const
    setClasses = (aO7, state) => {
        if (debug > 1) console.log(`${lognam} setClasses (${aO7.name}, '${state}')`)

        const classList = (aO7.image.play ? aO7.image.play : aO7.snd).classList

        if (state == Act.play) {
            if (aO7.image.play) {
                aO7.image.stop.style.display = 'none'
                aO7.image.play.style.display = aO7.modis.dspl
            }
            classList.add(W.clsPlay)
            classList.remove(W.clsPause)
        }
        else if (state == Act.pause) {
            classList.remove(W.clsPlay)
            classList.add(W.clsPause)
        }
        else if (state == 'stop') {
            classList.remove(W.clsPlay)
            classList.remove(W.clsPause)
        }
        else 
            alert(`setClasses: state='${state}'`)

        aO7.sound.state = state
    },
    stopSound = aO7 => {
        if (debug > 1) console.log(`${lognam}  stopSound (${aO7.name})`)

        // тут его НИЗЗЯ ! window.dispatchEvent(new CustomEvent('o_stopSound', { detail: { tag: aO7.audio, type: 'audio', } }))

        W.act.audio = null

        const image = aO7.image,
            audio = aO7.audio ? aO7.audio : aO7.sound.audio

        audio.pause()
        audio.currentTime = 0
        aO7.sound.state = 'stop'

        if (image && image.play) {
            image.play.style.display = 'none'
            image.stop.style.display = aO7.modis.dspl
        }

        if (audio !== aO7.audio)
            setClasses(aO7, 'stop')
    },
    startSound = aO7 => {
        const sound = aO7.sound,
            audio = sound.audio,
            Play = (aO7) => {
                if (debug > 1) console.log(`${lognam}   > Play()`)

                if (aO7.modis.over && !W.act.ready)
                    aO7.AddError('неАктивир.')

                if (sound.ison) { // если курсор не ушел
                    if (debug > 1) console.log(`${lognam} --> Play OK`)
                    try {
                        const audio = sound.audio
                        // audio.volume = aO7.sound.volume
                        audio.playbackRate = sound.shiftKey != 0 ? shift_speed : 1.0
                        if (sound.state != 'pause') audio.currentTime = 0 // т.е. если перезапуск старого музона	
                        else audio.currentTime = Math.max(audio.currentTime - W.consts.return_time, 0)

                        audio.play()
                    }
                    catch (e) {
                        console.error(`ошибка воспроизведения:`, e.message)
                    }
                }
                else
                    stopSound(aO7)
            }

        if (debug > 1) console.log(`${lognam} --> startSound() из '${aO7.sound.state}'`)

        if (W.act.audio && W.act.audio != audio)
            stopSound(W.act.audio.aO7snd)

        window.dispatchEvent(new CustomEvent('o_stopSound', { detail: { tag: W.act.audio, type: 'audio(moe)', } }))

        if (audio.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA)
            Play(aO7)
        else {
            setClasses(aO7, Act.pause)
            audio.addEventListener('canplay', () => Play(aO7), { capture: true, once: true })
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
            eAudios = [
                {
                    type: 'error',
                    Act: (snd, e) => {
                        const aO7 = snd.aO7snd
                        aO7.AddError('неЗагружен',
                            `\n${e.type}: (это при audio_play= '${aO7.parms.audio_play}', attrs.aplay= '${aO7.modis.aplay}') `)
                    }
                },
                {
                    type: ss.play,
                    Act: snd => {
                        const aO7 = snd.aO7snd,
                            sound = aO7.sound,
                            errIs = sound.errIs
                        if (aO7.sound.errIs.errs)
                            for (const mrk in errTypes)
                                if (typeof mrk === 'string' && errIs[mrk])
                                    aO7.RemError(mrk)

                        setClasses(aO7, 'play')
                        W.act.audio = sound.audio
                        W.act.ready = true
                    }
                },
                {
                    type: 'ended',
                    Act: snd => {
                        const aO7 = snd.aO7snd
                        if (aO7.modis.loop) {
                            const audio = aO7.sound.audio
                            audio.currentTime = 0
                            audio.play()
                        } else
                            stopSound(aO7)
                    }
                },
                { type: 'abort', Act: (snd, e) => PlayError(snd.aO7snd, e) },
                { type: 'stalled', Act: (snd, e) => PlayError(snd.aO7snd, e) },
                { type: 'loadstart', Act: snd => snd.classList.add(W.clsLoad) },
                { type: 'loadeddata', Act: snd => snd.classList.remove(W.clsLoad) },
            ],
            OnPlayAct = (e, eacts, txt) => {
                const type = e.type,
                    snd = GetTargetObj(e),
                    aO7 = snd.aO7snd

                if (debug > 1) console.log(`${lognam}  OnPlayAct.${txt}  ${('' + e.timeStamp).padStart(8)}` +
                    ` для тега '${aO7.name}' с типом '${type}' при isOny= ${aO7.sound.ison}`)

                eacts.find(eact => eact.type == type).Act(snd, e)
            },
            OnPlayActAudios = e => { OnPlayAct(e, eAudios, 'audio') },
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
                        case ss.pause:
                            if (isA) {
                                stopSound(aO7)
                                return // чтобы избежать StopBubble(e)
                            }
                            else sound.audio.play()
                            break
                        case ss.stop: startSound(aO7)
                            break
                        case ss.play:
                            sound.audio.pause()
                            setClasses(aO7, 'pause')
                    }

                    if (isA)
                        return StopBubble(e)
                }
                else
                    if (eFocus.includes(e.type))
                        switch (sound.state) {
                            case ss.pause: sound.audio.play()
                                break
                            case ss.stop: if (aO7.modis.over) startSound(aO7)
                                break
                            // default: return
                        }
            },
            CallstopSound = e => {
                const snd = GetTargetObj(e),
                    aO7 = snd.aO7snd

                if (eBlurs.includes(e.type)) {
                    aO7.sound.ison = false
                }
                if (aO7.sound.state != ss.stop &&
                    snd.style.display != 'none' &&
                    (!aO7.modis.alive || aO7.sound.audio.paused)) {

                    stopSound(aO7)

                    SetTitle(aO7, '')
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
            SetEventListeners = snd => {
                for (const eBlur of eBlurs)
                    snd.addEventListener(eBlur, CallstopSound, { capture: true })
                snd.addEventListener('keydown', DoKeyDown, { capture: true })
                snd.addEventListener('click', CallstartSound, { capture: true })
                if (snd.aO7snd.modis.over)
                    startSound(aO7)
            },
            audio = aO7.sound.audio = new Audio() // ocument.createElement('audio'),

        if (debug > 1)
            console.log(`${lognam}  Activate тега '${aO7.name}' с типом '${e.type}'`)

        setVolume.SetV(aO7, 0)

        for (const eWait of eFocus) // убрал оба чтоб не срабатывали
            snd.removeEventListener(eWait, sndAct.Activate, { capture: true })

        Object.assign(audio, { aO7snd: aO7, src: aO7.parms.audio_play, autoplay: false, controls: false, muted: false, loop: false, crossorigin: "" })
        audio.load()

        for (const eAudio of eAudios)
            audio.addEventListener(eAudio.type, OnPlayActAudios, { capture: true })

        Object.assign(aO7.sound, { ison: true, shiftKey: e.shiftKey ? (e.location == 2 ? 1 : -1) : 0 })
        if (!aO7.image.play)
            //                             не удалять! проверить!!  
            // if (aO7.parms.image_play)
            //     wshp.imgs.makeImgPlay(aO7, SetEventListeners)  // startSound, 
            // else
            aO7.image.play = aO7.image.stop

        for (const eFocu of eFocus)
            snd.addEventListener(eFocu, CallstartSound, { capture: true })
        SetEventListeners(snd)
    }

export const doAct = {    
    waitActivate: snd => {
        if (snd.aO7snd.modis.none ||
            snd.aO7snd.modis.active
        )
            return

        if (debug > 1) console.log(`${lognam}  WaitActivate ${C.MakeObjName(snd)}`)

        snd.aO7snd.modis.active = true
        for (const eWait of eFocus)
            snd.addEventListener(eWait, sndAct.Activate, { capture: true })
        // snd.addEventListener('keydown', DoKeyDown, { capture: true })
    },
    stopSound:stopSound,
}