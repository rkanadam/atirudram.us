(function ($){
$(function () {

    window.AppStore = {
        worksheets: {
            all: null,
            leads: null,
            ritwiks: null
        },

        $ritwik : null,
        $lead: null
    };

    var Store = window.AppStore;

    var apiURL = window.location.href.indexOf("localhost") !== -1 ? "http://localhost:8080/ritwik.app/api" : "http://ec2-184-72-161-106.compute-1.amazonaws.com/ritwik.app/api";
    //var apiURL = "http://ec2-184-72-161-106.compute-1.amazonaws.com/ritwik.app/api/";

    $("#indicator").dialog({
        modal: true,
        autoOpen: false,
        closeOnEscape: false,
        resizable: false,
        width: 500,
        height: 65
    }).dialog("widget").find(".ui-dialog-titlebar").hide ();

    $(document).ajaxStart(function () {
       $("#indicator").dialog ('open').blur ();
    });
    $(document).ajaxStop(function () {
        $("#indicator").dialog ('close');
    });

    $.fn.filterNode = function(name) {
        return this.find('*').filter(function() {
            return this.nodeName === name;
        });
    };

    $.expr[":"].icontains = $.expr.createPseudo(function(arg) {
        return function( elem ) {
            return $(elem).text().toUpperCase().indexOf(arg.toUpperCase()) >= 0;
        };
    });
    $.expr[":"].ieq = $.expr.createPseudo(function(arg) {
        return function( elem ) {
            return $(elem).text().toUpperCase() === (arg.toUpperCase());
        };
    });



   var GOOG_PREFIX = "https://spreadsheets.google.com";
    //Load the spreadsheets
   var worksheetFeedURL = "https://spreadsheets.google.com/feeds/worksheets/tHd43HFsLLNMPPzqAiNy5cg/private/full";
    $.get(apiURL + worksheetFeedURL.substring(GOOG_PREFIX.length), {}, function (worksheets) {
        Store.worksheets.all = worksheets;
        var leadsListFeedUrl = $("entry:icontains('Lead') link[rel='http://schemas.google.com/spreadsheets/2006#listfeed']", worksheets).attr("href");
        $.get(apiURL + leadsListFeedUrl.substring(GOOG_PREFIX.length), {}, function (listFeed) {
            Store.worksheets.leads = listFeed;
            var $leadTable = $("#leadTable");
            $leadTable.find("tbody").empty();
            $("entry", listFeed).each(function () {
                    var row = this;
                    var $tr = $("<tr/>").appendTo($leadTable);
                    $(["area", "leadname", "email", "phonenumber"]).each(function () {
                        var col = this.toString ();
                        var value = $(row).filterNode("gsx:" + col).text();
                        $("<td/>").appendTo($tr).text(value);
                    })
                });
        });
    });

   //Login Page
    $("form").submit (function (e) {
        e.preventDefault ();
        var email = $("input[name=email]").val ();
        var password = $("input[name=password]").val ();
        if (!email || !password) {
            alert("Please enter the e-mail address and password before clicking submit");
            return false;
        }

        if (!Store.worksheets.ritwiks) {
            var ritwiksCellFeedUrl = $("entry:icontains('data') link[rel='http://schemas.google.com/spreadsheets/2006#listfeed']", Store.worksheets.all).attr("href");
            $.get(apiURL + ritwiksCellFeedUrl.substring(GOOG_PREFIX.length), {}, function (listFeed) {
                Store.worksheets.ritwiks = listFeed;
                login (email, password);
            });
        } else {
            login (email, password);
        }
        return false;
    });

    var login = function (email, password) {
        var xml = Store.worksheets.ritwiks;
        var $emailCell = $("entry", xml).filterNode("gsx:email").filter(":ieq('" + email + "')");
        if ($emailCell.length < 1) {
            alert ("No ritwik was found with this e-mail address. Please verify the e-mail address given.");
            return;
        }

        var $yearOfBirth = $emailCell.closest("entry").filterNode("gsx:yearofbirth").filter(":ieq('" + password + "')");
        if ($yearOfBirth.length !== 1) {
            alert ("Invalid e-mail address or year of birth. Please use the correct e-mail address and the correct year of birth ");
            return;
        }

        Store.$ritwik = $yearOfBirth.closest("entry");

        var $ritwik = Store.$ritwik;
        //Find the lead
        var leadName = $ritwik.filterNode("gsx:lead").text ();
        var $lead = $(Store.worksheets.leads).filterNode("gsx:leadname").filter(":ieq('" + leadName + "')");
        if (!$lead.length) {
            alert ("We could not locate your lead. Something is not right. Please contact pavan.jella@gmail.com or sboddupalli@gmail.com");
            return;
        }

        Store.$lead = $lead.closest("entry");

        //done now load the home page
        $(".container").load ("partials/home.html", function () {
            window.initHomePage ();
        });
    };


    window.initHomePage = function () {
        var Store = window.AppStore;
        var $lead = Store.$lead;
        var $ritwik = Store.$ritwik;

        $("#top_alert").html(["Your lead is "
            , $lead.filterNode("gsx:leadname").text()
            , ". If you are having issues or problems please contact your lead at "
            , "<a href='mailto:", $lead.filterNode("gsx:email").text()
            , "?subject=Questions about the Atirudra Mahayajna'>"
            , $lead.filterNode("gsx:email").text()
            , "</a>"
            , ", <a href='tel://", $lead.filterNode("gsx:phonenumber").text(), "'>"
            , $lead.filterNode("gsx:phonenumber").text()
            , "</a>"]
            .join("")
        );

        var states = $(Store.worksheets.ritwiks)
            .filterNode("gsx:state")
            .map(function () {
                return this.textContent;
            })
            .get ()
            .unique ()
            .sort ();
        $("[name=state]").autocomplete({
            source: states
        })
        var cities = $(Store.worksheets.ritwiks)
            .filterNode("gsx:city")
            .map(function () {
                return this.textContent;
            })
            .get ()
            .unique ()
            .sort ();
        $("[name=city]").autocomplete({
            source: cities
        })

        $("[name=dateofbirth], [name=intendeddateofarrivalmustbeonorbeforeapril29th], [name=intendeddateofdeparturemustbelatemay11eveorlater]").datepicker({
            dateFormat: "m/dd/yy"
        });

        var leadName = $lead.filterNode("gsx:leadname").text();
        var ritwikName = $ritwik.filterNode("gsx:name").text ();
        var ritwikEmail = $ritwik.filterNode("gsx:email").text ();

        var $table = $("#teamTable");
        $table.empty();
        var $thead = $("<thead />").appendTo($table);
        var $tbody = $("<tbody/>").appendTo($table);
        $("input")
            .closest(".form-group")
            .find("label")
            .map(function()
                {
                    return $(this).text ();
                })
            .each(function () {
                $("<th nowrap/>").appendTo($thead).text(this);
            });

        var $columns = $("input")
            .map(function()
            {
                return $(this).attr ("name");
            });

        var $team = null;
        if (ritwikEmail.toLowerCase() === "sboddupalli@gmail.com"
            || ritwikEmail.toLowerCase() === "pavan.jella@gmail.com"
            || ritwikEmail.toLowerCase() === "raghuram.kanadam@gmail.com") {
            $team = $("entry", window.AppStore.worksheets.ritwiks);
        } else if (leadName === ritwikName) {
            $team = $(window.AppStore.worksheets.ritwiks).filterNode("gsx:lead").filter(":ieq('" + leadName + "')").closest("entry");
        } else {

            $team = $([$ritwik.get(0)]);

            //get the spouse information
            var spouseName = $ritwik.filterNode("gsx:spousename").text();
            if (spouseName) {
                var $spouse = $(Store.worksheets.ritwiks).filterNode("gsx:name").filter(":ieq('" + spouseName + "')").closest("entry");
                if ($spouse.length) {
                    $team = $([$ritwik.get(0), $spouse.get(0)]);
                }
            }
        }

        var newTeam = $team.get().sort(function (a, b) {
            var aName = $(a).filterNode("gsx:name").text().toLowerCase();
            var bName = $(b).filterNode("gsx:name").text().toLowerCase();
            return aName === bName ? 0 : (aName < bName ? -1 : 1);
        });

        $(newTeam).each (function () {
           var $row = $(this);
           var $tr = $("<tr/>").appendTo($tbody);
           $columns.each(function () {
              var columnName = this;
               $("<td nowrap/>").appendTo($tr).text($row.filterNode("gsx:" + columnName).text ());
           });
        });

        $table.on("click", "tr", function () {
           var name = $(this).find("td").get(0).textContent;
           //find a ritwik with this name and load his value;
           $ritwik = $(Store.worksheets.ritwiks).filterNode("gsx:name").filter(":ieq('" + name + "')").closest("entry")
           window.AppStore.$ritwik = $ritwik;
           loadRitwik ($ritwik);
        });

        $("#ritwikForm").submit(function (e) {
            e.preventDefault ();
            var $clone = window.AppStore.$ritwik.clone();

            //populate the clone with new data
            $clone.children().each(function () {
                var prefix = this.prefix;
                if (prefix !== "gsx") {
                    return;
                }

                var value = this.textContent;

                var $field = $("[name='" + this.nodeName.substring(prefix.length + 1) + "']");
                if ($field.length) {
                    this.textContent = $field.val();
                }
            });

            var xml = window.ActiveXObject && $clone.get(0).xml ? $clone.get(0).xml : (new XMLSerializer()).serializeToString($clone.get (0));
            var editURL = $clone.find("link[rel='edit']").attr("href");
            $.ajax(apiURL + editURL.substring(GOOG_PREFIX.length), {
                    method: "POST",
                    data: xml,
                    success: function (response) {
                        var $newEntry = $("entry", response);
                        window.AppStore.$ritwik.replaceWith($newEntry) ;
                        window.AppStore.$ritwik = $newEntry ;
                        alert ("Your information was successfully saved");
                    },
                    error: function (response) {
                        alert ("Sorry! Could not save your information. Please let raghuram.kanadam@gmail.com know.")
                    }
                }
            );
        });

        loadRitwik($ritwik);
    }

    var loadRitwik = function($ritwik) {
        $ritwik.children().each(function () {
            var prefix = this.prefix;
            if (prefix !== "gsx") {
                return;
            }

            var value = this.textContent;

            var $field = $("[name='" + this.nodeName.substring(prefix.length + 1) + "']");
            $field.val(this.textContent);
        });

        initPaymentOptions ();
		
		initAccomodationOptions ();
    }
	
	var initAccomodationOptions = function () {
		//First compute the number of people coming
        var $ritwik = window.AppStore.$ritwik;

        var hotelName, hotelRoomNumber, homaKundaName, homaKundaSpot, homaKundaNumber, hotelRoomRate;
		
		if ($ritwik.filterNode("gsx:hotelname").text ().trim ()) {
			hotelName = $ritwik.filterNode("gsx:hotelname").text ();
			hotelRoomNumber = $ritwik.filterNode("gsx:roomnumber").text ();
			homaKundaName = $ritwik.filterNode("gsx:homakundaname").text ();
			homaKundaNumber = $ritwik.filterNode("gsx:homakundanumber").text ();
			homaKundaSpot = $ritwik.filterNode("gsx:homakundaspot").text ();
			hotelRoomRate = $ritwik.filterNode("gsx:roomrate").text ();
		} else {
			var spouseName = $ritwik.filterNode("gsx:spousename").text();
			if (spouseName) {
				var $spouse = $(Store.worksheets.ritwiks).filterNode("gsx:name").filter(":ieq('" + spouseName + "')").closest("entry");
				if ($spouse.length) {
					hotelName = $spouse.filterNode("gsx:hotelname").text ();
					hotelRoomNumber = $spouse.filterNode("gsx:roomnumber").text ();
					homaKundaName = $spouse.filterNode("gsx:homakundaname").text ();
					homaKundaNumber = $spouse.filterNode("gsx:homakundanumber").text ();
					homaKundaSpot = $spouse.filterNode("gsx:homakundaspot").text ();
					hotelRoomRate = $spouse.filterNode("gsx:roomrate").text ();
				}
			}
		}
		
		var hotels = {
			"Budget Inn": {
				"address": "990 Ga Highway 42 N, Forsyth, GA",
				"phone": "478-994-9333"
			},
			"Hilltop Garden Inn": {
				"address": "951 Ga Highway 42 N, Forsyth, GA",
				"phone": "478-994-9260"
			},
			"New Forsyth Inn": {
				"address": "130 N Frontage Rd, Forsyth, GA",
				"phone": "478-994-5161"
			},
			"Regency Inn": {
				"address": "325 Cabaniss Rd, Forsyth, GA",
				"phone": " 478-994-2643"
			},
			"Ramada Inn": {
				"address": "480 Holiday Cir, Forsyth, GA",
				"phone": "478-994-5691"
			},
		};
		$("#hotelName").text(hotelName);
		var hotel = hotels[hotelName];
		if (hotel) {
			$("#hotelAddress").text(hotel.address);
			$("#hotelPhoneNumber").text(hotel.phone);
			$("#hotelRoomRate").text(hotelRoomRate);
		} else {
            $("#hotelAddress").text("");
            $("#hotelPhoneNumber").text("");
            $("#hotelRoomRate").text("");
        }
		$("#hotelRoomNumber").text(hotelRoomNumber);
		$("#homaKundaName").text(homaKundaName);
		$("#homaKundaNumber").text(homaKundaNumber);
		$("#homaKundaSpot").text(homaKundaSpot);
	}

    var initPaymentOptions = function () {

        //First compute the number of people coming
        var $ritwik = window.AppStore.$ritwik;

        var ritwik = {
           name: $ritwik.filterNode("gsx:name").text (),
           age: parseInt($.trim($ritwik.filterNode("gsx:ritwikage").text ())),
           accommodationPaymentStatus: $.trim($ritwik.filterNode("gsx:accommodationpaymentstatus").text ())
        };
        var spouse = null;
        var isSpouseARitwik = false;
        var spouseName = $ritwik.filterNode("gsx:spousename").text();
        if (spouseName) {
            var $spouse = $(Store.worksheets.ritwiks).filterNode("gsx:name").filter(":ieq('" + spouseName + "')").closest("entry");
            if ($spouse.length) {
                isSpouseARitwik = true;
                spouse = {
                    name: $spouse.filterNode("gsx:name").text (),
                    age: parseInt($.trim($spouse.filterNode("gsx:ritwikage").text ())),
                    accommodationPaymentStatus: $.trim($spouse.filterNode("gsx:accommodationpaymentstatus").text ())
                };
            } else {
                isSpouseARitwik = false;
                spouse = {
                    name: spouseName,
                    age: parseInt($.trim($ritwik.filterNode("gsx:spouseage").text ())),
                    accommodationPaymentStatus: $.trim($spouse.filterNode("gsx:spouseaccommodationpaymentstatus").text ())
                };
            }
        }

        var people = [];
        var totalOthers = 0;
        for (var i = 1; i <= 5; ++i) {
            var name = $.trim($ritwik.filterNode ("gsx:otheradult" + i + "name").text ());
            var age = parseInt($.trim($ritwik.filterNode ("gsx:otheradult" + i + "age").text ()));
            var accommodationPaymentStatus =  $.trim($ritwik.filterNode("gsx:otheradult" + i + "accommodationpaymentstatus").text ());

            if (name) {
                totalOthers++;
                people.push ({
                    name: name,
                    age: age,
                    accommodationPaymentStatus: accommodationPaymentStatus
                });
            }
        }

        var $tbody = $("#accommodation_options tbody");
        $tbody.empty ();

        var insertGuest = function (guest, ritwik) {
            if (!guest) {
                return;
            }
            var $row = $("<tr/>").appendTo($tbody);
            $("<td/>").appendTo($row).text(guest.name);
            if (guest.age <= 12) {
                $("<td/>").appendTo($row).text("Children stay free");
            } else {
                if (guest.accommodationPaymentStatus) {
                    $("<td/>").appendTo($row).text(guest.accommodationPaymentStatus);
                } else {
                    var $select = $("<select><option value='TENT-ONSITE'>Tent - Onsite (250 USD$)</option><option value='RV-ONSITE'>RV - Onsite (500 USD$)</option></select>");
                    $("<td/>").append($select).appendTo($row);
                    if (!ritwik && (!guest.age || guest.age >= 18)) {
                        $("<option value='HOTEL-OFFSITE'>Hotel - OFFSITE</option>").appendTo($select);
                    }
                }
            }
            if (guest.age) {
                $("<td/>").appendTo($row).text(guest.age);
            } else {
                $row.append("<td>&nbsp;</td>");
            }
        }

        insertGuest(ritwik, true);
        insertGuest(spouse, isSpouseARitwik);

        $(people).each(function () {
            insertGuest(this);
        });
        
        var updateTotal = function () {
            var value = 0;
            var hoteliers = 0;
            var ritwikNameToSelection = {};
            $tbody.find("select").each(function () {
                var selection = $(this).val ();
                var ritwikName = $.trim ($(this).closest("tr").find("td").first ().text ());
                ritwikNameToSelection[ritwikName] = selection;
                switch(selection) {
                    case "TENT-ONSITE":
                        value += 0.01;
                        break;
                    case "RV-ONSITE":
                        value += 0.02;
                        break;
                    case "HOTEL-OFFSITE":
                        hoteliers++;
                        break;
                }
            });
            var noOfHotelRooms = hoteliers <= 0 ? 0 : Math.max(1, parseInt(hoteliers / 3));
            value += 0.03 * noOfHotelRooms ;//* 40 * 11; //put 3 people in one room, 40 bucks a night for 11 days
            $("#accommodationPaypalForm")
                .find("[name=amount]")
                .val(value);

            $("#accommodationAmount").val(value);
            $("#accomodationAmountLabel").html(format("##,###.##", value) + " US$");

            var description = [""];
            for (var ritwikName in ritwikNameToSelection) {
                description.push(" ");
                description.push($.trim(ritwikName));
                description.push("(");
                description.push(ritwikNameToSelection[ritwikName][0]);
                description.push(")");
            }
            description.push(".Rooms: ");
            description.push(noOfHotelRooms);
            $("#accommodationPaypalForm")
                .find("[name=item_name]")
                .val(description.join(""));
        };
        
        $tbody.append('<tr>' +
            '<td>Total</td>' +
            '<td colspan="2"><div class="label label-info" style="font-size: 125%"><span id="accomodationAmountLabel"></span></div></td>' +
            '</tr>');

        $tbody.find("select").change(updateTotal);

        $("#accommodationPaymentButton").off("click").on("click", function () {
           $("#accommodationPaypalForm").submit ();
        });

        updateTotal ();
    }
})
})(jQuery);

Array.prototype.unique = function() {
    var u = {}, a = [];
    for(var i = 0, l = this.length; i < l; ++i){
        if(u.hasOwnProperty(this[i])) {
            continue;
        }
        a.push(this[i]);
        u[this[i]] = 1;
    }
    return a;
};