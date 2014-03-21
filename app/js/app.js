var gui = require('nw.gui');
var path = require('path');
var static = require('node-static');
var fs = require('fs');
var child_process = require('child_process');
var shelljs = require('shelljs');
var minimatch = require("minimatch");

// Get the current window
var win = gui.Window.get();

var wiki_root_html = localStorage.getItem('wiki_root_html');

if(wiki_root_html == null || !fs.existsSync(wiki_root_html))
{
  // fallback to a sane default: a built-in MDWiki.html with a introductory index.md
  wiki_root_html = path.join(process.cwd(), './app/example/mdwiki.html');
}
else
{
  $('#main-tabs li a[href="#tab-preview"]').click();
}

var wiki_root = path.dirname(wiki_root_html);

Dropzone.options.wikiRoot = {
  uploadMultiple: false,
  addRemoveLinks: true,
  maxFiles: 1,
  dictDefaultMessage: 'Drag the MDWiki html file here or click to choose it',
  init: function () {
    // body...
  },
  accept: function (file, done) {
    var file_path = file.path;

    //TODO further validation
    if(/.*\.html?$/.test(file_path))
    {
      wiki_root_html = file_path.toString();
      localStorage.setItem('wiki_root_html', wiki_root_html);
      wiki_root = path.dirname(wiki_root_html);
      $('#wiki-preview').
        attr('src', get_wiki_root_html() + '#!index.md'); 

      $('#main-tabs li a[href="#tab-preview"]').click();

      console.log(file_path);
      done();
    }
    else
    {
      done('Not an MDWiki html file.');
    }   
    
  }
};

var get_wiki_root = function () { 
  return wiki_root;
};

var get_wiki_root_html = function () {
  return wiki_root_html;
}

var get_current_wiki_url =  function () {
  return document.getElementById("wiki-preview").contentWindow.location.href.toString();
};

var get_current_wiki_source = function () {
  var orig_src = get_current_wiki_url();
  var mardown_src = orig_src.replace(/^.*#!/, '').replace(/\?.*$/, '');
  return path.join(get_wiki_root(), mardown_src);
};

var get_proper_height = function () {
  return Math.max(600, win.height - 250)
};

/*

  @param id: the id of the DOM element to create the toolbar in  
  @param buttons: definition object for buttons, alvailable options are:
                  *  id: the internal id of button(will be prefixed)
                  *  tip: string or function of context
                  *  label: string or function of context
                  *  context: an object to store context info
                  *  click: callback function for click event: callback(event, $(this), context)
                  *  TODO bindKey
 */
var create_toolbar = function (id, buttons, default_context) {
  id = id.replace(/#/, '');
  var toolbar_id = id + '-barbody';
  var toolbar = $('<div class="btn-toolbar"></div>').attr('id', toolbar_id);

  var toolbar_group_template = $('<div class="btn-group"></div>');

  var button_template = $('<button type="button" class="btn btn-default" data-toggle="tooltip"></button>');

  var toolbar_group = toolbar_group_template.clone();

  $.each(buttons, function (i, def) {
    var button = button_template.clone();

    //console.log(i, def);

    if(def.split)
    {
      toolbar.append(toolbar_group);
      toolbar_group = toolbar_group_template.clone();
      return;
    }

    if(def.id == null)
    {
      return;
    }

    var button_id = toolbar_id + '-' + def.id;
    button.attr('id', button_id);

    def.context = def.context || {};
    def.context.toolbar_group = toolbar_group; 
    def.context.button_id = button_id;
    for(key in default_context)
    {
      def.context[key] = default_context[key];
    }

    if(typeof def.tip == 'function')
    {
      button.attr('title', def.tip(def.context));
    }
    else if(typeof def.tip == 'string')
    {
      button.attr('title', def.tip);
    }

    if(typeof def.label == 'function')
    {
      button.html(def.label(def.context));
    }
    else if(typeof def.label == 'string')
    {
      button.html(def.label);
    }

    button.click(function (e) {
      var $this = $(this);
      var context = def.context;

      if(typeof def.label == 'function')
      {
        $this.html(def.label(def.context));
      }

      if(typeof def.click == 'function')
      {
        return def.click(e, $this, context);
      }
    });

    toolbar_group.append(button);

  });

  toolbar.append(toolbar_group);  

  $('#' + id).append(toolbar);

  $('.btn', toolbar).
    css({
      'margin-top': '0.5em',
      'margin-bottom': '0.5em'
    }).
    tooltip({
      container: 'body',
      placement: 'top auto'
    });
};

$(function () {
  /**
    adjust window size

    FIXME It's not good practice
  */

  var resize = function () {
    $('#wiki-preview').
      css({
        height: get_proper_height()
      });

    $('#editor-and-preview').
      css({
        height: get_proper_height()
      });
  };

  win.on('maximize', resize);

  //console.log(process.cwd());

  //console.log(win.width, win.height);

  win.maximize();

  resize();

  /**
    preview the wiki
  */

  $('#wiki-preview').
    attr('src', get_wiki_root_html() + '#!index.md');  

  /**
    tabs
  */
  $('#main-tabs a').click(function (e) {
    e.preventDefault();    

    $(this).tab('show');
  }).on('show.bs.tab', function (e) {
    var $this = $(this);

    //console.log(e.target,  e.relatedTarget);

    if($(e.target).attr('href') == $(e.relatedTarget).attr('href'))
    {
      return false;
    }

    if($(e.target).attr('href') == '#tab-edit')
    {
      //console.log(e.target);
      var markdown_src = get_current_wiki_source();

      $('#tab-edit-info').hide();
      $('#tab-edit-alert').hide();
      $('#img-paste-dialog').hide();

      ace_session.setValue('');

      fs.readFile(markdown_src, function (err, content) {
          if(err)
          {
            //FIXME
            console.error(err);
            return;
          }
          //console.log(content.toString());
          //$('#editor').val(content);          
          $('#tab-edit-alert').hide(); 
          ace_session.setValue(content.toString());
          $('#editor-preview').html(marked(ace_session.getValue()));

          //console.log($('#editor-preview').height(), $('#editor').height());

          $('#editor').css({
            height: Math.max($('#editor-preview').height() * 1.5, $('#editor').height())
          });
          ace_editor.resize(true);
          ace_editor.focus();

          ace_is_dirty = false;
        });
    }

    if($(e.target).attr('href') == '#tab-preview')
    {
      if(ace_is_dirty)
      {
        var wiki_src = get_current_wiki_source();
        var warning = "`"+ wiki_src.split(/\/|\\/).pop() +"` has been modified";
        var warning_para = $('<p></p>').text(warning);

        var button_para = $('<p></p>');

        var button_save = $('<button type="button" class="btn btn-primary"></button>').
          text('Save').css({
            'margin-right': '1em'
          }).click(function (e) {
            
            save_wiki(wiki_src, function () {
              $this.tab('show'); 
            });
          });

        var button_drop = $('<button type="button" class="btn btn-danger"></button>').
          text('Discard').css({
            'margin-right': '1em'
          }).click(function (e) {
            $('#tab-edit-alert').hide();
            ace_is_dirty = false;
            $this.tab('show');         
          });

        var button_cancel = $('<button type="button" class="btn btn-default"></button>').
          text('Cancel').css({
            'margin-right': '1em'
          }).click(function (e) {
            $('#tab-edit-alert').hide();         
          });

        button_para.
          append(button_save).
          append(button_drop).
          append(button_cancel);

        $('#tab-edit-alert-content').
          empty().
          append(warning_para).
          append(button_para)
          ;

        $('#tab-edit-alert').show();

        return false;
      }
    }

    return true;
  }).on('shown.bs.tab', function (e) { 
    if($(e.target).attr('href') == '#tab-preview')
    {
      $('#refresh').click();
    }    
  });

  /**
    editor
  */
  $('#tab-edit-alert').hide();   

  var ace_editor = ace.edit("editor");
  ace_editor.setOptions({
      enableBasicAutocompletion: true,
      enableSnippets: true
  });
  ace_editor.setTheme("ace/theme/github");
  ace_editor.setBehavioursEnabled(true);
  ace_editor.setWrapBehavioursEnabled(true);
  ace_editor.setFontSize(14);
  //ace_editor.setHighlightActiveLine(true);
  ace_editor.commands.addCommand({
      name: 'save',
      bindKey: {win: 'Ctrl-S',  mac: 'Command-S'},
      exec: function(editor) {
        var wiki_src = get_current_wiki_source();
        save_wiki(wiki_src);      
      },
      readOnly: false // false if this command should not apply in readOnly mode
  });

  var ace_session = ace_editor.getSession();
  ace_session.setMode("ace/mode/markdown");
  ace_session.setTabSize(2);
  ace_session.setUseSoftTabs(true);
  ace_session.setWrapLimitRange(80, 80);
  ace_session.setUseWrapMode(true);

  var ace_snippetManager = ace.require("ace/snippets").snippetManager;

  var ace_is_dirty = false;
  var ace_is_rendering = false;

  ace_session.on("change", function(delta) {
    ace_is_dirty = true;

    if(ace_is_rendering)
    {
      return;
    }
    else
    {
      setTimeout(function () {
        marked.setOptions({
              renderer: new marked.Renderer(),
              gfm: true,
              tables: true,
              breaks: true
              // pedantic: false,
              // sanitize: true,
              // smartLists: true,
              // smartypants: false
            });

        $('#editor-preview').html(marked(ace_session.getValue()));

        $('#editor-preview table').addClass('table table-bordered ');
        $('#editor-preview a').click(function (e) {
          return false;
        });
        $('#editor-preview img').each(function (i, e) {
          console.log(i, e);
          $(e).attr('src', 
           path.join(path.dirname(get_current_wiki_source()), $(e).attr('src'))
          );
        });

        var preview_height = $('#editor-preview').height();
        var editor_height = $('#editor').height();

        if(preview_height * 1.5 > editor_height)
        {
          $('#editor').css({
            height: preview_height * 1.5
          });
          ace_editor.resize(true);
        }
        
        ace_is_rendering = false;
      }, 500);
      ace_is_rendering = true;
    }
  });

  //load snippets
  fs.readFile(path.join(process.cwd(), 'app/js/snippets.snippets'), function (err, content) {
    if(err)
    {
      //FIXME
      console.error(err);
      return;
    }
    //console.log(content.toString());
    //$('#editor').val(content);          
     
    ace_snippets(ace_editor, ace_session, "markdown", content.toString());
  });

  var trigger_snippet = function (snippet_name) {
    ace_snippetManager.insertSnippet(
            ace_editor, 
            ace_snippetManager.getSnippetByName(
              snippet_name, 
              ace_editor).content);
    ace_editor.focus();
  };

  var save_wiki = function (wiki_src, cb) {
    fs.writeFile(wiki_src, ace_session.getValue(), function (err, data) {
        if(err)
        {
          //FIXME
          console.error(err);
          return;
        }

        $('#tab-edit-info-content').empty().text("`" + path.basename(wiki_src) + '` successfully saved.');
        $('#tab-edit-info').show();

        setTimeout(function () {
          $('#tab-edit-info-content').empty();
          $('#tab-edit-info').hide();
        }, 1000);

        ace_is_dirty = false;

        if(cb) cb();
      });       
  }

  create_toolbar('editor-toolbar', [
      {
        id: 'save',
        tip: 'Save (Ctrl+S)',
        label: '<i class="fa fa-fw fa-save"></i>Save',        
        click: function (e, $this, context) {
          var wiki_src = get_current_wiki_source();
          save_wiki(wiki_src);     
        }
      },
      {
        id: 'commit',
        tip: 'Commit SVN',
        //FIXME support more version control tools
        label: '<i class="fa fa-fw fa-cloud-upload"></i>Commit SVN',        
        click: function (e, $this, context) {
          // child_process.exec(command, [options], callback)#
          // command String The command to run, with space-separated arguments
          // options Object
          // cwd String Current working directory of the child process
          // env Object Environment key-value pairs
          // encoding String (Default: 'utf8')
          // timeout Number (Default: 0)
          // maxBuffer Number (Default: 200*1024)
          // killSignal String (Default: 'SIGTERM')
          // callback Function called with the output when process terminates
          // error Error
          // stdout Buffer
          // stderr Buffer
          // Return: ChildProcess object   
          child_process.exec(
            "TortoiseProc /command:commit /path:" + get_wiki_root(),
            function (error, stdout, stderr) {
              if(error && error.code != 'OK')
              {
                console.error(error);
                $('#tab-edit-alert-content').
                  empty().
                  text('TortoiseSVN is not installed or it\'s not added to system variable "PATH"');

                $('#tab-edit-alert').show();

                setTimeout(function () {
                  $('#tab-edit-alert-content').empty();
                  $('#tab-edit-alert').hide();
                }, 5000);
              }
              
            });
        }
      },
      {
        split: true
      },
      {
        id: 'bold',
        tip: 'Bold',
        label: '<i class="fa fa-fw fa-bold"></i>',        
        click: function (e, $this, context) {
            trigger_snippet('bold');          
        }
      },
      {
        id: 'italic',
        tip: 'Italic',
        label: '<i class="fa fa-fw fa-italic"></i>',        
        click: function (e, $this, context) {
            trigger_snippet('italic');          
        }
      },
      {
        split: true
      },
      {
        id: 'link',
        tip: 'Link',
        label: '<i class="fa fa-fw fa-link"></i>',        
        click: function (e, $this, context) {
            trigger_snippet('link');          
        }
      },
      {
        id: 'pic',
        tip: 'Image',
        label: '<i class="fa fa-fw fa-picture-o"></i>',        
        click: function (e, $this, context) {
            trigger_snippet('pic');          
        }
      },
      {
        split: true
      },
      {
        id: 'table',
        //FIXME make it a modal or something
        tip: 'Organize Table:\n(Create a 6-column table by default\nAlign existing table by the widest row of each column;an empty header deletes corresponding column;an extra header appends a column)',
        label: '<i class="fa fa-fw fa-table"></i>',        
        click: function (e, $this, context) {
          var current_line = ace_editor.getCursorPosition().row;
          var current_line_string = ace_session.getLine(current_line);     
          var table_regex = /\|([^|]*\|)+/;

          if(table_regex.test(current_line_string))
          {
            var table_begin = current_line;
            var table_end = current_line;

            while(table_begin > 0 && table_regex.test(ace_session.getLine(table_begin - 1)))
            {
              table_begin--;
            }

            while(table_end < ace_session.getLength() && table_regex.test(ace_session.getLine(table_end + 1)))
            {
              table_end++;
            }

            //console.log(current_line, table_begin, table_end, ace_session.getLine(table_end).length);

            var aceRange = ace.require('ace/range').Range;
            
            var table_range = new aceRange(
              table_begin, 0, 
              table_end, ace_session.getLine(table_end).length);

            var table_lines = ace_session.getLines(table_begin, table_end);

            var table_lines_processed = table_lines.join('\n').replace(/[^|\n]/g, '&');

            var table_header = table_lines[0].
                                replace(/^\|/g, '').
                                replace(/\|$/g, '').
                                split(/\|/);

            // for (var i = 0; i < table_header.length; i++) {
            //   if(table_header[i].match(/^\s*$/))
            //   {
            //     table_header.splice(i, 1);
            //     i--;
            //   }
            //   else
            //   {
            //     break;
            //   }
            // };

            // for (var j = table_header.length - 1; j >= 0 ; j--) {
            //   //console.log(j, table_header[j], /^\s*$/.test(table_header[j]));
            //   if(table_header[j].match(/^\s*$/))
            //   {
            //     table_header.splice(j, 1);
            //   }
            //   else
            //   {
            //     break;
            //   }
            // };

            //console.log(table_header);
            
            var col = table_header.length;            


            // var col = .
            //             reduceRight(
            //               function(previousValue, currentValue, index, array) {
            //                 if(/\S+/.test(currentValue))
            //                 {
            //                   return previousValue + 1;
            //                 }
            //                 else
            //                 {

            //                 }
            //             }, 0);

            //console.log(col);

            var col_max = new Array(col);

            for (var k = 0; k < col; k++) {
              table_lines.forEach(function (line, i) {

                line = line.
                        replace(/^\|/g, '').
                        replace(/\|$/g, '').
                        split(/\|/);
                col_max[k] = //Math.max(table_header[k].length, 
                    Math.max(col_max[k] || 0, 
                             (line[k] || '').
                              replace(/^\s+|\s+$|--/g, '').
                              //FIXME only considered Chinese characters
                              replace(/[^\x00-\xef]/g, '@@').
                              length)
                  //)
                  ;

                if(table_header[k].length == 0)
                {
                  col_max[k] = 0;
                }
      
              });  
            };

            //console.log(col_max);

            var repeat = function (char, times) {
              var ret = [];
              for (var i = 0; i < times; i++) {
                ret.push(char);
              }
              return ret.join('');
            };

            var extra_pad = 1;

            table_lines = table_lines.map(function (line, i) {
              line = line.
                        replace(/^\|/g, '').
                        replace(/\|$/g, '').
                        split(/\|/);

              line_processed = [''];

              for (var k = 0; k < col; k++) {

                var cell = line[k];

                if(cell == null)
                {
                  line_processed.push(
                    repeat(' ', col_max[k] + extra_pad * 2));
                  continue;
                }

                if(col_max[k] == 0)
                {
                  continue;
                }

                if(/^[ ]*-+[ ]*$/.test(cell))
                {
                  //console.log(cell);
                  line_processed.push(
                    repeat(' ', extra_pad) +
                    repeat('-', col_max[k]) + 
                    repeat(' ', extra_pad));
                }
                else
                {
                  var cell_content = cell.replace(/^\s+|\s+$|--/g, '');
                  var cell_length = cell_content.
                                      replace(/[^\x00-\xef]/g, '@@').
                                      length;
                  var total_pad_length = Math.max(0, col_max[k] + extra_pad * 2 - cell_length);

                  if(i == 0)
                  {
                    var left_pad_length = Math.floor(total_pad_length / 2) + total_pad_length % 2;
                    var right_pad_length = Math.floor(total_pad_length / 2);

                    //console.log(cell_content, col_max[k] + 4, cell_length, total_pad_length);

                    line_processed.push(
                      repeat(' ', left_pad_length) + cell_content
                       + repeat(' ', right_pad_length));
                  }
                  else
                  {
                    if(/\d+/.test(cell_content))
                    {
                      line_processed.push(
                        repeat(' ', total_pad_length - extra_pad) + 
                        cell_content + repeat(' ', extra_pad));
                    }
                    else
                    {
                      line_processed.push(repeat(' ', extra_pad) + cell_content + 
                                          repeat(' ', total_pad_length - extra_pad));
                    }
                  }                  
                }
              }

              line_processed.push('');

              return line_processed.join('|');
            });


            ace_session.replace(table_range, table_lines.join('\n'));

            //getRowLength(Number row) 
          }
          else
          {
            trigger_snippet('|*6');
          }  
        }
      },
      {
        split: true
      },
      {
        id: 'blockquote',
        tip: 'Blockquote',
        label: '<i class="fa fa-fw fa-indent"></i>',        
        click: function (e, $this, context) {
            var selection = context.$editor.getSelectionRange();
            var session = context.$session;
            var selection_string = session.getTextRange(selection);

            //console.log(selection, selection_string);

            if(selection.isEmpty())
            {
              trigger_snippet('blockquote');
            }
            else
            {
              if(/^>\s+/.test(selection_string))
              {
                trigger_snippet('blockquote-selected-undo');
              }
              else
              {
                trigger_snippet('blockquote-selected');
              }
            }                      
        }
      },
      {
        id: 'code',
        tip: 'Code',
        label: '<i class="fa fa-fw fa-code"></i>',        
        click: function (e, $this, context) {
            trigger_snippet('code');          
        }
      },
      {
        split: true
      },
      {
        id: 'ul',
        tip: 'Unordered list',
        label: '<i class="fa fa-fw fa-list-ul"></i>',        
        click: function (e, $this, context) {
            var selection = context.$editor.getSelectionRange();
            var session = context.$session;
            var selection_string = session.getTextRange(selection);

            //console.log(selection, selection_string);

            if(selection.isEmpty())
            {
              trigger_snippet('ul');
            }
            else
            {
              if(/^\*\s+/.test(selection_string))
              {
                trigger_snippet('ul-selected-undo');
              }
              else
              {
                trigger_snippet('ul-selected');
              }
            }          
        }
      },   
      //TODO: an ordered list   
      {
        split: true
      },
      {
        id: 'h1',
        tip: 'H1',
        label: 'H1',        
        click: function (e, $this, context) {
            trigger_snippet('h1');          
        }
      },
      {
        id: 'h2',
        tip: 'H2',
        label: 'H2',        
        click: function (e, $this, context) {
            trigger_snippet('h2');          
        }
      },
      {
        id: 'h3',
        tip: 'H3',
        label: 'H3',        
        click: function (e, $this, context) {
            trigger_snippet('h3');          
        }
      },
      {
        id: 'hr',
        tip: 'Horizontal line',
        label: '<i class="fa fa-fw fa-minus"></i>',        
        click: function (e, $this, context) {
            trigger_snippet('hr');          
        }
      },
      {
        split: true
      },
      {
        id: 'wrap',
        tip: 'Toggle wordwrap',
        label: '&crarr;',        
        click: function (e, $this, context) {
            ace_session.setUseWrapMode(!ace_session.getUseWrapMode());          
        }
      },
      // {
      //   id: 'invisible',
      //   tip: 'Toggle invisible',
      //   label: '&para;',        
      //   click: function (e, $this, context) {
      //       ace_editor.setShowInvisibles(!ace_editor.getShowInvisibles());          
      //   }
      // }
      ], {
      $editor: ace_editor,
      $session: ace_session
    });

  /**
   * image pasting
   */
  $("#tab-edit").pasteImageReader(function(results) {


    var dataURL, filename;
    filename = results.filename, dataURL = results.dataURL;
    var file = results.file;

    var img = $('#img-paste');
    img.attr('src', dataURL);
    var w = img.get().width;
    var h = img.get().height;

    var image_file_select = $('#image-file');

    var wiki_src = get_current_wiki_source();
    var wiki_image_dir = path.dirname(wiki_src);

    if(fs.existsSync(path.join(wiki_image_dir, 'img')))
    {
      wiki_image_dir = path.join(wiki_image_dir, 'img');
    }

    image_file_select.attr('nwworkingdir', wiki_image_dir);
    image_file_select.attr('nwsaveas', 
      path.basename(wiki_src, '.md') + '-' + Date.now() + '.png');

    //FIXME!!! this should be simply a default text input
    $('#image-save').click(function (e) {
      try
      {
        var saveas_path = image_file_select[0].files[0].path;
        console.log(saveas_path);

        var saveas_dir = path.dirname(saveas_path);
        console.log(wiki_image_dir, saveas_dir);

        if(saveas_dir.toUpperCase() == wiki_image_dir.toUpperCase() &&
            !/img[\/\\]?$/.test(saveas_dir))
        {
          saveas_dir = path.join(saveas_dir, 'img');
          if(!fs.existsSync(saveas_dir))
          {
            fs.mkdirSync(saveas_dir);
          }
        }

        var saveas_filename = path.basename(saveas_path);

        saveas_path = path.join(saveas_dir, saveas_filename); 

        console.log(saveas_path);

        var reader = new FileReader();
        reader.onload = function(evt) {    
          fs.writeFile(saveas_path, reader.result, function (err) {
            if(err)
            {
              console.error(err);
            }

            //trigger_snippet('pic');
            //
            
            $('#img-paste-dialog').hide();

            ace_snippetManager.insertSnippet(
                    ace_editor, 
                    [
                      '![](',
                      path.join(
                        path.relative(path.dirname(wiki_src), saveas_dir),
                        saveas_filename
                        ).replace(/\\/, '/'),
                      ' "${1}")'
                    ].join('')
                    );
            ace_editor.focus();

          });                      
        };
        reader.readAsBinaryString(file);
      }
      catch(err)
      {
        console.log(err);
      }      
    });


    // img.css({
    //   backgroundImage: "url(" + dataURL + ")"
    // }).data({'width':w, 'height':h});
    // 
    $('#img-paste-dialog').show();
  });

  /**
    Tool Tips
  */
  $('#toolbar .btn').
    css({
      'margin-top': '1em',
      'margin-bottom': '2em'
    }).
    tooltip({
      container: 'body',
      placement: 'top auto'
    });

  /**
    Button "Refresh"
  */
  $('#refresh').click(function () {
    var orig_src = get_current_wiki_url();
    $('#wiki-preview').attr('src', orig_src + '?_=' + Math.random());
    $('#wiki-preview').attr('src', orig_src);
    console.log($('#wiki-preview').attr('src'));
  });

  /**
    Button "Folder"
  */
  $('#locate').click(function () {
    var mardown_src = get_current_wiki_source();  
    console.log(mardown_src);
    if(mardown_src.match(/\.md$/))
    {
      gui.Shell.showItemInFolder(mardown_src);
    }
  });

  /**
    Button "Edit with..."
  */
  $('#edit-external').click(function () {
    var mardown_src = get_current_wiki_source();  
    console.log(mardown_src);
    if(mardown_src.match(/\.md$/))
    {
      gui.Shell.openItem(mardown_src);
    }
  });

  /**
    Button "Web Server"
  */
  var server = null;
  var server_port = 8080;
  var server_stopped_html = '<i class="fa fa-play"></i>&nbsp;Start web server';
  var server_started_html = '<i class="fa fa-stop"></i>&nbsp;Stop web server';

  $('#server').click(function () {

    var server_port_val = $('#server_port').val();

    if(server_port_val.match(/\d{2,5}/))
    {
      server_port = parseInt(server_port_val, 10);
    }
    else
    {
      server_port = 8080;    
    }

    $('#server_port').val(server_port);
    $('#server_port').attr('placeholder', server_port);    

    var ensureClose = function () {
      try
      {
        server.close();
        if(server) server.unref();
      }
      catch(e)
      {
        console.error(e);
      }
      finally
      {
        server = null;
        $('#server').html(server_stopped_html);
      }
    }

    if(server == null)
    {
      console.log('serving', path.resolve(get_wiki_root(), '.'));
      var file = new static.Server(
                        //to get around case sensitive bug under windows in node-static
                        path.resolve(path.join(get_wiki_root(), '.'))
                        , { cache: false });

      server = require('http').createServer(function (request, response) {
          request.addListener('end', function () {
              //
              // Serve files!
              //
              //console.log(request, response);
              file.serve(request, response);
          }).resume();
      }).    
      on('error', function (e) {
        if (e.code == 'EADDRINUSE') {
          console.error('Address in use, closing...');
          ensureClose();
        };
      }).
      on('listening', function () {      
        $('#server').html(server_started_html);
        gui.Shell.openExternal('http://localhost:' + server_port + '/' + path.basename(get_wiki_root_html()) + '#!index.md');
      }).
      on('close', function () {
        server = null;
        $('#server').html(server_stopped_html);
      }).
      listen(server_port);
    }
    else
    {
      ensureClose();
    }  
  });


  /*
    Button "Search"
   */  
  $('#search').click(function (e) {
    var search_target = new RegExp($('#search-target').val());

    if(search_target)
    {
      var files = path.join(get_wiki_root(), './*.md');
      var allfiles = shelljs.ls('-R', get_wiki_root());
      var mdfiles = allfiles.filter(minimatch.filter('**/*.md'));

      $('#search-result').empty();

      mdfiles.forEach(function (file, i) {
        var full_path = path.join(get_wiki_root(), './', file);

        fs.readFile(full_path, { 'encoding' : 'utf-8' }, function (err, data) {
          if(err)
          {
            throw err;
          }

          var lines = data.split(/[\r\n]/);

          var found = 0;

          var file_match_panel = $('<div class="panel panel-info"></div>');

          var file_match_panel_heading = $('<div class="panel-heading"></div>').
            text(path.relative(get_wiki_root(), full_path));

          file_match_panel_heading.click(function (e) {
            if(file != 'navigation.md')
            {
              $('#wiki-preview').attr('src', get_wiki_root_html() + '#!' + file);
              $('#main-tabs li a[href="#tab-preview"]').click();
            }            
          });

          file_match_panel.append(file_match_panel_heading);

          var file_match_list = $('<ul class="list-group"></ul>');

          file_match_panel.append(file_match_list);

          var file_match_item_tmpl = $('<li class="list-group-item"></li>');

          var should_break = false;

          lines.forEach(function (line, line_num) {

            if(line.match(search_target))
            {
              found += 1; 

              if(should_break)
              {
                return;
              }

              if(found < 5)
              {
                file_match_list.append(
                  file_match_item_tmpl.clone().
                    text(line)); 
              }
              else
              {
                file_match_list.append(
                  file_match_item_tmpl.clone().
                    text('...'));
                should_break = true;
              }            
            }
          });

          if(found > 0)
          {
            $('.panel-heading', file_match_panel).append($(' <span class="badge"></span>').text(found));
            $('#search-result').append(file_match_panel);
          }
        });
      });
    }
  });

});


