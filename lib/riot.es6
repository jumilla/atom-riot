'use babel';

import fs from 'fs'
import path from 'path'
import { CompositeDisposable } from 'atom'
import { exec, spawn } from 'child_process'

let subscriptions

export let config = {
    compileOnSave: {
        title: 'Compile on save',
        description: 'Compile on file save.',
        type: 'boolean',
        default: true,
    },

    riotPath: {
        title: 'Riot-CLI path',
        description: 'Path for Global riot command.',
        type: 'string',
        default: process.env.RIOT_PATH || '/usr/local/bin/riot',
    },
}

export function activate() {
    subscriptions = new CompositeDisposable(
        atom.commands.add('atom-text-editor', 'core:save', (event) => onCommandCompileOnSave(event.currentTarget.getModel())),
        atom.commands.add('atom-workspace', 'riot:compile', () => onCommandCompile(atom.workspace.getActiveTextEditor()))
    )
}

export function deactivate() {
    subscriptions.dispose()
}

function onCommandCompileOnSave(textEditor) {
    if (atom.config.get('riot.compileOnSave') === false) return

    onCommandCompile(textEditor)
}

function onCommandCompile(textEditor) {
    if (!textEditor) return

    let riotGrammar = atom.grammars.grammarForScopeName('source.riot')

    if (textEditor.getGrammar() == riotGrammar) {
        compileRiot(textEditor.getPath())
    }
}

function endsWith(string, suffix) {
    var sub = string.length - suffix.length
    return (sub >= 0) && (string.lastIndexOf(suffix) === sub)
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

            atom.notifications.addError(
                'Riot compile error',
                {
                    dismissable: true,
                    detail: stdout || stderr,
                }
            )

            return
        }

        console.info(stdout)

        let destPath = sourcePath.substring(0, sourcePath.length - ext.length) + '.js'
        atom.notifications.addSuccess(`Saved to ${destPath}`)
    })
}

function riotCommandPath() {
    // 1. global command
    let globalRiotPath = atom.config.get('riot.riotPath')
    if (fs.existsSync(globalRiotPath)) {
        return globalRiotPath
    }
    console.warn('Global riot command not found', globalRiotPath);

    // 2. package local command
    let atomPackage = atom.packages.getLoadedPackage('riot')

    if (!atomPackage) {
        throw new Error('package broken')
    }

    return atomPackage.path + '/node_modules/.bin/riot'
}
