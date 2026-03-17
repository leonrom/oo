/**
 * Pick.js
 * обработка событий мышина тегах
 * 
 * ловит события мыши на аудиотегах и вызывает их обработка в соотв. aO7
 */

const
    logName = 'snd.Pick: ',
    teves = Object.freeze({
        pointerover: 'enter',
        pointerout: 'leave',
        focusout: 'leave',
        focusin: 'enter',
        click: 'click',
    })

let prevO7, C, clasn;

function handler(e) {
    const tag = e.target, teve = teves[e.type]
    if (!teve) return

    const aO7 = tag.aO7snd || tag.aO7snd_ref  // в таком порядке
    // elsnd = tag.closest(`.${clasn}`),
    // aO7 = elsnd?.aO7snd 

    // игнорируем перемещения внутри одного контейнера
    if (e.relatedTarget) {
        const 
            rel = e.relatedTarget,
            rO7 = rel.aO7snd || rel.aO7snd_ref
        if (rO7 === aO7)
            return
    }

    if (aO7 && C.consts.debug > 2) {
        const name = C.getObjName(tag)
        console.log(logName, ` ${e.type.padEnd(12)} на '${name}':  '${aO7 ? aO7.name : '?'}'   prevO7='${prevO7 ? prevO7.name : '?'}'`)
    }

    if (teve === 'click') {
        Pick.firstClick.was = true
        if (aO7 && !aO7.isAUDIO)    // для <audio> будет проверяться не 'click', а 'play'
            aO7.onClick(e)
    }
    else        //   (teve === 'leave' || teve === 'enter') 
        if (prevO7 !== aO7) {
            if (prevO7)    // && tag.aO7snd_ref !== prevO7)
                if (!prevO7.isAUDIO)
                    prevO7.onLeave()

            if (aO7)
                if (teve === 'enter')
                    aO7.onEnter(e)
                else
                    if (!aO7.isAUDIO)
                        aO7.onLeave(e)
        }

    prevO7 = aO7
}

export const Pick = Object.freeze({
    firstClick: { was: false },
    init: function () {
        this.firstClick.was = false
    },
    prepare: function (c, clsn) {
        C = c
        clasn = clsn
        // for (const eve in teves)  -- теоретически может зацепить prototype.
        for (const eve of Object.keys(teves))
            document.addEventListener(eve, handler)
    },
})