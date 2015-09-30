var parallel = require('run-parallel')
var path = require('path')
var fs = require('fs')
var got = require('got')
var extend = require('extend')
var debug = require('debug')('figshre-search')
var pager = require('paged-http-stream')
var through = require('through2')
var qs = require('querystring')

module.exports = Figshare

function Figshare (opts) {
  if (!(this instanceof Figshare)) return new Figshare(opts)
  if (!opts) return new Figshare({})

  this.opts = opts
  this.version = opts.version || 1
  this.name = 'figshare'
  this.uri = (opts.uri || 'http://api.figshare.com') + '/v' +  this.version
}

Figshare.prototype.get = function (id, cb) {
  // could be the raw id or the URL with the id at the end.

  // e.g. http://figshare.com/articles/_The_VP1_and_5_8242_UTR_phylogeny_of_EV_C_species_/995187
  // becomes 995187
  if (id.toString().match(/http:\/\//)) {
    var splitted = id.split('/')
    var id = splitted[splitted.length - 1]
  }
  return got(this.uri + '/articles/' + id, function (err, data) {
    if (err) return cb(err)
    data = JSON.parse(data)
    if (data.count === 0) return cb(new Error('Article not found with id', id))
    if (data.count > 1) return cb(new Error('More than one article found with id', id))
    return cb(null, data.items[0])
  })
}

Figshare.prototype.download = function (article, dir, opts, cb) {
  var self = this
  if (!opts) opts = {}
  if (!fs.existsSync(dir)) fs.mkdirSync(dir)
  var tasks = []
  tasks.push(function (done) {
    if (opts.raw) {
      name = 'article.json'
      datapackage = article
    } else {
      name = 'datapackage.json'
      datapackage = self.datapackage(article)
    }
    var writer = fs.createWriteStream(path.join(dir, name))
    writer.write(JSON.stringify(article, null, 2))
    writer.end()
    done()
  })
  for (var i in article.files) {
    (function (i) {
      tasks.push(function (done) {
        var file = article.files[i]
        var writer = fs.createWriteStream(path.join(dir, file.name))
        writer.on('error', done)
        writer.on('finish', done)
        got.stream(file.download_url).pipe(writer)
      })
    })(i)
  }
  parallel(tasks, cb)
}

Figshare.prototype.datapackage = function (article) {
  // normalizes as a datapackage.json
  var datapackage = extend({}, article)
  datapackage.resources = datapackage.files
  delete datapackage.files
  return datapackage
}

Figshare.prototype._reqOpts = function (query) {
  var querystring = qs.stringify({
    search_for: query.fulltext,
    page: query.page
  })
  var opts = {
    method: 'GET',
    uri: this.uri + '/articles/search?' + querystring,
  }
  return opts
}

Figshare.prototype.search = Figshare.prototype.stream = function (query) {
  var self = this

  function next (data) {
    if (data.error) throw new Error(data.error)
    if (data.items.length === 0) return null // we are done here

    query.page = data.page_nr ? parseInt(data.page_nr + 1) : 1
    return self._reqOpts(query)
  }

  var opts = self._reqOpts(query)
  debug('sending to pager', opts, next)
  return pager(opts, next)
}
