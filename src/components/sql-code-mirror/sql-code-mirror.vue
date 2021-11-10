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
import { $message } from '@/services';

function set(str) {
  let obj = {}, words = str.split(" ");
  for (let i = 0; i < words.length; ++i) obj[words[i]] = true;
  return obj;
}
var sqlKeywords = "alter and as asc between by count create delete desc distinct drop from group having in insert into is join like not on or order select set table union update values where limit ";
// ClickHouse
CodeMirror.defineMIME("text/x-clickhouse", {
  name: "sql",
  client: set(''),
  keywords: set(sqlKeywords + "Int8 Int16 Int32 Int64 Int128 Int256 UInt8 UInt16 UInt32 UInt64 UInt128 UInt256 Float32 Float64 Decimal String FixedString UUID Date Date32 DateTime DateTime64 Enum LowCardinality Array AggregateFunction Nested Tuple Nullable SimpleAggregateFunction ALL ANY ASOF INNER LEFT RIGHT FULL CROSS OUTER SEMI ANTI JOIN USING WITH CUBE TOTALS HAVING ORDER BY FROM TO FILL STEP LIMIT ARRAY DISTINCT EXCEPT FORMAT INTO OUTFILE PREWHERE SAMPLE UNION FROM DATABASE TABLE VIEW MATERIALIZED DICTIONARY FUNCTION USER ROLE ROW POLICY QUOTA SETTINGS PROFILE ALTER COLUMN PARTITION DELETE UPDATE INDEX CONSTRANINT TTL USER QUOTA ROLE PROJECTION SYSTEM SHOW GRANT EXPLAIN REVOKE ATTACH DESCRIBE DETACH DROP EXISTS KILL OPTIMIZE RENAME EXCHANGE SET TRUNCATE USE WATCH ON IN CLUSTER ROLLUP SYNC NULL CAST MergeTree SummingMergeTree AggregatingMergeTree CollapsingMergeTree VersionedCollapsingMergeTree GraphiteMergeTree ReplacingMergeTRee ReplicatedMergeTree  ReplicatedSummingMergeTree ReplicatedReplacingMergeTree ReplicatedAggregatingMergeTree ReplicatedCollapsingMergeTree ReplicatedVersionedCollapsingMergeTree ReplicatedGraphiteMergeTree"),
  builtin: set("count min max sum avg any stddevPop stddevSamp varPop varSamp covarPop covarSamp anyHeavy anyLast argMin argMax avgWeighted coor topK topKWeighted groupArray groupUniqArray groupArrayInsertAt groupArrayMovingSum groupArrayMOvingAvg groupArraySample groupBitAnd groupBitOr groupBitXor groupBitmap groupBitmapAnd groupBitmapOr groupBitmapXor sumWithOverflow deltaSum deltaSumTimestamp sumMap minMap maxMap sumCount rankCorr sumKahan intervalLengthSum skewPop skewSamp kurtPop kurtSamp uniq uniqExact uniqCombined uniqCombined64 uniqHLL12 uniqTheta quantile quantilesExactExclusive quantilesExactInclusive quantileExact quantileExactWeighted quantileTiming quantileTimingWeighted quantileDeterministic quantileTDigest quantileTDigestWeighted quantileBFloat16 median simpleLinearRegression stochasticLinearRegression stochasticLogisticRegression  categoricalInformationValue studentTTest welchTTest entropy mannWhitneyUTest histogram sequenceMatch sequenceCount windowFunnel retention uniqUpTo sumMapFiltered sequenceNextNode file merge numbers remote url mysql postgresql jdbc odbc hdfs s3 input generateRandom cluster view null dictionary s3Cluster sqlite"),
  atoms: set(''),
  operatorChars: /^[*+\-%<>!=&|^]/,
  dateSQL: set("now"),
  support: set("binaryNumber hexNumber doubleQuote"),
  hooks: {}
});

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
    try {
      this.code = format(this.sql, {
        language: 'mysql',
        indent: '  ',
      });
    } catch(e) {
      this.code = this.sql;
    }
    
  },

  mounted() {
    const editor = this.sqlEditor = CodeMirror.fromTextArea(this.$refs.code, {
      mode: 'text/x-clickhouse',
      theme: 'darcula',
      readOnly: this.readOnly,
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
      try {
        const { sql, sqlEditor } = this;
        this.code = format(sql, {
          language: 'mysql',
          indent: '  ',
        });
        sqlEditor.setValue(this.code);
      } catch(e) {
        $message.info(this.$t("common.Current Browser Not Support"));
      }
    },

    onOk() {
      //
    }
  }
}
</script>