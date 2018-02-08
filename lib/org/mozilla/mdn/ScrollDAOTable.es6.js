// Copyright 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
'use strict';

foam.CLASS({
  package: 'org.mozilla.mdn',
  name: 'ScrollDAOTable',
  extends: 'foam.u2.View',

  requires: ['foam.u2.view.ScrollDAOView'],
  imports: [
    'columns',
    'removeColumn?',
  ],

  axioms: [
    foam.u2.CSS.create({
      code: `
^ {
  display: flex;
  min-height: 0;
  flex-direction: column;
}

^ col-heads {
  z-index: 20;
  flex-grow: 0;
  flex-shrink: 0;
  border-top: 1px solid #d0d0d0;
  overflow-y: scroll;
  background-color: rgb(248, 248, 248);
  font-weight: bold;
  height: 50px;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.14), 0 2px 1px -2px rgba(0, 0, 0, 0.2);
}

^ col-head {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  margin: auto 5px;
  display: flex;
  min-height: 0;
  justify-content: space-between;
}

^scroll-container {
  position: relative;
  flex-grow: 1;
}

^ span, ^ .id {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  margin: auto 5px;
}

^ .id .overlay {
  display: none;
  position: absolute;
  top: 0;
  left: 0;
}

^ li:hover .id {
 color: transparent;
}

^ li:hover .id .overlay {
  height: 100%;
  color: rgba(0, 0, 0, 0.8);
  background: rgba(255, 255, 255, 0.6);
  display: flex;
  align-items: center;
}

^icon {
  z-index: 2;
  display: inline-block;
  padding: 1rem;
}

^button {
  flex-grow: 0;
  flex-shrink: 0;
  font-size: inherit;
  background-color: inherit;
  color: inherit;
  padding: 0.5rem 0 0.5rem 0.5rem;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
}

^button:hover {
  background-color: rgba(255, 255, 255, 0.2);
  cursor: pointer;
}
`
    }),
  ],

  classes: [
    {
      name: 'RowFormatter',
      implements: ['foam.u2.RowFormatter'],

      imports: ['columns'],

      methods: [
        function format(data, opt_columns) {
          const columns = opt_columns || this.columns;

          let str = '';
          for (let i = 0; i < columns.length; i++) {
            const col = columns[i];
            const value = data ? col.f(data) : undefined;
            str += col.rawTableCellFormatter(data ? col.f(data) : undefined, data,
                                          col);
          }

          return str;
        },
      ],
    },
  ],

  properties: [
    {
      class: 'FObjectProperty',
      of: 'foam.u2.Element',
      name: 'scrollView',
      factory: function() {
        return this.ScrollDAOView.create({
          data$: this.data$,
          numRows: 25,
          rowHeight: 50,
          rowFormatter: this.RowFormatter.create(),
        });
      },
    },
    {
      class: 'Class',
      name: 'of',
      // TODO(markdittmer): This should be an expression, but that's not
      // working.
      factory: function() {
        return this.data.of;
      },
    },
  ],

  methods: [
    function initE() {
      const self = this;
      const removeColumn = this.removeColumn;
      this.setNodeName('div').addClass(this.myClass())
        .add(this.slot(function(columns) {
          let gridTemplateColumns = '';
          for (const column of columns) {
            gridTemplateColumns += `${column.gridTemplateColumn} `;
          }
          return this.E('style')
            .add(`
#${this.id} col-heads, #${this.id} ul.foam-u2-view-ScrollDAOView > li {
  padding: 0;
  border-bottom: 1px solid #d0d0d0;
  display: grid;
  grid-template-columns: ${gridTemplateColumns};
}
`);
        }))
        .add(this.slot(function(columns) {
          return this.E('col-heads')
            .forEach(columns, function(col) {
              let ret = this.start('col-head')
                    .start('span').add(col.label).end();
              if (removeColumn && col.name !== 'id') {
                ret.start('i').addClass('material-icons')
                  .addClass(self.myClass('icon'))
                  .addClass(self.myClass('button'))
                  .add('clear')
                  .on('click', function() {
                    removeColumn(col);
                  })
                  .end();
              }
              return ret.end();
            });
        }))
        .start('div').addClass(this.myClass('scroll-container'))
        .add(this.scrollView).end();
    },
  ],
});
