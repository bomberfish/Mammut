const domain = localStorage.getItem("instanceDomain");
const token = localStorage.getItem("access_token");

if (domain == null || token == null) {
  window.location.href = "/domain.html";
}
var myId = localStorage.getItem("myId");

function getTimeline(timelineType) {
  // appendTimelineNavBar(timelineType);
  const afterParam = getSearchParam("after");
  addComposeBtn();

  grab(
    "/api/v1/timelines/" +
      timelineType +
      "?limit=40" +
      (afterParam ? "&max_id=" + afterParam : ""),
    "GET",
    true,
    function (xhr) {
      if (xhr.status == 200) {
        var response = JSON.parse(xhr.responseText);
        console.log(response);
        var timelineDiv = document.createElement("div");

        var h1 = document.createElement("h1");
        switch (timelineType) {
          case "following":
            h1.innerHTML = "Home";
            break;
          case "public?local=true":
            h1.innerHTML = "Local";
            break;
          case "public?remote=true":
            h1.innerHTML = "Federated";
            break;
          default:
            h1.innerHTML = timelineType.charAt(0).toUpperCase() + timelineType.slice(1);
        }
        document.body.appendChild(h1);

        timelineDiv.id = "timeline";
        if (window.self === window.top) {
          timelineDiv.style.paddingTop = "0.25em";
          timelineDiv.style.paddingBottom = "2em";
        }
        timelineDiv.innerHTML = "";
        if (response.length == 0) {
          timelineDiv.innerHTML = "No posts.";
        }
        if (afterParam != null) {
          var newestButton = document.createElement("a");
          newestButton.id = "newestBtn";
          newestButton.href = window.location.pathname;
          newestButton.innerHTML = "Jump to the latest ";
          timelineDiv.appendChild(newestButton);
        }
        for (var i = 0; i < response.length; i++) {
          var post = response[i];
          timelineDiv.appendChild(
            appendStatus(post, "timeline-" + timelineType)
          );
          if (i == response.length - 1) {
            var lastPostId = post.id,
              olderButton = document.createElement("a");
            olderButton.href =
              window.location.pathname + "?after=" + lastPostId;
            olderButton.innerHTML = "View older posts";
            timelineDiv.appendChild(olderButton);
            olderButton.id = "olderBtn";
          }
        }
        document.body.appendChild(timelineDiv);
      } else {
        errorPage("Endpoint /api/v1/timelines/" + timelineType + " returned code " + xhr.status + " and readyState " + xhr.readyState + "\n" + xhr.responseText);
      }
    }
  );
}

function appendStatus(original_post, currentViewType, indentAmount, pinned) {
  var status = original_post;
  var statusDiv = document.createElement("div");
  var innerStatusDiv = document.createElement("div");
  var contentDiv = document.createElement("div");

  if (indentAmount) {
    statusDiv.style.marginLeft = indentAmount + "px";
  }

  statusDiv.className = "status id-" + status.id + " " + currentViewType;

  if (pinned) {
    statusDiv.classList.add("pinned");
    var pinLabel = document.createElement("div");
    pinLabel.className = "postlabel";
    pinLabel.appendChild(document.createTextNode("Pinned"));
    statusDiv.appendChild(pinLabel);
  }

  if (original_post.reblog) {
    status = original_post.reblog;
    var reblogLabel = document.createElement("div");
    reblogLabel.className = "postlabel";
    reblogLabel.appendChild(document.createTextNode("Reblogged by "));
    var rebloggerLink = document.createElement("a");
    rebloggerLink.href = "/user.html?id=" + original_post.account.id;
    rebloggerLink.innerHTML = original_post.account.display_name;
    reblogLabel.appendChild(rebloggerLink);
    statusDiv.appendChild(reblogLabel);
  }

  console.log(original_post, status, original_post === status);

  var replyToAccountId = status.in_reply_to_account_id;
  if (replyToAccountId) {
    var replyLabel = document.createElement("div");
    replyLabel.className = "postlabel";
    replyLabel.appendChild(document.createTextNode("Replied to "));
    var replyLink = document.createElement("a");
    replyLink.href = "/user.html?id=" + replyToAccountId;
    replyLink.innerHTML = "a user";
    replyLabel.appendChild(replyLink);
    statusDiv.appendChild(replyLabel);
    grab("/api/v1/accounts/" + replyToAccountId, "GET", true, function (xhr) {
      if (xhr.status === 200) {
        var response = JSON.parse(xhr.responseText);
        console.log(response);
        replyLink.innerHTML = response.display_name;
      }
    });
  }

  statusDiv.onclick = function (e) {
    if (e.target != statusDiv && e.target != contentDiv) return;
    window.location.href = "/status.html?id=" + status.id;
  };


  function createPostContent() {
    contentDiv.className = "content";
    contentDiv.innerHTML = status.content;

    const links = contentDiv.querySelectorAll("a");

    for (var i = 0; i < links.length; i++) {
      const link = links[i];
      for (var j = 0; j < status.mentions.length; j++) {
        const mention = status.mentions[j];
        if (mention.url === link.href) {
          link.href = "/user.html?id=" + mention.id;
          break;
        }
      }
    }

    interpolateEmoji(contentDiv, status.emojis);

    innerStatusDiv.appendChild(contentDiv);

    if (status.poll) {
      function appendPoll(poll, status) {
        console.log(poll);
        var pollDiv = document.createElement("form");
        pollDiv.className = "poll";
        console.log(poll);

        var pollLabel = document.createElement("strong");
        pollLabel.innerText = "Poll:";
        pollDiv.appendChild(pollLabel);

        for (var k = 0; i < poll.options.length; k++) {
          const option = poll.options[k];
          if (!option) continue;
          console.log(option);
          var optionDiv = document.createElement("div");
          optionDiv.className = "pollOption";
          const percentage =
            option.votes_count == 0
              ? "0%"
              : ((option.votes_count / poll.votes_count) * 100).toFixed(0) +
                "%";

          var optionInner = document.createElement("div");
          optionInner.className = "pollOptionInner";
          optionInner.style.width = percentage;
          optionDiv.appendChild(optionInner);
          var optionTitle = document.createElement("span");
          if (poll.multiple) {
            var checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.name = "choice";
            checkbox.style.display = "inline-block";
            checkbox.value = i;
            optionTitle.appendChild(checkbox);
          } else {
            optionTitle.innerHTML = "";
          }

          optionTitle.innerHTML = option.title + " (" + percentage + ")";
          optionTitle.style.display = "inline-block";
          optionTitle.style.width = "max-content";
          optionDiv.appendChild(optionTitle);

          if (poll.voted || poll.expired) {
            optionDiv.style.cursor = "not-allowed";
            var allChildren = optionDiv.children;
            for (var j = 0; j < allChildren.length; j++) {
              allChildren[j].style.cursor = "not-allowed";
            }
          } else {
            if (!poll.multiple) {
              optionDiv.style.cursor = "pointer";
              (function (choiceIndex) {
                optionDiv.onclick = function () {
                  console.log("Voting for " + option.title);
                  grab(
                    "/api/v1/polls/" + poll.id + "/votes",
                    "POST",
                    true,
                    function (xhr) {
                      if (xhr.status === 200) {
                        console.log("Voted for " + option.title, choiceIndex);
                        grab(
                          "/api/v1/statuses/" + status.id,
                          "GET",
                          true,
                          function (xhr) {
                            if (xhr.status == 200) {
                              status = JSON.parse(xhr.responseText);
                              // Re-render the poll
                              var newPollDiv = appendPoll(status.poll, status);
                              pollDiv.parentNode.replaceChild(
                                newPollDiv,
                                pollDiv
                              );
                            }
                          }
                        );
                      } else {
                        console.error("Failed to vote for " + option.title);
                        alert("Failed to vote: " + xhr.responseText);
                      }
                    },
                    JSON.stringify({ choices: [choiceIndex] }),
                    "application/json"
                  );
                };
              })(i);
            }
          }

          pollDiv.appendChild(optionDiv);
        }

        if (poll.multiple && !poll.voted && !poll.expired) {
          var submitButton = document.createElement("button");
          // submitButton.type = "submit";
          submitButton.innerText = "Submit";
          submitButton.onclick = function () {
            var choices = [];
            var checkboxes = pollDiv.querySelectorAll('input[type="checkbox"]');
            for (var i = 0; i < checkboxes.length; i++) {
              if (checkboxes[i].checked) {
                choices.push(parseInt(checkboxes[i].value));
              }
            }
            console.log(choices);
            grab(
              "/api/v1/polls/" + poll.id + "/votes",
              "POST",
              true,
              function (xhr) {
                if (xhr.status === 200) {
                  console.log("Voted for " + choices);
                  grab(
                    "/api/v1/statuses/" + status.id,
                    "GET",
                    true,
                    function (xhr) {
                      if (xhr.status == 200) {
                        status = JSON.parse(xhr.responseText);
                        // Re-render the poll
                        var newPollDiv = appendPoll(status.poll, status);
                        pollDiv.parentNode.replaceChild(newPollDiv, pollDiv);
                      }
                    }
                  );
                } else {
                  console.error("Failed to vote for " + choices);
                  alert("Failed to vote: " + xhr.responseText);
                }
              },
              JSON.stringify({ choices: choices }),
              "application/json"
            );
          };
          pollDiv.appendChild(submitButton);
        }

        var votersInfo = document.createElement("div");
        votersInfo.innerHTML =
          "<br><br><span>" +
          poll.voters_count +
          (poll.voters_count === 1 ? " person " : " people ") +
          " voted</span>";
        pollDiv.appendChild(votersInfo);

        return pollDiv;
      }
      // var pollElement = appendPoll(status.poll, status);
      // statusDiv.appendChild(pollElement);
    }

    for (var i = 0; i < status.media_attachments.length; i++) {
      var attachment = status.media_attachments[i];
      switch (attachment.type) {
        case "image":
          var img = document.createElement("img");
          img.src = attachment.preview_url;
          if (attachment.description) {
            img.alt = attachment.description;
            img.title = attachment.description;
          }
          img.className = "attachment";
          img.setAttribute("lazy", null);
          img.setAttribute("data-src", attachment.url);
          img.setAttribute(
            "onclick",
            'window.open("' + attachment.url + '", "_blank")'
          );
          innerStatusDiv.appendChild(img);
          break;
        case "video":
          appendVideo(attachment.url, innerStatusDiv, attachment.description);
          break;
        case "gifv":
          appendVideo(
            attachment.url,
            innerStatusDiv,
            true,
            undefined,
            true,
            attachment.description
          );
        case "audio":
          var audio = document.createElement("audio");
          audio.className = "attachment";
          audio.controls = true;
          if (attachment.description) {
            audio.title = attachment.description;
            audio.alt = attachment.description;
          }
          audio.src = attachment.url;
          innerStatusDiv.appendChild(audio);
        default:
          var attachmentLink = document.createElement("a");
          attachmentLink.className = "attachment";
          attachmentLink.href = attachment.url;
          attachmentLink.target = "_blank";
          attachmentLink.innerHTML = attachment.url.split("/").pop();
          innerStatusDiv.appendChild(attachmentLink);
      }
    }

    return innerStatusDiv;
  }

  var userLink = document.createElement("a");
  userLink.href = "/user.html?id=" + status.account.id;
  userLink.innerHTML = status.account.display_name;
  interpolateEmoji(userLink, status.account.emojis);
  statusDiv.appendChild(userLink);
  statusDiv.appendChild(document.createElement("br"));

  if (status.sensitive && currentViewType != "expanded") {
    var spoilerDiv = document.createElement("div");
    spoilerDiv.className = "spoiler";

    var spoilerLabel = document.createElement("strong");
    spoilerLabel.className = "spoiler-label";
    spoilerLabel.innerHTML = "Content Warning:";

    spoilerDiv.appendChild(spoilerLabel);

    var text = document.createTextNode(
      " " + status.spoiler_text + " (Click to reveal full post)"
    );

    spoilerDiv.appendChild(text);

    statusDiv.appendChild(disclosure(spoilerDiv, createPostContent()));

    // statusDiv.appendChild(spoilerDiv);
  } else {
    statusDiv.appendChild(createPostContent());
  }

  var postActions = document.createElement("div");
  postActions.className = "postActions";

  var replyButton = document.createElement("button");
  replyButton.className = "postAction replyButton";
  replyButton.title = "Reply to this post";
  replyButton.innerHTML =
    '<span class="btn-inner"><svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 12.6943 9.95996"><g><rect height="9.95996" opacity="0" width="12.6943" x="0" y="0"/><path d="M5.31152 9.95312C5.70117 9.95312 6.00195 9.66602 6.00195 9.27637L6.00195 7.28027L6.13867 7.28027C8.10742 7.28027 9.37891 7.77246 10.3633 9.53613C10.5684 9.90527 10.8418 9.95312 11.0879 9.95312C11.3955 9.95312 11.6895 9.67285 11.6895 9.16016C11.6895 5.28418 10.1172 2.67285 6.13867 2.67285L6.00195 2.67285L6.00195 0.717773C6.00195 0.328125 5.70117 0 5.29785 0C5.01074 0 4.81934 0.123047 4.49805 0.423828L0.259766 4.38867C0.0751953 4.57324 0 4.78516 0 4.97656C0 5.16113 0.0751953 5.37988 0.259766 5.55762L4.49805 9.57031C4.79199 9.83691 5.02441 9.95312 5.31152 9.95312ZM4.94238 8.62012C4.91504 8.62012 4.8877 8.60645 4.86719 8.58594L1.13477 5.03125C1.11426 5.01074 1.10059 4.99707 1.10059 4.97656C1.10059 4.95605 1.11426 4.94238 1.13477 4.92188L4.86719 1.3125C4.8877 1.29199 4.91504 1.27832 4.94238 1.27832C4.9834 1.27832 5.01074 1.30566 5.01074 1.34668L5.01074 3.4043C5.01074 3.52734 5.07227 3.58887 5.20215 3.58887L5.99512 3.58887C9.77539 3.58887 10.6914 6.30273 10.8213 8.51074C10.8213 8.54492 10.8008 8.55859 10.7871 8.55859C10.7734 8.55859 10.7666 8.55176 10.7529 8.51758C10.1377 7.27344 8.51074 6.35742 5.99512 6.35742L5.20215 6.35742C5.07227 6.35742 5.01074 6.41895 5.01074 6.54883L5.01074 8.55176C5.01074 8.59277 4.9834 8.62012 4.94238 8.62012Z"/></g></svg>&nbsp;<span class="btn-inner-text">' +
    status.replies_count +
    "</span></span>";
  
    var content;

    try {
      content = encodeURIComponent(truncate(status.content, 15) + "...");
    } catch (e) {
      content = "";
    }
  var link =
    "/compose.html?reply_id=" +
    status.id +
    "&reply_content=" +
    content +
    "&visibility=" +
    status.visibility;
  if (status.account.id != myId) {
    link += "&reply_to=" + status.account.acct;
  }
  console.log(link);
  replyButton.onclick = function () {
    window.open(link, "compose");
  };
  postActions.appendChild(replyButton);

  var favButton = document.createElement("button");
  favButton.className = "postAction favButton";
  favButton.title = "Favourite this post";

  if (status.favourited) {
    favButton.classList.add("active");
  }

  favButton.innerHTML =
    '<span><svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 12.5101 12.2842"><g><rect height="12.2842" opacity="0" width="12.5101" x="0" y="0"/><path d="M2.30386 11.3955C2.55679 11.5869 2.86441 11.5117 3.23355 11.2451L6.01577 9.20117L8.80484 11.2451C9.16714 11.5117 9.47476 11.5869 9.72769 11.3955C9.97378 11.2109 10.0216 10.8965 9.87124 10.4727L8.77066 7.19824L11.5802 5.18164C11.9494 4.92871 12.1066 4.64844 12.0041 4.34766C11.9084 4.06055 11.6212 3.91699 11.1701 3.92383L7.72476 3.95117L6.67886 0.65625C6.54214 0.225586 6.33023 0 6.01577 0C5.70816 0 5.49624 0.225586 5.35269 0.65625L4.30679 3.95117L0.861476 3.92383C0.410305 3.91699 0.130031 4.06055 0.027492 4.34766C-0.0682111 4.64844 0.0890155 4.92871 0.45132 5.18164L3.26089 7.19824L2.1603 10.4727C2.00991 10.8965 2.05777 11.2109 2.30386 11.3955ZM3.19937 10.1719C3.19253 10.1582 3.19253 10.1514 3.19937 10.124L4.24527 7.1709C4.32046 6.94531 4.27945 6.76758 4.07437 6.62402L1.49038 4.86035C1.46987 4.83984 1.46304 4.83301 1.46987 4.81934C1.47671 4.80566 1.48355 4.80566 1.51089 4.80566L4.64175 4.87402C4.88101 4.88086 5.0314 4.78516 5.10659 4.5459L5.98843 1.54492C5.99527 1.51758 6.0021 1.51074 6.01577 1.51074C6.02945 1.51074 6.03628 1.51758 6.04312 1.54492L6.92495 4.5459C7.00015 4.78516 7.15737 4.88086 7.39663 4.87402L10.5207 4.80566C10.548 4.80566 10.5548 4.80566 10.5617 4.81934C10.5685 4.83301 10.5617 4.83984 10.5412 4.86035L7.95718 6.62402C7.7521 6.76758 7.71109 6.94531 7.79312 7.1709L8.83218 10.124C8.83902 10.1514 8.83902 10.1582 8.83218 10.1719C8.82534 10.1855 8.81167 10.1719 8.79116 10.1582L6.30972 8.25098C6.12515 8.10059 5.91323 8.10059 5.72183 8.25098L3.24722 10.1582C3.22671 10.1719 3.21304 10.1855 3.19937 10.1719Z"/></g></svg>&nbsp;<span class="inner">' +
    status.favourites_count +
    "</span></span>";
  favButton.onclick = function () {
    const endpoint =
      "/api/v1/statuses/" +
      status.id +
      (favButton.classList.contains("active") ? "/unfavourite" : "/favourite");
    console.log(domain + endpoint);
    grab(endpoint, "POST", true, function (xhr) {
      if (xhr.status === 200) {
        favButton.classList.toggle("active");
        var favCount = favButton.querySelector(".inner");
        console.log(parseInt(favCount.innerHTML));
        favCount.innerHTML =
          parseInt(favCount.innerHTML) +
          (favButton.classList.contains("active") ? 1 : -1);
      } else {
        alert("Error: " + xhr.responseText);
      }
    });
  };
  postActions.appendChild(favButton);

  var repostButton = document.createElement("button");
  repostButton.className = "postAction repostButton";
  repostButton.title = "Boost this post";
  if (status.reblogged) {
    repostButton.classList.add("active");
  }
  repostButton.innerHTML =
    '<span class="btn-inner"><svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 13.8002 9.97363"><g><rect height="9.97363" opacity="0" width="13.8002" x="0" y="0"/><path d="M0.149631 3.72559C0.361545 3.93066 0.648654 3.91016 0.860568 3.71191L1.31858 3.25391L2.03635 2.48828L2.03635 8.25098C2.03635 9.39941 2.6174 9.97363 3.77951 9.97363L7.94944 9.97363C8.3049 9.97363 8.50998 9.7959 8.50315 9.48145C8.49631 9.16699 8.3049 8.98242 7.94944 8.98242L3.79319 8.98242C3.301 8.98242 3.02072 8.72266 3.02072 8.20312L3.02072 2.47461L3.74533 3.25391L4.20334 3.71191C4.41526 3.91016 4.70237 3.93066 4.91428 3.72559C5.11936 3.52051 5.11252 3.21289 4.90061 3.01465L3.15061 1.27148C2.75412 0.875 2.30979 0.875 1.90647 1.27148L0.163303 3.01465C-0.0486115 3.21289-0.0554475 3.52051 0.149631 3.72559ZM4.81858 0.505859C4.81858 0.820312 5.00998 0.998047 5.36545 0.998047L9.52854 0.998047C10.0207 0.998047 10.301 1.26465 10.301 1.77734L10.301 7.50586L9.57639 6.72656L9.11838 6.27539C8.90647 6.07031 8.61936 6.0498 8.40744 6.26172C8.20237 6.45996 8.2092 6.76758 8.42112 6.96582L10.1643 8.70898C10.5676 9.10547 11.0119 9.10547 11.4084 8.70898L13.1584 6.96582C13.3703 6.76758 13.3772 6.45996 13.1721 6.26172C12.9602 6.0498 12.6731 6.07031 12.4612 6.27539L11.9963 6.72656L11.2854 7.49902L11.2854 1.72949C11.2854 0.581055 10.7043 0.00683594 9.54221 0.00683594L5.36545 0.00683594C5.00998 0.00683594 4.81174 0.18457 4.81858 0.505859Z"/></g></svg>&nbsp;<span class="inner">' +
    status.reblogs_count +
    "</span></span>";
  repostButton.onclick = function () {
    const endpoint =
      "/api/v1/statuses/" +
      status.id +
      (repostButton.classList.contains("active") ? "/unreblog" : "/reblog");
    console.log(domain + endpoint);
    grab(endpoint, "POST", true, function (xhr) {
      if (xhr.status === 200) {
        repostButton.classList.toggle("active");
        var boostCount = repostButton.querySelector(".inner");
        console.log(parseInt(boostCount.innerHTML));
        boostCount.innerHTML =
          parseInt(boostCount.innerHTML) +
          (repostButton.classList.contains("active") ? 1 : -1);
      } else {
        alert("Error: " + xhr.responseText);
      }
    });
  };
  postActions.appendChild(repostButton);

  var bookmarkButton = document.createElement("button");
  bookmarkButton.className = "postAction bookmarkButton";
  bookmarkButton.title = "Bookmark this post";
  if (status.bookmarked) {
    bookmarkButton.classList.add("active");
  }
  bookmarkButton.innerHTML =
    '<span class="btn-inner"><svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 7.84082 11.6553"><g><rect height="11.6553" opacity="0" width="7.84082" x="0" y="0"/><path d="M0.62207 11.6348C0.90918 11.6348 1.08008 11.4639 1.64062 10.9238L3.62988 8.99609C3.65723 8.96875 3.71191 8.96875 3.73242 8.99609L5.72168 10.9238C6.28906 11.4639 6.45312 11.6348 6.74707 11.6348C7.13672 11.6348 7.3623 11.375 7.3623 10.917L7.3623 1.59277C7.3623 0.533203 6.83594 0 5.79004 0L1.57227 0C0.526367 0 0 0.533203 0 1.59277L0 10.917C0 11.375 0.225586 11.6348 0.62207 11.6348ZM1.12109 9.95996C1.0459 10.0283 0.963867 10.0078 0.963867 9.90527L0.963867 1.60645C0.963867 1.18262 1.18945 0.963867 1.62012 0.963867L5.74219 0.963867C6.17285 0.963867 6.39844 1.18262 6.39844 1.60645L6.39844 9.90527C6.39844 10.0078 6.31641 10.0283 6.24805 9.95996L3.99219 7.82031C3.80078 7.63574 3.56152 7.63574 3.37012 7.82031Z"/></g></svg>' +
    "</span>";
  bookmarkButton.onclick = function () {
    const endpoint =
      "/api/v1/statuses/" +
      status.id +
      (repostButton.classList.contains("active") ? "/unbookmark" : "/bookmark");
    console.log(domain + endpoint);
    grab(endpoint, "POST", true, function (xhr) {
      if (xhr.status === 200) {
        bookmarkButton.classList.toggle("active");
      } else {
        alert("Error: " + xhr.responseText);
      }
    });
  };
  postActions.appendChild(bookmarkButton);

  reactButton = document.createElement("button");
  reactButton.className = "postAction reactButton";
  reactButton.title = "React to this post";
  reactButton.innerHTML =
    '<span class="btn-inner"><svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 17.4727 14.9494"><g><rect height="14.9494" opacity="0" width="17.4727" x="0" y="0"/><path d="M14.2563 7.43914L14.2352 7.85627C14.131 7.84485 14.025 7.84 13.918 7.84C13.6665 7.84 13.4209 7.86658 13.1842 7.91797C13.2019 7.76087 13.2104 7.60102 13.2104 7.43914C13.2104 4.96453 11.2075 2.9616 8.73289 2.9616C6.25829 2.9616 4.26219 4.96453 4.26219 7.43914C4.26219 9.91375 6.25829 11.9167 8.73289 11.9167C9.313 11.9167 9.86719 11.8066 10.3739 11.6026C10.3906 11.9627 10.4655 12.3078 10.5902 12.6292C10.0117 12.8427 9.38547 12.9557 8.73289 12.9557C5.6909 12.9557 3.2163 10.488 3.2163 7.43914C3.2163 4.39032 5.6909 1.92254 8.73289 1.92254C11.7817 1.92254 14.2563 4.39032 14.2563 7.43914Z"/><path d="M10.6333 9.0319C10.6333 9.40106 9.86766 10.153 8.72606 10.153C7.59129 10.153 6.82567 9.40106 6.82567 9.0319C6.82567 8.89519 6.9624 8.82683 7.09911 8.88152C7.50243 9.07292 7.94676 9.31218 8.72606 9.31218C9.51219 9.31218 9.95653 9.07292 10.3598 8.88152C10.4966 8.82683 10.6333 8.89519 10.6333 9.0319ZM7.81689 6.22234C7.81689 6.66667 7.50243 6.9743 7.14696 6.9743C6.79833 6.9743 6.49071 6.66667 6.49071 6.22234C6.49071 5.76433 6.79833 5.45671 7.14696 5.45671C7.50243 5.45671 7.81689 5.76433 7.81689 6.22234ZM10.9751 6.22234C10.9751 6.66667 10.6675 6.9743 10.312 6.9743C9.95653 6.9743 9.65574 6.66667 9.65574 6.22234C9.65574 5.76433 9.95653 5.45671 10.312 5.45671C10.6675 5.45671 10.9751 5.76433 10.9751 6.22234Z"/><path d="M16.6729 11.3947C16.6729 12.8986 15.4083 14.1496 13.918 14.1496C12.4073 14.1496 11.1563 12.9123 11.1563 11.3947C11.1563 9.88394 12.4073 8.63981 13.918 8.63981C15.4287 8.63981 16.6729 9.88394 16.6729 11.3947ZM13.5626 10.0343L13.5626 11.0392L12.5577 11.0392C12.3458 11.0392 12.2022 11.1828 12.2022 11.3947C12.2022 11.6066 12.3458 11.7502 12.5577 11.7502L13.5626 11.7502L13.5626 12.755C13.5626 12.967 13.6993 13.1105 13.918 13.1105C14.1299 13.1105 14.2735 12.967 14.2735 12.755L14.2735 11.7502L15.2784 11.7502C15.4903 11.7502 15.627 11.6066 15.627 11.3947C15.627 11.1828 15.4903 11.0392 15.2784 11.0392L14.2735 11.0392L14.2735 10.0343C14.2735 9.82241 14.1299 9.67886 13.918 9.67886C13.6993 9.67886 13.5626 9.82241 13.5626 10.0343Z"/></g></svg></span>';
  reactButton.onclick = function () {
    var pickerFrame = document.createElement("iframe");
    pickerFrame.src = "/emoji.html?post_id=" + status.id;
    pickerFrame.style.height = "8em";
    pickerFrame.width = "100%";
    statusDiv.appendChild(pickerFrame);
  };

  postActions.appendChild(reactButton);

  // console.warn(status.account.id, myId);
  if (status.account.id == myId) {
    var deleteButton = document.createElement("button");
    deleteButton.className = "postAction deleteButton";
    deleteButton.title = "Delete post";
    deleteButton.innerHTML =
      '<span class="btn-inner"><svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 10.9238 12.9951"><g><rect height="12.9951" opacity="0" width="10.9238" x="0" y="0"/><path d="M3.64355 10.2334C3.87598 10.2334 4.02637 10.0898 4.01953 9.87793L3.8623 4.27246C3.85547 4.05371 3.70508 3.91699 3.48633 3.91699C3.26074 3.91699 3.10352 4.06055 3.11035 4.27246L3.26758 9.87793C3.27441 10.0967 3.4248 10.2334 3.64355 10.2334ZM5.22266 10.2334C5.45508 10.2334 5.6123 10.0898 5.6123 9.87793L5.6123 4.27246C5.6123 4.06055 5.45508 3.91699 5.22266 3.91699C4.99023 3.91699 4.83301 4.06055 4.83301 4.27246L4.83301 9.87793C4.83301 10.0898 4.99023 10.2334 5.22266 10.2334ZM6.80859 10.2334C7.02051 10.2334 7.17773 10.0967 7.18457 9.87793L7.33496 4.27246C7.3418 4.06055 7.19141 3.91699 6.95898 3.91699C6.74023 3.91699 6.58984 4.06055 6.58301 4.27246L6.43262 9.87793C6.42578 10.0898 6.57617 10.2334 6.80859 10.2334ZM2.83691 2.52246L3.80762 2.52246L3.80762 1.37402C3.80762 1.09375 4.00586 0.90918 4.29297 0.90918L6.14551 0.90918C6.42578 0.90918 6.62402 1.09375 6.62402 1.37402L6.62402 2.52246L7.60156 2.52246L7.60156 1.30566C7.60156 0.499023 7.0752 0 6.21387 0L4.21777 0C3.36328 0 2.83691 0.499023 2.83691 1.30566ZM0.451172 3.00781L9.99414 3.00781C10.2471 3.00781 10.4453 2.80273 10.4453 2.5498C10.4453 2.29688 10.2402 2.0918 9.99414 2.0918L0.451172 2.0918C0.211914 2.0918 0 2.29688 0 2.5498C0 2.80273 0.211914 3.00781 0.451172 3.00781ZM2.75488 11.9971L7.69727 11.9971C8.51074 11.9971 9.03711 11.4912 9.07812 10.6709L9.43359 2.90527L8.45605 2.90527L8.11426 10.5684C8.10059 10.876 7.89551 11.0811 7.59473 11.0811L2.84375 11.0811C2.55664 11.0811 2.34473 10.8691 2.33105 10.5684L1.96875 2.90527L1.01172 2.90527L1.37402 10.6777C1.41504 11.498 1.92773 11.9971 2.75488 11.9971Z"/></g></svg></span>';
    deleteButton.onclick = function () {
      if (confirm("Are you sure you want to delete this post?")) {
        deletePost(status);
      }
    };
    postActions.appendChild(deleteButton);

    var editButton = document.createElement("button");
    editButton.className = "postAction editButton";
    editButton.title = "Edit post";
    editButton.innerHTML =
      '<span class="btn-inner"><svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 12.3792 10.1197"><g><rect height="10.1197" opacity="0" width="12.3792" x="0" y="0"/><path d="M11.0978 8.83672C11.0978 9.11016 10.8722 9.33574 10.6056 9.33574L2.98457 9.33574L3.9807 8.34453L10.6056 8.34453C10.8722 8.34453 11.0978 8.57012 11.0978 8.83672Z" /><path d="M2.34097 8.85039L8.05581 3.14922L7.03042 2.12383L1.31558 7.825L0.816555 9.06231C0.761868 9.19902 0.912258 9.36309 1.05581 9.31523ZM8.548 2.66387L9.12906 2.09648C9.41616 1.80254 9.43667 1.48809 9.17691 1.22832L8.95816 1.01641C8.69839 0.749805 8.38394 0.777149 8.09683 1.06426L7.51577 1.63164Z" /></g></svg></span>';
    editButton.onclick = function () {
      window.open("/compose.html?content=" + encodeURIComponent(status.content) + "&editing=" + status.id, "compose");
    };
    postActions.appendChild(editButton);

    var pinButton = document.createElement("button");
    pinButton.className = "postAction pinButton";
    pinButton.title = "Pin post";

    if (status.pinned) {
      pinButton.classList.add("active");
    }

    pinButton.innerHTML = '<span class="btn-inner"><svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 9.00293 12.9131"><g><rect height="12.9131" opacity="0" width="9.00293" x="0" y="0"/><path d="M4.25879 12.9131C4.40918 12.9131 4.79199 12.1611 4.79199 11.252L4.79199 8.44922L3.73242 8.44922L3.73242 11.252C3.73242 12.1611 4.11523 12.9131 4.25879 12.9131ZM0.84082 8.95508L7.67676 8.95508C8.19629 8.95508 8.52441 8.62695 8.52441 8.13477C8.52441 6.54883 6.71973 4.91504 4.25879 4.91504C1.80469 4.91504 0 6.54883 0 8.13477C0 8.62695 0.328125 8.95508 0.84082 8.95508ZM1.10059 8.03223C0.984375 8.03223 0.936523 7.9707 0.963867 7.82031C1.10059 6.95215 2.26953 5.80371 4.25879 5.80371C6.25488 5.80371 7.41699 6.95215 7.56055 7.82031C7.58789 7.9707 7.5332 8.03223 7.41699 8.03223ZM0.635742 0.895508C0.635742 1.07324 0.704102 1.26465 0.854492 1.45605C1.12793 1.81152 1.77051 2.31738 2.48828 2.78906L2.29004 5.63965L3.26758 5.63965L3.46582 2.32422C3.47266 2.24219 3.45898 2.21484 3.4043 2.1875C2.56348 1.77051 1.98926 1.33301 1.94141 1.25781C1.88672 1.18945 1.93457 1.1416 1.98926 1.1416L6.53516 1.1416C6.58301 1.1416 6.63086 1.18945 6.58301 1.25781C6.52832 1.33301 5.96094 1.77051 5.11328 2.1875C5.06543 2.21484 5.05176 2.24219 5.05859 2.32422L5.25684 5.63965L6.23438 5.63965L6.0293 2.78906C6.74707 2.31738 7.38965 1.81152 7.66309 1.45605C7.82031 1.26465 7.88867 1.07324 7.88867 0.895508C7.88867 0.546875 7.61523 0.287109 7.21875 0.287109L1.30566 0.287109C0.902344 0.287109 0.635742 0.546875 0.635742 0.895508Z"/></g></svg></span>'

    pinButton.onclick = function () {
      if (status.pinned) {
        grab("/api/v1/statuses/" + status.id + "/unpin", "POST", true, function (xhr) {
          if (xhr.status === 200) {
            pinButton.classList.remove("active");
          } else {
            alert("Error: " + xhr.responseText);
          }
        });
      } else {
        grab("/api/v1/statuses/" + status.id + "/pin", "POST", true, function (xhr) {
          if (xhr.status === 200) {
            pinButton.classList.add("active");
          } else {
            alert("Error: " + xhr.responseText);
          }
        });
      }
    }
    postActions.appendChild(pinButton);
  }


  statusDiv.appendChild(postActions);

  if (status.reactions && status.reactions.length > 0) {
    statusDiv.appendChild(addReactions(status.reactions, status));
  }
  var xtraDetails = document.createElement("div");
  xtraDetails.className = "xtraDetails";

  var date = document.createElement("span");
  date.innerHTML = new Date(status.created_at).toLocaleString();
  xtraDetails.appendChild(date);

  if (status.application) {
    xtraDetails.innerHTML += " via ";
    if (status.application.website) {
      var application = document.createElement("a");
      application.target = "_blank";
      application.href = status.application.website;
      application.innerHTML = status.application.name;
    } else {
      var application = document.createElement("span");
      application.innerHTML = status.application.name;
    }

    xtraDetails.appendChild(application);
  }

  statusDiv.appendChild(xtraDetails);
  return statusDiv;
}

function addReactions(reactions, status) {
  console.log(reactions);
  var reactionDiv = document.createElement("div");
  reactionDiv.className = "reactions";
  for (var i = 0; i < reactions.length; i++) {
    const reaction = reactions[i];
    console.log(reaction);
    var btn = document.createElement("button");
    btn.className = "reaction";

    btn.onclick = function () {
      if (reaction.me) {
        react(status.id, reaction.name, true);
      } else {
        react(status.id, reaction.name, false);
      }

      if (window.location.pathname == "/post.html") {
        window.location.reload(); // workaround for this stuff just not working
      }

      reactionDiv.outerHTML = addReactions(reactions, status).outerHTML;
    };

    if (reaction.me) {
      btn.className += " me";
    }
    var inner = document.createElement("span");
    inner.className = "btn-inner";
    if (reaction.url) {
      inner.innerHTML =
        "<img src='" +
        reaction.url +
        "' class='reactionImage' alt='" +
        reaction.name +
        "' title='" +
        reaction.name +
        "' />";
    } else {
      inner.innerHTML = '<span class="inner">' + reaction.name + "</span>";
    }

    btn.appendChild(inner);

    var cnt = document.createElement("span");
    cnt.className = "reactionCount";
    cnt.innerHTML = reaction.count;
    btn.appendChild(cnt);

    reactionDiv.appendChild(btn);
  }
  return reactionDiv;
}

function deletePost(status) {
  grab(
    "/api/v1/statuses/" + status.id,
    "DELETE",
    true,
    function (xhr) {
      if (xhr.status === 200) {
        window.location.href = "/feed.html?view=local";
      } else {
        alert("Error: " + xhr.responseText);
      }
    },
    null
  );
}

function appendTimelineNavBar(timelineType) {
  // if (window.self !== window.top) return; // don't add the navbar in deck mode

  var topNav = document.createElement("nav");
  topNav.id = "topNav";

  var timelinesLabel = document.createElement("span");
  timelinesLabel.innerHTML = "Timelines: ";
  topNav.appendChild(timelinesLabel);

  var homeLink = document.createElement("a");
  homeLink.href = "/feed.html";
  homeLink.innerHTML = "Home | ";
  topNav.appendChild(homeLink);

  var localLink = document.createElement("a");
  localLink.href = "/feed.html?view=local";
  localLink.innerHTML = "Local | ";
  topNav.appendChild(localLink);

  var federatedLink = document.createElement("a");
  federatedLink.href = "/feed.html?view=federated";
  federatedLink.innerHTML = "Federated";
  topNav.appendChild(federatedLink);

  document.body.appendChild(topNav);

  var bottomNav = document.createElement("nav");
  bottomNav.id = "bottomNav";

  var searchLink = document.createElement("a");
  searchLink.href = "/search.html";
  searchLink.innerHTML = "Search | ";
  bottomNav.appendChild(searchLink);

  var bookmarksLink = document.createElement("a");
  bookmarksLink.href = "/bookmarks.html";
  bookmarksLink.innerHTML = "Bookmarks | ";
  bottomNav.appendChild(bookmarksLink);

  var notificationsLink = document.createElement("a");
  notificationsLink.href = "/notifications.html";
  notificationsLink.innerHTML = "Notifications | ";
  bottomNav.appendChild(notificationsLink);

  var profileLink = document.createElement("a");
  profileLink.href = "/user.html?id=" + myId;
  profileLink.innerHTML = "My Profile";
  bottomNav.appendChild(profileLink);

  document.body.appendChild(bottomNav);
}

function getCurrentUserId() {
  grab("/api/v1/accounts/verify_credentials", "GET", false, function (xhr) {
    if (xhr.status == 200) {
      var response = JSON.parse(xhr.responseText);
      console.debug(response.id);
      myId = response.id;
      localStorage.setItem("myId", myId);
    } else {
      console.log(xhr.responseText);
    }
  });
}

function getPost() {
  const postId = getSearchParam("id");
  if (postId != null) {
    var posts = [],
      isReblog = false;
    console.log(postId);
    grab(
      "/api/v1/statuses/" + postId + "/context",
      "GET",
      false,
      function (xhr) {
        if (xhr.status == 200) {
          var response = JSON.parse(xhr.responseText);
          console.log(
            response,
            response.ancestors.length,
            response.descendants.length
          );

          function appendStatuses(statuses) {
            for (var i = 0; i < statuses.length; i++) {
              const status = statuses[i];
              console.log(status);

              var indent = 0; // our indent, in px

              if (status.in_reply_to_id) {
                indent = 25;
                var parentId = status.in_reply_to_id;
                while (parentId) {
                  indent = min(indent + 25, window.innerWidth / 3);
                  var foundParent = false;
                  for (var j = 0; j < i; j++) {
                    if (statuses[j].id == parentId) {
                      parentId = statuses[j].in_reply_to_id;
                      foundParent = true;
                      break;
                    }
                  }
                  if (!foundParent) {
                    parentId = null;
                  }
                }
              }
              console.log(indent);
              document.body.appendChild(
                appendStatus(status, "expanded", indent)
              );
            }
          }

          appendStatuses(response.ancestors);

          var mainStatus;
          grab("/api/v1/statuses/" + postId, "GET", false, function (xhr) {
            if (xhr.status == 200) {
              var response = JSON.parse(xhr.responseText);
              console.log(response);
              document.body.appendChild(appendStatus(response, "expanded"));
              mainStatus = document.body.querySelector(".status.id-" + postId);
              mainStatus.classList.add("highlight");
            }
          });

          appendStatuses(response.descendants);
          setTimeout(function () {
            mainStatus.scrollIntoView({ block: "end", behavior: 'smooth' });
            setTimeout(function () {
              mainStatus.scrollIntoView({ block: "end" });
            }, 600);
          }, 300);
        } else {
          errorPage(
            "Endpoint /api/v1/statuses/" +
              postId +
              "/context returned code " +
              xhr.status +
              "\n" +
              xhr.responseText
          );
        }
      }
    );
  } else {
    document.write("No post ID specified");
  }
}

function getUserPage() {
  const userId = getSearchParam("id");
  const after = getSearchParam("after");
  addComposeBtn();
  if (userId != null) {
    if (userId == myId) {
      console.log("My profile");
      var logOutButton = document.createElement("button");
      logOutButton.innerHTML = "Log out";
      logOutButton.onclick = function () {
        logOut();
      };
      logOutButton.style.float = "right";
      logOutButton.style.backgroundColor = "red";
      logOutButton.style.color = "white";
      logOutButton.style.border = "none";
      logOutButton.style.padding = "5px";
      logOutButton.style.borderRadius = "8px";
      document.body.appendChild(logOutButton);
    }

    grab("/api/v1/accounts/" + userId, "GET", false, function (xhr) {
      if (xhr.status == 200) {
        var user = JSON.parse(xhr.responseText);
        console.log(user);
        var header = document.createElement("header");
        header.id = "userHeader";
        function adjustHeaderSize() {
          const width = document.documentElement.clientWidth,
            height = document.documentElement.clientHeight;
          if (width / height > 1.2) {
            header.style.width = "70%";
            header.style.height = Math.max(100, width / 6) + "px";
          } else {
            header.style.width = "100%";
            header.style.height = Math.max(100, height / 4) + "px";
          }
        }
        if (user.header) {
          header.style.backgroundImage = "url(" + user.header + ")";
          header.style.backgroundSize = "cover";
          header.style.backgroundPosition = "center";
        }
        header.style.margin = "0 auto";
        adjustHeaderSize();
        window.onresize = adjustHeaderSize;
        var overlay = document.createElement("div");
        overlay.id = "headerOverlay";

        overlay.style.width = "100%";
        overlay.style.height = "100%";
        overlay.style.color = "white";

        var userInfo = document.createElement("div");
        userInfo.id = "userInfo";
        userInfo.style.marginTop = "25px";
        userInfo.style.display = "inline-block";
        userInfo.style.textAlign = "left";
        userInfo.style.verticalAlign = "top";
        userInfo.style.width = "80%";

        var avatar = document.createElement("img");
        avatar.id = "userAvatar";
        avatar.src = user.avatar;
        avatar.style.width = "10%";
        avatar.style.height = "auto";
        avatar.style.borderRadius = "50%";
        avatar.style.verticalAlign = "middle";
        avatar.style.float = "left";
        avatar.style.marginTop = "7%";
        avatar.style.marginLeft = "20px";
        avatar.style.marginRight = "20px";
        overlay.appendChild(avatar);
        overlay.appendChild(userInfo);

        var userNameDiv = document.createElement("div");
        userNameDiv.id = "userNameDiv";
        userNameDiv.style.display = "inline-block";
        userNameDiv.style.verticalAlign = "middle";
        userNameDiv.style.width = "100%";

        var displayName = document.createElement("h1");
        displayName.id = "displayName";
        displayName.style.marginRight = "10px";
        displayName.style.width = "max-content";
        displayName.innerHTML = user.display_name;
        interpolateEmoji(displayName, user.emojis);
        userNameDiv.appendChild(displayName);

        var userHandle = document.createElement("h3");
        userHandle.id = "userHandle";
        userHandle.style.marginRight = "20px";
        userHandle.style.width = "max-content";
        if (user.acct.split("@").length > 1) {
          userHandle.innerHTML = "@" + user.acct;
        } else {
          userHandle.innerHTML = "@" + user.acct + "@" + domain.split("://")[1];
        }
        userNameDiv.appendChild(userHandle);

        if (userId != myId) {
          console.log("Not my profile");
          isFollowingUser(userId, function (follows) {
            const followBtn = createFollowButton(follows, userId);
            followBtn.style.float = "right";
            followBtn.style.position = "relative";
            followBtn.style.bottom = "50px";
            userNameDiv.appendChild(followBtn);
          });
        }

        userInfo.appendChild(userNameDiv);

        var userStats = document.createElement("div");
        userStats.style.display = "block";
        userStats.style.textAlign = "center";
        userStats.style.verticalAlign = "bottom";
        userStats.style.margin = "10px";

        var followsCount = document.createElement("span");
        followsCount.innerHTML = "Follows: " + user.following_count + " ";
        userStats.appendChild(followsCount);

        var followersCount = document.createElement("span");
        followersCount.innerHTML = "• Followers: " + user.followers_count;
        userStats.appendChild(followersCount);
        overlay.appendChild(userStats);

        header.appendChild(overlay);

        document.body.appendChild(header);

        var bio = document.createElement("div");
        bio.id = "bio";
        bio.innerHTML = user.note;

        interpolateEmoji(bio, user.emojis);

        document.body.appendChild(bio);

        var table = document.createElement("table");
        table.id = "userTable";
        for (var i = 0; i < user.fields.length; i++) {
          const field = user.fields[i];
          var row = document.createElement("tr");

          if (field.verified_at) {
            row.classList = "verified";
          }

          var key = document.createElement("td");
          key.innerHTML = field.name;
          row.appendChild(key);

          var value = document.createElement("td");
          value.innerHTML = field.value;
          row.appendChild(value);

          table.appendChild(row);
        }
        document.body.appendChild(table);

        var timeline = document.createElement("div");
        timeline.id = "timeline";

        if (window.self === window.top) {
          timeline.style.paddingBottom = "2em"
        }

        var viewOptions = document.createElement("div");
        viewOptions.id = "viewOptions";

        var title = document.createElement("h4");
        title.innerHTML = "View Options";
        viewOptions.appendChild(title);

        var onlyMedia = document.createElement("input");
        onlyMedia.type = "checkbox";
        onlyMedia.id = "onlyMedia";
        onlyMedia.name = "onlyMedia";
        onlyMedia.onchange = function () {
          fetchPosts();
        };
        viewOptions.appendChild(onlyMedia);

        var onlyMediaLabel = document.createElement("label");
        onlyMediaLabel.htmlFor = "onlyMedia";
        onlyMediaLabel.innerHTML = "Only show media";
        viewOptions.appendChild(onlyMediaLabel);

        var replies = document.createElement("input");
        replies.type = "checkbox";
        replies.id = "replies";
        replies.name = "replies";
        replies.onchange = function () {
          fetchPosts();
        };
        viewOptions.appendChild(replies);

        var repliesLabel = document.createElement("label");
        repliesLabel.htmlFor = "replies";
        repliesLabel.innerHTML = "Include replies";
        viewOptions.appendChild(repliesLabel);

        var reblogs = document.createElement("input");
        reblogs.type = "checkbox";
        reblogs.id = "reblogs";
        reblogs.name = "reblogs";
        reblogs.checked = true;
        reblogs.onchange = function () {
          fetchPosts();
        };
        viewOptions.appendChild(reblogs);

        var reblogsLabel = document.createElement("label");
        reblogsLabel.htmlFor = "reblogs";
        reblogsLabel.innerHTML = "Include reblogs";
        viewOptions.appendChild(reblogsLabel);

        document.body.appendChild(viewOptions);

        if (after != null) {
          var newestButton = document.createElement("a");
          newestButton.id = "newestBtn";
          newestButton.href = window.location.pathname;
          newestButton.innerHTML = "Jump to the latest ";
          timeline.appendChild(newestButton);
        }
        function fetchPosts() {
          document.body.appendChild(timeline);
          timeline.innerHTML = "";

          grab(
            "/api/v1/accounts/" +
              userId +
              "/statuses" +
              "?limit=40" +
              "&pinned=true",
            "GET",
            false,
            function (postsXhr) {
              if (postsXhr.status == 200) {
                var posts = JSON.parse(postsXhr.responseText);
                console.log(posts);
                for (var i = 0; i < posts.length; i++) {
                  timeline.appendChild(
                    appendStatus(posts[i], "user", undefined, true)
                  );
                }
                timeline.appendChild(document.createElement("hr"));
              }
            }
          );

          var endpoint =
            "/api/v1/accounts/" + userId + "/statuses" + "?limit=40";

          onlyMedia = document.getElementById("onlyMedia");
          replies = document.getElementById("replies");
          reblogs = document.getElementById("reblogs");
          console.log(onlyMedia.checked, replies.checked, reblogs.checked);

          if (after != null) endpoint += "&max_id=" + after;

          if (onlyMedia.checked) endpoint += "&only_media=true";

          if (!replies.checked) endpoint += "&exclude_replies=true";

          if (!reblogs.checked) endpoint += "&exclude_reblogs=true";

          console.log(endpoint);

          grab(endpoint, "GET", true, function (postsXhr) {
            if (postsXhr.status == 200) {
              var posts = JSON.parse(postsXhr.responseText);
              console.log(posts);
              for (var i = 0; i < posts.length; i++) {
                timeline.appendChild(appendStatus(posts[i], "user"));
                if (i == posts.length - 1) {
                  var lastPostId = posts[i].id,
                    olderButton = document.createElement("a");
                  olderButton.href =
                    window.location.pathname +
                    "?id=" +
                    userId +
                    "&after=" +
                    lastPostId;
                  olderButton.innerHTML = "View older posts";
                  timeline.appendChild(olderButton);
                  olderButton.id = "olderBtn";
                }
              }
            } else {
              errorPage("Endpoint /api/v1/accounts/" +
                userId +
                "/statuses returned code " +
                postsXhr.status +
                " and readyState " +
                postsXhr.readyState +
                "\n" +
                postsXhr.responseText);
            }
          });
        }

        fetchPosts();
      } else {
        errorPage("Endpoint /api/v1/accounts/" +
          userId +
          " returned code " +
          xhr.status +
          " and readyState " +
          xhr.readyState +
          "\n" +
          xhr.responseText);
      }
    });
  } else {
    document.write("No user ID specified");
  }
}

function isFollowingUser(userId, callback) {
  grab(
    "/api/v1/accounts/relationships?id=" + userId,
    "GET",
    true,
    function (xhr) {
      if (xhr.status == 200) {
        if (callback) {
          var response = JSON.parse(xhr.responseText);
          callback(response[0].following);
        }
      } else {
        if (callback) {
          callback(false);
        }
      }
    }
  );
}

function changeFollowStatus(currentlyFollowing, id, callback) {
  grab(
    "/api/v1/accounts/" + id + (currentlyFollowing ? "/unfollow" : "/follow"),
    "POST",
    true,
    function (xhr) {
      if (xhr.status == 200) {
        callback(true);
      } else {
        callback(false);
      }
    }
  );
}

function react(postId, emojiId, removeReaction) {
  var response;
  grab(
    "/api/v1/statuses/" +
      postId +
      (removeReaction === true ? "/unreact/" : "/react/") +
      emojiId,
    "POST",
    false,
    function (xhr) {
      if (xhr.status == 200) {
        alert("Reaction added!");
        response = JSON.parse(xhr.responseText);
      } else {
        alert("Error adding reaction: " + xhr.responseText);
      }
    }
  );
  return response;
}

function addComposeBtn() {
  if (window.self !== window.top) return; // don't add the compose button in deck mode
  var newPostButton = document.createElement("a");
  newPostButton.id = "newBtn";
  newPostButton.href = "/compose.html";
  newPostButton.innerHTML = "New Post";
  document.body.appendChild(newPostButton);
}

if (myId == null || myId == "undefined") {
  getCurrentUserId();
}

window.addEventListener("message", function (e) {
  console.log("[TL]", e);
  if (e.data.type == "emoji-insert" && e.data.postId) {
    // this is a reaction for sure.
    console.log(e.data.type, e.data.data, e.data.id);
    const response = react(e.data.postId, e.data.data);
    const frames = document.getElementsByTagName("iframe");
    for (var i = 0; i < frames.length; i++) {
      const id = frames[i].src.split("post_id=")[1];
      console.log(frames[i].src, id);
      if (id == e.data.postId) {
        const reacts = frames[i].parentNode.querySelector(".reactions");
        if (reacts && reacts.reactions && reacts.reactions.length > 0) {
          reacts.outerHTML = addReactions(response.reactions, response).outerHTML;
        }
        frames[i].remove();
        break;
      }
    }
  } else if (e.data.type == "timeline-update-request") {
    window.location.reload();
  }
});


window.addEventListener("DOMContentLoaded", function () {
  if (window.self === window.top) appendTimelineNavBar();
});
