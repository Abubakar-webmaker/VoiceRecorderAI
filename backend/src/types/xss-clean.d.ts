declare module 'xss-clean' {
  import type { RequestHandler } from 'express';
  function xss(): RequestHandler;
  export = xss;
}
