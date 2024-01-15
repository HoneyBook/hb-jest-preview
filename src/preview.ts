import fs from 'fs';
import path from 'path';
import { CACHE_FOLDER } from './constants';

const escapeHtml = (unsafe: string) => {
  return unsafe
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
};

const nameToDocument: Record<string, string> = {};

export function debug(
  name: string = `preview (${Object.keys(nameToDocument).length + 1})`,
): void {
  if (!fs.existsSync(CACHE_FOLDER)) {
    fs.mkdirSync(CACHE_FOLDER, {
      recursive: true,
    });
  }

  nameToDocument[name] = document.documentElement.outerHTML;

  const buttonClass = 'preview-button';
  let buttons = '';
  let globalVariablesScripts = '';
  Object.entries(nameToDocument).forEach(([currName, currDoc]) => {
    const buttonOnClickHandler = `let iframe = document.getElementById('content').contentWindow.document;iframe.documentElement.innerHTML=unescapeHtml(window['${currName}'])`;
    const buttonOnFocusHandler = `this.click()`;
    const button = `<button onclick="${buttonOnClickHandler}" onfocus="${buttonOnFocusHandler}" class="${buttonClass}">${currName}</button>`;
    buttons += button;

    const script = `<script>window['${currName}']=\`${escapeHtml(
      currDoc,
    )}\`</script>`;
    globalVariablesScripts += script;
  });

  const iframe = `<iframe id="content" style="width:calc(100% - 4px);height:calc(100% - 26px);"></iframe>`;
  const unescapeScript = `<script>const unescapeHtml = (text) => {return text.replaceAll('&amp;','&').replaceAll('&lt;','<').replaceAll('&gt;','>').replaceAll('&quot;','"').replaceAll('&#039;',"'")}</script>`;
  const keyboardEventScript = `<script>window.addEventListener('load', () => {document.onkeydown = (e) => {if (e.keyCode == '39' && document.activeElement.nextElementSibling.matches('.${buttonClass}')) {document.activeElement.nextElementSibling.focus()} else if (e.keyCode == '37') {document.activeElement.previousElementSibling?.focus()}}})</script>`;
  const onLoadSelectFirstButtonScript = `<script>window.addEventListener('load', () => {const firstButton = document.querySelectorAll('.${buttonClass}')[0]; firstButton.focus(); firstButton.click();})</script>`;
  const style = `<style>.${buttonClass}:focus{border:2px solid blue;}</style>`;
  const head = `<head>${style}</head>`;
  const body = `<body style="margin:0;">${buttons}${iframe}${globalVariablesScripts}${unescapeScript}${onLoadSelectFirstButtonScript}${keyboardEventScript}</body>`;
  const html = `<html>${head}${body}</html>`;
  fs.writeFileSync(path.join(CACHE_FOLDER, 'index.html'), html);
}
