<template>
  <section class="add-jira">
    <div v-if="selectedProject" class="preview">
      <p>{{ project }}</p>
      <a href="/tab/tab.html" target="_blank">
        <b-button type="is-primary">Dashboard</b-button>
      </a>
    </div>
    <div v-else class="select-project">
      <b-button
        v-for="(project, i) of projects"
        :key="i"
        @click="setActiveProject(project)"
      >{{ project.name }}</b-button>
      <div class="add-jira_input">
        <b-input v-model="jiraLink"></b-input>
        <b-button type="is-primary">Primary</b-button>
      </div>
    </div>
  </section>
</template>

<script>
import { mapState } from 'vuex';

export default {
  data() {
    return {
      jiraLink: null,
      selectedProject: null
    };
  },
  computed: {
    ...mapState(['projects', 'project'])
  },
  created() {
    this.$store.dispatch('getProjects');
  },
  methods: {
    setActiveProject(project) {
      this.selectedProject = project;
      this.$store.dispatch('setActiveProject', project);
    }
  }
};
</script>

<style lang="scss" scoped>
  p {
    font-size: 20px;
  }
</style>
