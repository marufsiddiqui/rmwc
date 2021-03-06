// @flow
import * as React from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import { getProviderOptions } from '../Provider';
import { simpleTag } from '../Base';

import type { RMWCProviderOptionsT } from '../Provider';

export const IconRoot = simpleTag({ displayName: 'IconRoot', tag: 'i' });

// prettier-ignore
type IconStrategyT = 'auto' | 'ligature' | 'className' | 'url' | 'component' | 'custom';

const renderLigature = ({ content, ...rest }) => {
  return <IconRoot {...rest}>{content}</IconRoot>;
};

const renderClassName = ({ content, ...rest }) => {
  return <IconRoot {...rest} />;
};

const renderUrl = ({ content, ...rest }) => {
  return <IconRoot tag="img" src={content} {...rest} />;
};

const renderComponent = ({ content, ...rest }) => {
  return <IconRoot {...rest}>{content}</IconRoot>;
};

const iconRenderMap = {
  ligature: renderLigature,
  className: renderClassName,
  url: renderUrl,
  component: renderComponent
};

/**
 * Given content, tries to figure out an appropriate strategy for it
 */
const processAutoStrategy = (content): IconStrategyT => {
  // check for URLS
  if (
    typeof content === 'string' &&
    (content.startsWith('/') ||
      content.startsWith('http://') ||
      content.startsWith('https://'))
  ) {
    return 'url';
  }

  // handle JSX components
  if (typeof content === 'object') {
    return 'component';
  }

  // we dont know what it is, default to ligature for compat with material icons
  return 'ligature';
};

/**
 * Get the actual icon strategy to use
 */
const getIconStrategy = (content, strategy, defaultStrategy) => {
  strategy = strategy || defaultStrategy;

  if (strategy === 'auto') {
    return processAutoStrategy(content);
  }

  return strategy;
};

export type IconPropsT = {
  /** The icon to use. This can be a string for a font icon, a url, or whatever the selected strategy needs. */
  use?: React.Node,

  /** Handle multiple methods of embedding an icon. 'ligature' uses ligature style embedding like material-icons, 'className' adds a class onto the element for libraries like glyphicons and ion icons, 'url' will load a remote image, and 'component' will render content as children like SVGs or any other React node. 'custom' allows you to specify your own render prop. If not set, 'auto' will be used or the defaults set inside of RMWCProvider. */
  strategy?: IconStrategyT,

  /** A className prefix to use when using css font icons that use prefixes, i.e. font-awesome-, ion-, glyphicons-. This only applies when using the 'className' strategy. */
  prefix?: string,

  /** A base className for the icon namespace, i.e. material-icons. */
  basename?: string,

  /** A render function to use when using the 'custom' strategy. */
  render?: (content: mixed) => React.Node
};

/**
 * An Icon component. Most of these options can be set once globally, read the documentation on Provider for more info.
 */
export class Icon extends React.PureComponent<IconPropsT> {
  static defaultProps = {
    use: undefined
  };

  componentWillMount() {
    this.providerOptions = getProviderOptions(this.context);
  }

  static contextTypes = {
    RMWCOptions: PropTypes.object
  };

  providerOptions: RMWCProviderOptionsT;
  context: Object;

  render() {
    const {
      use,
      children,
      render,
      strategy,
      prefix,
      basename,
      ...rest
    } = this.props;

    const {
      iconClassNameBase: defaultBasename,
      iconClassNamePrefix: defaultPrefix,
      iconStrategy: defaultStrategy,
      iconRender: defaultCustomRender
    } = this.providerOptions;

    const content = use || children;
    const strategyToUse = getIconStrategy(content, strategy, defaultStrategy);
    const prefixToUse = prefix || defaultPrefix;
    const basenameToUse = basename === undefined ? defaultBasename : basename;
    const iconClassName =
      strategyToUse === 'className' && typeof content === 'string' ?
        `${prefixToUse}${content}` :
        null;

    const renderToUse =
      strategyToUse === 'custom' ?
        render || defaultCustomRender :
        iconRenderMap[strategyToUse];

    if (!renderToUse) {
      console.error(`Icon: rendering not implemented for ${strategyToUse}.`);
      return null;
    }

    return renderToUse({
      ...rest,
      content,
      className: classNames(basenameToUse, rest.className, iconClassName)
    });
  }
}

export default Icon;
