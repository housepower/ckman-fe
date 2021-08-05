<template>
  <d-form v-if="schema" :schema="schema" :form-model="formModel"></d-form>
</template>
<script>
import { DForm } from '@/components/';
import mockData from '@/components/d-form/mock/data.json';
import { ClusterApi } from '@/apis';
export default {
  name: 'test',
  components: {
    DForm,
  },

  props: {},

  data() {
    return {
      schema: null,
      formModel: {}
    }
  },

  created() {
    this.getFormSchema();
  },

  mounted() {
  },

  methods: {
    async getFormSchema() {
      const { data: { entity } } = await ClusterApi.getClusterCreateFormSchema();
      // console.log(data);
      try {
        const schema = (new Function("return " + entity))();
        this.schema = schema;
        console.log(schema);
      } catch (e) {

      }
    }
  }
}
</script>