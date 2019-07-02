import {
    generateStandUp,
    get_date
} from './api.js';

$(document).ready(function () {

    $('[data-toggle="datepicker"]').val(get_date());

    $('[data-toggle="datepicker"]').datepicker({
        format: 'yyyy-mm-dd',
        date: get_date(),
        endDate: new Date()
    });

    // -------------- Generate StandUp ---------------- //
    $('#getStandup').on('click', function () {
        var date = $('[data-toggle="datepicker"]').val();
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
            'Доброе утро! @comedian\n\n*Вчера*\n' + yesterday +
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