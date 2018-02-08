// Copyright 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
'use strict';

foam.CLASS({
  package: 'org.mozilla.mdn',
  name: 'SearchView',
  extends: 'foam.u2.View',

  imports: [
    'localPredicate',
    'queryParserFactory',
  ],

  axioms: [
    foam.u2.CSS.create({
      code: `
^ {
  display: flex;
}

^icon {
  z-index: 2;
  display: inline-block;
  padding: 1rem;
}

^button {
  flex-grow: 0;
  flex-shrink: 0;
  background-color: inherit;
  color: inherit;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
}

^button:hover {
  background-color: rgba(0, 0, 0, 0.2);
  cursor: pointer;
}

^ input {
  color: inherit;
  background-color: inherit;
  font-family: inherit;
  font-size: inherit;
  flex-grow: 1;
  border: none;
  outline: none;
  display: inline-block;
  line-height: 2rem;
  padding: 0.5rem 0;
}

^ .hide {
  display: none;
}
`
    }),
  ],

  properties: [
    {
      name: 'queryParser',
      factory: function() { return this.queryParserFactory(this); },
    },
    {
      class: 'foam.u2.ViewSpec',
      name: 'viewSpec',
      value: {
        class: 'foam.u2.tag.Input',
        onKey: true,
      },
    },
    {
      name: 'view',
    },
  ],

  actions: [
    {
      name: 'clear',
      keyboardShortcuts: [27], // Escape.
      code: function() { this.view.data = ''; },
    },
  ],

  methods: [
    function initE() {
      this.addClass(this.myClass())
        .start('i').addClass('material-icons').addClass(this.myClass('icon'))
        .add('search').end()
          .tag(this.viewSpec, {}, this.view$)
        .start('i').addClass('material-icons')
        .addClass(this.myClass('icon'))
        .addClass(this.myClass('button'))
          .addClass(this.slot(data => data ? '' : 'hide',
                              this.view$.dot('data')))
          .add('close')
          .on('click', () => this.clear());
      this.view.data$.mapTo(
          this.localPredicate$,
          queryStr => {
            let ret;
            try {
              ret = this.queryParser.parseString(queryStr || '');
            } catch (e) {
              this.error('Query parser error: ', e);
            }
            return ret;
          });
      this.SUPER();
    },
  ],
});
