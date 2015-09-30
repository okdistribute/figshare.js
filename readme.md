# Figshare

A library for interacting with Figshare API.

## CLI
```
npm install -g figshare
```

### figshare download <article> [dir] [--raw]

Download an article's assets and metadata to a given directory. Will create a `datapackage.json` by default, and uses figshare's article spec if `--raw` supplied.

```
$ figshare download 1559145 grassland_data
$ cd grassland_data/
$ ls
Ecology-Lab2-Group3-DataSet2.xlsx
datapackage.json
```

Also can work if you give the HTML URL link:
```
figshare download http://figshare.com/articles/Group_3_Dataset_2_Grassland_data_of_the_plant_Purple_Aster_Aster_prenathoides_/1559145
```

## JavaScript

```js
var figshare = require('figshare')
```

### figshare(opts)

Options:

`uri`: can be changed if you have your own deployment. Default 'http://api.figshare.com'

`version`: defaults to 1, there is only one version of figshare search

### figshare.get(id, cb)

Hits the figshare api and gets the article with the given id. Will also work with the html url.

```js
figshare.get(id, function (err, article) {
  if (err) throw err
  console.log(article)
})
```

### figshare.download(article, dir, args, cb)

Downloads the article.

`article`: the article as returned by `figshare.get`

`dir`: the directory to put the data into. Will create it if it doesn't exist.

```js
figshare.download(article, dir, args, function (err) {
  if (err) throw err
  console.error('Download complete.')
})
```

### figshare.search(query)

```js
var stream = figshare.stream({fulltext: 'your fulltext query text here'})
stream.on('data', function (data) {
  console.log(data.items) // each 'data' is a page from the figshare search api
})
```
