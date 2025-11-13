
var $_store = (function() {
  var state = {
    assetPath: "",
    imageTypes: {
      default: [],
    },
    maxUndo: 8,
    out: "main", 
  }

  return {

    setImageType: (imageType, cssClasses) => {
      state.imageTypes[imageType] = cssClasses
    },

    getCssClassesbyImageType: (imageType) => {
      return state.imageTypes[imageType]
    },

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
