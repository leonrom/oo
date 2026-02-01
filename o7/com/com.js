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
import { CEvents } from './CEvents.js'
// import { Cleanup } from './Cleanup.js'
import { CApi } from './CApi.js'
import { C } from '../index.js'

export function com() {

    CConsts()
    CConsol()
    CEvents()
    // Cleanup()
    CApi()
    Object.freeze(C)

    if (C.modules.dbg) {
        (async function load() {
            const src = './CDebug.js'
            try {
                const mod = await import(src)
                mod.showC(C)
            } catch (e) {
                console.error('%c%s', C.consts.fmtErr, `'${src}': `, `ошибка загрузки`, e)
            }
        })()
    }
}
