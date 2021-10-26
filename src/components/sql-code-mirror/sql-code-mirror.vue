<template>
  <textarea ref="code" name="code" style="border: none;"></textarea>
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
import 'codemirror/addon/comment/comment';
import 'codemirror/keymap/sublime';
import { format } from 'sql-formatter';
import { trim } from 'lodash-es';

export default {
  name: 'SqlCodeMirror',
  components: {
    CodeMirror,
  },

  model: {
    prop: 'sql',
    event: 'change'
  },

  props: {
    sql: {
      type: String
    },
    readOnly: {
      type: Boolean,
      default: true
    }
  },

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
    const editor = this.sqlEditor = CodeMirror.fromTextArea(this.$refs.code, {
      mode: 'sql',
      theme: 'darcula',
      // indentWithTabs: true,
      // smartIndent: true,
      // lineNumbers: true,
      // matchBrackets : true,
      // autofocus: true,
      // readOnly: this.readOnly,
      // height: 500,
      // theme: 'default',
      indentWithTabs: true,
      smartIndent: true,
      lineNumbers: true,
      matchBrackets : true,
      keyMap: 'sublime',
      autofocus: true,
      hintOptions: {
        completeSingle: false,
      },
    });

    // 但输入字符后，显示提示信息
    editor.on('keypress', (e) => {
      editor.showHint();
    });

    editor.on('change', (instance) => {
      this.$emit('change', trim(instance.getValue()));
    });
    
    editor.setValue(this.code);
  },

  methods: {
    format() {
      const { sql, sqlEditor } = this;
      this.code = format(sql, {
        language: 'mysql',
        indent: '  ',
      });
      sqlEditor.setValue(this.code);
    },

    onOk() {
      //
    }
  }
}
</script>