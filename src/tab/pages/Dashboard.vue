<template>
  <section>
    <p>Dashboard</p>
    <router-link to="/worklogs">Worklogs</router-link>
  </section>
</template>

<script>
export default {
  data() {
    return {};
  },
  mounted() {
    const dp = new DayPilot.Calendar("dp");

    // behavior and appearance
    dp.cssClassPrefix = "calendar_white";

    // view
    dp.startDate = "2016-03-25";
    dp.days = 1;

    const e = new DayPilot.Event({
        start: new DayPilot.Date("2016-03-25T00:00:00"),
        end: new DayPilot.Date("2016-03-27T00:00:00"),
        id: DayPilot.guid(),
        text: "Event"
    });
    dp.events.add(e);
    dp.init();
  }
};
</script>

<style lang="scss" scoped>
p {
  font-size: 20px;
}
</style>
