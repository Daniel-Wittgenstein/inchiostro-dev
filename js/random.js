
var $_random = (function() {

  const seedRandom = Math.seedrandom
  if (!seedRandom) {
    throw new Error(`seedrandom.js library is missing?`)
  }

  let currentRng

  function seedRandomSetSeed(seed) {
    currentRng = new Math.seedrandom(seed)
  }

  function seedRandomRandomize() {
    currentRng = new Math.seedrandom()
  }

  function seedRandomGetFloat() {
    return currentRng()
  }

  seedRandomRandomize()

  const random = {


    shuffle: (arr) => {
      const copy = [... arr]
      let i = copy.length
      while(--i > 0){
        j = random.integer(0, i)
        const swap = copy[j]
        copy[j] = copy[i]
        copy[i] = swap
      }
      return copy
    },


    float: () => {
      return seedRandomGetFloat()
    },


    integer: (min, max) => {
      // min and max inclusive
      return Math.floor(seedRandomGetFloat() * (max - min + 1)) + min
    },


    randomize() {
      seedRandomRandomize()
    },


    seed(theSeed) {
      seedRandomSetSeed(theSeed)
    },


    pick(arr) {
      const i = random.integer(0, arr.length - 1)
      return arr[i]
    }


  }

  return random

})()

