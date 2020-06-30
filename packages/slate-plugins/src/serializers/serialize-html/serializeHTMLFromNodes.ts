import { ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { SlatePlugin } from '@udecode/core';
import { Node as SlateNode, Text as SlateText } from 'slate';
import { RenderElementProps, RenderLeafProps } from 'slate-react';

// Remove extra whitespace generated by ReactDOMServer
const trimWhitespace = (rawHtml: string): string =>
  rawHtml.replace(/(\r\n|\n|\r|\t)/gm, '');

// Remove redundant data attributes
const stripSlateDataAttributes = (rawHtml: string): string =>
  rawHtml
    .replace(/( data-slate)(-node|-type)="[^"]+"/gm, '')
    .replace(/( data-testid)="[^"]+"/gm, '');

// TODO: We might also want to remove generated classes in the future.

const getNode = (elementProps: RenderElementProps, plugins: SlatePlugin[]) => {
  // If no type provided we wrap children with div tag
  if (!elementProps.element.type) {
    return `<div>${elementProps.children}</div>`;
  }

  // Search for matching plugin based on element type
  const elementPlugin = plugins
    .filter((plugin) => plugin.renderElement)
    .find((plugin) => {
      return Object.keys(
        plugin.deserialize?.element as Record<string, unknown>
      ).includes(String(elementProps.element.type));
    });

  // Render element using picked plugins renderElement function and ReactDOM
  if (elementPlugin?.renderElement) {
    return renderToStaticMarkup(
      elementPlugin.renderElement(elementProps) as ReactElement
    );
  }
};

const getLeaf = (leafProps: RenderLeafProps, plugins: SlatePlugin[]) => {
  const { children } = leafProps;
  return plugins
    .filter((plugin) => plugin.renderLeaf)
    .filter(({ renderLeaf }) => renderLeaf?.(leafProps) !== children)
    .reduce((result, plugin) => {
      const newLeafProps = {
        ...leafProps,
        children: encodeURIComponent(result),
      };
      if (plugin?.renderLeaf) {
        return decodeURIComponent(
          renderToStaticMarkup(plugin.renderLeaf(newLeafProps))
        );
      }
      return result;
    }, children);
};

/**
 *
 * @param plugins
 */
export const serializeHTMLFromNodes = (plugins: SlatePlugin[]) => (
  nodes: SlateNode[]
): string => {
  const result = nodes
    .map((node: SlateNode) => {
      if (SlateText.isText(node)) {
        return getLeaf(
          {
            leaf: node as SlateText,
            text: node as SlateText,
            children: node.text,
            attributes: { 'data-slate-leaf': true },
          },
          plugins
        );
      }
      return getNode(
        {
          element: node,
          children: encodeURIComponent(
            serializeHTMLFromNodes(plugins)(node.children)
          ),
          attributes: { 'data-slate-node': 'element', ref: null },
        },
        plugins
      );
    })
    .join('');
  return stripSlateDataAttributes(trimWhitespace(decodeURIComponent(result)));
};