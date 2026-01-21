export function showC(C) {
    const
        Fill = (name) => {
            const arr = []
            for (const [key, val] of Object.entries(C[name]))
                arr.push({ key, val })
            return arr
        }

    const
        sincls = C.modules.map(m => m.name).join(', '),
        consts = Fill('consts'),
        urlrfs = Fill('urlrfs')

    console.groupCollapsed("%c%s", C.fmtOK, `С `, ` [${sincls}]`); {
        console.groupCollapsed(`константы`); {
            console.table(consts)
            console.groupEnd()
        }
        console.groupCollapsed(`адреса`); {
            console.table(urlrfs)
            console.groupEnd()
        }
        console.groupEnd()
    }

    console.log('==============================================')
}