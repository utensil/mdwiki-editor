mdwiki-editor
=============

An editor for MDwiki(https://github.com/Dynalon/mdwiki)

Development Status
----------------------

 [![Build Status](https://travis-ci.org/utensil/mdwiki-editor.png?branch=master)](https://travis-ci.org/utensil/mdwiki-editor)

Currently works. But without proper organization of code, without tests and documentation. Planning to refactor soon.

Installation
----------------

1. Install [node-webkit](https://github.com/rogerwang/node-webkit)
2. `cd` into the cloned repo and 

```
# installs dependency
npm install
npm install -g bower
bower install
#build
npm install -g grunt-cli
grunt
# run with `node-webkit`
nw .
```

Run tests
---------------

```
npm install -g jasmine-node
jasmine-node --coffee spec/
```

License
-----------------

MIT License, see LICENSE. Copyright (c) 2014 Utensil Song (https://github.com/utensil)

