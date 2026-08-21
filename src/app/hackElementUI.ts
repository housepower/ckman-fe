import { Select, Table } from 'element-ui';

(Select as any).props.optionMaxWidth.default = '800px';

/**
 * el-table 的 show-overflow-tooltip 浮层在表格滚动时不会自动收起。
 *
 * 拖滚动条时鼠标是不动的，单元格从它下面滑过会不断触发 mouseenter，
 * 浮层被反复唤起、却仍按上一个单元格定位，于是残留在行上盖住表格内容
 * （尤其是被固定列压住的那几列，看着像表格"透"到了后面）。
 * Element 自身只在 mouseleave 时关闭它，这里补上滚动时关闭。
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

(Table as any).mixins = [
  ...((Table as any).mixins || []),
  {
    mounted(this: any) {
      const wrapper = this.$refs && this.$refs.bodyWrapper;
      if (!wrapper) return;
      this.__closeTooltipOnScroll = () => closeOverflowTooltip(this);
      wrapper.addEventListener('scroll', this.__closeTooltipOnScroll, { passive: true });
    },
    beforeDestroy(this: any) {
      const wrapper = this.$refs && this.$refs.bodyWrapper;
      if (wrapper && this.__closeTooltipOnScroll) {
        wrapper.removeEventListener('scroll', this.__closeTooltipOnScroll);
      }
    },
  },
];
