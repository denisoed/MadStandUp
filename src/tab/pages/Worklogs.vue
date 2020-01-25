<template>
  <section>
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
    <DayPilotCalendar id="dp" :config="config" ref="calendar" />
  </section>
</template>

<script>
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
        timeRangeSelectedHandling: "Enabled",
        onTimeRangeSelected: (args) => {
          // console.log(args);
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
  computed: {
    // DayPilot.Calendar object - https://api.daypilot.org/daypilot-calendar-class/
    calendar: function () {
      return this.$refs.calendar.control;
    }
  },
  mounted: function() {
    this.loadEvents();
    this.calendar.message("Welcome!");
  },
  methods: {
    loadEvents() {
      const events = [
        // { id: 1, start: "2018-10-01T11:00:00", end: "2018-10-01T14:00:00", text: "Event 1" },
        { id: 2, start: DayPilot.Date.today().addHours(11), end: DayPilot.Date.today().addHours(14), text: "Event 1"}
      ];
      Vue.set(this.config, "events", events);
    },
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
    }
  }
}
</script>

<style lang="scss" scoped>
</style>