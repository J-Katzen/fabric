'use strict';

const App = require('../lib/app');

const Person = require('../resources/person');
const Post = require('../resources/post');
const Relationship = require('../resources/relationship');

window.app = new App({
  scripts: 'app.min.js',
  resources: {
    'Person': Person,
    'Post': Post,
    'Relationship': Relationship,
  }
});

app._load();

app.define('Person', Person);
app.define('Post', Post);
app.define('Relationship', Relationship);

window.onload = function () {
  document.querySelector('body').appendChild(window.app.element());
}