/**
 * Проверка автономного запуска модуля и его инициализация
 */

// добавить проверку от "двойного" подключения !!!!!!!!!!!!!!!!!!!!!!!
let C, debug;
const
    askModul = modul => { // содержит ли текущий скрипт имя 'modul' в конце url'а
        const m = new RegExp(`.*\\/${modul}\\.js(\\b|\\?|&|#)`)
        for (const script of [...document.scripts])
            if (script.src && script.src.match(m))
                return script
    }
    // isDefined = c => typeof c !== 'undefined'

export async function Auto(W) {
    const
        addr = new URL(document.URL),
        match = addr.search.match(/\bdebug\b/),
        script = askModul(W.modul)
    // isAutonom = script?.dataset.modules

    debug = match && match[0] ? 3 : 0
    if (debug)
        console.log(`модуль '${W.modul}' ` +
            `запущен ${script ? 'автономно' : 'в составе библиотеки'}`)

    if (!script)    // вызывающий скрипт не есть этот модуль 
        return

    const mod = await import(`../com/com.js`)

    C = mod.com(script)

    // const
    //     cs = script.dataset.consts||'',
    //     ss = cs.split(/\s*[,;]\s*/)  // пары имя=значение для констант

    // for (const s of ss) {
    //     const
    //         us = s.split(/\s*=\s*/),
    //         key = us[0].trim(),
    //         val = (us[1] || '').trim()

    //     if (debug)
    //         console.log(`key=${key} = '${val}'`, isDefined(W.consts[key]) ? ' для W' : '')

    //     if (isDefined(W.consts[key])) W.consts[key] = val
    //     else
    //         C.consts[key] = val
    // }

    // Object.freeze(W.consts)

    // C.fillCss(W)

    if (C.fillW(W)) {
        W.act.auto = 1
        // if (W.prepare)
        //     W.prepare(C)
        // Object.freeze(W)

        function startAutonom() {
            // W.prepare(C)
            W.init()
        }
        if (document.readyState === 'loading')
            document.addEventListener('DOMContentLoaded', startAutonom)
        else
            startAutonom()
    }
}