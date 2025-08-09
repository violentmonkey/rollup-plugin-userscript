import { parse as parseCode } from '@babel/parser';
import type { AstNode } from 'rollup';

import {
    collectGrants,
    getMetadata
} from '../src/util';

describe('collectGrants', () => {
  const parseCodeAsEstreeAst = (code: string) => {
    const file = parseCode(code, { plugins: ['estree'] });
    return file.program as AstNode;
  };

  it('should return an empty set on an empty input', () => {
    const astNode = parseCodeAsEstreeAst(``);
    const result = collectGrants(astNode);

    expect(result.size).toBe(0);
  });

  it('should return only GM_dummyApi', () => {
    const astNode = parseCodeAsEstreeAst(`GM_dummyApi`);
    const result = collectGrants(astNode);

    expect(result.size).toBe(1);
    expect(result).toContain('GM_dummyApi');
  });

  it('should ignore any scope-defined variables that look like GM APIs', () => {
    const astNode = parseCodeAsEstreeAst(`
      let GM_dummyApi;
      GM_dummyApi;
    `);
    const result = collectGrants(astNode);

    expect(result.size).toBe(0);
  });

  it('should return only GM.dummyApi', () => {
    const astNode = parseCodeAsEstreeAst(`GM.dummyApi`);
    const result = collectGrants(astNode);

    expect(result.size).toBe(1);
    expect(result).toContain('GM.dummyApi');
  });

  it('should return unsafeWindow when presented with just unsafeWindow', () => {
    const astNode = parseCodeAsEstreeAst(`unsafeWindow`);
    const result = collectGrants(astNode);

    expect(result.size).toBe(1);
    expect(result).toContain('unsafeWindow');
  });

  it('should return nothing unsafeWindow when presented with unsafeWindowButNotReally', () => {
    const astNode = parseCodeAsEstreeAst(`unsafeWindowButNotReally`);
    const result = collectGrants(astNode);

    expect(result.size).toBe(0);
  });

  it('should return unsafeWindow even when a subfield is accessed', () => {
    const astNode = parseCodeAsEstreeAst(`unsafeWindow.anotherThing`);
    const result = collectGrants(astNode);

    expect(result.size).toBe(1);
    expect(result).toContain('unsafeWindow');
  });

  it('should return unsafeWindow even when a subfield is accessed with object notation', () => {
    const astNode = parseCodeAsEstreeAst(`unsafeWindow["anotherThing"]`);
    const result = collectGrants(astNode);

    expect(result.size).toBe(1);
    expect(result).toContain('unsafeWindow');
  });
});

describe('getMetadata', () => {
  it('should throw error on an empty input', () => {
    expect(() => getMetadata('', new Set())).toThrow(Error);
  });
});
