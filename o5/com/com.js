/**
 * Формирует объект общего API `C`.
 *
 * Используется всеми feature-модулями.
 * Не зависит от feature-модулей.
 *
 * @exports C
 */

// import { C } from '../index.js'
import { extendC as CConsts } from './CConsts.js'
import { extendC as CConsol } from './CConsol.js'
import { extendC as CEncode } from './CEncode.js'
import { extendC as CParams } from './CParams.js'
import { extendC as CApi } from './CApi.js'
import { IniScripts } from './IniScripts.js'

export function init(C) {
    CConsts(C)      // д.б. самым первым
    CConsol(C)
    CEncode(C)
    CParams(C)
    CApi(C)

    Object.freeze(C)

    if (C.consts.debug)
        console.log(`Загружен 'com'`)

    if (C.consts.debug) (async function load() {
        const src = './CDebug.js'
        try {
            const mod = await import(src)
            await mod.showC(C)
        } catch (e) {
            console.error('%c%s', C.fmtErr, `'${src}': `, `ошибка загрузки`, e)
        }
    })()

    IniScripts()
}
