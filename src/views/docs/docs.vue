<template>
  <MarkdownHtml v-if="data && !loading" :data="data"></MarkdownHtml>
</template>
<script>
import MarkdownHtml from '@/components/markdown-html/markdown-file.vue';
import axios from 'axios';
export default {
  components: {
    MarkdownHtml,
  },
  data() {
    return {
      data: null,
      name: '',
      loading: true,
    }
  },
  created() {
    const { path } = this.$route.params;

    this.fetchFile(path);
  },
  methods: {
    async fetchFile(name) {
      this.loading = true;
      const { data } = await axios.get(`/docs/${name}.md`).finally(() => this.loading = false);
      this.data = data;
    }
  }
}
</script>