<template>
  <section class="add-jira">
    <b-button
      v-for="(project, i) of projects"
      :key="i"
    >{{ project.name }}</b-button>
    <div class="add-jira_input">
      <b-input v-model="jiraLink"></b-input>
      <b-button type="is-primary">Primary</b-button>
    </div>
  </section>
</template>

<script>
import { mapState } from 'vuex';

export default {
  data() {
    return {
      jiraLink: ''
    };
  },
  computed: {
    ...mapState(['projects'])
  },
  created() {
    this.$store.dispatch('getProjects');
  } 
};
</script>

<style lang="scss" scoped>
  p {
    font-size: 20px;
  }
</style>
