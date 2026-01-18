/**
 * o5 — ESM-библиотека с динамически подключаемыми feature-модулями.
 *
 * Архитектура:
 * - index.js — orchestrator
 * - com/     — общее API (C)
 * - <name>/  — feature-модули с init()
 *
 * Feature-модуль:
 * - не имеет сайд-эффектов при импорте
 * - экспортирует функцию init()
 *
 * Подключение (пример) :
 * <script type="module" src="/o5/index.js" data-modules="inc,shp,snd"></script>
 */

import { initCom } from './com/index.js'
export const C = {}

const
    dataset = (() => {
        const
            url = new URL(import.meta.url, document.baseURI).href,
            script = [...document.scripts].find(s =>
                s.src && new URL(s.src, document.baseURI).href === url
            )

        return script?.dataset ?? {}
    })(),
    modules = dataset?.modules?.trim().split(/\s*,\s*/g)

C.fmtOK = "background: cornsilk; color: black;"
C.fmtErr = "background: yellow; color: black;"
C.loadScripts = async function load(tyoe, inames) {
    for (const iname of inames) {
        try {
            const mod = await import(iname)
            await mod.init?.()
        } catch (e) {
            console.error("%c%s", C.fmtErr, `${type} '${iname}': `, `ошибка загрузки`, e)
        }
    }
}
C.freezeObjs = (obj, pref) => {
    for (const field of Object.getOwnPropertyNames(obj)) {
        if (pref && !field.startsWith(pref)) continue

        const desc = Object.getOwnPropertyDescriptor(obj, field)
        desc.configurable = false
        if ('value' in desc)
            desc.writable = false

        Object.defineProperty(obj, field, desc)
    }
    return obj
}

C.freezeObjs(C)
initCom(C)

if (modules && modules.length)
    C.loadScripts('ядро', modules.map(m => `./${m}/index.js`))