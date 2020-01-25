<template>
  <section class="add-jira">
    <div v-if="selectedProject" class="preview">
      <p>{{ selectedProject }}</p>
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
        <b-button @click="getProjects" type="is-primary">Get projects</b-button>
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
  created() {
    this.checkActiveProject();
  },
  computed: {
    ...mapState(['projects', 'project'])
  },
  methods: {
    checkActiveProject() {
      const project = window.localStorage.getItem('active-server-url');
      if (project !== null) {
        this.selectedProject = JSON.parse(project);
      }
    },
    setActiveProject(project) {
      this.$store.dispatch('setActiveProject', { project, baseUrl: this.jiraLink });
      this.selectedProject = window.localStorage.getItem('active-server-url');
    },
    validUrl() {
      if (this.jiraLink.includes('https://pm.maddevs.co')) {
        return 'https://pm.maddevs.co';
      }
      if (this.jiraLink.includes('atlassian.net')) {
        const positionKey = this.jiraLink.indexOf('atlassian.net');
        return this.jiraLink.substring(0, positionKey + 'atlassian.net'.length);
      }
      return false;
    },
    getProjects() {
      this.jiraLink = this.validUrl();
      if (this.jiraLink) {
        this.$store.dispatch('getProjects', this.jiraLink);
      }
    }
  }
};
</script>

<style lang="scss" scoped>
  p {
    font-size: 20px;
  }
</style>
