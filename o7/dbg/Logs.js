/* global window, console */
/*jshint asi:true  */
/*jshint esversion: 6*/

export function Logs(C) {
		const oldLog = console.log,
			oldwin = window
		let rez = '-НАШЁЛ',
			err = ''
		try {
			const debug = window.open("", "", "width=200,height=100");
			if (!debug) {
				console.error(`ошибка создания всплывающенго окна (возможно дан 'http' а не  'httpS') ?- см. настроки безопасности браузера`)
				return
			}
			const o_log = debug.document.body

			if (debug.document.title == '') {
				debug.document.title = modulname
				// o_log.innerText = ''
				o_log.innerHTML = `
<style>
body{
	background-color: oldlace;
	font-family: monospace;
	font-style: normal;
	font-size: small;
}
pre{
	line-height: 12px;
	margin: 0 !important;
}
pre span{
	margin-left: calc(100% - 7em);
	background-color: gold;
}
</style>
`
				rez = 'Создал'
			}
			if (o_log) console.log = function () {
				oldLog.apply(console, arguments) // так точнее совпадение временных меток
				const s = Array.prototype.join.call(arguments, ' '),
					dt = new Date(),
					ds = s.trim() == '' || s.startsWith('\n') ? '' : (
						(dt.getHours() + ':').padStart(3, '0') +
						(dt.getMinutes() + ':').padStart(3, '0') +
						(dt.getSeconds() + '.').padStart(3, '0') +
						(dt.getMilliseconds() + '').padEnd(3, '0'))
				// o_log.innerText += '\n' + ds + ' ' + s
				o_log.insertAdjacentHTML('beforeEnd', '<pre>' + ds + ' ' + s + '</pre>')
			}
			else err = 'Не удалось инициировать ' + modulname + ' ?'
		} catch (e) {
			err = `Ошибка инициализации 'Logs' по причине: "${e.message}"`
		}
		if (err) console.error(err)
		else console.log('\n<span>' + rez + ' ' + modulname + '</span>')

		oldwin.focus()
	}
