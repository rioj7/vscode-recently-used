# Recently Used

Create a Recently Used arguments list for any command.

If you use a command regularly that has an InputBox to get an argument for the command it's not nice to have to type the same strings often.

With this extension you can predefine a list of arguments and add strings to the list for the current session. The arguments used will be shown in a recently used list (QuickPick) with a special item at the bottom to add a new item.

The extension exports the command: **Recently Used: Select command and recently used arguments** (`recently-used.arguments`).

If you call this command from the command Palette or with a key binding without arguments you are presented with a list of the commands defined in the setting: `recently-used.arguments`. You select a command and then you select an item from the predefined list, or add a new item. The new items are remembered for this session of VSC. If you want to use them the next time you start VSC you have to add them to the `initial` property in the configuration.

You can create a keybinding with arguments to the command `recently-used.arguments` if you use a particular VSC command very often. You will be presented immediately with the recently used item list.

All recently used item lists have a _`name`_. If you use the same _`name`_ in different settings or key bindings they use the same list with that _`name`_.

## Configuration

The setting `recently-used.arguments` is an object (allows merging over the different `settings.json` files [User / Workspace / Folder]).

This object has 2 special keys (not very likely you want to name your command like this):

* `title` : `[string]` (Optional) The text above the QuickPick list to choose a command. (default: `undefined`)
* `placeHolder` : `[string]` (Optional) The placeholder text shown in the QuickPick list to choose a command. (default: `undefined`)

All other keys in the object are the labels for the commands. An idea is to use the same text as the command uses in the Command Palette. You can create separate lists for the same command by using labels that are unique like:

* `Emmet: Wrap with Abbreviation`
* `Emmet: Wrap with Abbreviation (code)`
* `Emmet: Wrap with Abbreviation (table)`

The value for a command label key is an object with the following properties:

* `command` : `[string]` The commandID of the VSC command you want to execute. You can find it in the key bindings GUI if you search for the used Command Palette text (use context menu when found).
* `args` : `[string|object|array|number|boolean]` The argument you want to pass to the `command`. You can construct any combination of the allowed types, like `array` of `object`s of `string`s. The strings are treated special. The string can contain any text and variables. All variables of the format: <code>&dollar;{recently:<em>name</em>}</code> are replaced by an item picked from the recently used list with that _`name`_. _`name`_ is a property of the `recently` property of this object (sibling of the `args` property). You can use multiple variables, in the same string or different strings.
* `recently` : `[object]` (Optional) Contains the configuration of the  <code><em>name</em></code>d recently used lists used in the `args` property. The key of the object is the _`name`_ of the list. (default: `{}` all named lists are empty on start if not defined and used in another command)  
  The value for each key _`name`_ is an object with the properties:

  * `title` : `[string]` (Optional) The text above the QuickPick list to choose an item. (default: `undefined`)
  * `placeHolder` : `[string]` (Optional) The placeholder text shown in the QuickPick list to choose an item. (default: `undefined`)
  * `initial` : `[array]` (Optional) An array of the initial content of the recently used list. Each array element can be a `string` or an `object`.
    * `object` has the following properties:
      * `value` : `[string]` The value used to replace the variable.
      * `label` : `[string]` (Optional) The label of the [QuickPickItem](https://code.visualstudio.com/api/references/vscode-api#QuickPickItem) shown. (default: same as `value`)
      * `description` : `[string]` (Optional) The description of the [QuickPickItem](https://code.visualstudio.com/api/references/vscode-api#QuickPickItem) shown.
      * `detail` : `[string]` (Optional) The detail of the [QuickPickItem](https://code.visualstudio.com/api/references/vscode-api#QuickPickItem) shown.
    * `string` is equivalent to
      ```json
      {
        "label": "string-text",
        "value": "string-text"
      }
      ```
  * `new` : `[object]` (Optional) An object to configure the addition of a new item to the recently used list. (default: `{}`)  
    The object has the following properties:
    * `label` : `[string]` (Optional) The label to show at the end of the recently used item list. (default: `"-- new --"`)  
      If you select this option you can enter a new item using an [InputBox](https://code.visualstudio.com/api/references/vscode-api#InputBoxOptions).  
      If `--` is possible content of the items you can change it to something else like: `"## new ##"`
    * `prompt` : `[string]` (Optional) The text under the [InputBox](https://code.visualstudio.com/api/references/vscode-api#InputBoxOptions) to add a new item. (default: <code>"Enter argument: <em>name</em>"</code>)
    * `title` : `[string]` (Optional) The text above the [InputBox](https://code.visualstudio.com/api/references/vscode-api#InputBoxOptions) to add a new item. (default: `undefined`)
    * `placeHolder` : `[string]` (Optional) The placeholder text shown in the [InputBox](https://code.visualstudio.com/api/references/vscode-api#InputBoxOptions) to add a new item. (default: `undefined`)

The next example shows every possible property of the setting. For this command they are not all useful. Just delete the ones you don't like.

This is part of the `settings.json` file. The Global/User, Workspace or Folder version.

```json
  "recently-used.arguments": {
    "title": "Pick a command",
    "placeHolder": "type to filter commands",
    "Emmet: Wrap with Abbreviation" : {
      "command": "editor.emmet.action.wrapWithAbbreviation",
      "args": { "abbreviation": "${recently:emmet-wrap}" },
      "recently": {
        "emmet-wrap": {
          "title": "Pick an Abbreviation",
          "placeHolder": "type to filter Abbreviations",
          "initial": [
            "span.math",
            {
              "label": "Formula",
              "value": "p.math",
              "description": "p.math description",
              "detail": "p.math detail"
            }
          ],
          "new": {
            "label": "## new Abbreviation ##",
            "prompt": "Enter Abbreviation",
            "title": "New Abbreviation",
            "placeHolder": "type Abbreviation"
          }
        }
      }
    },
    "Emmet: Update Tag" : {
      "command": "editor.emmet.action.updateTag",
      "args": "${recently:emmet-update-tag}",
      "recently": {
        "emmet-update-tag": {
          "initial": [ "blockquote", "table", "span", "code", "figure", "figcaption" ],
          "new": {
            "label": "-- new tag --",
            "prompt": "Enter Tag"
          }
        }
      }
    }
  }
```

## Key binding

If you use a particular command often you can create a keybinding that will show the recently used list(s) immediately.

Some of the HTML tags are more than 3 characters and you don't have suggestions in an InputBox.

```json
  {
    "key": "F15", // or any other key combo
    "when": "editorTextFocus",
    "command": "recently-used.arguments",
    "args": {
      "command": "editor.emmet.action.updateTag",
      "args": "${recently:emmet-update-tag}",
      "recently": {
        "emmet-update-tag": {
          "initial": [ "blockquote", "table", "span", "code", "figure", "figcaption" ],
          "new": {
            "label": "-- new tag --",
            "prompt": "Enter Tag"
          }
        }
      }
    }
  }
```

### Predefined key binding

The extension defines a key binding for the command `recently-used.arguments`

* Win/Linux: `ctrl+shift+alt+p`
* Mac: `cmd+shift+alt+p`

You are presented with a list like the Command Palette for commands you defined in the settings.
