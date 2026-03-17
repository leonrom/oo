/** 
 * DA.js
 * debugAudio(audio)
*/

export function DA(audio) {

  const evs = [
    'loadstart',
    'loadedmetadata',
    'loadeddata',
    'canplay',
    'canplaythrough',
    'play',
    'playing',
    'pause',
    'waiting',
    'stalled',
    'suspend',
    'progress',
    'seeking',
    'seeked',
    'ended',
    'error'
  ];

  const dump = (e) => {
    console.log(
      e.type,
      {
        paused: audio.paused,
        currentTime: audio.currentTime.toFixed(2),
        readyState: audio.readyState,
        networkState: audio.networkState,
        currentSrc: audio.currentSrc
      }
    );
  };

  evs.forEach(ev => audio.addEventListener(ev, dump));
}