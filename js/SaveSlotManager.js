
var $_SaveSlotManager = (function() {

  const genericWindow = window.$_genericWindow

  return class SaveSlotManager {

    constructor(callbacks, config) {
      this.localStorageSlotPrefix = "$__slot"
      this.domPrefix = "__saveSlotManager__"
      this.callbacks = callbacks
      this.config = config
      this.closeSaveSlotDialog = null
      this.#initEventListeners()
      
      this.slotMetaData = []
      const json = localStorage.getItem(this.localStorageSlotPrefix + "-meta")
      if (json) {
        this.slotMetaData = JSON.parse(json)
      }
    }


    #initEventListeners() {
      document.addEventListener("click", async (event) => {
        const clickedEl = event.target

        if (clickedEl.classList.contains(this.domPrefix + "-clear")) {
          
          const index = Number(clickedEl.dataset.index)
          this.#clearSlot(index)
          this.#refreshView()

          

        } else if (clickedEl.classList.contains(this.domPrefix + "-load")) {
        
          const index = Number(clickedEl.dataset.index)
          this.#closeSaveSlotDialog()
          await this.#loadFromSlot(index)



        } else if (clickedEl.classList.contains(this.domPrefix + "-save")) {

          const index = Number(clickedEl.dataset.index)
          const name = this.#generateSaveSlotName()
          this.#saveIntoSlot(index, name)
          this.#refreshView()

        }
      })
    }


    #generateSaveSlotName() {
      const text = this.callbacks.getSaveSlotText()
      let outText = ""
      if (text) outText += `<div class="svs-dia-name-text">${text}</div>`
      outText += `<div class="svs-dia-name-date">${new Date().toLocaleString()}</div>`
      return outText
    }


    #refreshView() {
      const html = this.#getHtmlForSaveDialog()
      const main = document.querySelector(".svsdia-main")
      main.innerHTML = html
    }


    async #loadFromSlot(index) {
      const json = localStorage.getItem(this.localStorageSlotPrefix + index)
      const state = JSON.parse(json).appState
      await this.callbacks.onStateLoaded(state)
    }


    #clearSlot(index) {
      localStorage.removeItem(this.localStorageSlotPrefix + index)

      this.slotMetaData[index] = undefined
    }


    #saveIntoSlot(index, name) {
      const state = {
        appState: this.callbacks.getStateToSave(),
      }
      const json = JSON.stringify(state)
      localStorage.setItem(this.localStorageSlotPrefix + index, json)

      this.slotMetaData[index] = {
        name,
      }

      const metaJson = JSON.stringify(this.slotMetaData)
      localStorage.setItem(this.localStorageSlotPrefix + "-meta", metaJson)
    }


    #processSaveSlotText(text, index) {
      return text.replaceAll("%no", index + 1)
    }


    #getHtmlForSaveSlot(i, name, domPrefix, slotIsFull, isLast) {
      let html = ""

      html += `<div class="svsdia-slot ` +
        `${isLast ? "is-last" : ""}" id="${domPrefix}-id-${i}">`
      
      const titleSave = this.#processSaveSlotText(this.config.texts.save, i)
      const titleLoad = this.#processSaveSlotText(this.config.texts.load, i)
      const titleClear = this.#processSaveSlotText(this.config.texts.clear, i)

      if (!slotIsFull) {
        html += `<button
          class="svsdia-slot-button svsdia-save ${domPrefix}-save"
          title="${titleSave}"
          data-index="${i}">
          </button>`
      }

      if (slotIsFull) {
        html += `<button
          class="svsdia-slot-button svsdia-load ${domPrefix}-load"
          title="${titleLoad}"
          data-index="${i}">
          </button>`
      }

      html += `<div class="svsdia-name">${name}</div>`
      
      if (slotIsFull) {
        html += `<button
          class="svsdia-slot-button svsdia-clear ${domPrefix}-clear"
          title="${titleClear}"
          data-index="${i}"></button>`
      }

      html += `</div>`
      
      return html
    }


    #getHtmlForSaveDialog() {
      let html = ""
      for (let i = 0; i < this.config.saveSlotAmount; i++) {
        const data = this.slotMetaData[i]
        const name = data ? data.name : 
          this.#processSaveSlotText(this.config.texts.emptySlot, i)
        html += this.#getHtmlForSaveSlot(i, name, this.domPrefix, !!data,
          i === this.config.saveSlotAmount - 1)
      }
      return html
    }


    openSaveSlotDialog() {
      const html = this.#getHtmlForSaveDialog()
      const ret = genericWindow.newWindow(`<div class="svsdia-main">${html}</div>`, [])
      this.closeSaveSlotDialog = ret.closeThisWindow
    }


    #closeSaveSlotDialog() {
      if (!this.closeSaveSlotDialog) return
      this.closeSaveSlotDialog()
    }
    


  }
})()
