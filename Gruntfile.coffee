module.exports = (grunt) ->
  grunt.initConfig
    pkg: grunt.file.readJSON('package.json')

    coffee:
      glob_to_multiple:
        expand: true
        cwd: 'app/coffee'
        src: ['*.coffee']
        dest: 'app/js/main/'
        ext: '.js'

    coffeelint:
      options:
        no_empty_param_list:
          level: 'error'
        max_line_length:
          level: 'ignore'

      gruntfile: ['Gruntfile.coffee']
      src: ['app/coffee/*.coffee']

  grunt.loadNpmTasks('grunt-contrib-coffee')
  grunt.loadNpmTasks('grunt-coffeelint')

  grunt.registerTask('lint', ['coffeelint'])
  grunt.registerTask('default', ['coffeelint', 'coffee'])
