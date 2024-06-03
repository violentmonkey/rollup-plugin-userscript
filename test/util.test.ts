import type { AstNode } from 'rollup';
import type { EmptyStatement } from 'estree';

import {
    collectGmApi,
    getMetadata
} from '../src/util';

describe('collectGmApi', () => {
    const EMPTY_STATEMENT: EmptyStatement = {
        type: 'EmptyStatement'
    };
    
    it('should return an empty set on an empty input', () => {
        expect(collectGmApi(EMPTY_STATEMENT as AstNode).size).toBe(0);
    });
});

describe('getMetadata', () => {
    it('should throw error on an empty input', () => {
        expect(() => getMetadata('', new Set())).toThrow(Error);
    });
});