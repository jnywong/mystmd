import { u } from 'unist-builder';
import { mystParse } from 'myst-parser';
import { defaultDirectives } from 'myst-directives';
import { fileError } from 'myst-common';

/**
 * @param {import('myst-common').OptionDefinition} option
 */
function type2string(option) {
  if (option.type === 'string' || option.type === String) return 'string';
  if (option.type === 'number' || option.type === Number) return 'number';
  if (option.type === 'boolean' || option.type === Boolean) return 'boolean';
  if (option.type === 'parsed' || option.type === 'myst') return 'parsed';
  return '';
}

function createOption(directive, optName, option) {
  if (!option) return [];
  const optType = type2string(option);
  const def = [
    u('definitionTerm', { identifier: `directive-${directive.name}-${optName}` }, [
      u('strong', [
        u(
          'text',
          optName === 'arg'
            ? 'Directive Argument'
            : optName === 'body'
            ? 'Directive Body'
            : optName,
        ),
      ]),
      ...(optType
        ? [
            u('text', ' ('),
            u('emphasis', [u('text', `${optType}${option.required ? ', required' : ''}`)]),
            u('text', ')'),
          ]
        : []),
    ]),
    u(
      'definitionDescription',
      option.doc ? mystParse(option.doc).children : [u('text', 'No description')],
    ),
  ];
  if (option.alias && option.alias.length > 0) {
    def.push(
      u('definitionDescription', [
        u('strong', [u('text', 'Alias')]),
        u('text', ': '),
        ...option.alias
          .map((a, i) => {
            const c = [u('inlineCode', a)];
            if (i < option.alias.length - 1) c.push(u('text', ', '));
            return c;
          })
          .flat(),
      ]),
    );
  }
  return def;
}

/**
 * Create a documentation section for a directive
 *
 * @type {import('myst-common').DirectiveSpec}
 */
const mystDirective = {
  name: 'myst:directive',
  arg: {
    type: String,
    required: true,
  },
  run(data, vfile) {
    const name = data.arg;
    const directive = defaultDirectives.find((d) => d.name === name);
    if (!directive) {
      fileError(vfile, `myst:directive: Unknown myst directive "${name}"`);
      return [];
    }
    const heading = u('heading', { depth: 2, identifier: `directive-${name}` }, [
      u('inlineCode', name),
      u('text', ' directive'),
    ]);
    const doc = directive.doc ? mystParse(directive.doc).children : [];
    let alias = [];
    if (directive.alias && directive.alias.length > 0) {
      alias = [
        u('paragraph', [
          u('strong', [u('text', 'Alias')]),
          u('text', ': '),
          ...directive.alias
            .map((a, i) => {
              const c = [u('inlineCode', a)];
              if (i < directive.alias.length - 1) c.push(u('text', ', '));
              return c;
            })
            .flat(),
        ]),
      ];
    }
    const options = Object.entries(directive.options ?? {})
      .map(([optName, option]) => createOption(directive, optName, option))
      .flat();
    const list = u('definitionList', [
      ...createOption(directive, 'arg', directive.arg),
      ...createOption(directive, 'body', directive.body),
      u('definitionTerm', { identifier: `directive-${directive.name}-opts` }, [
        u('strong', [u('text', 'Options')]),
      ]),
      options.length > 0
        ? u('definitionDescription', [u('definitionList', options)])
        : u('definitionDescription', [u('text', 'No options')]),
    ]);
    return [heading, u('div', [...doc, ...alias]), list];
  },
};

const REF_PATTERN = /^(.+?)<([^<>]+)>$/; // e.g. 'Labeled Reference <ref>'

/**
 * Create a documentation section for a directive
 *
 * @type {import('myst-common').RoleSpec}
 */
const mystDirectiveRole = {
  name: 'myst:directive',
  body: {
    type: String,
    required: true,
  },
  run(data) {
    const match = REF_PATTERN.exec(data.body);
    const [, modified, rawLabel] = match ?? [];
    const label = rawLabel ?? data.body;
    const [name, opt] = label?.split('.') ?? [];
    const directive = defaultDirectives.find((d) => d.name === name || d.alias?.includes(name));
    const identifier = opt
      ? `directive-${directive?.name ?? name}-${opt}`
      : `directive-${directive?.name ?? name}`;
    return [
      u('crossReference', { identifier }, [u('inlineCode', modified?.trim() || opt || name)]),
    ];
  },
};

/**
 * @type {import('myst-common').MystPlugin}
 */
const plugin = {
  name: 'MyST Documentation Plugins',
  author: 'Rowan Cockett',
  license: 'MIT',
  directives: [mystDirective],
  roles: [mystDirectiveRole],
};

export default plugin;
