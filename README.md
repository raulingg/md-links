# Markdown Links

> This repository is an implementation of this [proposal](https://github.com/Laboratoria/LIM008-fe-md-links)

[![Node.js CI](https://github.com/raulingg/md-links/actions/workflows/node.js.yml/badge.svg)](https://github.com/raulingg/md-links/actions/workflows/node.js.yml)
[![Coverage Status](https://coveralls.io/repos/github/raulingg/md-links/badge.svg?branch=master)](https://coveralls.io/github/raulingg/md-links?branch=master)

Find all links included in a markdown file or in all markdown files inside a folder.

## Installation

to install globally

`npm install -g @raulingg/md-links`

to install as a dependency in your project

`npm install @raulingg/md-links`

## Usage

- Requiring dependency

  ```js
  const mdLinks = require('@raulingg/md-links')

  mdLinks('path/to/file.md')
    .then(mdlink => {
      // Return an object with two methods data and stats

      // data() return an array with results
      mdlink.data().forEach(item => {
        console.log(item.path, item.href, item.text)
      })
    });

  // find links in all markdown files inside a directory
  mdLinks('path/to/directory').data().then(data => {});
  ```

- Importing using ES6

  ```js
  import mdLinks from require('@raulingg/md-links')

  const mdlink = await mdLinks('path/to/file.md')
  const results = mdlink.data()

  // do whatever you want
  ```

- validate broken links

  ```js
  mdLinks('path/to/file.md', { validate: true}).then((mdlink) => {
    mdlink.data().forEach((item) => {
      console.log(item.path, item.text, item.href, item.status, item.statusCode)
    })
  });
  ```

- Get stats

  ```js
  /**
   * Stats Object
   * {
   *    total: <#linksFound>
   *    unique: <#LinksUnique>
   *    broken: <#LinksBroken>
   * }
   */
  mdLinks('path/to/file.md').then(mdlink => mdlink.stats());

  // get stats from broken links
  mdLinks('path/to/file.md', { validate: true}).then(mdlink => mdlink.stats());
  ```

### CLI

- Basic usage

  ```sh
  # single file
  md-links <path/to/file.md>

  # scan all markdown files in directory
  md-links <path/to/directory>
  ```

- Adding a validation option (--validate or -val)

  ```sh
  md-links <path/to/directory> --validate
  ```

- Get stats about how many links and broken links exist

  ```sh
  md-links <path/to/directory> --stats

  # validate and return stats
  md-links <path/to/directory> --validate --stats
  ```

## Markdown file

### Extensions supported

- .md
- .markdown

### Format supported

- Basic Cases

  ```md
  [valid link](http://test.com)
  [test-link@test.com](http://test.com/test-link?djdjd&)
  [title (parenthesis)](http://www.test.com)
  [title with
  linebreak](http://test.com)
  ```

- Extra Cases

  ```md
  [[extra sq bracket](https://test.com?g=154&fh=!445?)
  ```

- Video Case

  Find image and video url

  ```md
  [![Solution Temperature converter](https://i.ytimg.com/vi/Ix6VLiBcABw/0.jpg)](https://www.youtube.com/watch?v=Ix6VLiBcABw)

  ```

- Unsupported Cases

  ```md
  [extra sq bracket - invalid]](https://test.com)

  [link with linebreak - invalid](http:
  //test.com)
  ```
