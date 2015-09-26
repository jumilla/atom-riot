//import fs from 'fs';
//import path from 'path';
import { CompositeDisposable } from 'atom';
//import mkdirp from 'mkdirp';
//import riot from 'riot';

import { exec, spawn } from 'child_process'
console.log(require('child_process'))

let subscriptions;

export function activate() {
    subscriptions = new CompositeDisposable(
        atom.commands.add('atom-text-editor', 'core:save', (event) => onFileSave(event.currentTarget.getModel())),
        atom.commands.add('atom-workspace', 'riot:compile', () => compile(atom.workspace.getActiveTextEditor()))
    );
}

export function deactivate() {
    subscriptions.dispose();
}

function onFileSave(textEditor) {
    if (!textEditor) return

    console.log('onFileSave')

    const riotGrammar = atom.grammars.grammarForScopeName('source.riot');

    if (textEditor.getGrammar() == riotGrammar) {
        compile(textEditor);
    }
}

function compile(textEditor) {
//    alert('compile!rel')
    console.log('compile', textEditor.getPath())

    let command = '"' + riotCommandPath() + '" "' + textEditor.getPath() + '"'
    exec(command, { env: process.env }, function(error, stdout, stderr) {
        if (error) {
            console.error(error)
            atom.notifications.addError(stderr, {
                dismissable: true,
            })
        }
        else {
            console.log(stdout)
        }
    })
}

function riotCommandPath() {
    let atomPackage = atom.packages.getLoadedPackage('riot')

    if (atomPackage) {
        return atomPackage.path + '/node_modules/.bin/riot'
    }

    return 'riot'
}
