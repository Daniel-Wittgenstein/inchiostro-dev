
var $_store = (function() {
  var state = {
    assetPath: "",
    maxUndo: 8,
    out: "main",
    shuffleChoicesOn: false,
    seed: 0,
    randomized: true,
    elementPause: 100, // in milliseconds
    choicePause: 100, // in milliseconds
    showChoiceText: true,
  }

  return {

    set: (key, value) => {
      state[key] = value
    },

    get: (key, optionalDefaultValue) => {
      if (state[key] === undefined) {
        return optionalDefaultValue
      }
      return state[key]
    },

    getStoreState() {
      return JSON.stringify(state)
    },

    setStoreState(stateString) {
      let newState
      try {
        newState = JSON.parse(stateString)
      } catch(err) {
        return false
      }
      state = newState
      return true
    },
  }

})()
