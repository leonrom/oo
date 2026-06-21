/**
 * Observer.js
 * в составе  shp.js
 *
 * Отлавливает появление подвисабельных тегов на эекране 
 * и, при первом появлении, создаёт для них aO7
 * 
 * Муняет статус  aO7.act.ready
 */

import { AO7 } from './AO7.js'
let C, activateAO7;

const
    Observe = entries => {
        for (const entry of entries) {
            const
                tag = entry.target,
                aO7 = tag.aO7shp

            //     ?? createAO7(tag)

            // if (!aO7) {  // этого - не смотрим
            //     observer.unobserve(tag)
            //     continue
            // }
            if (!aO7.tobased) {// определяем место в контейнерах
                aO7.tobased = true
                activateAO7(aO7)
            }

            const ready = aO7.act.ready

            if (entry.isIntersecting) {
                if (entry.intersectionRatio === 1)
                    aO7.act.ready = true
            }
            else
                if (aO7 && !aO7.act.isfix)
                    aO7.act.ready = false

            if (ready !== aO7.act.ready)
                tag.classList.toggle('o-isready', aO7.act.ready)
        }
    }

export const Observ = {
    observer: null,
    prepare: function (c, tobase) {
        C = c
        activateAO7 = tobase
    },
    reset: function () {
        this.observer = null
    },
    init: function () {
        if (this.observer) C.ConsoleAlert(`Повтор создания observer для shp`)
        else
            AO7.observer =
                this.observer = new IntersectionObserver(Observe, {
                    root: null,
                    threshold: [0, 1],
                    rootMargin: '0px',
                    trackVisibility: false,
                })
    },
    add: function (tag) {
        this.observer.observe(tag)
    }
}
