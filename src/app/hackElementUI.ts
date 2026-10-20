import { Select, Table } from 'element-ui';

(Select as any).props.optionMaxWidth.default = '800px';

/**
 * el-table 的 show-overflow-tooltip 浮层在滚动时不会自动收起。
 *
 * 拖滚动条时鼠标是不动的，单元格从它下面滑过会不断触发 mouseenter，
 * 浮层被反复唤起、却仍按上一个单元格定位，于是残留在行上盖住表格内容
 * （尤其是被固定列压住的那几列，看着像表格"透"到了后面）。
 * Element 自身只在 mouseleave 时关闭它，这里补上滚动时关闭。
 *
 * 注意监听的不只是表格自己的 body-wrapper：浮层是 append 到 body 上的，
 * 任何祖先容器滚动（弹框 .el-dialog__wrapper、页面主内容区）都会让它跟
 * 单元格脱节，同样留下残影。scroll 事件不冒泡，但捕获阶段仍会经过
 * document，所以在 document 上用 capture 监听可以一网打尽。
 */
const closeOverflowTooltip = (table: any) => {
  // 主体、左固定、右固定各有一个 ElTableBody，都是 el-table 的直接子组件
  (table.$children || []).forEach((child: any) => {
    const tooltip = child && child.$refs && child.$refs.tooltip;
    if (!tooltip) return;
    if (tooltip.setExpectedState) tooltip.setExpectedState(false);
    if (tooltip.handleClosePopper) tooltip.handleClosePopper();
  });
};

// 所有挂载中的 el-table，共用一个 document 级监听，避免每个表格各挂一份
const mountedTables = new Set<any>();
let scrollListenerBound = false;

const onAnyScroll = () => mountedTables.forEach(closeOverflowTooltip);

(Table as any).mixins = [
  ...((Table as any).mixins || []),
  {
    mounted(this: any) {
      mountedTables.add(this);
      if (!scrollListenerBound) {
        document.addEventListener('scroll', onAnyScroll, { capture: true, passive: true });
        scrollListenerBound = true;
      }
    },
    beforeDestroy(this: any) {
      mountedTables.delete(this);
    },
  },
];
