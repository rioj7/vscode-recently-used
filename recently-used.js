"use strict";
const vscode = require('vscode');
const extensionShortName = 'recently-used';

const getProperty = (obj, prop, deflt) => { return obj.hasOwnProperty(prop) ? obj[prop] : deflt; };
const isString = obj => typeof obj === 'string';
const isArray = obj => Array.isArray(obj);
const isObject = obj => (typeof obj === 'object') && !isArray(obj);
function dblQuest(value, deflt) { return value !== undefined ? value : deflt; }

class RecentlyUsed {
  constructor() {
    this.recentlyUsed = [];
  }
  constructQPItems(args) { return []; }
  /** @param {string} key @returns string */
  async transformKey(key) { return key; }
  async pickItem(args) {
    if (args === undefined) { return undefined; }
    let qpItems = this.constructQPItems(args);
    if (qpItems.length === 0) { return undefined; }
    const sortIndex = a => {
      let idx = this.recentlyUsed.findIndex( e => e === a.key );
      return idx >= 0 ? idx : this.recentlyUsed.length + a.idx;
    };
    qpItems.sort( (a, b) => sortIndex(a) - sortIndex(b) );
    let picked = await vscode.window.showQuickPick(qpItems, {ignoreFocusOut: true, title: getProperty(args, 'title'), placeHolder: getProperty(args, 'placeHolder')});
    if (!picked) { return undefined; }
    let key = await this.transformKey(picked.key);
    if (!key) { return undefined; }
    this.recentlyUsed = [key].concat(this.recentlyUsed.filter( e => e !== key ));
    return key;
  }
}

class RecentlyUsedCommands extends RecentlyUsed {
  constructor() {
    super();
  }
  constructQPItems(args) {
    let qpItems = [];
    if (!isObject(args)) { return qpItems; }
    for (const key in args) {
      if (!args.hasOwnProperty(key)) { continue; }
      if (['title', 'placeHolder'].includes(key)) { continue; }
      const item = args[key];
      let label = getProperty(item, 'label', key);
      let description = getProperty(item, 'description');
      let detail = getProperty(item, 'detail');
      qpItems.push( { idx: qpItems.length, key, label, description, detail } );
    }
    return qpItems;
  }
}

class RecentlyUsedInput extends RecentlyUsed {
  constructor(name) {
    super();
    this.name = name;
    this.newProps = undefined;
    this.newLabel = undefined;
  }
  constructQPItems(args) {
    let qpItems = [];
    let initial = getProperty(args, 'initial', []);
    if (!isArray(initial)) { return qpItems; }
    for (const item of initial) {
      let key = undefined;
      let label = undefined;
      let description = undefined;
      let detail = undefined;
      if (isString(item)) {
        key = item;
        label = item;
      }
      if (isObject(item)) {
        key = getProperty(item, 'value');
        label = getProperty(item, 'label', key);
        description = getProperty(item, 'description');
        detail = getProperty(item, 'detail');
      }
      if (!key || !isString(key)) { continue; }
      qpItems.push( { idx: qpItems.length, key, label, description, detail } );
    }
    this.newProps = getProperty(args, 'new', {});
    this.newLabel = getProperty(this.newProps, 'label', '-- new --');
    qpItems.push( { idx: qpItems.length, key: this.newLabel, label: this.newLabel } );
    for (const key of this.recentlyUsed) {
      if (qpItems.findIndex( e => key === e.key ) >= 0) { continue; }
      qpItems.push( { idx: qpItems.length, key, label: key } );
    }
    return qpItems;
  }
  async transformKey(key) {
    if (key !== this.newLabel) { return key; }
    return vscode.window.showInputBox({
      prompt: getProperty(this.newProps, 'prompt', `Enter argument: ${this.name}`),
      placeHolder: getProperty(this.newProps, 'placeHolder'),
      title: getProperty(this.newProps, 'title')
    });
  }
}

let recentlyUsedInputs = {};

async function recently(args, name) {
  let recentlyUsed = recentlyUsedInputs[name];
  if (!recentlyUsed) {
    recentlyUsed = new RecentlyUsedInput(name);
    recentlyUsedInputs[name] = recentlyUsed;
  }
  return recentlyUsed.pickItem(args);
}

async function asyncVariable(text, args, func) {
  if (text === undefined) { return undefined; }  // escaped a UI element
  let asyncArgs = [];
  let varRE = new RegExp(`\\$\\{${func.name}:(.+?)\\}`, 'g');
  text = text.replace(varRE, (m, p1) => {
    let deflt = {};
    let nameArgs = getProperty(getProperty(args, func.name, {}), p1, deflt);
    if (!nameArgs) { return 'Unknown'; }
    asyncArgs.push([nameArgs, p1]);
    return m;
  });
  for (let i = 0; i < asyncArgs.length; i++) {
    asyncArgs[i] = await func(asyncArgs[i][0], asyncArgs[i][1]);
    if (asyncArgs[i] === undefined) { return undefined; }
  }
  text = text.replace(varRE, (m, p1) => {
    return asyncArgs.shift();
  });
  return text;
}

async function variableSubstitution(text, args) {
  args = dblQuest(args, {});
  if (!isString(text)) { return text; }
  var result = text;
  result = await asyncVariable(result, args, recently);
  if (result === undefined) { return undefined; }
  return result;
};

async function dataStructVariableSubstitution(v, args) {
  if (isString(v)) {
    return variableSubstitution(v, args);
  }
  if (Array.isArray(v)) {
    let result = [];
    for (const v1 of v) {
      let v1a = await dataStructVariableSubstitution(v1, args);
      if (v1a === undefined) { return undefined; }
      result.push(v1a);
    }
    return result;
  }
  if (isObject(v)) {
    let result = {};
    for (const key in v) {
      if (!v.hasOwnProperty(key)) { continue; }
      let v1a = await dataStructVariableSubstitution(v[key], args);
      if (v1a === undefined) { return undefined; }
      result[key] = v1a;
    }
    return result;
  }
  return v;
}

let recentlyUsedCommands = new RecentlyUsedCommands();

function activate(context) {
  context.subscriptions.push(
    vscode.commands.registerCommand('recently-used.arguments', async args => {
      if (args === undefined) {
        let configurations = vscode.workspace.getConfiguration(extensionShortName);
        const argumentsConfig = configurations.get("arguments");
        let picked = await recentlyUsedCommands.pickItem(argumentsConfig);
        if (!picked) { return; }
        args = argumentsConfig[picked];
      }
      if (!args) { return; }
      let command = getProperty(args, 'command');
      let command_args = getProperty(args, 'args');
      if (!command || !command_args) { return; }
      command_args = await dataStructVariableSubstitution(command_args, args);
      if (command_args === undefined) { return; }
      await vscode.commands.executeCommand(command, command_args);
    })
  );
}

function deactivate() {}

module.exports = {
  activate,
  deactivate
}
