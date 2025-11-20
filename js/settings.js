
var $_settings = (function() {

  // "settings" is for user preferences like muted/unmuted audio.
  // This is very different from "store": the store manages
  // things that change during the story runtme and get reset when
  // the story restarts.

  const SAVE_STRING = "$___settings"

  let state = {
    muted: false,
    animationsOn: true,
  }


  function set(key, value) {
    state[key] = value
    saveState()
  }


  function get(key) {
    return state[key]
  }


  function saveState() {
    localStorage.setItem(SAVE_STRING, JSON.stringify(state))
  }


  function loadState() {
    const savedState = localStorage.getItem(SAVE_STRING)
    if (!savedState) return
    let deserializedState
    try {
      deserializedState = JSON.parse(savedState)
    } catch(err) {
      //ignore
      return
    }
    state = deserializedState
    console.log("restored user settings", state)
  }


  return {
    set,
    get,
    loadState,
  }

})()

