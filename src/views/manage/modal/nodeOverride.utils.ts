export interface OverrideRow {
  path: string;
  value: string;
  editable: boolean;
  raw?: string; // original XML segment when not editable, for display
}

/**
 * Parse a node_override.xml string into a flat list of dotted-path rows.
 * Nodes that cannot be flattened (attributes / repeated siblings / mixed
 * content) are returned with editable=false and the raw XML segment kept.
 */
export function parseXmlToRows(xml: string): OverrideRow[] {
  if (!xml || !xml.trim()) return [];
  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  const parseErr = doc.getElementsByTagName('parsererror')[0];
  if (parseErr) {
    throw new Error('invalid xml');
  }
  const root = doc.documentElement;
  if (!root) return [];
  const rows: OverrideRow[] = [];
  walk(root, [], rows);
  return rows;
}

function walk(el: Element, pathSoFar: string[], out: OverrideRow[]): void {
  const children = Array.from(el.children);

  // case 1: leaf — emit a row
  if (children.length === 0) {
    if (pathSoFar.length === 0) return; // root with no body
    const hasAttrs = el.attributes.length > 0;
    out.push({
      path: pathSoFar.join('.'),
      value: (el.textContent || '').trim(),
      editable: !hasAttrs,
      raw: hasAttrs ? el.outerHTML : undefined,
    });
    return;
  }

  // case 2: container — check editability of THIS level
  const tagCounts: Record<string, number> = {};
  children.forEach(ch => {
    tagCounts[ch.tagName] = (tagCounts[ch.tagName] || 0) + 1;
  });
  const hasRepeated = Object.values(tagCounts).some(n => n > 1);
  const hasAttrs = el.attributes.length > 0;

  if ((hasRepeated || hasAttrs) && pathSoFar.length > 0) {
    out.push({
      path: pathSoFar.join('.'),
      value: '',
      editable: false,
      raw: el.outerHTML,
    });
    return;
  }

  children.forEach(ch => walk(ch, [...pathSoFar, ch.tagName], out));
}

/**
 * Build XML from rows. Readonly rows contribute their raw XML segment;
 * editable rows are merged into a nested tree.
 */
export function rowsToXml(rows: OverrideRow[], rootTag = 'clickhouse'): string {
  if (rows.length === 0) return '';
  type Node = { [k: string]: Node | string };
  const tree: Node = {};
  const rawSegments: string[] = [];
  rows.forEach(r => {
    if (!r.editable && r.raw) {
      rawSegments.push(r.raw);
      return;
    }
    const segs = r.path.split('.');
    let cur: Node = tree;
    segs.forEach((s, i) => {
      if (i === segs.length - 1) {
        cur[s] = r.value;
      } else {
        if (typeof cur[s] !== 'object') cur[s] = {};
        cur = cur[s] as Node;
      }
    });
  });
  const inner = renderNode(tree);
  return `<${rootTag}>${inner}${rawSegments.join('')}</${rootTag}>`;
}

function renderNode(n: any): string {
  if (typeof n === 'string') return escape(n);
  return Object.entries(n)
    .map(([k, v]) => `<${k}>${renderNode(v)}</${k}>`)
    .join('');
}

function escape(s: string): string {
  return s.replace(/[<>&"]/g, c =>
    ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c] || c)
  );
}

export function detectRootTag(xml: string): 'clickhouse' | 'yandex' {
  if (!xml) return 'clickhouse';
  const m = /<\s*(clickhouse|yandex)[\s>]/i.exec(xml);
  return (m ? m[1].toLowerCase() : 'clickhouse') as 'clickhouse' | 'yandex';
}

/**
 * Pretty-print an XML string with the given indent. Returns the input
 * unchanged when it cannot be parsed (so we never lose user content).
 */
export function prettyXml(xml: string, indent = '    '): string {
  if (!xml || !xml.trim()) return '';
  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  if (doc.getElementsByTagName('parsererror').length || !doc.documentElement) {
    return xml;
  }
  return formatNode(doc.documentElement, '', indent);
}

function formatNode(el: Element, prefix: string, indent: string): string {
  const attrs = Array.from(el.attributes)
    .map(a => ` ${a.name}="${escapeAttr(a.value)}"`)
    .join('');
  const children = Array.from(el.children);
  if (children.length === 0) {
    const text = (el.textContent || '').trim();
    if (!text) return `${prefix}<${el.tagName}${attrs}/>`;
    return `${prefix}<${el.tagName}${attrs}>${escape(text)}</${el.tagName}>`;
  }
  const inner = children
    .map(c => formatNode(c, prefix + indent, indent))
    .join('\n');
  return `${prefix}<${el.tagName}${attrs}>\n${inner}\n${prefix}</${el.tagName}>`;
}

function escapeAttr(s: string): string {
  return s.replace(/[<>&"]/g, c =>
    ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c] || c)
  );
}
