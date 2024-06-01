import userscript from '../src/index';

describe('rollup-plugin-userscript', () => {
    it('should return "userscript-metadata" as the plugin name', () => {
        expect(userscript().name).toBe('userscript-metadata');
    });
});