'use babel';

import fs from 'fs'
import path from 'path'
import { CompositeDisposable } from 'atom'
//import mkdirp from 'mkdirp';
//import riot from 'riot';
import { exec, spawn } from 'child_process'

const RIOT_PATH = '/usr/local/bin/riot'
let subscriptions;

export function activate() {
    subscriptions = new CompositeDisposable(
        atom.commands.add('atom-text-editor', 'core:save', (event) => onCommandCompile(event.currentTarget.getModel())),
        atom.commands.add('atom-workspace', 'riot:compile', () => onCommandCompile(atom.workspace.getActiveTextEditor()))
    );
}

export function deactivate() {
    subscriptions.dispose();
}

function onCommandCompile(textEditor) {
    if (!textEditor) return

    let riotGrammar = atom.grammars.grammarForScopeName('source.riot');

    if (textEditor.getGrammar() == riotGrammar) {
        compileRiot(textEditor.getPath());
    }
}

function endsWith(string, suffix) {
    var sub = string.length - suffix.length;
    return (sub >= 0) && (string.lastIndexOf(suffix) === sub);
}

function compileRiot(sourcePath) {
    console.log('compile', sourcePath)

    let ext = (filePath) => {
        for (let ext of ['riot.tag', 'riot.html', 'tag', 'html']) {
            if (endsWith(filePath, '.' + ext)) {
                return '.' + ext
            }
        }
        return path.extname(filePath)
    }(sourcePath)

    let command = '"' + riotCommandPath() + '" "' + sourcePath + '"' + ' --ext=' + ext.slice(1)

    exec(command, { env: process.env }, function(error, stdout, stderr) {
        if (error) {
            console.error(error)

            atom.notifications.addError(stderr, {
                dismissable: true,
            })

            return
        }

        console.log(stdout)

        let destPath = sourcePath.substring(0, sourcePath.length - ext.length) + '.js'
        atom.notifications.addSuccess(`Saved to ${destPath}`);
    })
}

function riotCommandPath() {
    // 1. global command
    if (fs.existsSync(RIOT_PATH)) {
        return RIOT_PATH
    }

    // 2. package local command
    let atomPackage = atom.packages.getLoadedPackage('riot')

    if (!atomPackage) {
        throw new Error('package broken')
    }

    return atomPackage.path + '/node_modules/.bin/riot'
}
