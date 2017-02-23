/**
 * Die Funktionalität der Seite
 *
 * @author Christoph Dimmler
 * @version 1.03
 */

$(function () {
    // ### Funktionen welche beim Ausführen des Skriptes ausgeführt werden (Ähnlich Dokument.ready)
    var isLogged = executeAjax('/logged', 'GET', 'json', '', false)
    // ### Wenn der Bentuzer beim Laden der Seite nicht eingeloggt ist wird der Login-Dialog aufgerufen
    if (isLogged == false) {
        setDialog();
    }
    else {
        initPageContent();
    }

    // ### Erstellen des Menüs auf der Seite, der HTML Part ist auf der Seite, die Funktionalität wird hier hinzugefügt über die Tags
    var menu = $('#menu');
    menu.menu({
        select: function (event, ui) {
            var item = (ui.item.children().attr('tag'));
            if (item == 'item_1') {
                initPageContent($("#typeInput").val());
            }
            else if (item == 'item_2') {
                $("#typeInput").val("");
                initPageContent();
            }
            else if (item == 'item_3') {
                setDialog();
            }
            else if (item == 'item_4') {
                logout();
            }
            ;
        }
    });

    // ### Erstellen des Logout Dialoges, der eigentliche HTML Inhalt liegt auf der Seite, über JQuery wird hier ein modaler Dialog generiert, Achtung: Durch autoOpen false wird nur der
    // Dialog generiert aber noch nicht angezeigt - erst doch Dialog.show auf das Element wird er eingeblendet

    $("#logout-dialog").dialog({
        autoOpen: false,
        modal: true,
        buttons: {
            Ok: function () {
                $(this).dialog("close");
            }
        },
        show: {
            effect: "fold",
            duration: 500
        },
        hide: {
            effect: "fold",
            duration: 500
        }
    });

    //### Der Dialog wird als modaler Dialog mit Form-Elementen zur Eingabe später erzeugt (Da ist noch etwas Logik drin für die Länge und Regex auf Inhalt)
    // der Call wird an der Stelle nur aufgerufen um den HTML Part zum Dialog zu machen und nicht auf der Seite anzuzeigen!
    $("#login-form").dialog({
        autoOpen: false,
    });

    $("#createLog").dialog({
        autoOpen: false,
    });
});

function logout() {
    //### Wenn ein benutzer angemeldet ist, wird an den Server die Anfrage zum Logout geschickt
    if (executeAjax('/logged', 'GET', 'json', '', false)) {
        executeAjax('/logout', 'POST', 'text', '', false);
        //### Anzeige des Abgemeldet Dialoges
        $("#logout-dialog").dialog("open");
    }
    //### Initialisieren der Seite
    initPageContent();
};

// ### 'Klasse' UserInfo (Es gibt keine wirklichen Klassen unter JavaScript)
var userInfo = {
    name: "",
    pw: "",
    isLogged: function() {
        return this.name.length > 0;
    },
    getBasicInfo: function () {
        return this.name + ':' + this.pw;
    }
}

// ### Login-Dialog, auf diesem gibt es 2 Felder welche mit einer gewissen Logik auf Inhalt und Länge überprüft werden.
function setDialog() {
    var dialog, form,
        name = $("#name"),
        password = $("#password"),
        allFields = $([]).add(name).add(password),
        tips = $(".validateTips");

    function updateTips(t) {
        tips
            .text(t)
            .addClass("ui-state-highlight");
        setTimeout(function () {
            tips.removeClass("ui-state-highlight", 1500);
        }, 500);
    }

    function checkLength(o, n, min, max) {
        if (o.val().length > max || o.val().length < min) {
            o.addClass("ui-state-error");
            updateTips("Die Länge des Feldes " + n + " muss zwischen " +
                min + " und " + max + "zeichen betragen.");
            return false;
        } else {
            return true;
        }
    }

    function loginUser() {
        var valid = true;
        allFields.removeClass("ui-state-error");

        // ### Abfrage Länge
        valid = valid && checkLength(name, "username", 3, 16);
        valid = valid && checkLength(password, "password", 3, 16);

        if (valid) {
            var fLogin = executeAjax('/login', 'POST', 'text', {
                "name": name.val(),
                "password": password.val()
            }, false)

            if (fLogin) {
                // ### Wenn eingelogt wird später für die Authentifizierung die User-Klasse befüllt.
                userInfo.name = name.val();
                userInfo.pw = password.val();
                dialog.dialog("close");
            }
            else {
                // ### Bei einem falschen Login wird dem Dialog eine Klasse angefügt (Input Felder rot hinterlegt)
                password.addClass("ui-state-error");
                updateTips("Unbekannter Benutzer oder falsches Passwort");
                valid = !valid;
            }
        }
        else {
            password.addClass("ui-state-error");
            updateTips("Benutzername und Password müssen zwischen 3 und 16 Zeichen lang sein");
            valid = !valid;
        }

        if (valid)
            initPageContent();
    }

    // ### Erzeugt den Login-Dialog, die Funktionen erklären sich von selbst...
    dialog = $("#login-form").dialog({
        autoOpen: false,
        height: 300,
        width: 350,
        modal: true,
        buttons: {
            "Anmelden": loginUser,
            Abbrechen: function () {
                dialog.dialog("close");
            }
        },
        close: function () {
            // ### Beim Schließen werden die Inhalte auf dem Dialog zurückgesetzt
            form[0].reset();
            allFields.removeClass("ui-state-error");
        },
        show: {
            effect: "fold",
            duration: 500
        },
        hide: {
            effect: "fold",
            duration: 500
        }
    });

    form = dialog.find("form").on("submit", function (event) {
        // ### Fängt Key-Enter ab
        event.preventDefault();
        loginUser();
    });

    $("#login-form").dialog("open");
}

// ### Funktionalität ähnlich Login-Dialog...
function showCreateLog() {
    var dialog, form,
        type = $("#type"),
        msg = $("#msg"),
        allFields = $([]).add(type).add(msg),
        tips = $(".validateTips");

    function updateTips(t) {
        tips
            .text(t)
            .addClass("ui-state-highlight");
        setTimeout(function () {
            tips.removeClass("ui-state-highlight", 1500);
        }, 500);
    }

    function checkLength(o, n, min, max) {
        if (o.val().length > max || o.val().length < min) {
            o.addClass("ui-state-error");
            updateTips("Die Länge des Feldes " + n + " muss zwischen " +
                min + " und " + max + "zeichen betragen.");
            return false;
        } else {
            return true;
        }
    }

    function createLog() {
        var valid = true;
        allFields.removeClass("ui-state-error");

        valid = valid && checkLength(type, "type", 1, 32);
        valid = valid && checkLength(msg, "message", 1, 255);

        if (valid) {
            var fCreateLog = executeAjax('/log', 'POST', 'json', {
                "type": type.val(),
                "msg": msg.val(),
                "time": new Date()
            }, false)

            if (fCreateLog) {
                dialog.dialog("close");
            }
            else {
                msg.addClass("ui-state-error");
                updateTips("Fehler beim Erstellen des Eintrags");
                valid = !valid;
            }
        }
        else {
            msg.addClass("ui-state-error");
            updateTips("Typ und Nachricht müssen zwischen 3 und 16 Zeichen lang sein");
            valid = !valid;
        }

        if (valid)
            initPageContent();
    }

    dialog = $("#createLog").dialog({
        autoOpen: false,
        height: 300,
        width: 350,
        modal: true,
        buttons: {
            Erstellen: function () {
                createLog();
            },
            Abbrechen: function () {
                dialog.dialog("close");
            }
        },
        close: function () {
            form[0].reset();
            allFields.removeClass("ui-state-error");
            initPageContent();
        },
        show: {
            effect: "fold",
            duration: 500
        },
        hide: {
            effect: "fold",
            duration: 500
        }
    });

    form = dialog.find("form").on("submit", function (event) {
        event.preventDefault();
        createLog();
    });

    dialog.dialog("open");
}

function initPageContentEx(filterText) {
    var userList = executeAjax('/logs', 'GET', 'json');
    var listHTML = '';
    $.each(userList, function (index, M) {
        listHTML += '<table>';
        var d = new Date(M.time).toLocaleString();
        if (filterText != null && filterText.length > 0) {
            if (M.type.toUpperCase() === filterText.toUpperCase()) {
                listHTML += '<tr>' + '<td> ' + M.type + ' </td>' + '<td> ' + d + ' </td>' + '<td> ' + M.msg + ' </td>' + '</tr>';
            }
        }
        else {
            listHTML += '<tr>' + '<td> ' + M.type + ' </td>' + '<td> ' + d + ' </td>' + '<td> ' + M.msg + ' </td>' + '</tr>';
        }
        listHTML += '</table>';
    });
    $('#dataBody').html(listHTML);
    $("#page-content").show();
}

function initPageContent(filterText) {
    // ### Holt sich die Liste der Logs vom Server, die Anfrage wird Base64 decodiert! (Letzter Parameter true)
    var logList = executeAjax('/logs', 'GET', 'json', '', true);
    var table = document.getElementById('dataBody');
    table.innerHTML = "";

    $.each(logList, function (index, M) {
        if (filterText != null && filterText.length > 0) {
            if (M.type.toUpperCase() === filterText.toUpperCase()) {
               addTableRow(table, M);
            }
        }
        else {
            addTableRow(table, M);
        }
    });
    addCreateNewRow(table);
}

// ### Erzeugt die Listenspalten: "Type, Zeit, Nachricht, und das Löschen 'X')"
function addTableRow(table, M) {
    var tr = document.createElement('tr');
    var d = new Date(M.time).toLocaleString();
    addTableData(tr, M.type);
    addTableData(tr, d);
    addTableData(tr, M.msg);
    addTableButton(tr, "x", "w3-red", function() {executeAjax('/log/' + M._id, 'DELETE', 'json', '', false);});
    table.appendChild(tr);
}

// ### Setzt jeder Spalte die Daten und fügt sie der Row hinzu
function addTableData(tr, data) {
    var td = document.createElement('td');
    td.textContent = data;
    tr.appendChild(td);
}

var trData;
var trPrevData;
// ### Erzeugt den Löschen Knopf hinter jeder Spalte
function addTableButton(tr, text, colorClass, actionAfter) {
    var tdBtn = document.createElement('span');
    tdBtn.textContent = text;
    tdBtn.setAttribute("class", "w3-btn-floating w3-transparent w3-ripple")
    tdBtn.addEventListener('click', function () {
        var counter = 0;
        if (trData == tr) {
            clearInterval(interval);
            tr.remove();
            actionAfter();
        }
        else {
            trPrevData = trData;
            trData = tr;
            $(tr).toggleClass(colorClass, 200,"easeOutSine");
            var interval = setInterval(function() {
                counter++;
                if (counter == 2) {
                    trData = null;
                    tdBtn.textContent = text;
                    tr.setAttribute("class", "")
                    clearInterval(interval);
                }
            }, 1000);
            if (trPrevData != null) trPrevData.setAttribute("class", "")
        }
    });
    tr.appendChild(tdBtn);
}

// ### Erzeugt die Hinzufügen Spalte
function addCreateNewRow(table) {
    var tr = document.createElement('tr');
    addTableButton(tr, "+", "w3-blue", function() { showCreateLog(); });
    addTableData(tr, "");
    addTableData(tr, "");
    addTableData(tr, "");
    table.appendChild(tr);
}

// ### Erzeugt den Seiteninhalt und übergibt der Liste den Wert des Typ-Filters
function filterList() {
    initPageContent($('#typeInput').val())
}

/**
 * Globaler AJAX-Call zur Kommunikation mit dem Server, jegliche Inhalte werden hierrüber abgerufen oder übermittelt
 * @param Link des Aufrufs auf dem Server - Bsp: 'http://localhost:8082/log/'
 * @param Art des Aufrufes, bswp. GET oder POST
 * @param Zu übermittelnder oder erwarteter Datentyp, bswp. json oder text
 * @param An den Server zu übergebende Daten im Json-Format
 * @param Gibt an, ob der AJAX-Call die Anfrage Base64 kodieren soll
 * @returns Gibt die Daten zurück, im Falle eines fehlgeschlagenen Aufrufes wird null zurückgegeben.
 */
function executeAjax(url, method, type, data, encode) {
    var returnValue;
    $.ajax({
        url: url,
        method: method,
        async: false,
        data: data,
        dataType: type,
        headers: {
            "Accept": "application/json"
        },
        beforeSend: function (xhr) {
            if (userInfo.isLogged() && encode) {
                alert(encode);
                xhr.setRequestHeader ("Authorization", "Basic " + btoa(userInfo.getBasicInfo()));
            }
        },
        success: function (data) {
            returnValue = data;
        },
        error: function (ex, textStatus, errorThrown) {
            returnValue = null;
            //alert('Error: ' + errorThrown + '\nT-Status: ' + textStatus + '\nSrvStatus: ' + ex.status + '\nException: ' + ex.responseText);
        }
    })

    if (returnValue != null) {
        try {
            returnValue = JSON.parse(returnValue);
        }
        catch (e) {
        }
    }
    return returnValue;
}