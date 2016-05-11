(function ($) {
    $(function () {

        $("#indicator").modal({
            keyboard: false,
            show: false,
            backdrop: "static"
        });

        $(document).ajaxStart(function () {
            $("#indicator").modal('show');
        });
        $(document).ajaxStop(function () {
            $("#indicator").modal('hide');
        });

        var store = window.sessionStorage;

        var apiLocation = document.location.hostname == "localhost" ? "http://localhost:8080/api/kauai/login" : "http://atirudram-us-php.appspot.com/api/kauai/login";


        $("#loginForm").submit(function (e) {
            e.preventDefault();
            $.post(apiLocation, $(this).serialize(), function (records) {
                if (records === false) {
                    store.hasLoggedIn = false;
                    alert("Uh-oh sorry your login failed. Please try again.");
                } else {
                    store.hasLoggedIn = true;
                    store.records = records;
                    $.get("registrants.html", "", function (html) {
                        $(".content").html (html);
                        $("#arrival, #departure").datetimepicker ().click (function () {
                            $(this).data ("DateTimePicker").show ();
                        });
                    }, "html");
                }
            }, "json");
            return false;
        });

    })
})(jQuery);