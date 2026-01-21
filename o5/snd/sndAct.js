export const sndAct = {
    stop: 'stop', play: 'play', pause: 'pause',

    Activate: e => {
        const snd = GetTargetObj(e),
            aO5 = snd.aO5snd,
            PlayError = (aO5, e) => {
                if (debug > 0) console.error(`--> PlayError ${aO5.name}`, e)
                if (e.name == 'TypeError') aO5.AddError('ошибкаКода')
                else if (e.name == 'NotAllowedError') aO5.AddError('неРазрешен')
                else if (e.code != 20) aO5.AddError('естьОшибка',
                    `e.type='${e.type}'` + e.code ? `\n\tcode= '${e.code}': ${e.message}` : ``)
            },
            eAudios = [
                {
                    type: 'error',
                    Act: (snd, e) => {
                        const aO5 = snd.aO5snd
                        aO5.AddError('неЗагружен',
                            `\n${e.type}: (это при audio_play= '${aO5.parms.audio_play}', attrs.aplay= '${aO5.modis.aplay}') `)
                    }
                },
                {
                    type: ss.play,
                    Act: snd => {
                        const aO5 = snd.aO5snd,
                            sound = aO5.sound,
                            errIs = sound.errIs
                        if (aO5.sound.errIs.errs)
                            for (const mrk in errTypes)
                                if (typeof mrk === 'string' && errIs[mrk])
                                    aO5.RemError(mrk)

                        aO5.setClasses(sndAct.play)
                        wshp.actaudio = sound.audio
                        wshp.activated = true
                    }
                },
                {
                    type: 'ended',
                    Act: snd => {
                        const aO5 = snd.aO5snd
                        if (aO5.modis.loop) {
                            const audio = aO5.sound.audio
                            audio.currentTime = 0
                            audio.play()
                        } else
                            wshp.StopSound(aO5)
                    }
                },
                { type: 'abort', Act: (snd, e) => PlayError(snd.aO5snd, e) },
                { type: 'stalled', Act: (snd, e) => PlayError(snd.aO5snd, e) },
                { type: 'loadstart', Act: snd => snd.classList.add(wshp.css.olga5sndLoad) },
                { type: 'loadeddata', Act: snd => snd.classList.remove(wshp.css.olga5sndLoad) },
            ],
            OnPlayAct = (e, eacts, txt) => {
                const type = e.type,
                    snd = GetTargetObj(e),
                    aO5 = snd.aO5snd

                if (debug > 1) console.log(`${lognam}  OnPlayAct.${txt}  ${('' + e.timeStamp).padStart(8)}` +
                    ` для тега '${aO5.name}' с типом '${type}' при isOny= ${aO5.sound.ison}`)

                eacts.find(eact => eact.type == type).Act(snd, e)
            },
            OnPlayActAudios = e => { OnPlayAct(e, eAudios, 'audio') },
            StopBubble = e => {
                e.stopPropagation()  // 
                e.preventDefault()
                e.cancelBubble = true
                return false
            },
            CallStartSound = e => {
                const snd = GetTargetObj(e),
                    aO5 = snd.aO5snd,
                    sound = aO5.sound

                Object.assign(aO5.sound, { ison: true, shiftKey: e.shiftKey ? (e.location == 2 ? 1 : -1) : 0 })

                if (e.type == 'click') {
                    const isA = snd.tagName.toUpperCase() == 'A'
                    switch (sound.state) {
                        case ss.pause:
                            if (isA) {
                                wshp.StopSound(aO5)
                                return // чтобы избежать StopBubble(e)
                            }
                            else sound.audio.play()
                            break
                        case ss.stop: sndAct.StartSound(aO5)
                            break
                        case ss.play:
                            sound.audio.pause()
                            aO5.setClasses(sndAct.pause)
                    }

                    if (isA)
                        return StopBubble(e)
                }
                else
                    if (eFocus.includes(e.type))
                        switch (sound.state) {
                            case ss.pause: sound.audio.play()
                                break
                            case ss.stop: if (aO5.modis.over) sndAct.StartSound(aO5)
                                break
                            // default: return
                        }
            },
            CallStopSound = e => {
                const snd = GetTargetObj(e),
                    aO5 = snd.aO5snd

                if (eBlurs.includes(e.type)) {
                    aO5.sound.ison = false
                }
                if (aO5.sound.state != ss.stop &&
                    snd.style.display != 'none' &&
                    (!aO5.modis.alive || aO5.sound.audio.paused)) {

                    wshp.StopSound(aO5)

                    SetTitle(aO5, '')
                    if (e.type == 'click') // для любых тегов - только лишь остановить музон
                        return StopBubble(e)
                }
            },
            DoKeyDown = e => {
                const snd = GetTargetObj(e),
                    aO5 = snd.aO5snd,
                    sound = aO5.sound,
                    key = e.key.match(/ArrowUp|ArrowRight/) ? 1 :
                        (e.key.match(/ArrowDown|ArrowLeft/) ? -1 : 0)
                if (sound.ison && sound.audio.played && key != 0) {
                    setVolume.SetV(aO5, key)
                    return StopBubble(e)
                }
            },
            SetEventListeners = snd => {
                for (const eBlur of eBlurs)
                    snd.addEventListener(eBlur, CallStopSound, { capture: true })
                snd.addEventListener('keydown', DoKeyDown, { capture: true })
                snd.addEventListener('click', CallStartSound, { capture: true })
                if (snd.aO5snd.modis.over)
                    sndAct.StartSound(aO5)
            },
            audio = aO5.sound.audio = new Audio() // ocument.createElement('audio'),

        if (debug > 1)
            console.log(`${lognam}  Activate тега '${aO5.name}' с типом '${e.type}'`)

        setVolume.SetV(aO5, 0)

        for (const eWait of eFocus) // убрал оба чтоб не срабатывали
            snd.removeEventListener(eWait, sndAct.Activate, { capture: true })

        Object.assign(audio, { aO5snd: aO5, src: aO5.parms.audio_play, autoplay: false, controls: false, muted: false, loop: false, crossorigin: "" })
        audio.load()

        for (const eAudio of eAudios)
            audio.addEventListener(eAudio.type, OnPlayActAudios, { capture: true })

        Object.assign(aO5.sound, { ison: true, shiftKey: e.shiftKey ? (e.location == 2 ? 1 : -1) : 0 })
        if (!aO5.image.play)
            //                             не удалять! проверить!!  
            // if (aO5.parms.image_play)
            //     wshp.imgs.makeImgPlay(aO5, SetEventListeners)  // StartSound, 
            // else
                aO5.image.play = aO5.image.stop

        for (const eFocu of eFocus)
            snd.addEventListener(eFocu, CallStartSound, { capture: true })
        SetEventListeners(snd)
    },
    // для доступа из snd
    waitActivate :snd=> {
        if (snd.aO5snd.modis.none ||
            snd.aO5snd.modis.activated
        )
            return

        if (debug > 1) console.log(`${lognam}  WaitActivate ${C.MakeObjName(snd)}`)

        snd.aO5snd.modis.activated = true
        for (const eWait of eFocus)
            snd.addEventListener(eWait, sndAct.Activate, { capture: true })
        // snd.addEventListener('keydown', DoKeyDown, { capture: true })
    },
    StartSound: aO5 => {
        const sound = aO5.sound,
            audio = sound.audio,
            Play = (aO5) => {
                if (debug > 1) console.log(`${lognam}   > Play()`)

                if (aO5.modis.over && !wshp.activated)
                    aO5.AddError('неАктивир.')

                if (sound.ison) { // если курсор не ушел
                    if (debug > 1) console.log(`${lognam} --> Play OK`)
                    try {
                        const audio = sound.audio
                        // audio.volume = aO5.sound.volume
                        audio.playbackRate = sound.shiftKey != 0 ? shift_speed : 1.0
                        if (sound.state != sndAct.pause) audio.currentTime = 0 // т.е. если перезапуск старого музона	
                        else audio.currentTime = Math.max(audio.currentTime - W.consts.return_time, 0)

                        audio.play()
                    }
                    catch (e) {
                        console.error(`ошибка воспроизведения:`, e.message)
                    }
                }
                else
                    wshp.StopSound(aO5)
            }

        if (debug > 1) console.log(`${lognam} --> StartSound() из '${aO5.sound.state}'`)

        if (wshp.actaudio && wshp.actaudio != audio)
            wshp.StopSound(wshp.actaudio.aO5snd)

        window.dispatchEvent(new CustomEvent('o5snd_stopSound', { detail: { tag: wshp.actaudio, type: 'audio(moe)', } }))

        if (audio.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA)
            Play(aO5)
        else {
            wshp.setClasses(aO5, Act.pause)
            audio.addEventListener('canplay', () => Play(aO5), { capture: true, once: true })
        }
    },

    StopSound: aO5 => {
        if (debug > 1) console.log(`${lognam}  StopSound (${aO5.name})`)

        // тут его НИЗЗЯ ! window.dispatchEvent(new CustomEvent('o5snd_stopSound', { detail: { tag: aO5.audio, type: 'audio', } }))

        wshp.actaudio = null

        const image = aO5.image,
            audio = aO5.audio ? aO5.audio : aO5.sound.audio

        audio.pause()
        audio.currentTime = 0
        aO5.sound.state = Act.stop

        if (image && image.play) {
            image.play.style.display = 'none'
            image.stop.style.display = aO5.modis.dspl
        }

        if (audio !== aO5.audio)
            setClasses(aO5, Act.stop)
    }

}
function setClasses(aO5, state) {
    if (debug > 1) console.log(`${lognam} setClasses (${aO5.name}, '${state}')`)
    const classList = (aO5.image.play ? aO5.image.play : aO5.snd).classList
    if (state == Act.play) {
        const image = aO5.image
        if (image.play) {
            image.stop.style.display = 'none'
            image.play.style.display = aO5.modis.dspl
        }
        classList.add('o-sndPlay')
        classList.remove('o-sndPause')
    }
    else if (state == Act.pause) {
        classList.remove('o-sndPlay')
        classList.add('o-sndPause')
    }
    else if (state == Act.stop) {
        classList.remove('o-sndPlay')
        classList.remove('o-sndPause')
    }
    else alert(`setClasses: state='${state}'`)
    aO5.sound.state = state
}