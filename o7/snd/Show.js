import { AO7 } from './AO7.js'

const eves = Object.freeze({
    play: 'play',
    pause: 'pause',
    ended: 'ended',
    error: 'error',
    playing: 'playing',
})

let C;

function showSound(eve, snd) {
    const cls = snd.classList
    for (const e in eves)
        if (e === eve)
            cls.add(eve)
        else
            if (e !== eves.error)
                cls.remove(e)
}

function doEve(e) {
    if (Curr.aO7) 
        showSound(e.type, Curr.aO7.snd)    
}

function setEves(isON, tag) {
    const Fun = isON ? tag.addEventListener : tag.removeEventListener
    for (const eve in eves){
        // console.log(Fun.name, tag.id, eve)
        Fun(eves[eve], doEve)}
}

export const Show = {
    // showSound: showSound,
    init: function (W) {
        // C.makeForTypName(tag => setEves(true, tag.aO7snd), 'myclass', W.clasn)
        setEves(true, AO7.comm.audio)
    },
    reset: function () {
        // C.makeForTypName(tag => setEves(false, tag.aO7snd), 'myclass', clasn)
        setEves(false, AO7.comm.audio)
    },
    prepare: function (c) {
        C = c
    },
}
