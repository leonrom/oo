/**
 * CAO7.js
 * 
 * Класс CAO7  - обработка НЕ <audio> тегов
 * - обработка именованных ссылок
 * - обработка квалификаторов класса olga-snd воспроизведение аудио
 * - обработка событий мыши на теге
 */

import { AO7 } from './AO7.js'
import { Pick } from './Pick.js'
import { Play } from './Play.js'
import { Urls } from './Urls.js'

let C, clasn, firstLogCanPlay = true, audio;
const
    logName = 'snd.CAO7: '

function canPlayAfterClick(aO7, state) {
    if (Pick.firstClick() || Play.firstPlay()) {
        if (state < 0)
            aO7.tag.title = aO7.title

        return 1
    }
    if (state === 0) {
        aO7.tag.title = 'чтобы началось звучание - кликните на странице'
        if (firstLogCanPlay) {
            firstLogCanPlay = false
            console.log("%c%s", C.consts.fmtErr,
                `${logName} - необходимо кликнуть на странице `, `чтобы звучало при наведении курсора `)
        }
        return -1
    }
    return state
}
function initAudio() {
    audio = new Audio()

    audio.preload = "none" // сам всё делаю!
    audio.crossOrigin = 'anonymous'
    audio.aO7snd = null

    Play.addListeners(audio, 'мой audio')
}

function stopO7(txt, aO7) {
    if (audio && aO7.getStt()) {
        if (C.consts.debug > 1)
            console.log(logName, `stopO7 по '${txt}' для old='${audio.aO7snd.name}'`)

        audio.pause()
    }
}

async function setUrl(aO7, url) {
    aO7.needAudioSrc = false
    const tag = aO7.tag
    tag.url = await Urls.getUrl(aO7.url)

    if (!tag.url || tag.url.endsWith('/undefined')) {
        try {
            tag.url = await Urls.loadUrl(url, !aO7.errSrc)
        }
        catch (e) {
            aO7.needAudioSrc = true
        }
        finally {
            if (aO7.needAudioSrc) {
                if (!aO7.errSrc) {
                    if (C.consts.debug)
                        console.log("%c%s", C.consts.fmtErr, logName + `${aO7.name}': ошибка загрузки ${tag.id}:`, ` url="${tag.url}"`)

                    aO7.errSrc = true
                    tag.title = `Ошибка загрузки  аудио ` + (aO7.title ? `\n (${aO7.title})` : ``)
                    tag.classList.add(Urls.oERROR)
                }
            }
            else
                if (aO7.errSrc) {
                    if (C.consts.debug)
                        console.log("%c%s", C.consts.fmtOK, logName + ` загрузилось (после ошибки) '${aO7.name}'!`)

                    aO7.errSrc = false
                    tag.title = aO7.title
                    tag.classList.remove(Urls.oERROR)
                }
                else
                    if (C.consts.debug)
                        console.log("%c%s", C.consts.fmtOK, logName + ` загрузилось '${aO7.name}'!`)
        }
    }
}

async function playO7(txt, aO7) {
    // const audio = aO7.audio
    if (C.consts.debug > 1)
        console.log(logName, `playO7 по '${txt}' для '${aO7.name}',  old='${audio?.aO7snd ? audio.aO7snd.name : 'null'}'`)

    if (audio.aO7snd?.getStt() === Play.oSOUND)
        audio.aO7snd.setSTT('')     //      audio.pause() - не надо!

    audio.aO7snd = aO7
    if (aO7.needAudioSrc)
        aO7.setSTT(Play.oLOAD)

    await setUrl(aO7, aO7.url)

    // _этот_ файл загружен и уже в BLOB'е
    if (audio.aO7snd === aO7)
        audio.src = aO7.url
        audio.play()
}

export class CAO7 extends AO7 {

    static prepare(c, clsn) {
        C = c
        clasn = clsn
    }
    static reset() {
        C.makeForTypName(tag => tag.aO7snd.erase(), 'myclass', clasn)
    }

    #needAudioSrc = true
    #state = 0      // обработка заголовка titlee при наведении курсора

    constructor(tag, quals, ori) {
        super(tag, quals)

        this.url = new URL
            (ori ? C.decodeUrl(ori, this.name) : '',
                document.baseURI   // учитывает <base>
            ).href

        if (!audio)
            initAudio()

        this.audio = audio
        Object.seal(this)
    }
    get needAudioSrc() {
        return this.#needAudioSrc
    }
    set needAudioSrc(v) {
        this.#needAudioSrc = v
    }
    erase() {
        super.erase()
    }

    async onEnter(e, byClick) {
        if (C.consts.debug > 2)
            console.log(logName + (e ? `${e.type.padEnd(8)}` : `?`).padEnd(12) + ` на '${this.name}'`, 'entered=' + this.isEntered())

        if (!this.isEntered() || byClick) {
            super.onEnter(e)
            if (this.mode === AO7.M.OVER || this.mode === AO7.M.AVER) {
                if (this.#state !== 1)
                    this.#state = byClick ? 1 : canPlayAfterClick(this, this.#state)

                if (this.#state === 1 && (!Play.actO7() || byClick))
                    playO7('enter', this)
                else
                    await setUrl(this, this.url)
            }
        }
    }
    onLeave(e) {
        if (C.consts.debug > 2)
            console.log(logName + (e ? `${e.type.padEnd(8)}` : `?`).padEnd(12) + ` на '${this.name}'`, 'entered=' + this.isEntered())

        if (this.isEntered()) {
            super.onLeave(e)
            if (audio.aO7snd === this && this.mode === AO7.M.OVER)
                stopO7('leave', this)
        }
    }
    onClick(e) {
        // super.onClick(e)
        if (audio.aO7snd === this && this.getStt() === Play.oSOUND)
            stopO7('click', this)
        else
            if (e)
                playO7('click', this, true)
    }
    byClick() {
        return this.mode === AO7.M.CLICK
    }
}