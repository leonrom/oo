/**
 * Page.js
 * в составе lib.js
 * 
 * Контроль обновления страницы (документа)
 * Вызывается после обновления документа и после загрузки каждого модуля
 * 
 * Для новой страницы:
 * 
 * В отладочном режиме проверяет включённость всех вставок - корректность модуля inc
 * записывает в C.cleanup  сброс таймера
 * отмечает все загруженные модули как "еще не исполненные"
 * вызывает выполнение загруженных модулей
 */

// let no=''
let C, tStart = 0;
import { Mods } from './Mods.js'
const
    page = Object.seal({ i: 0, url: '', timer: 0, entrances: 0, processing: false }),

    clrPage = "background: green;color:white;",
    // checkForInclude = () => {
    //     const incs =
    //         document.querySelector(`[data-o_include]`)
    //         || document.querySelector(`[o_include]`)
    //     if (C.modules.inc) {
    //         if (!incs)
    //             C.ConsoleInfo(`¿ Задан модуль 'inc' но отсутствует тег с атрибутом '(data-)${C.consts.o_include}' ?`)
    //     }
    //     else
    //         if (incs)
    //             C.ConsoleError(`Имеется тег с атрибутом '(data-)o_include' но отсутствует модуль 'inc'`)
    // },
    finishPage = txt => {

        const dt = performance.now() - tStart

        if (txt) {
            if (page.timer)
                window.clearTimeout(page.timer)

            tStart = 0
            console.log('%c%s', Mods.clr, `Страница  ${++page.i} ` + txt, page.url, (dt.toFixed() + ' ms').padStart(12))
        }
        else {
            const { sdone, sload } = Mods.getErrs()
            C.ConsoleError(` Обработка страницы прервана по таймеру  `,
                `\n\t страница: '${page.url}'` +
                `\n\t не загружены: [${sload.join(', ')}]` +
                `\n\t не выполнены: [${sdone.join(', ')}]`)
        }
        page.timer = 0

        // сообщаю всем о завершении загрузки        
        window.dispatchEvent(new CustomEvent('o-inited', { detail: { dt: dt, C:C} }))
    },
    test = W => {        // начало тестовый прогон
        // перед snapshot - 2 раза кнопку Memory → Collect garbage 	
        debugger;
        let count = 133
        const id = window.setInterval(
            () => {
                W.reset()
                performance.clearResourceTimings()
                W.init()
                console.log(`------------------------   `, count)
                if (count-- < 0) {
                    console.log(`перед snapshot - 2 раза кнопку Memory → Collect garbage    `)
                    window.clearInterval(id)
                    console.clear()
                    performance.clearResourceTimings()
                    debugger;
                }
            },
            900
        )
        // W.reset()                    // ОСТАВЬ !
        // конец тестовый прогон	
    }

export const Page = {
    prepare: function (c) {
        C = c
        Object.assign(page, { url: '', timer: 0 })
    },
    setNewPage: function () {
        const url = document.URL.match(/[^?&#]*/)[0].trim()
        if (page.url === url)
            return

        if (C.consts.debug > 0)
            console.log('%c%s', Mods.clr, " СТАРТ обработки страницы ", url)

        if (page.timer) // не нужно уже проверять page.url 
            finishPage('отменена')

        // if (C.consts.debug)
        //     checkForInclude()

        // no=''
        tStart = performance.now()

        C.pagedef.olga = document.getElementsByClassName('olga-start')

        Mods.startModules()

        page.url = url
        const timer =
            page.timer = window.setTimeout(
                () => {
                    if (page.timer === timer)
                        finishPage()
                },
                1000 * C.consts.timLoad
            )

        C.cleanup.push(() => window.clearTimeout(timer))

        this.executeModules()
    },
    markDone: function (e) {
        const name = e.detail?.module
        if (!name)
            C.ConsoleAlert(`Функция markDone получила 'e' баз 'module`)

//         if (C.consts.debug > 0)
//             console.log(`markDone: ${name}`)
// if (!no && name==='shp')
//     debugger
// no=name

        if (Mods.markDone(name)) {
            finishPage('обработана')
        }
    },
    // executeModules: function () {   // попытка исполнить неисполненные модули на загруженной странице
    //     if (!page.url)              // пока еще не нанадчем работать
    //         return

    //     if (page.entrances) {
    //         page.entrances++
    //         return
    //     }

    //     page.entrances = 1

    //     Mods.processModules()

    //     const wasNew = page.entrances > 1  // были новые "поступления"
    //     page.entrances = 0
    //     if (wasNew)
    //         this.executeModules()
    // },
    executeModules: function () {   // попытка исполнить неисполненные модули на загруженной странице
        if (!page.url)              // пока еще не нанадчем работать
            return

        page.entrances++
        if (page.processing)
            return

        page.processing = true

        try {
            while (page.entrances > 0) {
                page.entrances = 0
                Mods.processModules()
            }

        } finally {
            page.processing = false
        }
    }
}