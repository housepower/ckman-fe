<template>
  <textarea id="code" name="code" style="border: none;"></textarea>
</template>
<script>
import CodeMirror from 'codemirror';
import 'codemirror/addon/fold/brace-fold';
import 'codemirror/addon/fold/foldgutter';
import 'codemirror/addon/fold/foldgutter.css';
import 'codemirror/mode/javascript/javascript';
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/darcula.css';
import "codemirror/addon/hint/show-hint.css";
import 'codemirror/mode/sql/sql';
import 'codemirror/addon/hint/show-hint';
import 'codemirror/addon/hint/sql-hint';
import { format } from 'sql-formatter';

export default {
  name: 'SqlCodeMirror',
  components: {
    CodeMirror,
  },

  props: ["sql"],

  data() {
    return {
      code: '',
      sqlEditor: '',
    }
  },

  created() {
    this.code = format(this.sql, {
      language: 'mysql',
      indent: '  ',
    });
  },

  mounted() {
    const editor = this.sqlEditor = CodeMirror.fromTextArea(document.getElementById('code'), {
      mode: 'sql',
      theme: 'darcula',
      indentWithTabs: true,
      smartIndent: true,
      lineNumbers: true,
      matchBrackets : true,
      autofocus: true,
      readOnly: true,
      height: 500,
    });
    editor.setValue(this.code);
  },

  onOk() {
  }
}
</script>