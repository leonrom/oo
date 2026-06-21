/**
 * Формирует объект общего API `C`.
 *
 * Используется всеми feature-модулями.
 * Не зависит от feature-модулей.
 *
 * @exports C
 */

import { CConsts } from './CConsts.js'
import { CConsol } from './CConsol.js'
// import { CEvents } from './CEvents.js'
// import { CMsg } from './CMsg.js'
import { CApi } from './CApi.js'

export function com(script) {
    const
            dataset = script?.dataset ?? {},
            buri = document.baseURI,
        src = script.src
    // urlJS = new URL(import.meta.url, buri).href

    const C = {
        dataset: Object.freeze({ ...dataset }),
        myInclude: 'data-o_inc', // регистрирует ВСЕ мои вставки,
        // modLevels: {},
        // modules: {},
        cleanup: [],   //   подборка функций очистки вставок,
        owners: [],
        consts: {
            debug: 0, nomnu: 0, noact: 0, timLoad: 3,
            depends: "inc; pop:ref,snd; ref= inc; snd:ref; shp=snd, ref; mnu; tab",
            fmtOK: "background: cornsilk; color: black;",
            fmtErr: "background: yellow; color: black;",
            doscr: 'olga_sdone',
            _root: new window.URL(location).origin + '/',
            _olga: src.substring(0, src.lastIndexOf('/') + 1),
            _html: buri.substring(0, buri.lastIndexOf('/') + 1),
        },
        isDefined: c => typeof c !== 'undefined',
        splitStr: str => str.replace(/(#|\/\/).*$/gm, '') // убрать комментарии        
            .split(/[,;]/)	                			 // разбить на выражения
            .map(s => s.trim())
            .filter(Boolean)
    }

    // Object.freeze(C.dataset)
    // Object.freeze(C.modules)
    // Object.freeze(C.modLevels)

    CConsts(C)
    CConsol(C)
    // CEvents(C)
    // CMsg(C)
    CApi(C)

    C.IsKey = function (e) {
        return e.shiftKey || e.ctrlKey || e.altKey
    }
    C.mouse = Object.seal({ x: 0, y: 0, isKey: false })

    document.addEventListener('pointermove', e => {
        Object.assign(C.mouse, {
            x: e.clientX,
            y: e.clientY,
            // t: performance.now(),
            isKey: C.IsKey(e)     // e.shiftKey||0
        })
    }, { passive: true });

    Object.freeze(C)

    return C
}

