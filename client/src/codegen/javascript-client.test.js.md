# Snapshot report for `dist/codegen/javascript-client.test.js`

The actual snapshot is saved in `javascript-client.test.js.snap`.

Generated by [AVA](https://ava.li).

## typescript definition generator

> Snapshot 1

    `"use strict";␊
    Object.defineProperty(exports, "__esModule", { value: true });␊
    var prisma_lib_1 = require("prisma-client-lib");␊
    var typeDefs = require("./prisma-schema").typeDefs;␊
    ␊
    exports.Prisma = prisma_lib_1.makePrismaClientClass({ typeDefs });␊
    exports.prisma = new exports.Prisma();␊
    `
