// не поспевает за мышкой!

let C;

import { Drag } from './Drag.js'
const logName = 'pop.Wnd : ',
    // -------------- общее ------------------------
    makeDiv = url => {
        const div = document.createElement('div'),
            title = `Изменить размеры или\n (при shift) перетащить`
        div.className = Div.clasW
        div.innerHTML = `
            <div class="wnd-bar" title="${url}">
                <span class="wnd-head"  title="Перетащить окно"> ? </span>
                <div class="wnd-btns" title="${url}">
                    <button class="wnd-open" title = 'Переоткрыть в новой вкладке'>↗</button>
                    <button class="wnd-close" title = 'Закрыть это окно'>✖</button>
                </div>
            </div>
            <div class="wnd-body">
                <div class="wnd-loader">
                    <p>Открытие страницы:</p>
                    <p  class="wnd-loader-url">${url}</p>
                    <p>при ошибке - кликните &nbsp; <button class="wnd-open-big">↗</button></p>
                </div>
            </div>
            <div class="wnd-resize L T" title="${title}"></div>
            <div class="wnd-resize R T" title="${title}"></div>
            <div class="wnd-resize L B" title="${title}"></div>
            <div class="wnd-resize R B" title="${title}"></div>
        `
        //                <div class="wnd-dring" ></div>
        // div.style.resize = 'both'
        div.style.resize = 'none'
        div.style.overflow = 'auto'
        return div
    },
    setDivEvents = act => {
        const
            div = Div.aO7div.div,
            F = act ? div.addEventListener : div.removeEventListener

        F('pointerup', Drag.finish)
        F('pointercancel', Drag.finish)
        F('lostpointercapture', Drag.finish)

        F('pointermove', Div.action)

        Div.aO7div.setFrameAct(!act)
    }
// ---------------- тег окна ----------------
export class Div {  // нельзя как класс из-за document.createElement
    static ACT = 'active'
    static clasW = ''
    static action = null
    static aO7div = null  // action - обнуляется, а aO7div - сохраняется для контроля

    static prepare(c, clasw) {
        C = c
        Div.clasW = clasw
    }

    static beginDrag(aO7div, e) {
        if (Div.action) {
            C.ConsoleAlert(`Повтор drag:`, `новое= ${aO7div.wnd.aO7?.name || '?'}, старое= ${Div.aO7div.wnd.aO7.name}`)
            Div.endDrag(Div.aO7div)
            return
        }

        const
            target = e.target,
            classList = target.classList

        e.preventDefault()
        Div.aO7div = aO7div
        Div.action = Drag.start(
            aO7div,
            classList.contains('wnd-resize'),
            classList.contains('R'),
            classList.contains('B'),
            e.clientX,
            e.clientY,
            target === aO7div.head
        )

        setDivEvents(true)
    }

    static endDrag(e) {  // также  м.б. undefined или Event
        if (Div.action)
            setDivEvents(false)
        else
            C.ConsoleAlert(`Отключение старого (пустого)  drag:`, `старое= ${Div.aO7div?.wnd?.aO7?.name || '?'}`)
        // `новое= ${aO7div.wnd?.aO7?.name || '?'}, старое= ${Div.aO7div?.wnd?.aO7?.name || '?'}`)
        Div.action = null

        Drag.finish()  //  это безопасно, т.к. там есть все проверки

        if (Div.aO7div.div)
            Div.aO7div.wnd.aO7.savePos(Div.aO7div.div)

        // const r = Div.aO7div.div.getBoundingClientRect()
        // Object.assign(Div.aO7div.size, { y: r.top, x: r.left, w: r.width, h: r.height })
    }

    constructor(wnd) {
        const
            div = makeDiv(wnd.url),
            D = s => div.querySelector(s)

        Object.assign(this, {
            // is_aO7div: true,      // признак что это aO7diiv
            div: div,
            wnd: wnd,
            // size: {},
            isKey: false,
            iframe: null,
            bar: D('.wnd-bar'),
            body: D('.wnd-body'),
            head: D('.wnd-head'),
            btns: D('.wnd-btns'),
            bOpen: D('.wnd-open'),
            bClose: D('.wnd-close'),
            loader: D('.wnd-loader'),
            bOpenB: D('.wnd-open-big'),
        })
        this.div.style.position = 'fixed'
        this.div.aO7div = this
        this.bar.title = wnd.url

        Object.seal(this)

        document.body.appendChild(this.div)
    }

    // calcSize(aO7, actWs) {
    //     const
    //         r = { ...aO7.size },
    //         thisWnd = this.wnd,
    //         checkShift = () => {
    //             for (const actW of actWs)
    //                 if (actW.wnd !== thisWnd) {
    //                     const
    //                         aO7div = actW.wnd.aO7div,
    //                         bH2 = Math.max(aO7div.bar.offsetHeight * 0.9, 4),  // давать та,- для текущего еще не определены
    //                         bW2 = Math.max(aO7div.btns.offsetWidth * 0.8, 6),
    //                         sizo = aO7div.size

    //                     if ((Math.abs(r.x - sizo.x) < bW2) &&
    //                         (Math.abs(r.y - sizo.y) < bH2)
    //                     ) {
    //                         r.x = sizo.x + bW2
    //                         r.y = sizo.y + bH2
    //                         checkShift()
    //                     }
    //                 }
    //         }

    //     checkShift()

    //     Object.assign(this.size, r)
    // }
    setSize(r) {
        // const r = this.size
        Object.assign(this.div.style, {
            top: `${r.y}px`,
            left: `${r.x}px`,
            width: `${r.w}px`,
            height: `${r.h}px`,
        })
    }
    doAction(e) {
        if (C.consts.debug)
            console.log(logName, `doAction: ${e.type} className='${e.target.className}' `)

        const target = e.target
        if (
            target === this.bClose ||
            target === this.bOpenB ||
            target === this.bOpen ||
            target === this.btns
        ) {
            this.wnd.close(C.IsKey(e))  //  e.shiftKey)
            if (target === this.bOpen || target === this.bOpenB)
                window.open(this.wnd.url, 'olga-wnd-open')
        }
        else
            Div.beginDrag(this, e)
    }
    setFrameAct(act) {
        this.iframe.style.pointerEvents = act ? '' : 'none'
        this.iframe.classList[act ? 'remove' : 'add']('none')      // чисто для виз. контроля
    }
    markAsAct(act) {
        // this.iframe.style.pointerEvents = act ? '' : 'none'
        this.bar.classList[act ? 'add' : 'remove'](Div.ACT)
        this.body.classList[act ? 'remove' : 'add']('none')
        this.setFrameAct(act)
    }
    activateFrame(aO7) {
        // if (!!aO7 === !!this.iframe?.aO7) {  - делать через wnd.act
        //     C.ConsoleAlert(`Повтор ${aO7 ? '' : 'де'}активации iframe`,
        //         ` aO7='${aO7 ? aO7.name : ""}',  iframe.aO7='${this.iframe.aO7 ? this.iframe.aO7.name : ""}'`)
        //     return
        // }
        this.div.style.display = aO7 ? '' : 'none'
        this.head.innerText = aO7 ? aO7.tag.innerText : '?'
        if (aO7) {   // createFrame

            this.bar.style.display = (aO7.mode === 'O') ? 'none' : ''

            const iframe = this.iframe = document.createElement('iframe')

            iframe.className = 'wnd-frame'
            iframe.tabIndex = 0     // чтобы стало фокусируемым
            iframe.src = aO7.url
            // iframe.aO7 = aO7

            iframe.onerror = () => C.ConsoleError(`Ошибка загрузки url"`, iframe.src)
            iframe.onload = (e) => {
                console.log(`загружено ${iframe.src}`)
                this.loader.style.display = 'none'
            }
            iframe.onload = () => {
                this.loader.style.display = 'none'
                try {
                    const doc = iframe.contentDocument

                    if (doc.title.includes('404'))
                        console.log(`404 ${iframe.src}`)
                    else
                        console.log(`загружено ${iframe.src}`)

                } catch (e) {
                    console.log('Нет доступа - чужой домен', e.message)
                }
            }

            this.loader.style.display = ''

            this.setFrameAct(true)

            // this.body.appendChild(iframe)
            this.body.insertBefore(iframe, this.dring);
        }
        else {     //  destroyFrame
            this.iframe.remove()
            this.iframe = null
        }
    }
}