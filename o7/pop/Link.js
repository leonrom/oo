/**
 * Структура хранения размеров в DB
  { w.
    h,
    0:{x, y},   // позиции хранятся отдельно для каждого квадранта
    1:{x, y},
    2:{x, y},
    3:{x, y},
    4:{x, y},
  }
 */
let C, actWs, aO7;

import { AO7 } from './AO7.js'
import { FS } from './FS.js'
import { DB } from './DB.js'

const
    initR = () => {        // определение квадранта всплытия окна
        const
            rtag = aO7.tag.getBoundingClientRect(),
            r = Object.seal({
                H: window.innerHeight, W: window.innerWidth,
                x: 0, y: 0, w: 0, h: 0,
                mx: 0, my: 0,
            })

        r.my = C.mouse.y
        if (r.my < rtag.top || r.my > rtag.top + rtag.height)
            r.my = rtag.top + 0.5 * rtag.height

        r.mx = C.mouse.x
        if (r.mx < rtag.left || r.mx > rtag.left + rtag.width)
            r.mx = rtag.left + 0.1 * rtag.width

        let n = aO7._geom
        if (n < 0 || n > 4)
            if (my < r.H / 2) n = (mx < r.W / 2) ? 4 : 3
            else
                n = (mx < r.W / 2) ? 2 : 1

        Object.assign(r, {
            n: n,
            w: aO7.wsiz.w,
            h: aO7.wsiz.h,
            x: aO7.wsiz[n].x,
            y: aO7.wsiz[n].y,
        })
        return r
    },
    calcPos = () => {
        let x, y, dx = 0, dy = 0
        const
            checkShift = () => {    // подвинуть относительно уже открытых
                for (const actW of actWs) {
                    const aO7 = actW.aO7
                    if (aO7 && aO7 !== aO7) {
                        const
                            aO7div = actW.aO7div,
                            bH2 = Math.max(aO7div.bar.offsetHeight * 0.9, 4),  // давать та,- для текущего еще не определены
                            bW2 = Math.max(aO7div.btns.offsetWidth * 0.8, 6),
                            osiz = aO7.wsiz

                        if ((Math.abs(r.x - osiz.x) < bW2) &&
                            (Math.abs(r.y - osiz.y) < bH2)
                        ) {
                            r.x = osiz.x + bW2
                            r.y = osiz.y + bH2
                            checkShift()
                        }
                    }
                }
            }

        if (n === 0) {
            if (r.w > 0.9 * W) r.w = 0.9 * W
            if (r.h > 0.9 * H) r.h = 0.9 * H
        }

        if (n === 3 || n === 4) {
            let y2 = H - margaH
            y = y2 - wpoz.h
            if (y < my + margaH) {
                y = my + margaH
                if (wpoz.h > H - y)
                    wpoz.h = H - y
                y = H - wpoz.h
            }
        } else {
            y = margaH
            if (y + wpoz.h > my - margaH) {
                y = 0
                wpoz.h = my - margaH - y
            }
        }
        wpoz.y = r.y = wpoz.y

        if (n === 1 || n === 2) {
            let x2 = W - margaW
            x = x2 - wpoz.w
            if (x < mx + margaW) {
                x = mx + margaW
                if (wpoz.w > W - x)
                    wpoz.w = W - x
                x = W - wpoz.w
            }
        } else {
            x = margaW
            if (x + wpoz.w > mx - margaW) {
                x = 0
                wpoz.w = mx - margaW - x
            }
        }
        wpoz.x = r.x = wpoz.x

        checkShift()
    },
    fillFromR = r => {
        Object.assign(aO7.wsiz, { x: r.x, y: r.y, w: r.w, h: r.h })
        Object.assign(aO7.wsiz[r.n], { x: r.x, y: r.y })
    },
    calcSiz = async (r) => {
        // const si = await fetch(fileName).then(r => r)
        if (!AO7.sizes)
            AO7.sizes = await loadJSON()

        const pos = AO7.sizes[aO7.tag.id]
        if (pos) {
            r.w = Math.min(pos.w, 0.8 * r.W)
            r.h = Math.min(pos.h, 0.8 * r.H)
        }
        else {
            r.w = r.W / 2 - margaW * 2
            r.h = r.H / 2 - margaH * 2
        }

        // Object.assign(aO7.wsize, { w: r.w, h: r.h, })
    }


async function toDB() {
    try {
        await DB.dbSet('popups', aO7.name, aO7.wsize)
    }
    catch (err) {
        console.error(err)
    }
}
async function fromDB() {
    try {
        await DB.dbSet('popups', aO7.name, aO7.wsize)
    }
    catch (err) {
        console.error(err)
    }
}
async function fromFile() {
    try {
        await DB.dbSet('popups', aO7.name, aO7.wsize)
    }
    catch (err) {
        console.error(err)
    }
}

export const Link = {
    prepare(c, actws) {
        C = c
        actWs = actws
    },
    attaO7: (wnd, ao7, doCalc) => {
        aO7 = ao7

        const r = initR()

        if (!doCalc)
            if (!fromDB(r)) // в БД еще нет этого  тега
                doCalc = true

        if (doCalc) {

            if (!FS.fromFile(r))
                calcSiz(r)

            calcPos(r)
        }

        fillFromR(r)

        wnd.aO7 = aO7
        aO7.act.wnd = wnd
        if (aO7._show)
            aO7.tag.classList.add(AO7.M.oSHOW)

        //         const
        //             needSiz = isKey || !aO7.wsize.t,
        //             r = fillR()

        //         if (needSiz) {
        //             aO7.wsize.t = window.performance.now()
        //             calcSiz()
        //         }
        //         if (calcPos())
        //             checkShift()
        // return r
    },
    detaO7: (wnd) => {
        const aO7 = wnd.aO7

        wnd.aO7 = null
        aO7.act.wnd = null
        if (aO7._show)
            aO7.tag.classList.remove(AO7.M.oSHOW)

        // сохранение в БД 
        toDB(aO7)
    }
}

/**
 
вот совместными усилиями мы с Тобой придумали НОВЫЙ (кажется) алгоритм уникальной идентификации тегов в докумеенте: 


function getEl(ref) {
    const
        noms = ref.match(/(?<!\.)\.\d+/g),
        idx = noms ? ref.indexOf(noms[0]) : -1,
        id = idx < 0 ? ref : ref.substring(0, idx)

    let el = id
        ? document.getElementById(id.replace(/\.\./g, '.'))
        : document.documentElement

        if (noms)
    for (const nom of noms)
        el = el.children[nom.substring(1)]

    return el
}
function iChild(el, parent) {
    if (!parent)
        debugger
    let i = parent.children.length
    while (i-- > 0)
        if (parent.children[i] === el)
            return i
}
function getQS(el) {
    let path = ''

    while (true) {
        if (el.aidO7)
            return el.aidO7
        else
            if (el.id) {
                if (    // есть дубликат (уже проверялся)
                    el.aidO7 === '' ||
                    document.querySelectorAll(`#${CSS.escape(el.id)}`).length > 1
                ) {
                    el.aidO7 = ''
                    getQS(el)
                }
                else {
                    const id = el.id.replace(/\./g, '..')
                    el.aidO7 = id
                    return id + path
                }
            }
        const parent = el.parentElement
        if (!parent)
            return path

        path = '.' + iChild(el, parent) + path
        el = parent
    }
}

Пояснение:

 у меня позиции всплытия (и соответственно уникальная ссылка на тех) выполняются для тех эелементов, 
 на которые ткнул пользователь, а он, просматривая и пересметривая страницы, 
 мог и вообще ни на что не  ткнуть. 

 Поэтому заранее обходить все (и даже только "мои") id мне кажется чрезмерным. 

А вВот если усер ткнёт на tag - тогда да, обходим и определяем тегу  атрибут aidO7 = getQS(tag)
 ('a' - чтобы был в начале списка атрибутов, но м.б. лучше какой-то допустимый но непривычный для DOM  символ?)
 в дополнение к его id 

где-то единожды задать:
document.getElementsByTagName('html').aidO7 = 'html'

потом для "ткнутого" тега вызывать  getQS(tag)

function calcElName(el, parent) {
    let i = parent.length
    while (i-- > 0)
        if (parent.children[i] === el)
            return '>' + el.tagName.toLowerCase() + (i > 0 ? `:nth-child(${i + 1})` : 0)
}
function getQS(el) {
    const path = ''

    while (el && el.nodeType === 1) {
        const
            parent = el.parentElement,
            elname = calcElName(el, parent)

        if (parent.aidO7)
            return parent.aidO7 + elname
        else
            if (parent.id) {
                if (    // есть дубликат (уже проверялся)
                    parent.aidO7 === '' ||
                    document.querySelectorAll(`#${CSS.escape(parent.id)}`).length > 1
                ) {
                    parent.aidO7 = ''
                    getQS(paren)
                }
                else {
                    pname = `#{parent.id}`
                    parent.aidO7 = pname
                    return pname + elname
                }
            }
        path = elname + path
        el = parent
    }
    return path
}


console.log('12.33.25'.match(/\.\d+/)[0])
console.log('12.33.25'.match(/\.\d+/)[1])
console.log('12'.match(/\.\d+/)[0])
*/