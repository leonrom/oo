 
// audioGlobal.js
/**
1. Глобальный синхронизатор всех audio

Он слушает play у любого <audio> в документе
и гасит остальные.
*/
export const AudioGlobal = (() => {

    const all = new Set()
    let active = null

    function register(audio) { window.TRACE && console.log('→ register');
        if (all.has(audio)) return
        all.add(audio)

        audio.addEventListener('play', () => {
            if (active && active !== audio) {
                active.pause()
                active.currentTime = 0
            }
            active = audio
        })
    }

    function unregister(audio) { window.TRACE && console.log('→ unregister');
        all.delete(audio)
        if (active === audio) active = null
    }

    // синхронизация с обычными <audio> в документе
    function hookDocument() { window.TRACE && console.log('→ hookDocument');
        document.querySelectorAll('audio').forEach(register)

        document.addEventListener('play', e => {
            if (e.target.tagName === 'AUDIO')
                register(e.target)
        }, true)
    }

    hookDocument()

    return {
        register,
        unregister
    }

})()
