import { W } from './snd.js'

const eacts = [
    {
        type: 'error',
        Act: (snd, e) => {
            const aO7 = snd.aO7snd
            aO7.AddError('неЗагружен',
                `\n${e.type}: (это при url= '${aO7.aplay.url}') `)
        }
    },
    {
        type: 'play',
        Act: snd => {
            const aO7 = snd.aO7snd,
                sound = aO7.sound,
                errIs = sound.errIs
            if (aO7.sound.errIs.errs)
                for (const mrk in errTypes)
                    if (typeof mrk === 'string' && errIs[mrk])
                        aO7.RemError(mrk)

            // setState(aO7, W.state.play)  д.б. как результат действия play/stop
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
                aO7.stopSound()
        }
    },
    { type: 'abort', Act: (snd, e) => PlayError(snd.aO7snd, e) },
    { type: 'stalled', Act: (snd, e) => PlayError(snd.aO7snd, e) },
    { type: 'loadstart', Act: snd => snd.classList.add(W.clsLoad) },
    { type: 'loadeddata', Act: snd => snd.classList.remove(W.clsLoad) },
],
    doEvent = e => {
        const type = e.type,
            snd = GetTargetObj(e),
            aO7 = snd.aO7snd

        if (debug > 1) console.log(`${lognam}  OnPlayAct. 'audio'  ${('' + e.timeStamp).padStart(8)}` +
            ` для тега '${aO7.name}' с типом '${type}' при isOny= ${aO7.sound.ison}`)

        const eact = eacts.find(ea => ea.type == type)
        eact?.Act(snd, e)
    },
    stopSoundOnPage = () => {
        if (act.audio)
            act.audio.aO7snd.stopSound()
    },
    stopEves = ['o_isHidden', 'blur', 'pagehide', 'dblclick'],
    OnEnter = (e) => {
        const audio = e.target
        audio.setAttribute('src', audio.aO7snd.url)
        stopForMouseOver(audio)
        efirsts.forEach(efirst => audio.removeEventListener(efirst, OnEnter))
    }

export const Eve = {
    addEvents: function (snd) {
        for (const eact of eacts)
            audio.addEventListener(eact.type, doEvent, { capture: true })
    },

    removeEvents: function (snd) {
        for (const eact of eacts)
            audio.removeEventListener(eact.type, doEvent)

    },
    waitForStop: function () {
        for (const eve of stopEves)
            document.addEventListener(eve, stopSoundOnPage)
    },
    stopForStop: function () {
        for (const eve of stopEves)
            document.removeEventListener(eve, stopSoundOnPage)
    },
    SetEventListeners: snd => {
        for (const eBlur of eBlurs)
            snd.addEventListener(eBlur, CallstopSound, { capture: true })
        snd.addEventListener('keydown', DoKeyDown, { capture: true })
        snd.addEventListener('click', CallstartSound, { capture: true })
        if (snd.aO7snd.modis.over)
            aO7.startSound()
        for (const eFocu of eFocus)
            snd.addEventListener(eFocu, CallstartSound, { capture: true })
    },
    waitForMouseOver: function (tag) {
        for (const efirst of efirsts)
            tag.addEventListener(efirst, OnEnter, { capture: true, once: true })
    },
    stopForMouseOver: function (tag) {
        for (const efirst of efirsts)
            tag.addEventListener(efirst, OnEnter, { capture: true, once: true })
    }
}