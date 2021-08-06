<template>
  <div class="flex flex-column" style="line-height: 34px;">
    <div class="pt-15 pr-20 pb-5 struct">
      <DFormItem v-model="formModel" v-for="(item, key) in schema" :key="key" :schema="item" :origin-name="key" :prop-name="`${PropName}.${key}`">
      </DFormItem>
    </div>
    
  </div>
</template>
<script>
export default {
  name: 'DForm',
  components: {
    DFormItem: () => import('../d-form-item.vue'),
  },

  model: {
    prop: 'formModel',
    event: 'change',
  },

  props: {
    schema: {
      type: Object,
      default() {
        return {};
      },
    },
    PropName: {
      type: String,
      default: ''
    },
    formModel: {
      type: Object,
      default() {
        return {}
      }
    }
  },

  data() {
    return {
      formData: {},
    }
  },

  created() {
  },

  mounted() {

  },

  methods: {
  }
}
</script>