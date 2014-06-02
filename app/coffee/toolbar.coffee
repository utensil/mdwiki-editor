$ = require 'jquery'
{View, $$} = require 'space-pen'

module.exports =
class ToolbarView extends View

  # @param id: the id of the DOM element to create the toolbar in
  # @param buttons: definition object for buttons, available options are:
  #                 *  id: the internal id of button(will be prefixed)
  #                 *  tip: string or function of context
  #                 *  label: string or function of context
  #                 *  context: an object to store context info
  #                 *  click: callback function for click event: callback(event, $(this), context)
  #                 *  TODO bindKey
  @content: (id, buttons, default_context) ->
    id = id.replace(/#/, '')
    @toolbar_id = "#{id}-barbody"
    @div id: id, =>
      @toolbar = @create_toolbar(@toolbar_id)

      toolbar_group = @create_toolbar_group()

      for def in buttons
        if def.split
          @toolbar.append toolbar_group
          toolbar_group = @create_toolbar_group()
          continue

        if def.id == null
          continue

        button_id = "#{@toolbar_id}-#{def.id}"

        button = @create_button(button_id)

        def.context = def.context || {}
        def.context.toolbar_group = toolbar_group
        def.context.button_id = button_id

        default_context = default_context || {}

        for key, value of default_context
          def.context[key] = value
    
        if typeof def.tip == 'function'
          button.attr('title', def.tip(def.context))
        else if typeof def.tip == 'string'
          button.attr('title', def.tip)
    
        if typeof def.label == 'function'
          button.html(def.label(def.context))
        else if typeof def.label == 'string'
          button.html(def.label)
    
        button.click (e) ->
          $this = $(this)
          context = def.context
    
          if typeof def.label == 'function'
            $this.html(def.label(def.context))

          if typeof def.click == 'function'
            return def.click(e, $this, context)
    
        toolbar_group.append(button)

        @toolbar.append(toolbar_group)
        
        $("##{id}").append(@toolbar)
        
        $('.btn', @toolbar).
          css(
            'margin-top': '0.5em',
            'margin-bottom': '0.5em'
          )
          # TODO add back tooltip functionality
          # .
          # tooltip(
          #   container: 'body',
          #   placement: 'top auto'
          # )

  @create_toolbar: (toolbar_id)->
    $$ ->
      @div class: 'btn-toolbar', id: toolbar_id
  @create_toolbar_group: ->
    $$ ->
      @div class: 'btn-group'

  @create_button: (id) ->
    $$ ->
      @button type: 'button', class: 'btn btn-default', 'data-toggle': 'tooltip'
