// Table rows use XPath-like path syntax to stay consistent with the cluster
// Expert config: '/' as separator, '[@k=v]' for attribute predicates.
// Examples:
//   merge_tree/parts_to_throw_insert       -> <merge_tree><parts_to_throw_insert>..</></>
//   disk[@name='hdfs1']/type               -> <disk name="hdfs1"><type>..</type></disk>
//   title[@lang='en', @size=4]/header      -> <title lang="en" size="4"><header>..</header></title>
export interface OverrideRow {
  path: string;
  value: string;
  editable: boolean;
  raw?: string; // original XML segment when row could not be expressed in XPath form
}

interface ParsedSegment {
  tag: string;
  attrs: Array<{ name: string; value: string }>;
  canonical: string; // canonical "tag[@k='v', @j='w']" used as merge key
}

function parseSegment(s: string): ParsedSegment | null {
  const m = /^([^/[\s]+)\s*(?:\[(.+)\])?$/.exec(s.trim());
  if (!m) return null;
  const tag = m[1];
  const attrs: Array<{ name: string; value: string }> = [];
  if (m[2]) {
    m[2].split(',').forEach(pair => {
      const am = /^\s*@([^=]+)\s*=\s*['"]?([^'"]*)['"]?\s*$/.exec(pair);
      if (am) attrs.push({ name: am[1].trim(), value: am[2] });
    });
  }
  return { tag, attrs, canonical: canonicalSegment(tag, attrs) };
}

function canonicalSegment(tag: string, attrs: Array<{ name: string; value: string }>): string {
  if (attrs.length === 0) return tag;
  const pred = attrs.map(a => `@${a.name}='${a.value}'`).join(', ');
  return `${tag}[${pred}]`;
}

/**
 * Parse a node_override.xml string into a flat list of XPath-style rows.
 * Repeated same-tag siblings (without distinguishing attrs) and mixed
 * content fall back to editable=false with the raw XML segment preserved.
 */
export function parseXmlToRows(xml: string): OverrideRow[] {
  if (!xml || !xml.trim()) return [];
  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  if (doc.getElementsByTagName('parsererror').length) {
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

  // Leaf: emit a row regardless of attributes (attrs go into the path segment).
  if (children.length === 0) {
    if (pathSoFar.length === 0) return; // root with no body
    out.push({
      path: pathSoFar.join('/'),
      value: (el.textContent || '').trim(),
      editable: true,
    });
    return;
  }

  // Container: detect tagname collisions where siblings would canonicalize the
  // same — e.g. two <volume> with no distinguishing attrs. We can't express
  // those in XPath without an index/predicate, so we punt the whole subtree.
  const canonCounts: Record<string, number> = {};
  for (const ch of children) {
    const seg = canonicalSegment(ch.tagName, Array.from(ch.attributes).map(a => ({ name: a.name, value: a.value })));
    canonCounts[seg] = (canonCounts[seg] || 0) + 1;
  }
  const hasRepeated = Object.values(canonCounts).some(n => n > 1);

  if (hasRepeated && pathSoFar.length > 0) {
    out.push({
      path: pathSoFar.join('/'),
      value: '',
      editable: false,
      raw: el.outerHTML,
    });
    return;
  }

  for (const ch of children) {
    const seg = canonicalSegment(ch.tagName, Array.from(ch.attributes).map(a => ({ name: a.name, value: a.value })));
    walk(ch, [...pathSoFar, seg], out);
  }
}

/**
 * Build XML from rows. Readonly rows contribute their raw XML segment;
 * editable rows are merged into a nested tree keyed by canonical segment
 * (so 'disk[@name=x]/a' and 'disk[@name=x]/b' share one <disk name="x">).
 */
export function rowsToXml(rows: OverrideRow[], rootTag = 'clickhouse'): string {
  if (rows.length === 0) return '';
  interface TreeNode {
    parsed?: ParsedSegment;
    children: Map<string, TreeNode>;
    leafValue?: string;
  }
  const root: TreeNode = { children: new Map() };
  const rawSegments: string[] = [];

  for (const r of rows) {
    if (!r.editable && r.raw) {
      rawSegments.push(r.raw);
      continue;
    }
    const segs = r.path.split('/').map(s => s.trim()).filter(Boolean);
    if (segs.length === 0) continue;
    let cur = root;
    segs.forEach((s, i) => {
      const parsed = parseSegment(s);
      if (!parsed) return;
      const key = parsed.canonical;
      let next = cur.children.get(key);
      if (!next) {
        next = { parsed, children: new Map() };
        cur.children.set(key, next);
      }
      if (i === segs.length - 1) next.leafValue = r.value;
      cur = next;
    });
  }

  const parts: string[] = [];
  for (const child of root.children.values()) parts.push(renderNode(child));
  return `<${rootTag}>${parts.join('')}${rawSegments.join('')}</${rootTag}>`;
}

function renderNode(n: { parsed?: ParsedSegment; children: Map<string, any>; leafValue?: string }): string {
  if (!n.parsed) return '';
  const tag = n.parsed.tag;
  const attrStr = n.parsed.attrs
    .map(a => ` ${a.name}="${escapeAttr(a.value)}"`)
    .join('');
  if (n.children.size === 0) {
    const v = n.leafValue ?? '';
    if (v === '') return `<${tag}${attrStr}/>`;
    return `<${tag}${attrStr}>${escape(v)}</${tag}>`;
  }
  let inner = '';
  for (const child of n.children.values()) inner += renderNode(child);
  return `<${tag}${attrStr}>${inner}</${tag}>`;
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
