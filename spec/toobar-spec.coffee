require './spec-helper'
$ = require 'jquery'
{View, $$} = require 'space-pen'
ToolbarView = require '../app/coffee/toolbar.coffee'

targetDiv = '<div id="target"></div>'


FIXTURE_FUN = (e, $this, context) ->
  console.log e, $this, context

FIXTURE_DEF = [
  {
    id: 'bold',
    tip: 'Bold',
    label: '<i class="fa fa-fw fa-bold"></i>',        
    click: FIXTURE_FUN
  },
  {
    id: 'italic',
    tip: 'Italic',
    label: '<i class="fa fa-fw fa-italic"></i>',        
    click: FIXTURE_FUN
  },
  {
    split: true
  },
  {
    id: 'link',
    tip: 'Link',
    label: '<i class="fa fa-fw fa-link"></i>',        
    click: FIXTURE_FUN
  }
]

expectAttrsHelper = (actual, expectedAttrs) ->
  for attr, expectedVal of expectedAttrs
    actualVal = actual.attr(attr)
    expect(actualVal).not.toBeNull()
    expect(actualVal).toBe(expectedVal)

beforeEach ->
  $('body').empty()
  $('body').append($(targetDiv))

describe 'ToolbarView', ->
  it 'can be created with an empty definition', ->
    tv = new ToolbarView('target', [])
    expect(tv).not.toBeNull()
    expect($('#target').parent().html()).toBe(targetDiv)

  it 'can be created with a useful definition', ->
    tv = new ToolbarView('target', FIXTURE_DEF)

    # 
    # created
    # 
    expect(tv).not.toBeNull()
    target = $('#target')

    # 
    # has a body
    # 
    body = target.find('#target-barbody.btn-toolbar')
    expect(body).not.toBeNull()

    # 
    # correctly splitted into groups
    # 
    btnGroups = body.find('.btn-group')
    expect(btnGroups.length).toBe(2)

    firstGroup = $('button', btnGroups[0])
    secondGroup = $('button', btnGroups[1])

    expect(firstGroup.length).toBe(2)
    expect(secondGroup.length).toBe(1)   

    # 
    # correctly assign attributes to buttons
    # 
    defaultAttrs = 
      "type": "button"
      "class": "btn btn-default"
      "data-toggle": "tooltip"
      "style": "margin-top: 0.5em; margin-bottom: 0.5em;"

    btns = [$(firstGroup[0]), $(firstGroup[1]), null, $(secondGroup[0])]

    for i in [0..3]
      btn = btns[i]
      continue if null == btn

      expectAttrsHelper btn, $.extend({}, defaultAttrs, {
        "title": FIXTURE_DEF[i].tip
      })
      expect(btn.html()).toBe(FIXTURE_DEF[i].label)

      # FIXME events not triggered
      btn.click()





