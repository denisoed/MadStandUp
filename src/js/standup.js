import handlers from './modules/handlers';
import msg from './modules/msg';
import form from './modules/form';
import runner from './modules/runner';
import $ from 'jquery';
import datepicker from "js-datepicker";
import {
    generateStandUp,
    get_date
} from './api.js';

// here we use SHARED message handlers, so all the contexts support the same
// commands. but this is NOT typical messaging system usage, since you usually
// want each context to handle different commands. for this you don't need
// handlers factory as used below. simply create individual `handlers` object
// for each context and pass it to msg.init() call. in case you don't need the
// context to support any commands, but want the context to cooperate with the
// rest of the extension via messaging system (you want to know when new
// instance of given context is created / destroyed, or you want to be able to
// issue command requests from this context), you may simply omit the
// `handlers` parameter for good when invoking msg.init()

$(document).ready(function () {

    datepicker('#datepicker', {
        formatter: (input, date) => {
            if (date != undefined) {
                input.value = date.getUTCFullYear() + '-' + ('0' + (date.getUTCMonth() + 1)).slice(-2) + '-' + ('0' + date.getDate()).slice(-2)
            }
        },
        onSelect: (instance, date) => {
            if (date == undefined) {
                $('#datepicker').val(get_date());
            }
        },
        dateSelected: new Date(get_date()),
        maxDate: new Date()
    });

    // -------------- Generate StandUp ---------------- //
    $('#getStandup').on('click', function () {
        var date = $('#datepicker').val();
        getStandUp(date);
    });

    function showStandUp(arrayText) {
        var texts = arrayText.reverse();
        var yesterday = '';
        hideLoader();
        for (let i = 0; i < texts.length; i++) {
            var comment = '';
            for (let j = 0; j < texts[i]['comments'].length; j++) {
                comment += texts[i]['comments'][j] + ' ';
            }
            yesterday += '- ' + comment.trim() + ' ' + texts[i]['link'] + '\n';
        }
        $('#standup-text').val(
            'Доброе утро!\n\n*Вчера*\n' + yesterday +
            '\n*Сегодня*\n-' +
            '\n\n*Проблемы*\n- Нет проблем!'
        );
    }

    async function getStandUp(date) {
        showLoader();
        var standup = await generateStandUp(date);
        showStandUp(standup);
    }
    // ---------- END: Generate StandUp ---------- //

    function showLoader() {
        $('#loading').show();
    }

    function hideLoader() {
        $('#loading').hide();
    }
});

form.init(runner.go.bind(runner, msg.init('standup', handlers.create('standup'))));
