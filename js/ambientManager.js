
const FADE_IN_TIME_AFTER_LOAD = 500

var $_ambientManager = (function() {

  let currentAmbient
  let currentAmbientId
  let currentAssetName = ""


  function startNewSound(newHowlerSound, fadeInTime = 1000) {
    console.log("start new sound", newHowlerSound)
    currentAmbientId = newHowlerSound.play()
    currentAmbient = newHowlerSound
    newHowlerSound.loop(true, currentAmbientId)
    currentAmbient.fade(0, 1, fadeInTime, currentAmbientId)
  }


  function playAmbient(newHowlerSound, assetName, fadeInTime = 1000, fadeOutTime = 1000) {

    if (assetName === currentAssetName) {
      // same ambient sound as before: do nothing
      return
    }

    currentAssetName = assetName

    if (currentAmbient && currentAmbient.playing(currentAmbientId)) {
      console.log("AMBIENT ALREADY PLAYING", currentAmbient, currentAmbientId)
      currentAmbient.fade(currentAmbient.volume(currentAmbientId), 
        0, fadeOutTime, currentAmbientId)

      setTimeout(() => {
        currentAmbient.stop(currentAmbientId)
        currentAmbient = null
        currentAmbientId = null
        startNewSound(newHowlerSound, fadeInTime)
      }, fadeOutTime)

    } else {
      console.log("NO AMBIENT YET")
      startNewSound(newHowlerSound, fadeInTime)
    }
  }


  function stopAmbient(fadeOutTime = 1000) {
    if (!currentAssetName) {
      // no ambient is playing. ignore.
      return
    }

    currentAssetName = ""

    currentAmbient.fade(currentAmbient.volume(currentAmbientId), 
      0, fadeOutTime, currentAmbientId)
  }


  function getState() {
    return {
      currentAssetName,
      $_isAmbientManagerState: true,
    }
  }


  function setState(state, assetMap) {
    if (!state.$_isAmbientManagerState) {
      throw new error(`Not a valid ambient manager state.`)
    }
    currentAssetName = state.currentAssetName
    if (!currentAssetName) {
      // no ambient was playing, so we do not need to start one
      return
    }
    const newHowlerSound = assetMap[currentAssetName]
    startNewSound(newHowlerSound, FADE_IN_TIME_AFTER_LOAD)
  }


  return {
    playAmbient,
    stopAmbient,
    getState,
    setState,
  }

})()
