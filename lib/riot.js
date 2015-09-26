'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});
exports.activate = activate;
exports.deactivate = deactivate;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _atom = require('atom');

//import mkdirp from 'mkdirp';
//import riot from 'riot';

var _child_process = require('child_process');

var RIOT_PATH = '/usr/local/bin/riot';
var subscriptions = undefined;

function activate() {
    subscriptions = new _atom.CompositeDisposable(atom.commands.add('atom-text-editor', 'core:save', function (event) {
        return onCommandCompile(event.currentTarget.getModel());
    }), atom.commands.add('atom-workspace', 'riot:compile', function () {
        return onCommandCompile(atom.workspace.getActiveTextEditor());
    }));
}

function deactivate() {
    subscriptions.dispose();
}

function onCommandCompile(textEditor) {
    if (!textEditor) return;

    var riotGrammar = atom.grammars.grammarForScopeName('source.riot');

    if (textEditor.getGrammar() == riotGrammar) {
        compileRiot(textEditor.getPath());
    }
}

function endsWith(string, suffix) {
    var sub = string.length - suffix.length;
    return sub >= 0 && string.lastIndexOf(suffix) === sub;
}

function compileRiot(sourcePath) {
    console.log('compile', sourcePath);

    var ext = (function (filePath) {
        var _arr = ['riot.tag', 'riot.html', 'tag', 'html'];

        for (var _i = 0; _i < _arr.length; _i++) {
            var _ext = _arr[_i];
            if (endsWith(filePath, '.' + _ext)) {
                return _ext;
            }
        }
        return _path2['default'].extname(filePath);
    })(sourcePath);

    var command = '"' + riotCommandPath() + '" "' + sourcePath + '"' + ' --ext=' + ext.slice(1);

    (0, _child_process.exec)(command, { env: process.env }, function (error, stdout, stderr) {
        if (error) {
            console.error(error);

            atom.notifications.addError(stderr, {
                dismissable: true
            });

            return;
        }

        console.log(stdout);

        var destPath = sourcePath.substring(0, sourcePath.length - ext.length) + '.js';
        atom.notifications.addSuccess('Saved to ' + destPath);
    });
}

function riotCommandPath() {
    // 1. global command
    if (_fs2['default'].existsSync(RIOT_PATH)) {
        return RIOT_PATH;
    }

    // 2. package local command
    var atomPackage = atom.packages.getLoadedPackage('riot');

    if (!atomPackage) {
        throw new Error('package broken');
    }

    return atomPackage.path + '/node_modules/.bin/riot';
}