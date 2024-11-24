function truncate(t, e) {
  return t.length > e ? t.substr(0, e - 3) + "..." : t;
}

function getSearchParams(url) {
  var query = url || window.location.search;
  var params = {};

  if (query.length > 0) {
    query = query.substring(1);
    var pairs = query.split("&");

    for (var i = 0; i < pairs.length; i++) {
      if (pairs[i] === "") continue;
      const pair = pairs[i].split("=");
      const key = pair[0];
      const value = pair.length > 1 ? decodeURIComponent(pair[1]) : null;
      params[key] = value;
    }
  }
  console.log("params", params);
  return params;
}

function getSearchParam(t, url) {
  const param = getSearchParams(url)[t];
  console.log("param", param);
  return param;
}

// grab: fetch if it was bad and only worked for our purposes
function grab(endpoint, method, async, callback, body, contentType) {
  var xhr = new XMLHttpRequest(); // archaic ass api for old browser support

  if (!domain) var domain;
  if (!token) var token;

  // open the request
  xhr.open(
    method || "GET",
    (domain || localStorage.getItem("instanceDomain")) + endpoint,
    async
  );

  // auth with our user token
  xhr.setRequestHeader(
    "Authorization",
    "Bearer " + (token || localStorage.getItem("access_token"))
  );
  if (contentType) {
    xhr.setRequestHeader("Content-Type", contentType);
  }
  xhr.onreadystatechange = function() {
    console.debug("readystate", xhr.readyState);
    // we literally never care when readyState != 4
    if (xhr.readyState === 4) {
      callback(xhr); // call our... er... callback
    }
  };
  xhr.send(body); // fire in the hole!
}

function isMobile() {
  return (
    /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino|android|ipad|playbook|silk/i.test(
      navigator.userAgent || navigator.vendor || window.opera
    ) ||
    /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(
      (navigator.userAgent || navigator.vendor || window.opera).substr(0, 4)
    )
  );
}

function appendVideo(url, parentElement, autoplay, mimetype, loop, alt) {
  var video = document.createElement("video");
  video.setAttribute("controls", "true");
  video.className = "attachment";

  if (autoplay === true) {
    video.autoplay = true;
  }

  if (loop === true) {
    video.loop = true;
  }

  if (alt) {
    video.alt = alt;
    video.title = alt;
  }

  var source = document.createElement("source");
  source.src = url;

  if (mimetype != undefined) {
    source.type = mimetype;
  }

  video.appendChild(source);

  var object = document.createElement("object");
  object.setAttribute("type", "application/x-shockwave-flash");
  object.setAttribute("data", "/assets/player.swf");
  var movieParam = document.createElement("param");
  movieParam.setAttribute("name", "movie");
  movieParam.setAttribute("value", "player.swf");
  object.appendChild(movieParam);
  var flashvarsParam = document.createElement("param");
  flashvarsParam.setAttribute("name", "flashvars");
  flashvarsParam.setAttribute(
    "value",
    "file=" +
      encodeURIComponent(url) +
      "&autostart=" +
      (autoplay === true ? "true" : "false") +
      "&controlbar=over"
  );
  object.appendChild(flashvarsParam);
  video.appendChild(object);
  parentElement.appendChild(video);
}

function fixupLinkInFrames(el) {
  // if (window.self !== window.top) {
  //   console.log("fixing link", el, "for deck");
  //   el.onclick = function () {
  //     console.log("clicked link", el, "from deck");
  //     if (window.history.pushState) {
  //       window.history.pushState({}, "", el.href);
  //     } else {
  //       window.history.replaceState({}, "", el.href);
  //     }
  //   };
  // }
}

function interpolateEmoji(contentDiv, emojis) {
  function processNode(node) {
    if (!node) return;
    if (node.nodeType === 3) {
      var text = node.nodeValue;
      var parts = text.split(":");
      if (parts.length > 1) {
        var fragment = document.createDocumentFragment();
        for (var i = 0; i < parts.length; i++) {
          if (i % 2 === 0) {
            fragment.appendChild(document.createTextNode(parts[i]));
          } else {
            var shortcode = parts[i];
            var found = false;
            for (var j = 0; j < emojis.length; j++) {
              if (emojis[j].shortcode == shortcode) {
                var img = document.createElement("img");
                img.className = "emote";
                img.src = emojis[j].url;
                img.alt = ":" + emojis[j].shortcode + ":";
                img.title = ":" + emojis[j].shortcode + ":";
                fragment.appendChild(img);
                found = true;
                break;
              }
            }
            if (!found) {
              fragment.appendChild(document.createTextNode(":" + shortcode));
            }
          }
        }
        if (node.parentNode) {
          node.parentNode.replaceChild(fragment, node);
        }
      }
    } else if (node.nodeType === 1) {
      var childNodes = node.childNodes;
      var nodes = [];
      for (var i = 0; i < childNodes.length; i++) {
        nodes.push(childNodes[i]);
      }
      for (var i = 0; i < nodes.length; i++) {
        processNode(nodes[i]);
      }
    }
  }
  processNode(contentDiv);
}

function min(t, e) {
  return t < e ? t : e;
}

function max(t, e) {
  return t > e ? t : e;
}

function popupwindow(url, title, w, h) {
  var left = screen.width / 2 - w / 2;
  var top = screen.height / 2 - h / 2;
  return window.top.open(
    url,
    title,
    "toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=no, resizable=no, copyhistory=no, width=" +
      w +
      ", height=" +
      h +
      ", top=" +
      top +
      ", left=" +
      left
  );
}

"undefined" == typeof XMLHttpRequest &&
  (XMLHttpRequest = function () {
    try {
      return new ActiveXObject("Msxml2.XMLHTTP.6.0");
    } catch (t) {}
    try {
      return new ActiveXObject("Msxml2.XMLHTTP.3.0");
    } catch (t) {}
    try {
      return new ActiveXObject("Microsoft.XMLHTTP");
    } catch (t) {}
    throw new Error("This browser does not support XMLHttpRequest.");
  });
