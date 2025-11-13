
var utils = {

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  },


  listEnumProperties(enm) {
    return Object.keys(enm).map(n => `"${n}"`).join(', ')
  },


  addCssClasses(domEl, cssClasses) {
    cssClasses.split(" ")
      .map(n => n.trim())
      .filter(n => n)
      .forEach(n => domEl.classList.add(n))
  },


  removeAll(selector, parent = document.body) {
    for (const el of parent.querySelectorAll(selector)) {
      el.parentNode.removeChild(el)
    }
  },


  getFirstWordAndRest(str) {
    const trimmedStr = str.trim()
    const firstSpaceIndex = trimmedStr.search(/\s/)
    return firstSpaceIndex === -1 ? [trimmedStr, ""] :
      [trimmedStr.slice(0, firstSpaceIndex), trimmedStr.slice(firstSpaceIndex + 1)]
  },


  splitAtLastInstance(str, separator) {
    const index = str.lastIndexOf(separator)
    return index !== -1 ?
      [str.slice(0, index), str.slice(index + separator.length)] :
      [str]
  },


  convertToKebabCase(str) {
    return str
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .toLowerCase()
  },
  

  convertToSnakeCase(str) {
    return str
      .replace(/([a-z])([A-Z])/g, '$1_$2')
      .toLowerCase()
  },
  
  
  convertToCamelCase(str) {
    return str
      .toLowerCase()
      .replace(/[_-](\w)/g, (_, c) => c.toUpperCase())
  },
  

  findIndexLastNotBetween(str, searchFor, notImmediatelyBetween) {
    /* Searches string "str" for an occurrence of the char "searchFor" that is NOT
      immediately between char "notImmediatelyBetween" and "notImmediatelyBetween".
      Returns index of LAST occurrence or -1 if nothing found.
      So ("$ %$%", "$", "%") would return 0. */
    if (searchFor.length !== 1 || notImmediatelyBetween.length !== 1) {
      throw new Error("Expected single char!")
    }
    for (let i = str.length; i >= 0; i--) {
      if (str[i] === searchFor) {
        const prev = str[i - 1]
        const next = str[i + 1]
        if (prev !== notImmediatelyBetween && next !== notImmediatelyBetween) {
          return i
        }
      }
    }
    return -1
  },
  

  normalizepath: (path) => {
    path = path.replaceAll('\\', '/')
    if (path.startsWith('/')) {
      path = path.slice(1)
    }
    if (!path.endsWith('/')) {
      path = path + '/'
    }
    return path
  }


}
