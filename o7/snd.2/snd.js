
import { Bind } from './Bind.js'
import { Cur } from './Cur.js'

function init() { 
    Bind.init()
}

function clear() { 
    Bind.destroy()
    Cur.destroy()
}

window.TRACE = true
document.addEventListener('DOMContentLoaded', init)
