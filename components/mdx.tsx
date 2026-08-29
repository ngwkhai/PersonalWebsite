import * as runtime from 'react/jsx-runtime';

/**
 * Velite compiles MDX to a function body string, which this evaluates against
 * the JSX runtime.
 *
 * Evaluated on the server: the case studies are static prose, so compiling on
 * the client would ship both the evaluator and every article body as
 * JavaScript for no benefit.
 */
export function MDXContent({ code }: { code: string }) {
  const Component = new Function(code)({ ...runtime }).default as React.ComponentType;
  return <Component />;
}
