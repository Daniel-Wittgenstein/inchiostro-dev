

$_switchButton = (function () {

  let index = 0

  let items

  return (tItems, onChoose, startIndex = 0) => {
    items = tItems
    index = startIndex
    const button = document.createElement('button')
    button.innerText = items[0].text

    button.addEventListener("click", () => {
      index++
      if (index >= items.length) {
        index = 0
      }
      const item = items[index]
      button.innerText = item.text
      onChoose(index)
    })
    return button
  }

})()
