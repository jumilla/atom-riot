//import fs from 'fs';
//import path from 'path';
'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});
exports.activate = activate;
exports.deactivate = deactivate;

var _atom = require('atom');

//import mkdirp from 'mkdirp';
//import riot from 'riot';

var _child_process = require('child_process');

console.log(require('child_process'));

var subscriptions = undefined;

function activate() {
    subscriptions = new _atom.CompositeDisposable(atom.commands.add('atom-text-editor', 'core:save', function (event) {
        return onFileSave(event.currentTarget.getModel());
    }), atom.commands.add('atom-workspace', 'riot:compile', function () {
        return compile(atom.workspace.getActiveTextEditor());
    }));
}

function deactivate() {
    subscriptions.dispose();
}

function onFileSave(textEditor) {
    if (!textEditor) return;

    console.log('onFileSave');

    var riotGrammar = atom.grammars.grammarForScopeName('source.riot');

    if (textEditor.getGrammar() == riotGrammar) {
        compile(textEditor);
    }
}

function compile(textEditor) {
    //    alert('compile!rel')
    console.log('compile', textEditor.getPath());

    var command = '"' + riotCommandPath() + '" "' + textEditor.getPath() + '"';
    (0, _child_process.exec)(command, { env: process.env }, function (error, stdout, stderr) {
        if (error) {
            console.error(error);
            atom.notifications.addError(stderr, {
                dismissable: true
            });
        } else {
            console.log(stdout);
        }
    });
}

function riotCommandPath() {
    var atomPackage = atom.packages.getLoadedPackage('riot');

    if (atomPackage) {
        return atomPackage.path + '/node_modules/.bin/riot';
    }

    return 'riot';
}