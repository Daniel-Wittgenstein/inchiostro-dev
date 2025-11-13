
var CommandManager = (function() {

  const commandProcessor = window.commandProcessor

  class CommandManager {


    constructor() {
      this.aliases = {}
    }


    addCommand(id, aliases, paramTemplate) {
      const validator = commandProcessor.createCommandValidator(paramTemplate)
      const command = {
        id,
        validator,
      }
      for (const alias of aliases) {
        if (alias.includes("-") || alias.includes("_")) {
          throw new Error(`Invalid command alias definition "${alias}". `
            + `Don't use _ or - here.`
            + `Command aliases should be defined as "myCommandAlias".`
            + `Variants "my_command_alias" and "my-command-alias" will be auto-generated.`
          )
        }
        this.aliases[alias] = command
        this.aliases[utils.convertToKebabCase(alias)] = command
        this.aliases[utils.convertToSnakeCase(alias)] = command
      }
    }


    getCommandByName(commandAliasName) {
      return this.aliases[commandAliasName]
    }


    processCommandString(str) {
      const res = commandProcessor.processCommand(str,
        this.getCommandByName.bind(this))
    
      if (res.error) {
        let msg = res.msg
        if (res.commandName) {
          msg = `Command "$${res.commandName}": ` + msg
        }
        return `${msg} --- ${res.commandName}`
      }
      
      const {command, paramData} = res

      return {
        id: command.id,
        paramData,
      }
    }

  }

  return CommandManager

})()
