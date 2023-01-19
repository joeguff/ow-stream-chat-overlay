import { InGameController } from './in-game-controller.js';

const inGameController = new InGameController();

inGameController.run();

const isValidUrl = urlString=> {
    var urlPattern = new RegExp('^(https?:\\/\\/)?'+ // validate protocol
    '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // validate domain name
    '((\\d{1,3}\\.){3}\\d{1,3}))'+ // validate OR ip (v4) address
    '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // validate port and path
    '(\\?[;&a-z\\d%_.~+=-]*)?'+ // validate query string
    '(\\#[-a-z\\d_]*)?$','i'); // validate fragment locator
    return !!urlPattern.test(urlString);
}

let lh = null, wh = null;

if (!inGameController._lsWindowOpacity) {
    localStorage.setItem('ingameWindowOpacity', 75);
    inGameController._lsWindowOpacity = 75;
}
if (!inGameController._lsWindowOpacity) {
    localStorage.setItem('ingameChatOpacity', 75);
    inGameController._lsChatOpacity = 75;
}
if (inGameController._headerVisible == null) {
    inGameController._headerVisible = true;
    localStorage.setItem('ingameHeaderShow', true);
}

$("#settingsButton").click(function() {
    $("#settings-row").toggle();
    if ($("#settings-row").is(":visible")) {
        overwolf.windows.getCurrentWindow(function() {
            overwolf.windows.removeWindowStyle(arguments[0].window.id, 'InputPassThrough', console.log);
        });
    } else {
        overwolf.windows.getCurrentWindow(function() {
            overwolf.windows.setWindowStyle(arguments[0].window.id, 'InputPassThrough', console.log);
        });
    }
});

$("#settingsSaveButton").click(function() {
    let url = $("#embedURLInput").val();
    $("#embedURLInput").val('');
    if (isValidUrl(url)) {
        if (url == inGameController._embedURL) {
            return true; 
        }
        localStorage.setItem('ingameEmbedURL', url);
        inGameController._embedURL = url;
        $("#chat-embed").remove();
        $(`<iframe id="chat-embed" src="${inGameController._embedURL}" style="height: 100%; width: 100%"></iframe>`).appendTo($("#iframe-container"));
        localStorage.setItem('ingameEmbedURL', url)
    } else {
        alert("You must enter a valid URL");

    }
})

if (inGameController._headerVisible !== 'false') {
    $('.app-header').show();
}
document.getElementsByClassName("in-game")[0].style.opacity = inGameController._lsWindowOpacity/100;
document.getElementById("chat-container").style.opacity = inGameController._lsChatOpacity/100;
$("#slider-row").hide();
$("#settings-row").hide();

if (inGameController._embedURL && !$('#chat-embed').length) {
    //$("#embedURLInput").val(inGameController._embedURL);
    $(`<iframe id="chat-embed" src="${inGameController._embedURL}" style="height: 100%; width: 100%"></iframe>`).appendTo($("#iframe-container"));
} else {
    $("#settingsButton").click();

}


overwolf.games.getRunningGameInfo2(function(g){
    $(".fill-height").height('100%');
    overwolf.windows.getCurrentWindow(function(w) {
        var maxHeight, maxWidth, ch = w.window.height, cw = w.window.width;
        if (w.window.top < 0) {
            maxHeight = g.gameInfo.logicalHeight-5;
        } else {
            maxHeight = g.gameInfo.logicalHeight-w.window.top-5;
        }
        if (w.window.left < 0) {
            maxWidth = g.gameInfo.logicalWidth-5;
        } else {
            maxWidth = g.gameInfo.logicalWidth-w.window.left-5;
        }
        if (ch > maxHeight) {
            ch = maxHeight;
        }
        if (cw > maxWidth) {
            cw = maxWidth;
        }
        $("#slider-row").append(`<div class="col">
                <label for="heightSlider">Height</label>
                <input type="range" class="form-range" min="250" max="${maxHeight}" step="10" value="${ch}" id="heightSlider">
            </div>
        </div>
        <div class="row">
            <div class="col">
                <label for="widthSlider">Width</label>
                <input type="range" class="form-range" min="250" max="${maxWidth}" value="${cw}" step="10" id="widthSlider">
            </div>
        </div>
        <div class="row">
            <div class="col">
                <label for="widthSlider">Header Opacity</label>
                <input type="range" class="form-range" min="10" max="100" value="${inGameController._lsWindowOpacity}" step="1" id="windowOpacitySlider"> 
            </div>
            <div class="col">
                <label for="widthSlider">Chat Opacity</label>
                <input type="range" class="form-range" min="10" max="100" value="${inGameController._lsChatOpacity}" step="1" id="chatOpacitySlider">
            </div>
        `)

        $('#heightSlider').change(_sizeSliderOnChange);
        $('#widthSlider').change(_sizeSliderOnChange);
        if (ch > maxHeight) {
            $("#heightSlider").val(maxHeight);
        }
        if (cw > maxWidth) {
            $("#heightSlider").val(maxWidth);
        }
        $('#windowOpacitySlider').change(function(e) {
            localStorage.setItem('ingameWindowOpacity', $(this).val());
            inGameController._lsWindowOpacity = $(this).val();
            document.getElementsByClassName("in-game")[0].style.opacity = $(this).val()/100;
        });

        $('#chatOpacitySlider').change(function(e) {
            localStorage.setItem('ingameChatOpacity', $(this).val());
            inGameController._lsChatOpacity = $(this).val();
            document.getElementById("chat-container").style.opacity = $(this).val()/100;
        });

        overwolf.games.onGameInfoUpdated.addListener(_onGameInfoUpdated);

    });
});

overwolf.windows.onMessageReceived.addListener((message) =>  {
    if(message.id === 'dragMoveResults') {
        _sizeSliderOnChange();
        /*
        overwolf.games.getRunningGameInfo2(function(g){
            overwolf.windows.obtainDeclaredWindow('in_game', function(w) {
                var top = w.window.top, left = w.window.left, doChangeSize = false;
                if (left < 5) {
                    left = 5;
                    doChangeSize = true;
                }
                if (top < 5) {
                    top = 5;
                    doChangeSize = true;
                }
                if (doChangeSize) {
                    overwolf.games.getRunningGameInfo2(function(r) {
                        var processName = r.gameInfo.commandLine.split('/');
                        processName = processName.pop();
                        processName = processName.replace('.exe','');

                        var setPositionOptions = {
                            relativeTo: {
                                windowTitle: r.gameInfo.windowHandle,
                                processName: processName
                            },
                            top: top,
                            left: left
                        }
                        overwolf.windows.setPosition(w.window.id, setPositionOptions, function(c){
                            alert(JSON.stringify(c));
                        });
                    });
                } else {
                    _sizeSliderOnChange();
                }

                
            });
        });
        /*
        overwolf.games.getRunningGameInfo2(function(g){
            var gameInfo = g.gameInfo;
            
                
                alert(JSON.stringify(w));
            });
        });
        */
        
    }
});

function _onGameInfoUpdated(g) {
    if (g.reason[0] == 'gameResolutionChanged' && g.gameInfo.isInFocus) {
        overwolf.windows.obtainDeclaredWindow('in_game', function(w) {
            let maxWidth = g.gameInfo.logicalWidth-w.window.left-5;
            let maxHeight = g.gameInfo.logicalHeight-w.window.top-5;
            $("#widthSlider").attr("max", maxWidth);
            $("#heightSlider").attr("max",maxHeight);
            if (w.window.width > maxWidth) {
                _sizeSliderOnChange();
            } else if (w.window.height > maxHeight) {
                _sizeSliderOnChange();
            }
        });
    }
}

function _sizeSliderOnChange(e) {
    overwolf.games.getRunningGameInfo2(function(g){
        overwolf.windows.obtainDeclaredWindow('in_game', function(w) {
            var nh = $("#heightSlider").val(),
                nw = $("#widthSlider").val(),
                heightSliderMax = $("#heightSlider").attr('max'),
                widthSliderMax = $("#widthSlider").attr('max'),
                maxHeight,
                maxWidth,
                doChange = false;
            if (w.window.top < 0) {
                maxHeight = g.gameInfo.logicalHeight+w.window.top-5;
            } else {
                maxHeight = g.gameInfo.logicalHeight-w.window.top-5;
            }
            if (w.window.left < 0) {
                maxWidth = g.gameInfo.logicalWidth+w.window.left-5;
            } else {
                maxWidth = g.gameInfo.logicalWidth-w.window.left-5;
            }
            if (maxHeight != heightSliderMax) {
                $("#heightSlider").attr('max', maxHeight);
                doChange = true;
            }

            
            if (maxWidth != widthSliderMax) {
                $("#widthSlider").attr('max', maxWidth);
                doChange = true;
            }

            if (doChange = true) {
                heightSliderMax = $("#heightSlider").attr('max');
                widthSliderMax = $("#widthSlider").attr('max');
            }
            
            if (nh > maxHeight) {
                //alert('nh: '+nh);
                nh = maxHeight;
                $("#heightSlider").val(nh)
            }
            if (nw > maxWidth) {
                //alert('nw: '+nw);
                nw = maxWidth;
                $("#widthSlider").val(nw);
            }
            _sliderChangeSize(w.window.id,nw,nh);
        });
    });

}

function _sliderChangeSize(window,nw,nh) {
    let sizeSettings = {
        "window_id": window,
        "width":nw,
        "height":nh,
        "auto_dpi_resize":true //relevant only for native windows
    }
    overwolf.windows.changeSize(sizeSettings ,function() {
        $("#chat-panel").height('100%');
    });
}