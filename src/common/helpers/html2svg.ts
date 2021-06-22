import { readFile } from './readFile';

/** Convert remote url to data-uri */
async function fillUrl(styleString: string, baseUrl = '', onlyType = '.ttf') {
  let lastIndex = 0;
  let result = '';

  const re = /url\((?:["']?)(.+?)(?:["'])?\)/g;
  for (let matches: RegExpExecArray; (matches = re.exec(styleString));) {
    const url = matches[1];
    if (url.startsWith('data:')) continue;
    if (onlyType && !url.endsWith(onlyType)) continue;
    const resp = await fetch(baseUrl + url);
    const dataUrl = `data:${resp.headers.get('Content-Type')};base64,${btoa(await readFile(await resp.blob(), true))}`;
    result += styleString.slice(lastIndex, matches.index);
    result += `url("${dataUrl}")`;
    lastIndex = re.lastIndex;
  }

  result += styleString.slice(lastIndex);

  return result;
}

/** Export HTML element to svg */
export async function html2svg(
  element: HTMLElement,
  styles?: Record<string, any>,
  size = {
    width: element.scrollWidth + '',
    height: element.scrollHeight + '',
  },
): Promise<SVGSVGElement> {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', size.width);
  svg.setAttribute('height', size.height);
  svg.setAttribute('class', document.documentElement.className);

  const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
  title.innerHTML = document.title;
  svg.appendChild(title);

  await Promise.all(Array.from(document.head.children).map(async (el: HTMLElement) => {
    switch (el.tagName) {
      case 'STYLE': {
        const style = el.cloneNode(true) as HTMLElement;
        style.innerHTML = await fillUrl(style.innerHTML);
        svg.appendChild(style);
        break;
      }

      case 'LINK': {
        if ((el as HTMLLinkElement).rel.toLowerCase() === 'stylesheet') {
          const { href } = (el as HTMLLinkElement);
          const style = document.createElement('style');
          const resp = await fetch(href);
          style.innerHTML = await fillUrl(await resp.text(), href.slice(0, href.lastIndexOf('/') + 1));
          svg.appendChild(style);
        }
        break;
      }
    }
  }));

  const foreignObject = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject');
  if (styles) {
    const computedStyles = getComputedStyle(element);
    Object.assign(foreignObject.style, {
      width: '100%',
      height: '100%',
      font: computedStyles.font,
      textRendering: computedStyles.textRendering,
      webkitFontSmoothing: (computedStyles as any).webkitFontSmoothing,
      mozOsxFontSmoothing: (computedStyles as any).mozOsxFontSmoothing,
      color: computedStyles.color,
      direction: computedStyles.direction,
    }, styles);
  }

  element.querySelectorAll('canvas').forEach((el, idx) => {
    if (!el.id) {
      el.id = '$$HTML2SVG_TEMP_CANVAS_ID_' + idx;
    }
  });
  element.querySelectorAll('input').forEach((el, idx) => {
    if (!el.id) {
      el.id = '$$HTML2SVG_TEMP_INPUT_ID_' + idx;
    }
  });

  const newNode = element.cloneNode(true) as HTMLElement;
  newNode.querySelectorAll('canvas').forEach(el => {
    const canvas = document.getElementById(el.id) as HTMLCanvasElement;
    const image = new Image();
    image.src = canvas.toDataURL('image/png');
    image.className = canvas.className;
    image.setAttribute('style', canvas.getAttribute('style'));
    el.replaceWith(image);
  });
  newNode.querySelectorAll('input').forEach(el => {
    const input = document.getElementById(el.id) as HTMLInputElement;
    el.setAttribute('value', input.value);
  });

  foreignObject.appendChild(newNode);
  svg.appendChild(foreignObject);

  return svg;
}
