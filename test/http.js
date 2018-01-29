'use strict';

import Fabric from '../';

const assert = require('assert');
const expect = require('chai').expect;

const widget = {
  name: 'Widget',
  properties: {
    name: { type: String , maxLength: 100 }
  },
  routes: {
    query: '/widgets',
    get: '/widgets/:id'
  }
};

const empty = require('../data/null');
const message = require('../data/message');
const payload = {
  name: 'foobar'
};

const oldest = {
  name: 'foobae'
};

const newest = {
  name: 'foobaz'
};

const target = widget.routes.query;
const genesis = message['@id'];

describe('HTTP', function () {
  it('should expose a constructor', function () {
    assert.equal(typeof Fabric.HTTP, 'function');
  });
  
  it('can clean up after itself', async function () {
    let server = new Fabric.HTTP();
    let Widget = server.define('Widget', widget);

    await server.start();

    try {
      let test = new Fabric.Vector(message['@data'])._sign();

      let result = await server._PUT(target, test['@data']);
      let vector = new Fabric.Vector(result)._sign();

      console.log('create attempt:', typeof result, result);
      console.log('create vector:', typeof vector, vector);

      let collection = await server._GET(target);

      console.log('collection:', collection);

      await server.flush();

      let now = await server._GET(target);
      let answer = new Fabric.Vector(now)._sign();

      assert.equal(test['@id'], genesis);
      assert.equal(vector['@id'], genesis);
      //assert.equal(collection, JSON.stringify([message['@data']]));
      assert.equal(answer['@id'], empty['@id']);
    } catch (E) {
      console.error(E);
      assert.fail(E);
    }

    await server.stop();
  });

  it('can receive an OPTIONS request to the main index', async function () {
    let server = new Fabric.HTTP();
    let Widget = server.define('Widget', widget);

    await server.start();

    try {
      let options = await server._OPTIONS('/');
      let vector = new Fabric.Vector(options)._sign();

      console.log('options:', options);
      console.log('vector:', vector);

      assert.equal(vector['@id'], 'e2ca2939b6f94b9a8723013ed01abb1e1baed182485e53cc675e2532844bb981');
    } catch (E) {
      console.error(E);
      assert.fail(E);
    }

    await server.stop();
    //await server.storage.close();
  });

  it('can receive a GET request to the main index', async function () {
    let server = new Fabric.HTTP();
    let Widget = server.define('Widget', widget);

    await server.start();

    try {
      let home = await server._GET('/');
      let vector = new Fabric.Vector(home)._sign();

      console.log('home:', home);
      console.log('vector:', vector);

      assert.equal(vector['@id'], empty['@id']);
    } catch (E) {
      console.error(E);
      assert.fail(E);
    }

    await server.stop();
    //await server.storage.close();
  });

  it('can receive a PUT request', async function () {
    let server = new Fabric.HTTP();

    server.define('Widget', widget);

    await server.start();

    try {
      let test = new Fabric.Vector(message['@data'])._sign();
      let result = await server._PUT(target, test['@data']);

      console.log('result:', result);
      
      let vector = new Fabric.Vector(result['@data'])._sign();

      console.log('create attempt:', typeof result, result);
      console.log('create vector:', typeof vector, vector);
      
      let now = await server._GET(target);
      let answer = new Fabric.Vector(now)._sign();

      assert.equal(test['@id'], genesis);
      assert.equal(answer['@id'], genesis);
      assert.equal(answer['@id'], test['@id']);
    } catch (E) {
      console.error(E);
      assert.fail(E);
    }

    await server.stop();
    //await server.storage.close();
  });

  it('can receive a POST request', async function () {
    let server = new Fabric.HTTP();

    server.define('Widget', widget);

    await server.start();

    try {
      let test = new Fabric.Vector(message['@data'])._sign();
      let list = new Fabric.Vector([test['@data']])._sign();

      let request = await server._POST(target, message['@data']);
      let response = new Fabric.Vector(request)._sign();

      let collection = await server._GET(target);
      let all = new Fabric.Vector(collection)._sign();

      console.log('response:', response);
      console.log('collection:', all);

      assert.equal(response['@id'], test['@id']);
      assert.equal(all['@id'], list['@id']);
    } catch (E) {
      console.error(E);
      assert.fail(E);
    }

    await server.stop();
    //await server.storage.close();
  });

  it('can receive a PATCH request', async function () {
    let server = new Fabric.HTTP();

    server.define('Widget', widget);

    //await server.flush();
    await server.start();

    try {
      let test = new Fabric.Vector(message['@data'])._sign();
      let update = new Fabric.Vector('This is a replacement.')._sign();

      let request = await server._POST(target, message['@data']);
      let response = new Fabric.Vector(request)._sign();

      console.log('response:', response);

      let result = await server._PATCH(target + '/' + response['@id'], update['@data']);
      let vector = new Fabric.Vector(result)._sign();

      console.log('PATCH RESULT:', result);
      console.log('PATCH VECTOR:', vector);

      assert.equal(response['@id'], test['@id']);
      assert.equal(vector['@id'], update['@id']);
    } catch (E) {
      console.error(E);
      assert.fail(E);
    }

    await server.stop();
    //await server.flush();
  });

  xit('correctly aggregates created objects', async function () {
    let server = new Fabric.HTTP();
    let remote = new Fabric.Remote({
      host: 'localhost:3000',
      secure: false
    });

    server.define('Widget', widget);

    await server.start();

    let elder = new Fabric.Vector(oldest)._sign();
    let child = new Fabric.Vector(newest)._sign();

    try {
      let result = await remote._POST(target, oldest);
      let latest = await remote._POST(target, newest);

      console.log('result:', result);
      console.log('latest:', latest);
      


      let collection = await remote._GET(target);

      //console.log('full list:', collection);

      assert.equal(result['@id'], elder['@id']);
      assert.equal(latest['@id'], child['@id']);

      assert.equal(collection[0]['@id'], child['@id']);
      assert.equal(collection[1]['@id'], elder['@id']);
    } catch (E) {
      console.error(E);
      assert.fail(E);
    }

    await server.stop();
    await server.storage.close();
  });
});
