/**
 * Формирует объект общего API `C`.
 *
 * Используется всеми feature-модулями.
 * Не зависит от feature-модулей.
 *
 * @exports C
 */

import { C } from '../index.js'
import { extendC as CApi } from './CApi.js'
import { extendC as CConsole } from './CConsole.js'
import { extendC as CConsts } from './CConsts.js'
import { extendC as CEncode } from './CEncode.js'
import { extendC as CParams } from './CParams.js'
import { IniScripts } from './IniScripts.js'

export function initCom(C) {
    CConsts(C)
    CApi(C)
    CConsole(C)
    CEncode(C)
    CParams(C)

                const IMMUTABLE = { writable: false, configurable: false, enumerable: true }
            for (const field of Object.getOwnPropertyNames(this))
                Object.defineProperty(C, field, { ...IMMUTABLE, value: this[field] })

}
