let C;

const
    IsOnlyTranslate = nst => {
        const t = nst.transform;
        if (!t || t === 'none') {
            return { x: 0, y: 0 };
        }
        // --- 2D ---
        const eps = 1e-6,
            m2 = t.match(/^matrix\(([^)]+)\)$/)
        if (m2) {
            const v = m2[1].split(',').map(Number)
                /*    matrix2d:
                  [ 1  0  ]
                  [ 0  1  ]
                   tx ty 
                */  if (
                Math.abs(v[0] - 1) < eps &&
                Math.abs(v[1]) < eps &&
                Math.abs(v[2]) < eps &&
                Math.abs(v[3] - 1) < eps
            )
                return { x: v[4], y: v[5] }
        }
        else {
            // --- 3D ---
            const m3 = t.match(/^matrix3d\(([^)]+)\)$/)
            if (m3) {
                const v = m3[1].split(',').map(Number)
                /*    matrix3d:
                  [ 1  0  0  0 ]
                  [ 0  1  0  0 ]
                  [ 0  0  1  0 ]
                  [ tx ty tz 1 ]
                */
                if (
                    Math.abs(v[0] - 1) < eps &&
                    Math.abs(v[1]) < eps &&
                    Math.abs(v[2]) < eps &&
                    Math.abs(v[3]) < eps &&

                    Math.abs(v[4]) < eps &&
                    Math.abs(v[5] - 1) < eps &&
                    Math.abs(v[6]) < eps &&
                    Math.abs(v[7]) < eps &&

                    Math.abs(v[8]) < eps &&
                    Math.abs(v[9]) < eps &&
                    Math.abs(v[10] - 1) < eps &&
                    Math.abs(v[11]) < eps &&

                    Math.abs(v[15] - 1) < eps
                )
                    return { x: v[12], y: v[13] }
            }
        }
    }

export const AOcls = {

    InitStyle: aO7 => {
        const shp = aO7.cnst.shp,
            nst = window.getComputedStyle(shp),
            t = IsOnlyTranslate(nst),
            z = nst.zoom

        aO7.act.inited = true

        if (!t || !(z === "normal" || Number(z) === 1)) {
            const
                err = !t ? `'transform'` : `'zoom'`,
                add = !t ? `(кроме "translation")` : `(кроме "zoom = 1")`
            C.DisplayErrMsg(aO7.name, ` - теги с ` + err + ` НЕ обрабатываются`, `\n${add}`)
            console.log(`DoFix ${aO7.name}: расфиксировалось (навсегда)`)
            aO7.act.observer.unobserve(shp)
            aO7.act.ready = false
            return true
        }

        Object.assign(aO7.transform, t)

        Object.assign(aO7.origin, {
            display: nst.display,
            overflowX: nst.overflowX,
            overflowY: nst.overflowY,
        })
        Object.assign(aO7.margin, {
            margin: nst.margin,
            marginTop: nst.marginTop,
            marginLeft: nst.marginLeft,
            marginRight: nst.marginRight,
            marginBottom: nst.marginBottom,
        })
        Object.assign(aO7.outline, {
            outlineWidth: nst.outlineWidth,
            outlineStyle: nst.outlineStyle,
            outlineColor: nst.outlineColor,
            outlineOffset: nst.outlineOffset,
        })

        const a = shp.style
        Object.assign(aO7.astyle, {
            top: a.top,
            left: a.left,
            width: a.width,
            height: a.height,
            margin: a.margin,
            border: a.border,
            outline: a.outline,
            position: a.position,
            overflowX: a.overflowX,
            overflowY: a.overflowY,
            boxSizing: a.boxSizing,
        })
    },
    ReadCls: (aO7, ss) => {
        const
            errs = [],
            cls = aO7.cls,
            puts = cls.puts,
            mselec = /[A-Z]|a-z]|[+-]?\d+/g

        Object.assign(cls, {           // для повторной инициализации (напр. в тестах)
            level: 0,
            pitch: 'S',
            nofx: false,
            alive: false,
        })
        puts.T = puts.L = puts.R = puts.B = false

        const cs = ss.toUpperCase().match(mselec)
        for (const c of cs)
            switch (c) {
                case 'A': cls.alive = true
                    break
                case 'C':                // сжимает предыдущий
                case 'P':                // сталкивает предыдущий
                case 'S':                // сдвигает предыдущий
                case 'O': cls.pitch = c  // наезжает на предыдущий
                    break
                case 'T':
                case 'L':
                case 'R':
                case 'B': puts[c] = true
                    break
                case 'N': cls.nofx = true; break    // не подвисает, но может сдвигать остальные
                default:
                    if (!isNaN(c)) cls.level = Number(c)
                    else
                        errs.push(`c='${c}' в "${ss}"`)
            }
        if (!puts.T && !puts.L && !puts.R && !puts.B) puts.T = true

        if (errs.length)
            console.error("%c%s", C.consts.fmtErr, `Для ${aO7.name} не опр. квалиф.: ` + errs.join(', '))
    },
    ClearClone: clon => {
        const EVENTS = [
            'onclick', 'ondblclick',
            'onmousedown', 'onmouseup',
            'onmousemove', 'onmouseover', 'onmouseout',
            'onkeydown', 'onkeyup', 'onkeypress',
            'onchange', 'oninput', 'onsubmit',
            'onfocus', 'onblur',
            'oncontextmenu'
        ],
            all = [clon, ...clon.querySelectorAll('*')];

        for (const el of all) {
            for (const ev of EVENTS)
                el.removeAttribute(ev)

            if (el.id) {
                el.dataset.origId = el.id
                el.id = ''
            }
        }
    },
    prepare: c=> {
        C = c
    }
}