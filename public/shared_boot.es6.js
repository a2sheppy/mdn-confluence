// Copyright 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
'use strict';


(foam.isServer ? global : window).mdnConfluenceBoot = opt_ctxConfig => {
  const boxContext = foam.box.Context.create();
  const baseCtx = boxContext.__subContext__;

  // TODO(markdittmer): Running createSubContext({}) below breaks registry of
  // generated code. This might be a bug in createSubContext().
  const dataCtx = opt_ctxConfig ? baseCtx.createSubContext(opt_ctxConfig) :
          baseCtx;

  boxContext.parser = foam.json.Parser.create({
    creationContext$: boxContext.creationContext$,
  }, dataCtx);
  boxContext.outputter = foam.box.BoxJsonOutputter.create(null, dataCtx)
    .copyFrom(foam.json.Network);

  const codeCtx = dataCtx.createSubContext({
    parser: foam.json.ModelParser.create({
      creationContext$: boxContext.creationContext$,
    }, dataCtx),
    outputter: foam.json.ModelOutputter.create(null, dataCtx)
      .copyFrom(foam.json.Network),
  });

  // Default ctx is a strict serialization ctx. Expose the permissive code
  // loader ctx and Model DAO (created in code loader ctx) on the default ctx.
  foam.__context__ = dataCtx.createSubContext({
    dataCtx,
    codeCtx,
    modelDAO: foam.dao.MDAO.create({of: foam.core.Model}, codeCtx),
    dataParser: dataCtx.parser,
    dataOutputter: dataCtx.outputter,
    codeParser: codeCtx.parser,
    codeOutputter: codeCtx.outputter,
  });
  foam.boxContext = boxContext;
};

if (foam.isServer) {
  module.exports = global.mdnConfluenceBoot;
}
