(function (base, settings) {
    "use strict";
    /** マップオブジェクト */
    var map = null;
    /**
     * 読み込み函数
     * @param url 読み込みファイルURL
     * @return Promise<string> 読み込んだデータ
     */
    var reader = function (url) {
        return new Promise(function (resolve, reject) {
            var xhr = new XMLHttpRequest()
            xhr.addEventListener("loadend", function (e) {
                console.log(arguments);
                if (xhr.status === 200)
                    resolve(xhr.response);
                else
                    reject(new Error(xhr.statusText));
            }, false);
            xhr.open("GET", url);
            xhr.send();
        });
    };
    /**
     * Promise<string> → Promise<rows>
     * @param responseText
     * @return Promise<rows> csvデータ表現
     */
    var csvResponseToRows = function (response) {
            var header,
                texts = response,
                rows = texts.split("\n")
                .map(function (rowText, i) {
                    if (!header) {
                        return header = rowText.replace(/\r$/m, "").split(",")
                            .map(function (colText) {
                                console.log(colText);
                                return colText.replace(/(^["]|["]$)/m, "").replace(/["]["]/, "\"");
                            });
                    }
                    return rowText.replace(/\r$/m, "").split(",")
                        .reduce(function (body, colText, i) {
                            return body[header[i]] = colText.replace(/(^["]|["]$)/m, "").replace(/["]["]/, "\""), body;
                        }, {});
                });
            rows.shift();
            return {
                header: header,
                body: rows
            };
        }
        /** データの読み込み Promise<rows> */
    var getCsv = reader(settings.SPOT.FILE_PATH).then(csvResponseToRows)
        .catch(function (e) {
            console.error(e);
        });
    /** 初動完了Promise<> これが完了していると 変数:map に値が設定される。 */
    var started = new Promise(function (resolve, reject) {
        base[settings.CALLBACK_FUNCTION_NAME] = function () {
            map = new google.maps.Map(document.getElementById("map-main"), {
                center: settings.DEFALUT_CENTER,
                zoom: 14
            });
            resolve();
        };
    });
    started
        .then(function () {
            var takaokaEki = new google.maps.Marker({
                position: {
                    lat: 36.741677,
                    lng: 137.014932
                },
                title: "高岡駅",
                map: map
            });
            var shinTakaokaEki = new google.maps.Marker({
                position: {
                    lat: 36.726908,
                    lng: 137.011975
                },
                title: "新高岡駅",
                map: map
            });

            /* // 位置調整を仕込もうとしているが失敗している。
            var bounds = new google.maps.LatLngBounds(takaokaEki.getPosition(), shinTakaokaEki.getPosition());
            console.log(bounds);
            var ret = map.fitBounds(bounds);
            console.log(ret);*/
            return getCsv;
        })
        .then(function (rows) {
            rows.body.forEach(function (row) {
                var lat = parseFloat(row.stop_lat),
                    lng = parseFloat(row.stop_lon),
                    zoneId = parseInt(row.zone_id);
                console.log(row.stop_name, " ", lat, " ", lng," ",row.zone_id);
                if (isNaN(lat) || isNaN(lng)) return;
                zoneId = isNaN(zoneId)? 0:zoneId-1;
                var marker = new google.maps.Marker({
                    position: {
                        lat: lat,
                        lng: lng
                    },
                    title: row.stop_name,
                    icon:settings.SPOT.ICONS[zoneId],
                    map: map
                });
                var info = new google.maps.InfoWindow({
                    content: "<strong>" + row.stop_name + "</strong><p>" + row.stop_desc + "</p>"
                });
                google.maps.event.addListener(marker, 'click', function () {
                    info.open(map, marker);
                });
            })
        });
})(window, {
    CALLBACK_FUNCTION_NAME: "initMap",
    DEFALUT_CENTER: {
        lat: 36.735617,
        lng: 137.010474
    },
    SPOT:{
        ICONS:[
            "./img/bus_stop0.png",
            "./img/bus_stop1.png",
            "./img/bus_stop2.png",
            "./img/bus_stop3.png",
            "./img/bus_stop4.png",
            "./img/bus_stop5.png",
            "./img/bus_stop6.png"
        ],
        FILE_PATH: "./csv/takaoka_spot_utf-8.csv"
    }
});