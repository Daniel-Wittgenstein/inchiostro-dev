
var commandProcessor = (function() {

  const utils = window.utils

  const paramTypes = {
    
    "int0+": {
      check: isPositiveOrZeroIntegerString,
      failText: `Expected an integer number >= 0 here.`,
      convert: (str) => Number(str),
    },

    "number": {
      check: str => str.trim() !== "" && Number.isFinite(Number(str)),
      failText: `Expected a number here.`,
      convert: (str) => Number(str),
    },


    bool: {
      check: isBoolString,
      failText: `Expected "yes" or "no" here.`,
      convert: convertBoolString,
    },


    string: {
      check: () => true,
      failText: ``,
      convert: null,
    },

  }

  function createCommandValidatorFromSpecialTemplate(templateStr) {
    if (templateStr === "$none") {
      return {
        parameterless: true,
        process(str) {
          if (str.trim()) {
            return err(`This command takes no parameters at all. `+
              `Please just use the command name, with no text following it.`
            )
          }
          return {
            string: str
          }
        }        
      }

    }

    else if (templateStr === "$string") {
      return {
        parameterless: true,
        process(str) {
          return {
            string: str
          }
        }        
      }

    } else if (templateStr === "$singleWord") {
      return {
        parameterless: true,
        process(str) {
          if (/\s/.test(str)) {
            return err(`Expected single word.`)
          }
          return {
            singleWord: str.trim()
          }
        }
      }


    } else if (templateStr === "$flag") {

      return {
        parameterless: true,
        process(str) {

          let flag
          
          try {
            flag = convertBoolString(str)
          } catch {
            return err(`Expected "yes" or "no" here (or "on/off" or "true/false").`)
          }

          return {
            flag,
          }

        }
      }

    } else if (templateStr === "$wordList") {
      return {
        parameterless: true,
        process(str) {
          return {
            wordList: str
              .replaceAll(",", " ")
              .split(/\s/)
              .filter(Boolean)
          }
        }
      }

    } else {
      throw new Error(`"${templateStr}" is not a valid parameter definition ` +
        `for a command. I was expecting a parameter list or something like "$wordList".`)
    }
  }

  function isBoolString(str) {
    return ["yes", "no", "true", "false"].includes(str.toLowerCase())
  }


  function convertBoolString(str) {
    str = str.toLowerCase()
    if (str === "yes" || str === "true" || str === "on") return true
    if (str === "no" || str === "false" || str === "off") return false
    throw new Error(`convertBoolString called with wrong argument`)
  }


  function isPositiveOrZeroIntegerString(str) {
    return isIntegerString(str) && Number(str) >= 0
  }


  function isIntegerString(str) {
    return str.trim() !== "" && !isNaN(str)
      && Number.isInteger(Number(str))
  }


  function err(msg) {
    return {
      error: true,
      msg,
    }
  }


  function createCommandValidator(template) {
    if (template.trim().startsWith("$")) {
      return createCommandValidatorFromSpecialTemplate(template)
    }
    const templateParts = template.split(";")
    const commandValidator = []
    for (let item of templateParts) {
      const paramValidator = {}
      commandValidator.push(paramValidator)
      item = item.trim()
      paramValidator.mandatory = true
      if (item.endsWith("?")) {
        item = item.substring(0, item.length - 1)
        paramValidator.mandatory = false
      }
      const [prop, typeName] = item.split("=").map(n => n.trim())
      const validatorFunc = paramTypes[typeName].check
      if (!validatorFunc) {
        throw new Error(`Invalid validator function name: "${typeName}".`)
      }
      paramValidator.prop = prop
      paramValidator.check = validatorFunc
      paramValidator.failText = paramTypes[typeName].failText
      if (paramTypes[typeName].convert) {
        paramValidator.convert = paramTypes[typeName].convert
      }
    }
    return commandValidator
  }


  function validateAndSanitizeParameters(paramData, commandValidator) {
    for (const paramValidator of commandValidator) {
      const prop = paramValidator.prop
      const val = paramData[prop]
      if (val === undefined) {
        if (paramValidator.mandatory) {
          return err(`The mandatory property "${prop}" is missing.`)
        }
        continue
      }
      if (!paramValidator.check(val)) {
        return err(`${prop} = ${val}: ` + paramValidator.failText)
      }
      if (paramValidator.convert) {
        paramData[prop] = paramValidator.convert(paramData[prop])
      }
    }

    const validProps = new Set(commandValidator.map(entry => entry.prop))
    const invalidProp = Object.keys(paramData).find(key => !validProps.has(key)) || null
    if (invalidProp) {
      const validPropsText = commandValidator.map(entry => `"${entry.prop}"`).join(", ")
      return err(`${invalidProp}: is not a valid property for this command. ` +
        `The valid properties are: ${validPropsText}`
      )
    }

    return paramData
  }


  function parseParameters(str) {    
    const paramData = {}
    const parts = str.trim().split(";").map(n => n.trim()).filter(Boolean)
    for (const part of parts) {
      if (part.includes("=")) {
        const subParts = part.split("=").map(n => n.trim())
        if (subParts.length > 2) {
          return err(`${part}: expected only one =`)
        }
        let [prop, val] = subParts
        prop = normalizeParamProp(prop)
        if (paramData[prop]) {
          return err(`Property "${prop}" is defined twice.`)
        }
        paramData[prop] = val
      } else {
        if (/\s/.test(str)) {
          return err(`${part}: Expected either "property = value" or a single word property.`)
        }
        let prop = part
        prop = normalizeParamProp(prop)
        if (paramData[prop]) {
          return err(`Property "${prop}" is defined twice.`)
        }
        paramData[prop] = true
      }
    }
    return paramData
  }

  function normalizeParamProp(prop) {
    return utils.convertToCamelCase(prop)
  }

  function processParameters(str, commandValidator) {
    if (commandValidator.parameterless) {
      return commandValidator.process(str)
    } else {
      const res = parseParameters(str)
      if (res.error) return res
      const paramData = res
      return validateAndSanitizeParameters(paramData, commandValidator)
    }
  }


  function processCommand(str, getCommandByName) {
    str = str.replace("$", "").trim()
    let [commandName, paramStr] = utils.getFirstWordAndRest(str)
    commandName = commandName.replace(":", "")
    if (paramStr.startsWith(":")) {
      paramStr = paramStr.replace(":", "")
    }
    const command = getCommandByName(commandName)
    if (!command) {
      return err(`"${commandName}" is not a valid command.`)
    }
    //console.log("retrieved command", command)
    const res = processParameters(paramStr, command.validator)
    if (res.error) {
      res.commandName = commandName
      return res
    }
    return {
      command,
      paramData: res,
    }
  }

  return {
    createCommandValidator,
    processCommand,
  }

})()
