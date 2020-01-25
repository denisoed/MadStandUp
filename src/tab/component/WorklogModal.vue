<template>
  <form action="">
    <div class="modal-card" style="width: auto">
      <header class="modal-card-head">
        <p class="modal-card-title">New worklog</p>
      </header>
      <section class="modal-card-body">
        <b-field label="Text"
          :label-position="labelPosition">
          <b-input maxlength="200" type="textarea"></b-input>
        </b-field>
      </section>
      <footer class="modal-card-foot">
        <button class="button" type="button" @click="$parent.close()">Close</button>
        <button class="button is-primary">Add</button>
      </footer>
    </div>
  </form>
</template>

<script>
export default {
  name: 'WorklogModal',
  data() {
    return {
      labelPosition: 'on-border'
    };
  }
};
</script>
