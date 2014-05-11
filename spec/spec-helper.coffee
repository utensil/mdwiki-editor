jsdom = require("jsdom").jsdom
global.document = jsdom("<html><head></head><body>Spec Runner</body></html>")
global.window = document.parentWindow