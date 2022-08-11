<template>
  <div class="flex height-full">
    <div class="navbar width-300 pt-40"
        v-if="headings">
      <el-tree
        class="filter-tree"
        style="overflow: auto;"
        node-key="id"
        :data="headings"
        :props="defaultProps"
        :default-expanded-keys="defaultExpandedKeys"
        :filter-node-method="filterNode">
        <span class="custom-tree-node" slot-scope="{ node }">
          <a class="text-ellipsis" :href="`#key${ node.id }`" :title="node.label">{{node.label}}</a>
        </span>
      </el-tree>
    </div>
    <div class="markdown-body flex-1 height-full" v-html="markdownData" style="overflow: auto;" />
  </div>
</template>

<script>
  import { marked } from 'marked';
  import hljs from 'highlight.js';
  import 'highlight.js/styles/default.css';
  import 'github-markdown-css';
  function listToTree(data) {

    const rootNode = data[0];
    const root = {
      text: rootNode.text,
      id: 0,
    };

    for (let i = 1; i < data.length; i++) {
      const node = data[i];
      const depth = node.depth;
      let lastNode = root;
      for (let j = 0; j < depth - 2; j++) {
        lastNode = lastNode.children[lastNode.children.length - 1];
      }

      if (lastNode.children === undefined){
        lastNode.children = [];
      }
      lastNode.children.push(node);
    }
    return root;
  }

  export {
    listToTree,
  };

  export default {
    name: 'MarkdownHtml',
    props: {
      data: String,
      options: Object,
      height: {
        type: String,
        default: '100%',
      }
    },
    data() {
      return {
        visible: false,
        markdownData: null,
        headings: null,
        filterText: null,
        defaultProps: {
          children: 'children',
          label: 'text'
        },
        defaultExpandedKeys: [0],
      };
    },
    created() {
      this.generateMarkdownHtml();
      let i = 0;
      const renderer = {
        heading(text, level) {
          i++;
          return `
            <h${level}>
              <a name="key${i}" class="anchor" href="#key${i}">
                <span class="header-link"></span>
              </a>
              ${text}
            </h${level}>`;
        },
        link(href, title, text) {
          const regex = /^\.\/(?<name>\w+)\.md$/;
          const matchResult = href.match(regex);
          if (href.match(regex)) {
            return `<a href="/docs/${ matchResult.groups.name }">${ text }</a>`;
          }
          return `<a href="${ href }" target="_blank">${ text }</a>`;
        },
        image(href, title, text) {
          return `<image src="/docs/${ href }" title="${ title }" alt="${ text }" />`
        }
      };
      marked.use({ renderer });
      this.markdownData = marked(this.data);
      this.getHeadings(this.data);
    },
    methods: {
      generateMarkdownHtml() {
        const defaultOption = {
          renderer: new marked.Renderer(),
          highlight(data){
            return hljs.highlightAuto(data).value;
          },
          pedantic: false,
          gfm: true,
          tables: true,
          breaks: false,
          sanitize: false,
          smartLists: true,
          smartypants: false,
          xhtml: false,
        };
        marked.setOptions(Object.assign(defaultOption, this.option));
      },
      toggleShow() {
        this.visible = !this.visible;
      },
      getHeadings(data) {
        const tokens = marked.lexer(data);
        this.headings = [listToTree(tokens.filter(item => item.type === 'heading').map((item, index) => {
          return {
            text: item.text,
            depth: item.depth,
            id: index + 1,
          };
        }))];
      },
      filterNode(value, data) {
        if (!value) return true;
        return data.text.indexOf(value) !== -1;
      }
    }
  };
</script>

<style lang="scss" scoped>
.markdown-body ::v-deep {
  box-sizing: border-box;
  margin: 0 auto;
  overflow-y: auto;
  padding: 20px 40px;

  table td, table th {
    min-width: 100px;
  }
}

.navbar {
  border-right: 2px solid #f2f2f2;
  transition: all 0.3s;
  border-radius: 3px;
  padding: 20px 20px;
  position: sticky;
  top: 0;
  overflow: auto;
}

.custom-tree-node {
  flex: 1;
  a {
    width: 100%;
    display: inline-block;
  }
}
</style>
