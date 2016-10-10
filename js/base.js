(function (base, settings, $) {
    "use strict";
    /** マップオブジェクト */
    var map = null;
    /** 場所管理用データ */
    var spot_data = null;
    /**
     * 読み込み函数
     * @param url 読み込みファイルURL
     * @return Promise<string> 読み込んだデータ
     */
    var reader = function (url) {
        return new $.Deferred(function (deferred) {
            var xhr = new XMLHttpRequest();
            xhr.addEventListener("loadend", function (e) {
                if (xhr.status === 200)
                    deferred.resolve(xhr.response);
                else
                    deferred.reject(new Error(xhr.statusText));
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
    var getCsv = reader(settings.SPOT.FILE_PATH).then(csvResponseToRows);
    /** 初動完了Promise<> これが完了していると 変数:map に値が設定される。 */
    var started = new $.Deferred(function (deferred) {
            base[settings.CALLBACK_FUNCTION_NAME] = function () {
                map = new google.maps.Map(document.getElementById("map-main"), {
                    center: settings.DEFALUT_CENTER,
                    zoom: 14
                });
                deferred.resolve();
            };
        })
        .then(function () {
            spot_data = {};
            var tEki = {
                stop_id: "takaokaEki",
                stop_name: "高岡駅",
                stop_lat: "36.741677",
                stop_lon: "137.014932"
            };
            spot_data[tEki.stop_id] = {
                id: tEki.stop_id,
                /*marker: new google.maps.Marker({
                    position: {
                        lat: parseFloat(tEki.stop_lat),
                        lng: parseFloat(tEki.stop_lon)
                    },
                    title: tEki.stop_name,
                    map: map
                }),*/
                data: tEki
            };
            var sTEki = {
                stop_id: "shinTakaokaEki",
                stop_name: "新高岡駅",
                stop_lat: "36.726908",
                stop_lon: "137.011975"
            };

            spot_data[sTEki.stop_id] = {
                id: sTEki.stop_id,
                /*marker: new google.maps.Marker({
                    position: {
                        lat: parseFloat(sTEki.stop_lat),
                        lng: parseFloat(sTEki.stop_lon)
                    },
                    title: sTEki.stop_name,
                    map: map
                }) ,*/
                data: sTEki
            };

            //infoWindow
            var tInfoWindow = new google.maps.InfoWindow({
                content: '高岡駅',
                position: {
                    lat: parseFloat(tEki.stop_lat),
                    lng: parseFloat(tEki.stop_lon)
                }
            });
            var sInfoWindow = new google.maps.InfoWindow({
                content: '新高岡駅',
                position: {
                    lat: parseFloat(sTEki.stop_lat),
                    lng: parseFloat(sTEki.stop_lon)
                }
            });
            tInfoWindow.open(map);
            sInfoWindow.open(map);

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
                if (isNaN(lat) || isNaN(lng)) return;
                zoneId = isNaN(zoneId) ? 0 : zoneId - 1;
                var marker = new google.maps.Marker({
                    position: {
                        lat: lat,
                        lng: lng
                    },
                    title: row.stop_name,
                    icon: settings.SPOT.ICONS[zoneId],
                    map: map
                });
                var info = new google.maps.InfoWindow({
                    content: "<strong>" + row.stop_name + "</strong><p>" + row.stop_desc + "</p>"
                });
                google.maps.event.addListener(marker, 'click', function () {
                    info.open(map, marker);
                });
                spot_data[row.stop_id] = {
                    id: row.stop_id,
                    marker: marker,
                    info: info,
                    data: row
                };
            })
        })
        .fail(function (e) {
            console.error(e);
        })
        .promise();
    // 仮の初期化
    base[settings.BASE_OBJECT_NAME] = {
        map: null,
        spot_data: [],
        started: started
    };
    started.then(function () {
        // started 以降は初期化する
        base[settings.BASE_OBJECT_NAME].map = map;
        base[settings.BASE_OBJECT_NAME].spot_data = spot_data;
    });
})(window, {
    CALLBACK_FUNCTION_NAME: "initMap",
    DEFALUT_CENTER: {
        lat: 36.735617,
        lng: 137.010474
    },
    SPOT: {
        ICONS: [
            "./img/spot1.png",
            "./img/spot2.png",
            "./img/spot3.png",
            "./img/spot4.png",
            "./img/spot5.png",
            "./img/spot6.png",
            "./img/spot7.png",
            "./img/bus-stop0.png",
        ],
        FILE_PATH: "./csv/takaoka_spot_utf-8.csv"
    },
    BASE_OBJECT_NAME: "shinTakaoka"
}, jQuery);