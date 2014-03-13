/*
 *  Note: this is a fixed version of https://github.com/Dahs81/ace-snippet-extension
 *  see https://github.com/Dahs81/ace-snippet-extension/pull/1
 */

ace.require('ace/ext/language_tools');

// Is ace a psuedo global? i.e. as should be loaded before this file is includes
// This file should be included before the js file in which your editor is defined
var ace_snippets = function(editor, session, mode, snippetText) {
	var snippet = setup(editor, session, mode, snippetText);
	snippet.manager.register(snippet.m.snippet, snippet.m.scope);
};

var getNames = function (editor, session, mode, snippetText) {
	var snippet = setup(editor, session, mode, snippetText),
		names = [];

	for (var i = 0; i < snippet.m.snippet.length; i++) {
		names.push(snippet.m.snippet[i].name);
	}

	return names;
};

var getContent = function (editor, session, mode, snippetText) {
	var snippet = setup(editor, session, mode, snippetText),
		content = [];

	for (var i = 0; i < snippet.m.snippet.length; i++) {
		content.push(snippet.m.snippet[i].content);
	}

	return content;
};

/*
 *  Helper function that sets up the snippet code
 */
function setup(editor, session, mode, snippetText) {
	editor.setOptions({
		enableBasicAutocompletion: true,
		enableSnippets: true
	});

	var snippetManager = ace.require("ace/snippets").snippetManager;

	var id = session.$mode.$id || "";
	var m = snippetManager.files[id];

	m.scope = mode;
	m.snippetText = snippetText;
	m.snippet = snippetManager.parseSnippetFile(snippetText, m.scope);

	return {
		manager: snippetManager,
		id: id,
		m: m
	};
}
