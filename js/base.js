(function (base, settings) {
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
            spot_data = {};
            resolve();
        };
    });
    started
        .then(function () {
            var tEki = {
                    stop_id:"takaokaEki",
                    stop_name: "高岡駅",
                    stop_lat: "36.741677",
                    stop_lon: "137.014932"
                },
                takaokaEki = new google.maps.Marker({
                    position: {
                        lat: parseFloat(tEki.stop_lat),
                        lng: parseFloat(tEki.stop_lon)
                    },
                    title: tEki.stop_name,
                    map: map
                });
            spot_data[tEki.stop_id] = {id:tEki.stop_id,marker:takaokaEki,data:tEki};
            var sTEki = {
                    stop_id:"shinTakaokaEki",
                    stop_name:"新高岡駅",
                    stop_lat:"36.726908",
                    stop_lon:"137.011975"
                },
                shinTakaokaEki = new google.maps.Marker({
                    position: {
                        lat: parseFloat(sTEki.stop_lat),
                        lng: parseFloat(sTEki.stop_lon)
                    },
                    title: steki.stop_name,
                    map: map
                });
            spot_data[sTEki.stop_id] = {id:sTEki.stop_id,mrker:shinTakaokaEki,data:sTEki};

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
                spot_data[row.stop_id] = {id:row.stop_id,marker:marker,info:info,data:row};
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