// Each entry: [interview summary, what, why, when, when not, how, trade-offs, alternatives, example]
const SERVICE_ANSWERS = {
  "Selectors and Specificity": [
    "Specificity decides which CSS rule wins when several match the same element. Inline styles beat IDs, IDs beat classes and attributes, and classes beat element selectors. I keep specificity low by using classes, so overrides stay easy.",
    "Each selector has a weight written as (IDs, classes, elements). For example, #nav .link has (1,1,0) and beats .link (0,1,0). Equal specificity falls back to the rule that comes last in the file.",
    "Unexpected overrides are one of the most common CSS bugs, and knowing the weights lets you find them fast.",
    "When a style does not apply as expected and you need to know why.",
    "Do not chain IDs or add !important to win a fight, because later changes become very hard.",
    "Use one class per component where possible, check the computed styles in DevTools to see which rule wins, and lower the specificity of the losing rule rather than raising the winner.",
    "Pros: low-specificity classes are easy to override. Cons: without a naming convention, global class names can clash.",
    "Scoped styles or CSS modules, which limit selectors to one component.",
    `/* (0,1,0) */ .card { color: #333; }
/* (1,1,0) wins over .card */ #sidebar .card { color: #000; }`
  ],
  "Cascade and Inheritance": [
    "The cascade decides the final value of a property from origin, importance, specificity and source order. Inheritance passes some properties, such as color and font, from parent to child, while others, such as margin, are not inherited.",
    "A declaration is chosen by origin (user agent, author, user), then !important, then specificity, then order. Inherited properties take the parent's value when nothing else applies. The inherit, initial, unset and revert keywords control this explicitly.",
    "Understanding the cascade explains why a child element ignores a style you set on a parent.",
    "When you rely on inherited text styles or need to reset styles on a third-party component.",
    "Do not assume every property inherits. Margin, padding and borders do not.",
    "Set typography on the body or a wrapper and let children inherit, use inherit to pass a value down explicitly, and use all: unset or revert to reset a component.",
    "Pros: set once and inherit everywhere. Cons: inherited styles can leak into components that did not expect them.",
    "CSS layers with @layer to control the order of whole groups of rules.",
    `body { font-family: system-ui; color: #222; }   /* inherited by all text */
.card { margin: 8px; }                          /* not inherited */
.card-title { color: inherit; }                 /* explicit inheritance */`
  ],
  "Stacking Context and z-index": [
    "z-index only orders elements that share a stacking context. A new stacking context is created by properties such as position with a z-index, opacity below 1, transform and some flex or grid settings, and a child can never escape its parent's context.",
    "Elements form a tree of stacking contexts. Inside one context, positioned elements with higher z-index paint above lower ones. A high z-index inside a low one still stays below an element in a higher context.",
    "A modal that appears behind a header is usually caused by a stacking context created by a parent.",
    "Dropdowns, modals and tooltips that overlap other content.",
    "Do not set huge z-index values like 9999 to win the stack, because the real cause is usually the context.",
    "Find the parent that created the context in DevTools, move the overlay to a higher level in the DOM (a portal), or raise z-index on the element that shares the context.",
    "Pros: simple layering once understood. Cons: hidden contexts from transform or opacity cause confusing bugs.",
    "Use the top layer (the dialog element and popover API) for overlays.",
    `.header { position: relative; z-index: 10; }
.modal   { position: fixed; z-index: 1000; }
/* A parent with transform or opacity < 1 creates a new context,
   so z-index inside it cannot rise above elements outside it. */`
  ],
  "Box Model": [
    "Every element is a box made of content, padding, border and margin. With box-sizing set to border-box, width includes padding and border, which makes layouts predictable. I set border-box globally at the start of every project.",
    "The content box holds the text or children, padding adds space inside the border, border wraps it, and margin separates the box from its neighbours. Margins of adjacent blocks can collapse.",
    "Without border-box, adding padding makes an element wider than the width you set, which breaks layouts.",
    "Every project, usually as a global reset.",
    "Do not rely on margin collapse in flex or grid layouts, because those contexts do not collapse margins.",
    "Add *, *::before, *::after { box-sizing: border-box; } at the top of the stylesheet, then size elements with width or max-width and spacing with padding and gap.",
    "Pros: predictable sizing. Cons: margin collapse can surprise people who do not expect it.",
    "Use gap in flex and grid instead of margins between items.",
    `*, *::before, *::after { box-sizing: border-box; }
.box { width: 200px; padding: 16px; border: 2px solid; }  /* total width is 200px */`
  ],
  "Flexbox": [
    "Flexbox arranges items in one dimension, a row or a column, and distributes space and aligns them. I use it for navigation bars, toolbars and any row or column of items where size depends on content.",
    "A flex container sets display: flex. justify-content aligns items on the main axis, align-items on the cross axis, flex-grow and flex-shrink control how items grow or shrink, and gap adds space between them.",
    "Flexbox removes the old float and clearfix hacks and centres content easily.",
    "Single-row or single-column layouts such as menus, button groups and card footers.",
    "Do not use flexbox for full two-dimensional page layouts where rows and columns must align together, because grid is better there.",
    "Set display flex on the parent, use justify-content and align-items to position children, let children grow with flex: 1, and use gap instead of margins.",
    "Pros: simple and flexible for one dimension. Cons: wrapping rows do not align across lines the way grid does.",
    "CSS Grid for two-dimensional layouts.",
    `.navbar { display: flex; justify-content: space-between; align-items: center; gap: 16px; }
.navbar .search { flex: 1; }   /* takes the remaining space */`
  ],
  "CSS Grid": [
    "CSS Grid lays out items in rows and columns at the same time. I use it for page layouts and card grids where rows and columns must line up across the whole container.",
    "A grid container sets display: grid and defines tracks with grid-template-columns and grid-template-rows. Items are placed on grid lines or areas, and fr units share the free space.",
    "Grid handles two-dimensional alignment that flexbox cannot do in one pass.",
    "Page layouts, dashboards, galleries and any grid of equal-sized cards.",
    "Do not use grid for a simple row of buttons where flexbox is shorter and clearer.",
    "Define columns with repeat and minmax, use auto-fill for responsive card grids, and place named areas for page layouts.",
    "Pros: powerful two-dimensional layout. Cons: more concepts to learn than flexbox.",
    "Flexbox for single-dimension layouts, or multi-column for text flow.",
    `.cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
}`
  ],
  "Positioning: Sticky, Fixed and Absolute": [
    "Positioning moves elements away from their normal place. Sticky keeps an element in view while scrolling within its parent, fixed pins it to the viewport, absolute places it relative to the nearest positioned ancestor, and relative offsets it from its normal spot.",
    "position: sticky needs a top, bottom, left or right value and works only inside a scrolling parent. position: absolute is removed from the flow and positioned against the nearest ancestor with position other than static.",
    "Sticky headers, badges and overlays need the right positioning context to work.",
    "Sticky table headers, floating action buttons and badges on cards.",
    "Do not use fixed for everything, because it removes content from the flow and can cover the page.",
    "Set position: relative on the container, use absolute for the badge inside it, and use sticky with top: 0 for headers inside a scrolling wrapper.",
    "Pros: precise placement. Cons: absolute and fixed elements need care with overlap and small screens.",
    "Flex or grid alignment, which often avoids absolute positioning entirely.",
    `.card { position: relative; }
.card .badge { position: absolute; top: 8px; right: 8px; }
.table-header th { position: sticky; top: 0; background: #fff; }`
  ],
  "Media Queries and Mobile-First": [
    "Media queries apply styles based on screen width or other features. I write mobile-first styles as the base and add min-width queries for larger screens, which keeps the default layout simple.",
    "A media query is a condition such as (min-width: 768px) wrapping a set of rules. Mobile-first means the base CSS targets small screens, and larger breakpoints add columns or spacing.",
    "Most users now browse on phones, and mobile-first CSS is smaller and easier to override.",
    "Any layout that changes between phone, tablet and desktop.",
    "Do not write separate desktop-first and mobile-first rules for the same element, because they fight each other.",
    "Start with a single column in the base styles, add a min-width query at 768px for two columns, and add another at 1024px for three columns.",
    "Pros: simple progressive enhancement. Cons: many breakpoints can become hard to track, so keep them few.",
    "Container queries, which react to the size of a component rather than the viewport.",
    `.grid { display: grid; grid-template-columns: 1fr; gap: 12px; }      /* mobile first */
@media (min-width: 768px) {
  .grid { grid-template-columns: 1fr 1fr; }
}
@media (min-width: 1024px) {
  .grid { grid-template-columns: repeat(3, 1fr); }
}`
  ],
  "Responsive Units and clamp()": [
    "Relative units such as rem, em, vh, vw and percentages make sizes scale with the user's settings and the screen. clamp() sets a value that grows and shrinks between a minimum and a maximum, which is useful for fluid typography.",
    "rem is relative to the root font size, em to the parent font size, and vw and vh to the viewport. clamp(min, preferred, max) keeps the preferred value inside the range.",
    "Fixed pixel sizes ignore user font settings and do not adapt to screen size.",
    "Font sizes, spacing and containers that should scale smoothly.",
    "Do not use vh alone for mobile heights, because mobile browsers change the viewport when the address bar moves; prefer dvh where supported.",
    "Use rem for font sizes, a percentage or max-width for containers, and clamp for headings and spacing.",
    "Pros: accessible and fluid. Cons: values are harder to predict than fixed pixels.",
    "Media queries at fixed breakpoints for larger layout changes.",
    `h1 { font-size: clamp(1.5rem, 4vw, 3rem); }
.container { width: min(90%, 1100px); margin-inline: auto; }`
  ],
  "CSS Custom Properties": [
    "CSS custom properties are variables defined with two dashes, such as --brand, and read with var(). I define the design tokens for colours and spacing on :root so one change updates the whole site, and they can be changed at runtime with JavaScript.",
    "A custom property is set on any element and inherits like other properties. var(--name, fallback) reads it with an optional fallback. Scoped values can override the root for a part of the page.",
    "Tokens keep the theme consistent and make dark mode or per-brand themes easy.",
    "Colours, spacing, font sizes and any value repeated across many rules.",
    "Do not use them for values that must be calculated in a preprocessor-only way, and do not forget the fallback when the value might be missing.",
    "Declare the tokens in :root, use var() in component rules, and override them in a parent or media query for themes.",
    "Pros: runtime changes and cascade-aware. Cons: they are strings, so type checks happen at use time.",
    "Sass variables, which are compiled away and cannot change at runtime.",
    `:root {
  --brand: #0a66c2;
  --space: 8px;
}
.button { background: var(--brand); padding: calc(var(--space) * 2); }
[data-theme="dark"] { --brand: #6ab0ff; }`
  ],
  "Scoped Styles in Angular": [
    "Angular scopes component styles by default with emulated view encapsulation, which adds generated attributes to elements so a style applies only to its own template. I rely on this instead of global class names, and I use :host for the component root.",
    "With ViewEncapsulation.Emulated, Angular rewrites selectors so they match only elements in the component. ViewEncapsulation.None makes styles global, and ShadowDom uses the browser's shadow DOM.",
    "Scoping prevents one component's CSS from breaking another and keeps naming simple.",
    "Almost all component styles in Angular applications.",
    "Do not use ::ng-deep to reach into child components, because it is deprecated and leaks styles. Use CSS custom properties or global styles for shared theming.",
    "Write styles in the component's styles file, use :host for the wrapper, and pass theme values through CSS variables defined globally.",
    "Pros: safe by default. Cons: styling child components needs custom properties or a deliberate global rule.",
    "ViewEncapsulation.ShadowDom for true isolation, or global styles for shared rules.",
    `@Component({
  selector: 'app-card',
  template: '<div class="title"><ng-content></ng-content></div>',
  styles: [':host { display: block; } .title { font-weight: 600; }']
})
export class CardComponent {}`
  ],
  "BEM Naming": [
    "BEM stands for Block, Element and Modifier. It gives class names a clear structure, such as card__title and card--highlighted, so the relationship between parts is visible without nesting selectors.",
    "A block is a standalone component, an element is a part of it written with two underscores, and a modifier changes its state or variant written with two dashes.",
    "Flat class names with a consistent pattern avoid clashes and keep specificity low.",
    "Shared CSS across a team or a project without a component scoping system.",
    "Do not nest elements inside elements in the class name, such as card__header__title, because that is hard to read.",
    "Name the block after the component, use __ for parts and -- for variants, and keep each selector to one class.",
    "Pros: clear and low specificity. Cons: names are long and need discipline.",
    "CSS modules or Angular scoped styles, which generate unique names automatically.",
    `.card { }
.card__title { font-size: 1.25rem; }
.card--highlighted { border-color: gold; }`
  ],
  "Dark Mode": [
    "I support dark mode by defining colour tokens as custom properties and switching them with the prefers-color-scheme media query or a data attribute set by the user's choice. This keeps the components unchanged.",
    "The prefers-color-scheme query reads the operating system setting. Overriding the tokens in a dark scope changes every colour that uses them.",
    "Users expect dark mode, and token-based theming makes it a small change.",
    "Apps with many colours or where users ask for a comfortable reading mode.",
    "Do not hard-code colours in components, because they will not change with the theme.",
    "Define light values on :root, override them under prefers-color-scheme: dark, and let users switch with a data attribute stored in localStorage.",
    "Pros: one set of tokens and no duplicate rules. Cons: checking contrast in both themes takes effort.",
    "The color-scheme property, which tells the browser to style form controls for the theme.",
    `:root { --bg: #ffffff; --fg: #111111; }
@media (prefers-color-scheme: dark) {
  :root { --bg: #111111; --fg: #f5f5f5; }
}
body { background: var(--bg); color: var(--fg); }`
  ],
  "Transitions and Keyframes": [
    "Transitions animate a change between two states, such as hover, and keyframes define a sequence of steps for a longer animation. I use transitions for small interface feedback and keyframes for loading indicators or attention cues.",
    "transition sets the property, duration, timing function and delay. @keyframes names a set of steps at percentages, and animation applies the keyframes with duration, count and direction.",
    "Small motion makes the interface feel responsive and guides the user.",
    "Hover effects, menu open and close, skeleton loaders and spinners.",
    "Do not animate layout properties such as width or top when a transform would do, and do not ignore users who prefer reduced motion.",
    "Add transition to the element for the property that changes, change a class to trigger it, and define keyframes with animation for repeating effects. Wrap motion in prefers-reduced-motion.",
    "Pros: simple and declarative. Cons: complex sequences are harder to control and debug than JavaScript animations.",
    "The Web Animations API for scripted control, or Angular animations for component transitions.",
    `.button { transition: background-color 200ms ease; }
.button:hover { background-color: #0056b3; }

@keyframes spin { to { transform: rotate(360deg); } }
.spinner { animation: spin 1s linear infinite; }

@media (prefers-reduced-motion: reduce) { .spinner { animation: none; } }`
  ],
  "Animation Performance": [
    "Smooth animation needs the browser to change only properties it can handle on the compositor, which are transform and opacity. Animating layout properties such as width, height or top forces recalculation of the page and causes jank.",
    "The browser pipeline runs style, layout, paint and composite. Transform and opacity skip layout and paint, so they stay fast even when many elements move.",
    "Janky animations make an app feel slow, especially on low-end phones.",
    "Any animation that runs often or on many elements, such as lists or scroll effects.",
    "Do not animate box-shadow or filter across many elements, because they are expensive to paint.",
    "Use transform translate and scale instead of changing position or size, use opacity for fades, and use will-change sparingly for elements that are about to animate.",
    "Pros: smooth 60fps animations. Cons: transforms can create stacking contexts, which affects z-index.",
    "The FLIP technique when a layout change must be animated.",
    `/* Smooth: compositor only */
.panel { transition: transform 300ms, opacity 300ms; }
.panel.hidden { transform: translateX(-100%); opacity: 0; }

/* Janky: triggers layout on every frame */
/* .panel { transition: left 300ms; } */`
  ],
  "Focus Styles and Contrast": [
    "Keyboard users need a visible focus indicator and text that has enough contrast with its background. I never remove the outline without replacing it, and I check colours against the WCAG contrast ratio of at least 4.5 to 1 for normal text.",
    "The :focus-visible selector shows focus only for keyboard navigation. Contrast ratios compare text and background luminance, with 4.5 to 1 for body text and 3 to 1 for large text and UI components.",
    "Users who navigate with keyboards or have low vision depend on these details, and accessibility is often tested in interviews.",
    "Every interactive element such as buttons, links and form fields.",
    "Do not write outline: none without a replacement, and do not use colour alone to show errors or states.",
    "Style :focus-visible with a clear outline and offset, test by tabbing through the page, and check contrast with a tool in DevTools.",
    "Pros: inclusive and often required by law. Cons: stronger focus rings can look heavy, so balance the design.",
    "Native elements such as button and input, which already have focus behaviour.",
    `button:focus-visible,
a:focus-visible {
  outline: 3px solid #1a73e8;
  outline-offset: 2px;
}`
  ],
  "Center a Div": [
    "I centre a block horizontally with margin auto and vertically and horizontally with flexbox or grid. Flexbox with justify-content and align-items is the most common modern answer, and I mention the older transform method too.",
    "Asked to centre a div inside its parent both ways, using the simplest modern technique.",
    "It is one of the most frequent CSS questions and tests knowledge of layout modes.",
    "Login boxes, modals and hero sections.",
    "Do not use absolute positioning with negative margins, which needs the element size to be known.",
    "Make the parent a flex container, set justify-content and align-items to center, and give the parent a height so vertical centring has space.",
    "Pros: short and works for unknown sizes. Cons: the parent needs a height for vertical centring.",
    "position absolute with top 50 percent, left 50 percent and transform translate minus 50 percent, which works when the parent is not a flex container.",
    `.parent {
  display: flex;
  justify-content: center;   /* horizontal */
  align-items: center;       /* vertical */
  min-height: 100vh;
}`
  ],
  "Responsive Card Grid": [
    "I build a card grid that places as many cards per row as fit, with a minimum width for each card. CSS Grid with repeat auto-fill and minmax does this without media queries.",
    "Asked to create a grid of cards that changes the number of columns with the screen width and keeps equal heights.",
    "It tests grid, responsive units and the difference between auto-fill and auto-fit.",
    "Product lists, galleries and dashboards with cards.",
    "Do not fix the number of columns with pixel widths, because the layout breaks on other screens.",
    "Set display grid on the container, use grid-template-columns with repeat auto-fill and minmax of 220px to 1fr, and add a gap. Cards stretch to the full row height by default.",
    "Pros: responsive with one rule. Cons: the last row can look uneven when there are few cards.",
    "Flexbox with wrap and a fixed basis, which gives similar results with more control of alignment.",
    `.cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
}
.card { display: flex; flex-direction: column; }`
  ],
  "Sticky Footer Layout": [
    "A sticky footer stays at the bottom of the viewport when the page is short, and moves down after the content when the page is long. I use a flex column on the body with the main area growing to fill the space.",
    "Asked to keep the footer at the bottom even when the content is short, without fixed positioning.",
    "It tests flexbox column layout and the min-height trick.",
    "Every page layout where the footer should not float in the middle of a short page.",
    "Do not use position fixed for the footer, because it covers the content.",
    "Make body a flex column with min-height 100vh, give the main element flex 1, and let the footer follow naturally.",
    "Pros: simple and robust. Cons: uses 100vh, so mobile address bars need dvh for the best result.",
    "Grid with grid-template-rows set to auto 1fr auto on the body.",
    `body { display: flex; flex-direction: column; min-height: 100vh; margin: 0; }
main { flex: 1; }
footer { }`
  ],
  "Fix a Specificity Conflict": [
    "I find the rule that wins in DevTools, lower the specificity of the rule I want to change or raise the one I want to win in a controlled way, and avoid !important. The goal is a fix that keeps future changes simple.",
    "Asked to change the colour of a link that is not updating because a more specific selector overrides it.",
    "Specificity fights are common in real projects and show whether you understand the cascade.",
    "A style that does not apply and you cannot explain why.",
    "Do not add !important or more IDs to win, because the problem grows with each fix.",
    "Inspect the element, see the crossed out rule and its selector, then move the override to the same level or use a layer or a scoped class.",
    "Pros: cleaner selectors. Cons: refactoring existing rules takes time.",
    "CSS layers to control the order of groups of rules, or :where to set zero specificity for defaults.",
    `/* Default: zero specificity with :where */
:where(.link) { color: #0a66c2; }

/* Overrides still win easily */
.sidebar .link { color: #111; }`
  ]
};
