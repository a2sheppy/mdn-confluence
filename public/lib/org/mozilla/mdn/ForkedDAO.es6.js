// Copyright 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
'use strict';

foam.CLASS({
  name: 'ForkedDAO',
  package: 'org.mozilla.mdn',
  extends: 'foam.dao.PromisedDAO',

  documentation: 'ClientDAO wrapper for out-of-process FirebaseDAO strategy.',

  requires: [
    'foam.box.BoxRegistry',
    'foam.box.SkeletonBox',
    'foam.box.node.ForkBox',
    'foam.core.StubFactorySingleton',
    'foam.dao.ClientDAO',
    'foam.dao.ReadOnlyDAO',
    'org.chromium.apis.web.SerializableHttpJsonDAO',
    'org.chromium.apis.web.SerializableLocalJsonDAO',
  ],
  imports: [
    'error',
    'info',
  ],

  properties: [
    {
      class: 'foam.dao.DAOProperty',
      name: 'serializableDAO',
      required: true,
    },
    {
      name: 'stubFactory',
      factory: function() {
        return this.StubFactorySingleton.create();
      },
    },
    {
      name: 'forkBox',
      final: true,
      factory: function() {
        return this.ForkBox.create({
            nodeParams: this.getForkNodeParams_(),
            childScriptPath: this.getForkScriptPath_(),
        });
      },
      postSet: function(old, nu) {
        // TODO(markdittmer): Shouldn't reach into private member: child_.
        if (old) {
          old.child_.removeListener('error', this.onForkExit);
          old.child_.removeListener('exit', this.onForkExit);
        }
        if (nu) {
          nu.child_.on('error', this.onForkExit);
          nu.child_.on('exit', this.onForkExit);
        }
      },
    },
    {
      name: 'forkRegistry',
      expression: function(forkBox) {
        return this.stubFactory.get(this.BoxRegistry).create({
          delegate: forkBox,
        }, this.__subContext__);
      },
    },
    {
      class: 'String',
      name: 'registeredName_',
    },
  ],

  methods: [
    function init() {
      this.SUPER();
      this.validate();

      this.info(`Forking ${this.cls_.id} of ${this.of.id}`);

      const of = this.of;
      const dao = this.ReadOnlyDAO.create({
        of,
        delegate: this.ClientDAO.create({
          of,
          delegate: this.forkRegistry.register(
            this.registeredName_ = foam.uuid.randomGUID(),
            null,
            this.SkeletonBox.create({
              data: this.serializableDAO,
            })),
        }),
      });

      // Perform simple query to ensure DAO is eagerly initialized.
      this.promise = dao.limit(1).select().then(() => dao);

      this.promise.then(
        dao => this.info(`Promised ${this.cls_.id} of ${this.of.id} resolved as ${dao.cls_.id}`),
        err => this.error(`Promised ${this.cls_.id} of ${this.of.id} rejected with ${err}`)
      );
    },
    function detach() {
      if (this.registeredName_) {
        this.info(`${this.cls_.id} unregistering service on detach`);
        this.forkRegistry.unregister(this.registeredName_);
      }
      this.registeredName_ = '';
      this.info(`${this.cls_.id} killing child process on detach`);
      // TODO(markdittmer): Shouldn't reach into private member: child_.
      this.forkBox.child_.kill();
      return this.SUPER();
    },
    function getForkNodeParams_() { return ['--max_old_space_size=4096']; },
    function getForkScriptPath_() {
      return require('path')
          .resolve(`${__dirname}/../../../../../main/forkScript.es6.js`);
    },
  ],

  listeners: [
    function onForkExit() {
      if (this.registeredName_) {
        const fb = this.forkBox;
        // TODO(markdittmer): Shouldn't reach into private member: child_.
        this.error(`PID=${process.pid} exiting due to ForkedDAO
                        exit-before-detached
                        (PID=${fb.child_ ? fb.child_.pid : 'UNKNOWN'})`);
        process.exit(1);
      }
    },
  ],
});
