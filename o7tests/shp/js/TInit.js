"use strict";
export class TInit {
    static #FillMarks(aO5, div, athis) {
        const
            key = athis.pmark,
            pdiv = div.getElementsByClassName(key)[0],
            sps = pdiv.getElementsByTagName('span')

        for (const sp of sps) {
            const
                cls = sp.className.trim(),
                b = sp.getElementsByTagName('b')[0]

            b.innerHTML = aO5.cls.puts[cls] ? cls : '&nbsp;'
            b.b5 = { aO5: aO5, val: cls, div: div, key: key }
            b.addEventListener('click', athis.CbMark)
            div.aO5bs.push(b)
        }
    }
    static #FillPitch(aO5, div, athis) {
        const
            key = athis.pitch,
            pdiv = div.getElementsByClassName(key)[0],
            sps = pdiv.getElementsByTagName('span')

        for (const sp of sps) {
            const
                cls = sp.className.trim(),
                b = sp.getElementsByTagName('b')[0]

            b.innerHTML = aO5.cls.pitch === cls ? cls : '&nbsp;'
            b.addEventListener('click', athis.CbPitch)
            b.b5 = { aO5: aO5, val: cls, div: div, key: key }
            div.aO5bs.push(b)
        }
    }
    static #FillLevel(aO5, div, athis) {
        const
            key = athis.level,
            inp = Array.from(div.getElementsByClassName(key))[0]

        inp.b5 = { aO5: aO5, val: aO5.cls.level, div: div, key: key, title: 'уровень/level' }
        inp.title = `${inp.b5.title}= ${aO5.cls.level}`
        inp.value = aO5.cls.level
        // почему для shp2 при -1 показывает 0 ??????????????????????????????                
        inp.addEventListener('input', athis.CbLevel)
        div.aO5bs.push(inp)
    }
    static #FillAlive(aO5, div, athis) {
        const
            key = athis.alive,
            cb = Array.from(div.getElementsByClassName(key))[0]

        cb.b5 = { aO5: aO5, val: aO5.cls.level, div: div, key: key, title: 'автовозврат после сдвига' }
        cb.title = `${cb.b5.title}= ${aO5.cls.alive}`
        cb.checked = aO5.cls.alive
        cb.addEventListener('change', athis.CbAlive)
        div.aO5bs.push(cb)
    }

    static InitCtrls(aO5, div, athis) {        // это - бывшая FillFrams()
        const
            cf = 'f', cc = 'c', co = '&nbsp;',
            key = athis.frame,
            bO5 = aO5.pBase.pO5,
            pdiv = div.getElementsByClassName(key)[0],
            ps = Array.from(pdiv.getElementsByTagName('p')),                        
            StopPropagation = e => {
                e.preventDefault();
                e.stopPropagation();
            },
            AskScroll = e => {
                const btn = document.getElementById('btnScrollHead')
                if (btn) {
                    if (document.getElementById(e.target.innerText))
                        btn.innerText = e.target.innerText
                    else
                        console.error(`нет такого контейнера '${e.target.innerText}' `)
                }
                else
                    console.error(`нет кнопки "btnScrollHead" ??`)
            },
            FindO = (id, ps) => {
                for (const p of ps)
                    if (id === p.name)
                        return true
            },
            FindI = (id, bO5) => {
                if (id === bO5.id)
                    return true

                let tag = aO5.cnst.parent;
                do {
                    if (id === tag.id)
                        return true
                } while ((tag = tag.parentElement) && tag.id !== bO5.id)
            }

        let found = false
        for (const p of ps) {
            const
                name = p.className.trim(),
                dcls = document.getElementById(name)

            p.style.display = 'none'
            if (!found)
                found = name === bO5.name

            if (dcls) {
                const
                    id = dcls.id,
                    isOut = FindO(id, bO5.pOuts),
                    isInc = FindI(id, bO5) && (found || id === aO5.frms.tagCut.pO5.name)
                // isInc = 
                //     (id === aO5.frms.tagCut.pO5.name) ||
                //     (id === bO5.name) ||
                //     FindI(id, bO5)

                if (isInc || isOut) {
                    p.style.display = ''

                    const is0 = Array.from(p.getElementsByTagName('i'))[0]
                    is0.classList.add('button')
                    is0.title = "Выбор для скроллинга желтыми 'TLRB'"
                    is0.addEventListener('contextmenu', StopPropagation)
                    is0.addEventListener('mouseup', AskScroll)

                    const pcn = name + '-b',
                        bs = Array.from(p.getElementsByTagName('b'))
                    for (const i of [0, 1]) {
                        const b = bs[i]
                        b.id = pcn + i
                        b.innerHTML = co
                        div.aO5bs.push(b)
                        b.b5 = { aO5: aO5, div: div, key: key, nam: is0.innerText, val: '', cut: '' }
                        b.innerHTML = co
                        Object.seal(b.b5)
                    }

                    let b = bs[0]
                    if (isOut) {
                        b.title = 'фиксация (по ходу)'
                        b.addEventListener('click', athis.CbFramF)
                        for (const frame of aO5.frms.frames)
                            if (name === frame.pO5.name) {
                                b.innerHTML = b.b5.val = cf
                                break
                            }
                    }
                    else
                        b.classList.add('disable')

                    b = bs[1]
                    if (isInc) {
                        b.title = 'обрезание (сзади)'
                        b.addEventListener('click', athis.CbFramC)
                        if (aO5.frms.tagCut.id === name)
                            b.innerHTML = b.b5.cut = cc
                    }
                    else
                        b.classList.add('disable')
                }
            }
        }
        TInit.#FillPitch(aO5, div, athis)
        TInit.#FillMarks(aO5, div, athis)
        TInit.#FillLevel(aO5, div, athis)
        TInit.#FillAlive(aO5, div, athis)
    }
}