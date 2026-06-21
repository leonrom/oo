/**
 * ESM-библиотека с динамически подключаемыми feature-модулями.
 *
 * Архитектура:
 * - index.js — orchestrator
 * - com/     — общее API (C)
 * - <name>/  — feature-модули с prepare()
 *
 * Feature-модуль:
 * - не имеет сайд-эффектов при импорте
 * - экспортирует функцию prepare()
 *
 * Подключение (пример) :
 * <script type="module" src="./index.js" data-modules="inc,shp,snd"></script>
 */

import { com } from './com/com.js'
import { lib } from './lib/lib.js'

// export const C = {}
const
    buri = document.baseURI,
    urlJS = new URL(import.meta.url, buri).href,
    script = [...document.scripts].find(s =>
        s.src && new URL(s.src, document.baseURI).href === urlJS
    ),
    C = com(script)

if (C) 
    lib.prepare(C)
else
    console.error(`Нет модулей для обработки `)