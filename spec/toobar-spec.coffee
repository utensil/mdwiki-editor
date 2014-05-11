require './spec-helper'
ToolbarView = require '../app/coffee/toolbar.coffee'

describe 'ToolbarView', ->
  it 'can be create', ->
    expect(new ToolbarView('test', [])).not.toBeNull()
