let div, timer;
function show(text, xy, err = false) {
    const pos = xy ? xy : {
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
    }
    Object.assign(div.style, {
        backgroundColor: err ? 'greenyellow' : ' lightyellow',
        top: (pos.y - 12) + 'px',
        left: pos.x + 'px',
        display: '',
    })
}
function hide() {
    if (timer) {
        clearTimeout(timer)
        timer = 0
    }
    div.style.display = 'none'
}

export function CMsg(C) {
    C.DisplayMsg = (text, add, tab, err = false, xy, duration = 2222) => {
        if (!div) {
            div = document.createElement('div')
            Object.assign(div.style, {
                boxShadow: 'rgba(0, 0, 0, 0.3) 0px 2px 6px',
                border: '1px solid rgb(204, 204, 204)',
                transform: 'translateX(-50%)',
                fontFamily: 'sans-serif',
                borderRadius: '5px',
                padding: '10px 20px',
                position: 'fixed',
                color: 'black',
                zIndex: 9999,
                display: 'none',
                maxWidth: '60%',
                fontSize: '14px',
                whiteSpace: 'pre-line',
            })
            div.addEventListener('click', hide)

            document.body.appendChild(div)
        }
// ConsoleMsg (err?MSG.ERROR:MSG.INFO, txt, add, tab) 
        console.log("%c%s", C.consts[err ? 'fmtErr' : 'fmtOK'], text, add)

        div.textContent = text + '\n(см. console.log)'
        timer = setTimeout(hide, duration)
        show(text, xy, err)

        C.cleanup.push(() => {
            clearTimeout(timer)
            div.removeEventListener('click', hide)
            div.remove()
            div = null
        })
    }
    C.DisplayLogMsg = (text, add,tab) => {
        C.DisplayMsg = (text, add,  false, xy, duration = 2222)
        }
    C.DisplayErrMsg = (text, add,tab) => {
        C.DisplayMsg = (text, add, tab, false, xy, duration = 2222)
        }
}