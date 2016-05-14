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

        var apiLocation = document.location.hostname == "localhost" ? "http://localhost:8080/api/kauai" : "http://atirudram-us-php.appspot.com/api/kauai";


        $("#loginForm").submit(function (e) {
            e.preventDefault();
            var email = $("[name=email]").val();
            var password = $("[name=password]").val();
            $.post(apiLocation, $(this).serialize(), function (records) {
                if (records === false) {
                    alert("Uh-oh sorry your login failed. Please try again.");
                } else {
                    $.get("registrants.html", "", function (html) {
                        $(".content").html(html);
                        $("[name=arrival], [name=departure]").closest(".input-group").datetimepicker().click(function () {
                            $(this).data("DateTimePicker").show();
                        });

                        $(".familyMember").each(function (index) {
                            if (index >= records.length) {
                                return false;
                            }
                            var $this = $(this);
                            var record = records[index];
                            for (var key in record) {
                                $this.find("[name=" + key + "]").val(record[key]);
                            }
                        });

                        var commonProperties = ["address", "doyouhavearentalcar"];
                        _.each(commonProperties, function (commonProperty) {
                            var values = _.where(records, function (r) {
                                return r[commonProperty];
                            });
                            if (values && values.length) {
                                $("[name=" + commonProperty + "]").val(values[0][commonProperty]);
                            }

                        });

                        $("#accommodationForm").submit(function (e) {
                            e.preventDefault();
                            var submission = {"email": email, "password": password};

                            var records = [];
                            $(".familyMember").each(function () {
                                var $input = $(this).find(":input");
                                if (!$input.first().val()) {
                                    return false;
                                }
                                var record = {};
                                $input.each(function () {
                                    var name = $(this).attr("name");
                                    record[name] = $(this).val();
                                });
                                records.push(record);
                            });

                            //Now put all the common properties
                            _.each(records, function (record) {
                                _.each(commonProperties, function (commonProperty) {
                                    record[commonProperty] = $("[name=" + commonProperty + "]").val();
                                });
                                record.primary = email;
                            });

                            submission.entries = JSON.stringify(records);
                            submission.action = "put";
                            $.post(apiLocation, submission, function (response) {
                                if (response === true) {
                                    alert("Successfully saved your information. Sairam");
                                } else {
                                    alert("Uh-oh sorry could not save your information. Please try again.");
                                }
                            }, "json");
                        });
                    }, "html");
                }
            }, "json");
            return false;
        });

    })
})(jQuery);