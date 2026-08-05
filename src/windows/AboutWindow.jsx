import Ui from "../ui"

function aboutWindowContents() {
	return <div style="width: 400px; max-height: 700px; overflow: scroll; padding: 8px;">
		<h1>Theme Editor</h1>
		<p>This is an in-development version and is subject to change. It may be unstable, have missing or broken features.</p>

		<h1>Usage</h1>
		<p>Begin a project in File &gt; New project. You can File &gt; Save at any time for in-browser saving.</p>
		<p>To set a keyboard background image, add an image to "Other assets", then drag it to Config &gt; Background Image</p>
		<p>To change keyboard background color, edit keyboardSurface</p>
		<p>To set a font, add a font to "Other assets", then drag it to Config &gt; Font</p>
		<p>By default most colors are set to automatic, meaning they're derived from other colors. You can still change them manually.</p>
		<p>Many colors come in pairs, for example primary and onPrimary. The "on" version defines the foreground color on that particular color.</p>
		<p>To change all key colors, edit keyboardContainer in Colors. Also see onKeyboardContainer, keyboardContainerVariant and primary.</p>
		<p>To customize key borders, add border assets (or generate rectangle in Insert), add a matchrule, then drag the asset to matchrule. Instead of dragging you can also click on the left part of the matchrule to open a select window.</p>

		<h2>Saving</h2>
		<p>You can click File &gt; Save for an in-browser save. You should get an alert if it was successful.</p>
		<p>Use File &gt; Export for an exported zip. Import is not yet implemented</p>

		<h2>Borders and icons</h2>
		<p>Your border assets should be fairly low resolution. As an example this one is 128x140</p>
		<img src="example_border.png" />
		<p>You will need to {Ui.iconEl("sliders")} configure your border assets after adding, in particular set the foreground color.</p>
		<p>We use <a href="https://en.wikipedia.org/wiki/9-slice_scaling?useskin=vector">9-slicing</a> to allow borders to support arbitrary key dimensions. You need to use the {Ui.iconEl("crop-simple")} crop tool to adjust the slice center when configuring the asset. Example:</p>
		<img src="example_border_9.png" />
		<p>Your icons should be white. Example:</p>
		<img src="example_icon.png" />

		<h2>Matchrule syntax</h2>
		<p>Matchrules let you match specific keys or types of keys on a layout to apply a border or icon to. Use the autocomplete functionality to discover all available keywords.</p>
		<p>Multiple keywords apply an AND operation. So don't specify mutually exclusive rules like <code>normal functional</code> as that will exclude everything.</p>
		<p>Only the first matchrule gets applied. So put more specific ones above more broad ones, e.g. ones with <code>pressed</code> should be above all others.</p>
		<p>Some common examples:</p>
		<ul>
			<li><code>normal</code> - match normal alphabet letter keys</li>
			<li><code>functional</code> - match darker keys</li>
			<li><code>action</code> - match the enter key</li>
			<li><code>functional row -1 col 0</code> - match ?123 key</li>
			<li><code>icon shift_key</code> - match shift key</li>
			<li><code>icon action_emoji</code> - match emoji key</li>
		</ul>

		<h3>State Filters</h3>
		<p>You can test these by using the arrow pointer tool on the left: {Ui.iconEl("arrow-pointer")}, to click on keyboard keys. Beware that if you override a key's border but don't add a matching pressed rule, there may be no visual indication for it being pressed.</p>
		<ul>
			<li><code>popup</code> - Matches the key popup, which is there for alphabet letters on QWERTY</li>
			<li><code>pressed</code> - Matches if key is currently pressed if popups are disabled, either by the user in settings, or by the key itself (e.g. functional keys like spacebar, backspace, numpad keys)</li>
		</ul>
	</div>
}

const AboutWindow = {
	name: "About",
	contents: aboutWindowContents,
};

export default AboutWindow;
globalThis.AboutWindow = AboutWindow;
