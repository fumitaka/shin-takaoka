/*********************************************/
/*  LandMapクラス
/*********************************************/
var landMap = null;
function LandMap()
{      
    this.map = null;
    this.markerImages = new MakerImages();
    this.geocoder = new Geocoder();
    this.routeRequestList = null;
}
/*-------------------------------------------*/
/*  LandMap.Init 地図初期化
/*-------------------------------------------*/
LandMap.prototype.Init = function (map) {
    this.map = map;

    //境界線取得
    var border = this.getLatlngList(borderLatlngList);
    //縮尺調整
    this.fitToMap(border);
    //境界描画
    this.putLine(border, getBorderPen());
    
    //クリックイベントハンドラ
    google.maps.event.addListener(this.map, "click", function (event) {
        var lat = event.latLng.lat();
        var lng = event.latLng.lng();
        var html = $('#myconsole').html() + "\n{lat:" + lat + ",lng:" + lng + "},";
        $('#myconsole').html(html)
    });
}
/*-------------------------------------------*/
/*  LandMap.setCenter
/*-------------------------------------------*/
LandMap.prototype.setCenter = function () {
    if (arguments.length == 1) {
        var latLng = arguments[0];
        this.map.setCenter(latLng);
    }
    else if (arguments.length == 2) {
        var lat = arguments[0];
        var lng = arguments[1];
        var latLng = new google.maps.LatLng(lat, lng);
        this.map.setCenter(latLng);
    }
}
/*-------------------------------------------*/
/*  LandMap.getCenter
/*-------------------------------------------*/
LandMap.prototype.getCenter = function () {
    return this.map.getCenter();
}
/*-------------------------------------------*/
/*  LandMap.addressMatching
/*-------------------------------------------*/
LandMap.prototype.addressMatching = function (address, func) {
    this.geocoder.addressMatching(address, func);
}
/*-------------------------------------------*/
/*  LandMap.putMarker マーカー表示
/*-------------------------------------------*/
LandMap.prototype.putMarker = function (lat, lng) {
    var marker = this.createMarker(lat, lng);
    marker.setMap(this.map);
    return marker;
}
/*-------------------------------------------*/
/*  LandMap.putMarkerToMap
/*-------------------------------------------*/
LandMap.prototype.putMarkerToMap = function (marker) {
    marker.setMap(this.map);
}
/*-------------------------------------------*/
/*  LandMap.addDragEventHandlerToMarker
/*-------------------------------------------*/
//行き先マーカーのイベントハンドラ
LandMap.prototype.addDragEventHandlerToMarker = function (marker, id) {
    //ドラッグ開始イベントハンドラ
    google.maps.event.addListener(marker, 'dragstart', function (ev) {
        
    });
    //ドラッグ終了イベントハンドラ
    google.maps.event.addListener(marker, 'dragend', function (ev) {
        
    });
}
/*-------------------------------------------*/
/*  LandMap.createMarker マーカー作成
/*-------------------------------------------*/
LandMap.prototype.createMarker = function (lat, lng) {
    var marker = new google.maps.Marker({
        position: new google.maps.LatLng(lat, lng),
        draggable: true,
        raiseOnDrag: false       
    });
    return marker;
}
/*-------------------------------------------*/
/*  LandMap.setLatLngToMarker
/*-------------------------------------------*/
LandMap.prototype.setLatLngToMarker = function (marker, lat, lng) {
    marker.position = new google.maps.LatLng(lat, lng);
}
/*-------------------------------------------*/
/*  LandMap.addInfoWindowToMarker マーカーに情報ウィンドウ追加(クリックで表示）
/*-------------------------------------------*/
LandMap.prototype.addInfoWindowToMarker = function (marker, text) {
    var infoWindow = new google.maps.InfoWindow({ content: text, maxWidth:150 });
    google.maps.event.clearListeners(marker, 'click');
    google.maps.event.addListener(marker, 'click', function () {
        infoWindow.open(this.map, marker);
    });
    return infoWindow;
}
/*-------------------------------------------*/
/*  LandMap.openInfoWindowByMarker マーカーに情報ウィンドウ表示
/*-------------------------------------------*/
LandMap.prototype.openInfoWindowByMarker = function (infoWindow, marker) {
    infoWindow.open(this.map, marker);
}
/*-------------------------------------------*/
/*  LandMap.removeMarker マーカー削除
/*-------------------------------------------*/
LandMap.prototype.removeMarker = function (marker) {
    if (marker) {
        marker.setMap(null);
        marker = null;
    }
}
/*-------------------------------------------*/
/*  LandMap.setImageToMarker
/*-------------------------------------------*/
LandMap.prototype.setImageToMarker = function(marker, img){
    marker.setIcon(img);
}
/*-------------------------------------------*/
/*  LandMap.openInfoWindow 情報ウィンドウ表示
/*-------------------------------------------*/
LandMap.prototype.openInfoWindow = function (position, text) {
    var infowindow = new google.maps.InfoWindow({
        content: text,
        position: position
    });
    infowindow.open(this.map);
}
/*-------------------------------------------*/
/*  LandMap.getPosition　
/*-------------------------------------------*/
LandMap.prototype.getPosition = function () {
    if (arguments.length == 1) {
        var latlng = arguments[0];
        return new google.maps.LatLng(latlng.lat, latlng.lng);
    }
    else if (arguments.length == 2) {
        var lat = arguments[0];
        var lng = arguments[1];
        return new google.maps.LatLng(lat, lng);
    }
    else{
        return null;
    }
}
LandMap.prototype.getLatlngList = function (array) {
    var list = [];
    for(var i=0;i<array.length;i++){
        list.push(this.getPosition(array[i]));
    }
    return list;
}
LandMap.prototype.searchRoute = function(){
    this.drawRoute(this.getLatlngList(sampleCourse));
}
/*-------------------------------------------*/
/*  LandMap.drawRoute 経路を検索してルート表示
/*-------------------------------------------*/
var routeRequestList = null;
LandMap.prototype.drawRoute = function (latLngList) {  
    if (latLngList.length < 2) {
        return;
    }

    //複数の点列のルートをまとめてGoogleにリクエストするための準備
    var routeRequestList = new Array();
    var maxWayPointCount = 8;
    var idx = 0;
    var endIdx = -1;
    while (idx < latLngList.length - 1) {
        var startIdx = idx;
        endIdx = Math.min(idx + maxWayPointCount + 1, latLngList.length - 1);
        routeRequestList.push({ startIdx: startIdx, endIdx: endIdx, requestEnd: false, requestSuccess: false, renderer: null });
        idx = endIdx;
    }
    console.log(routeRequestList);
    // レンダリングオプションの設定
    var pen = getRoutePen();
    var rendererOptions = {
        map: this.map,
        preserveViewport: false,             // ルートを地図の中心にしないかどうか
        polylineOptions: pen,               // ポリライン表示オプション
        suppressPolylines: false,           // ポリライン描画抑制
        suppressMarkers: true,              // マーカ表示抑制
        suppressInfoWindows: true           // 情報ウィンドウ抑制
    };
    var avoidHighWay = true;
    
    // ルート出発地点・到着地点・経由地点のセット
    var getRoute = function () {
        //まだ終了していないリクエストのidxを検索
        var idx = -1;
        for (var i = 0; i < routeRequestList.length; i++) {
            if (!routeRequestList[i].requestEnd) {
                idx = i;
                break;
            }
        }
        if (idx == -1) {
            return;
        }
        //start、endをセット
        var startIdx = routeRequestList[idx].startIdx;
        var endIdx = routeRequestList[idx].endIdx;
        var startpt = latLngList[startIdx];
        var endpt = latLngList[endIdx];
        //中継地点をセット
        var waypts = new Array();
        for (var i = startIdx + 1; i < endIdx; i++) {
            waypts.push({
                location: latLngList[i]
            });
        }

        api_direction_disp = new google.maps.DirectionsRenderer(rendererOptions);
        api_direction_service = new google.maps.DirectionsService();
        // ディレクションサービスのオプションを設定
        var request = {
            origin: startpt,
            destination: endpt,
            waypoints: waypts,
            optimizeWaypoints: false,    //ルートの最適化を行うか【行わない：固定】
            avoidHighways: avoidHighWay, //高速道路の除外
            avoidTolls: avoidHighWay,    //有料道路の除外    
            travelMode: google.maps.DirectionsTravelMode.WALKING,   //交通手段【車：固定】
            unitSystem: google.maps.DirectionsUnitSystem.METRIC,    //単位【ｋｍ：固定】
            region: 'ja' //地域コード【固定】
        };
        // ルート検索（ディレクションサービス）
        try {
            api_direction_service.route(request, 
            function (response, status) {
            	//結果取得
                if (status == google.maps.DirectionsStatus.OK) {
                    api_direction_disp.setDirections(response);
                    api_direction_disp.setPanel(document.getElementById('routeDetail'));
                    routeRequestList[idx].renderer = api_direction_disp;
                    routeRequestList[idx].requestSuccess = true;
                    routeRequestList[idx].requestEnd = true;
                    //次のリクエスト
                    setTimeout(function () {
                        getRoute();
                    }, 1000);
                }
                //エラー
                else {
                    routeRequestList[idx].requestSuccess = false;
                    routeRequestList[idx].requestEnd = true;
                    alert("ルートが表示できませんでした。時間をおいて再度実行してください。");
                    return;
                }

                //すべてのリクエスト完了チェック
                var isFinish = true;
                for (var i = 0; i < routeRequestList.length; i++) {
                    if (!routeRequestList[i].requestEnd) {
                        isFinish = false;
                        this.routeRequestList = routeRequestList;
                        break;
                    }
                }
                if (isFinish) {
                    var totalDistance = 0;
                    var totalTimeSpan = 0;
                    var arrivalTime = 8 * 3600;//this.custListSetting.startTime;
                    var html = "";
                    for (var i = 0; i < this.routeRequestList.length; i++) {
                        var routeRequest = this.routeRequestList[i];
                        //var startCust = this.custList[routeRequest.startIdx];
                        //var endCust = this.custList[routeRequest.endIdx];
                        var route = this.routeRequestList[i].renderer.getDirections().routes[0];
                        for (var j = 0; j < route.legs.length; j++) {
                            //var cust = this.custList[routeRequest.startIdx + j];

                            var routeDetail = new RouteDetail();
                            routeDetail.distance = route.legs[j].distance.value; //m
                            routeDetail.timeSpan = route.legs[j].duration.value; //s
                            var instructions = "";
                            for (var n = 0; n < route.legs[j].steps.length; n++) {
                                instructions += route.legs[j].steps[n].instructions + "<br>";
                            }
                            //instructions = instructions.replace(/<.+?>/g, "");
                            instructions = instructions.replace(/目的地は.+です/, "");

                            routeDetail.instructions = instructions;
                            //cust.routeDetailToNextCust = routeDetail;

                            //cust.arrivalTime = arrivalTime; $("#console").append("到着：" + arrivalTime + "<br>");
                            //arrivalTime = cust.getNextArrivalTime();

                            totalDistance += routeDetail.distance;
                            totalTimeSpan += parseInt(routeDetail.timeSpan);// + parseInt(cust.stayTime);
                            html += routeDetail.distance + "m " + routeDetail.timeSpan + "秒\n";
                            html += instructions + "\n";
                        }
                    }
                    //$('#routeDetail').html(html);
                }
            });
        }
        catch (e) {
            
        }
    }
    getRoute();
}
LandMap.prototype.fitToMap = function (latlngList) {
    var lat_max = -1;
    var lng_max = -1;
    var lat_min = 1000;
    var lng_min = 1000;
    for(var i=0;i<latlngList.length;i++){        
        lat_max = Math.max(latlngList[i].lat(), lat_max);
        lng_max = Math.max(latlngList[i].lng(), lng_max);
        lat_min = Math.min(latlngList[i].lat(), lat_min);
        lng_min = Math.min(latlngList[i].lng(), lng_min);        
    }
    if(lat_max < 0){
        return;
    }
    var ll_sw = new google.maps.LatLng(lat_min, lng_min);
    var ll_ne = new google.maps.LatLng(lat_max, lng_max);
    var latLngBounds = new google.maps.LatLngBounds(ll_sw, ll_ne);
    this.map.fitBounds(latLngBounds);
}
LandMap.prototype.putLine = function (latlngList, line){
    line.setPath(latlngList);
    line.setMap(this.map);
}
/*********************************************/
/*  MakerImagesクラス
/*********************************************/
function MakerImages(){
    // アンマッチのマーカー画像
    var img_unmatch = new google.maps.MarkerImage(
      'http://maps.google.co.jp/mapfiles/ms/icons/purple.png',
      new google.maps.Size(32,32),
      new google.maps.Point(0,0),
      new google.maps.Point(16,32)
    );

    // デポのマーカー画像
    var img_depot = new google.maps.MarkerImage(
      'http://maps.google.co.jp/mapfiles/ms/icons/red-pushpin.png',
      new google.maps.Size(32,32),
      new google.maps.Point(0,0),
      new google.maps.Point(16,32)
    );

    //中心マーカー
    var img_center = new google.maps.MarkerImage(
          'http://www.google.com/mapfiles/gadget/arrowSmall80.png',
          new google.maps.Size(31,27),
          new google.maps.Point(0,0),
          new google.maps.Point(9,27)
    );
    
    this.center = img_center;
    this.depot = img_depot;
    this.unmatch = img_unmatch;
}
MakerImages.prototype.NumberMarker = function (no) {
    if (no > 200) {
        var chart_url = "http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=";        
        var markerImage = chart_url + no + "|" + colorList[1] + "|000000";
    }
    else {
        var markerImage = null;
    }
    return markerImage;
}

/*********************************************/
/*  Geocoderクラス
/*********************************************/
function Geocoder() {
      this.geocoder = new google.maps.Geocoder(); 
      
      var gs = google.maps.GeocoderStatus; //ジオコーディング結果のステータス
      this.errorMessage = new Array();//ジオコーディング結果のエラーメッセージ
      this.errorMessage[gs.ERROR] = "Google サーバーへの接続に問題が発生しました。";
      this.errorMessage[gs.INVALID_REQUEST] = "この GeocoderRequest は無効でした。";
      this.errorMessage[gs.OVER_QUERY_LIMIT] = "ウェブページは、短期間にリクエストの制限回数を超えました。";
      this.errorMessage[gs.REQUEST_DENIED] = "ウェブページではジオコーダを使用できません。";
      this.errorMessage[gs.UNKNOWN_ERROR] = "サーバー エラーのため、ジオコーディング リクエストを処理できませんでした。もう一度試すと正常に処理される可能性があります。";
      this.errorMessage[gs.ZERO_RESULTS] = "この GeocoderRequest に対する結果が見つかりませんでした。";
}
Geocoder.prototype.addressMatching = function (address, func) {
    if (address == "") {
        //customerList.showOKMessage(2,"住所を入力してください。", null);
        return;
    }
    var html = "";
    this.geocoder.geocode(
      { 'address': address, 'region': 'jp' }, // ジオコーディング リクエスト
      function (results, status) { // ジオコーディング結果callback関数
          if (status == google.maps.GeocoderStatus.OK) {
              // 結果がOK
              landMap.setCenter(results[0].geometry.location);
              //国外の場合メッセージ表示
              if (landMap.geocoder.isJapanLatLng(results[0].geometry.location) == false)
                  //customerList.showOKMessage(1,"行き先の指定は日本国内のみです。<br/>国外の行き先は、順番効率化、ルート表示をご利用できません。", null);

              func(results[0].geometry.location.lat(), results[0].geometry.location.lng());
              html = "[検索OK]" + results.length + "件、緯度：" + results[0].geometry.location.lat() + " 経度：" + results[0].geometry.location.lng() + "、Type:" + results[0].types;
          } else {
              // 結果がNG
              //customerList.showOKMessage(1, "検索に失敗しました。<br />" + status, null);
              html = "[検索NG]" + status; // this.errorMessage[status];
          }
          $("#myconsole").html($("#myconsole").html() + html);
      });
}
Geocoder.prototype.custAddressMatching = function (idx) {
      $("#console").append("idx:" + idx + " geocoder.custAddressMatching start<br>");
      var address = customerList.custList[idx].address;
      if (address == "") {
          $("#console").append("住所がありません。<br>");
          return;
      }
      this.geocoder.geocode(
      { 'address': address, 'region': 'jp' }, // ジオコーディング リクエスト
      function (results, status) {       
          if (status == google.maps.GeocoderStatus.OK) {
              //結果がOK
              $("#console").append("address matching OK<br>");
              if (googleMap.geocoder.isJapanLatLng(results[0].geometry.location)) {
                  googleMap.setCenter(results[0].geometry.location);
                  customerList.custList[idx].lat = results[0].geometry.location.lat();
                  customerList.custList[idx].lng = results[0].geometry.location.lng();
                  customerList.addMakerToCust(customerList.custList[idx]);
                  html = "idx:" + idx + " 住所:" + address + "[検索結果 OK]" + results.length + "件、緯度：" + results[0].geometry.location.lat() + " 経度：" + results[0].geometry.location.lng() + " " + results[0].types + "<br>";
              }
              else {
                  html = "idx:" + idx + " 住所:" + address + "[検索結果 OK(日本以外)]" + results.length + "件、緯度：" + results[0].geometry.location.lat() + " 経度：" + results[0].geometry.location.lng() + " " + results[0].types + "<br>";
                  customerList.showOKMessage(1,"行き先の指定は日本国内のみです。<br/>国外の行き先は、順番効率化、ルート表示をご利用できません。", null);
                  //alert("行き先は日本国内しか指定できません。");
              }

          } else {
              // 結果がNG
              html = "idx:" + idx + " 住所:" + address + "[検索結果 NG]" + status + "<br>"; // this.errorMessage[status];
              customerList.writeLog("アドレスマッチング", "エラー:" + status);
          }
          $("#console").append(html);
          delete customerList.tempList[idx];

          //終了チェック
          var objKeys = $.map(customerList.tempList, function (value, key) {
              return key;
          });
          var keyLength = objKeys.length;
          //if (Object.keys(customerList.tempList).length == 0) {
          if (keyLength == 0) {
              $("#console").append("終わったよ☆<br>");
              customerList.showList();
              customerList.fitToMap();
          }
      });
}
Geocoder.prototype.isJapanLatLng = function (location) {
// 日本の緯度経度の範囲
      var result = true;
      var minLat = 20.25;
      var maxLat = 45.33;
      var minLng = 122.56;
      var maxLng = 153.59;

      var lat = location.lat();
      var lng = location.lng();
      if (lat < minLat || maxLat < lat || lng < minLng || maxLng < lng) {
          result = false;
      }
      return result;
}
/*********************************************/
/*  RouteDetailクラス
/*********************************************/
function RouteDetail() {
    this.distance = -1;//m
    this.timeSpan = -1; //s
    this.instructions = "";
}
/*********************************************/
/*  地図上オブジェクト描画関連
/*********************************************/
var colorList = ["0080FF", "FF4040", "008040", "FF8000", "FFFF40", "80FFFF", "800080", "FF40FF"];
function getBorderPen(){
    var border = new google.maps.Polyline({
    //path: borderlist, //ポリラインの配列
    strokeColor: "#" + colorList[0],//'#FF0000', //色（#RRGGBB形式）
    strokeOpacity: 0.5, //透明度 0.0～1.0（デフォルト）
    strokeWeight: 10 //太さ（単位ピクセル）
    });
    return border;
}
function getRoutePen(){
    var route = {
        strokeColor: "#" + colorList[1],
        strokeOpacity: 0.8,
        strokeWeight: 10
    };
    return route;
}
var borderLatlngList = [
    {lat:36.741738529645055,lng:137.0094895362854},
    {lat:36.74180730918472,lng:137.01326608657837},
    {lat:36.74338922158555,lng:137.01772928237915},
    {lat:36.74101634075728,lng:137.0195746421814},
    {lat:36.73541054832361,lng:137.0204758644104},
    {lat:36.730767404168105,lng:137.02008962631226},
    {lat:36.72615837598943,lng:137.01953172683716},
    {lat:36.726743118766905,lng:137.0151972770691},
    {lat:36.727018290298,lng:137.01043367385864},
    {lat:36.72698389391055,lng:137.00897455215454},
    {lat:36.72822215415311,lng:137.00845956802368},
    {lat:36.7367346527895,lng:137.00945734977722},
    {lat:36.73876375557534,lng:137.00915694236755},
    /*{lat:36.74184169893145,lng:137.00937151908875},*/
    {lat:36.741738529645055,lng:137.0094895362854}
    ];
var sampleCourse = [
    {lat: "36.741677",lng: "137.014932"},//高岡駅
    {lat: "36.735797",lng:"137.010485"},//瑞龍寺
    {lat: "36.726908",lng: "137.011975"}//新高岡駅
]
