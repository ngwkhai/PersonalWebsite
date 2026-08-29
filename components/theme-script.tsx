/**
 * Runs before paint so the chosen theme never flashes. Deliberately tiny and
 * inlined: any network round-trip here is a visible flash.
 *
 * Three states, matching globals.css — 'light', 'dark', or absent (follow the
 * system). Absent is the default, so a reader who never touches the toggle
 * tracks their OS setting for the life of the site.
 */
const script = `(function(){try{var t=localStorage.getItem('theme');if(t==='light'||t==='dark'){document.documentElement.setAttribute('data-theme',t)}}catch(e){}})()`;

export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
