<template>
  <section @mousemove="getCurrentTime" ref="worklogs">
    <b-modal
      :active.sync="modalOpened"
      @close="reset"
      has-modal-card
      trap-focus
      aria-role="dialog"
      aria-modal
    >
      <modal-form>
        <form action="">
          <div class="modal-card" style="width: auto">
            <header class="modal-card-head">
              <p class="modal-card-title">New worklog</p>
            </header>
            <section class="modal-card-body">
              <b-field label="Start">
                <b-input v-model="startWorklog"></b-input>
              </b-field>
              <b-field label="End">
                <b-input v-model="endWorklog"></b-input>
              </b-field>
              <b-field label="Text"
                :label-position="labelPosition">
                <b-input maxlength="200" type="textarea"></b-input>
              </b-field>
            </section>
          <footer class="modal-card-foot">
            <button class="button is-primary" @click="createWorklog">Add</button>
          </footer>
        </div>
      </form>
      </modal-form>
    </b-modal>
    <b-button
      type="is-primary"
      v-if="mousePositionY && mousePositionX"
      :style="{ position: 'fixed', top: (mousePositionY - 20) + 'px', left: 0, zIndex: 999 }">
      {{ currentTime }}
    </b-button>
    <b-navbar>
      <template slot="brand">
        <b-navbar-item tag="router-link" :to="{ path: '/' }">
          <img
            src="https://raw.githubusercontent.com/buefy/buefy/dev/static/img/buefy-logo.png"
            alt="Lightweight UI components for Vue.js based on Bulma"
          >
        </b-navbar-item>
      </template>
      <template slot="end">
        <b-navbar-item tag="div">
          <div class="buttons">
            <b-button @click="prevWeek" type="is-primary">Prev Week</b-button>
            <b-button @click="nextWeek" type="is-primary">Next Week</b-button>
          </div>
        </b-navbar-item>
      </template>
    </b-navbar>
    <DayPilotCalendar id="dp" :config="config" ref="calendar" />
  </section>
</template>

<script>
import { mapState } from 'vuex';
import moment from 'moment-timezone';
import { DayPilot, DayPilotCalendar } from 'daypilot-pro-vue';
import Vue from 'vue';

export default {
  name: 'Worklogs',
  components: {
    DayPilotCalendar
  },
  props: {
  },
  data: function() {
    return {
      mousePositionY: null,
      mousePositionX: null,
      wrappCells: null,
      currentTime: null,
      currentDate: moment().subtract(1, 'days').format('YYYY-MM-DD'),
      minusWeek: 8,
      plusWeek: 8,
      startWorklog: null,
      endWorklog: null,
      worklogArgs: null,
      modalOpened: false,
      labelPosition: 'on-border',
      config: {
        viewType: "Week",
        cellHeight: 30,
        heightSpec: "Full",
        cellDuration: 10,
        cellHeight: 15,
        dayBeginsHour: 8,
        dayEndsHour: 24,
        startDate: moment().subtract(1, 'days').format('YYYY-MM-DD'),
        timeFormat: "Clock24Hours",
        timeRangeSelectedHandling: "Enabled",
        onTimeRangeSelected: (args) => {
          this.worklogArgs = args;
          this.startWorklog = args.start;
          this.endWorklog = args.end;
          this.modalOpened = true;
        },
        eventDeleteHandling: "Disabled",
        eventMoveHandling: "Update",
        onEventMoved: function (args) {
          this.message("Event moved: " + args.e.text());
        },
        eventResizeHandling: "Update",
        onEventResized: function (args) {
          this.message("Event resized: " + args.e.text());
        },
        eventClickHandling: "Disabled",
        eventHoverHandling: "Disabled",
      },
    }
  },
  created() {
    this.$store.dispatch('getWorklogs');
  },
  computed: {
    // DayPilot.Calendar object - https://api.daypilot.org/daypilot-calendar-class/
    calendar: function () {
      return this.$refs.calendar.control;
    },
    ...mapState(['yesterdayWorklogs'])
  },
  watch: {
    yesterdayWorklogs(newValue) {
      const logs = this.displayWorklogs(newValue);
      Vue.set(this.config, "events", logs);
    }
  },
  mounted: function() {
    this.loadEvents();
    this.calendar.message("Welcome!");
    this.wrappCells = document.querySelector('.calendar_default_scroll').getBoundingClientRect();
  },
  methods: {
    getCurrentTime(e) {
      if (e.target.className == 'calendar_default_cell_inner') {
        this.mousePositionY = e.y;
        this.mousePositionX = e.x;
        const hourHeight = this.wrappCells.height / (this.config.dayEndsHour - this.config.dayBeginsHour);
        const startPosY = (e.clientY + document.documentElement.scrollTop) - (this.wrappCells.top);
        const minutes = Math.floor(startPosY / (hourHeight / 60));
        this.currentTime = moment.utc(moment.duration(minutes, "minutes").asMilliseconds()).format("HH:mm");
      }
    },
    loadEvents() {},
    createWorklog() {
      const dp = this.worklogArgs.control;
      dp.clearSelection();
      dp.events.add(new DayPilot.Event({
        start: this.worklogArgs.start,
        end: this.worklogArgs.end,
        id: DayPilot.guid(),
        text: 'Time',
        resource: this.worklogArgs.resource
      }));
      this.modalOpened = false;
    },
    reset() {
      const dp = this.worklogArgs.control;
      dp.clearSelection();
    },
    displayWorklogs(worklogs) {
      const logs = [];
      worklogs.forEach(e => {
        e.list.forEach(log => {
          logs.push({
            id: log.id,
            start: moment(log.created).tz('Asia/Bishkek').format('YYYY-MM-DDTHH:mm:ss'),
            end: moment(log.created).tz('Asia/Bishkek').add(log.timeSpentSeconds, 'seconds').format('YYYY-MM-DDTHH:mm:ss'),
            text: log.comment
          });
        });
      });
      return logs;
    },
    prevWeek() {
      this.plusWeek = 8;
      const startDate = moment(this.currentDate).subtract(this.minusWeek, 'days');
      this.config.startDate = new DayPilot.Date(startDate.format(), true);
      this.minusWeek += 8;
      this.currentDate = startDate;
    },
    nextWeek() {
      this.minusWeek = 8;
      const startDate = moment(this.currentDate).add(this.plusWeek, 'days');
      this.config.startDate = new DayPilot.Date(startDate.format(), true);
      this.plusWeek += 8;
      this.currentDate = startDate;
    }
  }
}
</script>

<style lang="scss" scoped>
</style>