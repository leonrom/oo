 
import { bindAudioHover } from './audioBind.js'

let unbind;

function init(){
 unbind = bindAudioHover(document)
}

function clear(){
// при обновлении Blogger
// unbind()
    unbind()
AudioCore.destroy()
}

		document.addEventListener('DOMContentLoaded', init)
