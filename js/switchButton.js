

var $_switchButton = (function () {

  // Cannot be serialized. Only for user settings buttons known at startup.


  const settings = $_settings

  class SwitchButton {
    constructor (parent, states, boundVarKey, cssClass = "") {
      
      if (!boundVarKey || !states || !parent) {
        throw new Error(`property missing.`)
      }

      const value = settings.get(boundVarKey)
      
      let initialStateIndex = -1
      let i = -1
      for (const state of states) {
        i++
        if (state.value === value) {
          initialStateIndex = i
        }
      }

      if (initialStateIndex === -1) {
        console.error(`settings property "${boundVarKey}" has value ${value}: `+
          `value not found inside button states. This should not happen.` +
          `Defaulting to first button state.`
        )
        initialStateIndex = 0        
      }

      this.button = document.createElement("button")
      
      this.boundVarKey = boundVarKey
      this.states = states

      parent.append(this.button)
      
      if (cssClass) parent.classList.add(cssClass)
      
      this.button.addEventListener("click", (ev) => {
        this.counter++
        if (this.counter >= this.states.length) {
          this.counter = 0
        }
        this.setButtonState()
      })

      this.counter = initialStateIndex
      this.setButtonState(initialStateIndex)

    }

    setButtonState() {
      const state = this.states[this.counter]
      this.button.innerHTML = state.text
      const newValue = state.value
      settings.set(this.boundVarKey, newValue)
    }

  }

  return SwitchButton


})()

