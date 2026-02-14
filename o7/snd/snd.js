
import { bindAudioHover } from './audioBind.js'

let unbind;

function init() { window.TRACE && console.log('→ init');
    unbind = bindAudioHover(document)
}

function clear() { window.TRACE && console.log('→ clear');
    // при обновлении Blogger - unbind()
    unbind()
    AudioCore.destroy()
}

window.TRACE = true
document.addEventListener('DOMContentLoaded', init)
