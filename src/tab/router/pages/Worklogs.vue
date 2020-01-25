<template>
  <DayPilotCalendar id="dp" :config="config" ref="calendar" />
</template>

<script>
import { DayPilot, DayPilotCalendar } from 'daypilot-pro-vue';
import Vue from 'vue';

export default {
  name: 'Worklogs',
  data: function() {
    return {
      config: {
        viewType: "Week",
        cellHeight: 30,
        heightSpec: "Full",
        cellDuration: 10,
        cellHeight: 15,
        timeRangeSelectedHandling: "Enabled",
        onTimeRangeSelected: function (args) {
          DayPilot.Modal.prompt("Create a new event:", "Event 1").then(function(modal) {
            var dp = args.control;
            dp.clearSelection();
            if (!modal.result) { return; }
            dp.events.add(new DayPilot.Event({
              start: args.start,
              end: args.end,
              id: DayPilot.guid(),
              text: modal.result
            }));
          });
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
  props: {
  },
  components: {
    DayPilotCalendar
  },
  computed: {
    // DayPilot.Calendar object - https://api.daypilot.org/daypilot-calendar-class/
    calendar: function () {
      return this.$refs.calendar.control;
    }
  },
  methods: {
    loadEvents() {
      const events = [
        // { id: 1, start: "2018-10-01T11:00:00", end: "2018-10-01T14:00:00", text: "Event 1" },
        { id: 2, start: DayPilot.Date.today().addHours(11), end: DayPilot.Date.today().addHours(14), text: "Event 1"}
      ];
      Vue.set(this.config, "events", events);
    }
  },
  mounted: function() {
    this.loadEvents();
    this.calendar.message("Welcome!");
  }
}
</script>

<style lang="scss" scoped>
</style>