import { u } from 'unist-builder';
import { mystToHtml } from '../src';

describe('mystToHtml', () => {
  it('Converts a tag schema to a string', () => {
    const html = mystToHtml(u('root', [u('paragraph', [u('text', 'hello world')])]));
    expect(html).toBe('<p>hello world</p>');
  });
  it('Converts comment', () => {
    const html = mystToHtml(u('root', [u('comment', 'hello world')]) as any);
    expect(html).toBe('<!--hello world-->');
  });
});