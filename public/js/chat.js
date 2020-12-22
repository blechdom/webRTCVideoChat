
// Vars
var isMuted;
var videoIsPaused;
const browserName = getBrowserName();


const isWebRTCSupported =
  navigator.getUserMedia ||
  navigator.webkitGetUserMedia ||
  navigator.mozGetUserMedia ||
  navigator.msGetUserMedia ||
  window.RTCPeerConnection;


// Element vars
const remoteVideo = $("#remote-video");
const captionText = $("#remote-video-text");
const localVideoText = $("#local-video-text");
var frontgif = document.getElementById('remote-video');
var ringtone = document.getElementById('ringtone');
const pc_config = {
  "iceServers": [

    {
      urls: 'stun:stun.l.google.com:19302'
    }, {
      urls: 'turn:numb.viagenie.ca',
      credential: 'thXKSRwkFWP9rk6',
      username: 'jhaanand841@gmail.com'
    }
  ]
}

var VideoChat = {
  connected: false,
  willInitiateCall: false,
  localICECandidates: [],
  socket: io(
    '/webrtcPeer',
    {
      path: '/webrtc',
      query: {}
    }
  ),

  remoteVideo: document.getElementById("remote-video"),
  localVideo: document.getElementById("local-video"),
  recognition: undefined,
  passstring: "",
  role: "",

  pc: new RTCPeerConnection(pc_config),

  requestMediaStream: function (event) {
    logIt("requestMediaStream");
    rePositionLocalVideo();
    navigator.mediaDevices
      .getUserMedia({
        video: true,
        audio: {
          maxFrameRate: 60
        }
      })
      .then((stream) => {
        VideoChat.onMediaStream(stream);
        localVideoText.text("Drag Me");
        setTimeout(() => localVideoText.fadeOut(), 5000);
      })
      .catch((error) => {
        logIt(error);
        logIt(
          "Failed to get local webcam video, check webcam privacy settings"
        );
        // Keep trying to get user media
        setTimeout(VideoChat.requestMediaStream, 1000);
      });
  },

  // Called when a video stream is added to VideoChat
  onMediaStream: function (stream) {
    logIt("onMediaStream");
    VideoChat.localStream = stream;
    VideoChat.localVideo.srcObject = stream;
    //do this for media got services
    VideoChat.pc.addStream(stream)
  },
};

//on connection success
VideoChat.socket.on('connection-success', success => {
  console.log(success)
  console.log("step 1");

  function getPassString() {
    var person = prompt("Please Enter Your Meeting ID", "");
    Notification.requestPermission().then(() => {
      console.log("Notification permission granted");
    }).catch(() => {
      captionText.text("We would not be able to inform you about the doctor please grant the notification permission.")
    })
    VideoChat.passstring = person
    var role = person.split('-')[0]
    console.log("ROLE IS -- " + role);
    VideoChat.role = role
    var callpatient = document.getElementById('callpatient')
    var answer = document.getElementById('answer')
    if (role == "R") {
      captionText.text("We have Notified the doctor that your are online He would call you in a bit. If there is something wrong please contact Jan Elaaj. Get Well Soon... ").fadeIn();
      //DISABLE THE CORRESPONDING BUTTONS
      callpatient.disabled = true;
      callpatient.style.color = "grey"
      callpatient.style.display = "none"
    } else {
      captionText.text("We have Notified the patient that your are online. If the call quality is not good. please consider watsapp call. Thank you..").fadeIn();
      answer.disabled = true;
      answer.style.color = "grey"
      answer.style.display = "none"
    }
    const data = {
      socketID: VideoChat.socket.id,
      role: VideoChat.role,
      passstring: VideoChat.passstring
    }
    console.log("PASSSTRING");
    console.log(data);

    VideoChat.socket.emit('passString', data)
  }
  if (VideoChat.role == "") {
    getPassString()
  }
})

// on ice candidate
VideoChat.pc.onicecandidate = (e) => {
  if (e.candidate) {
    console.log(JSON.stringify(e.candidate));
    const data = {
      socketID: VideoChat.socket.id,
      payload: e.candidate
    }
    VideoChat.socket.emit('candidate', data)
  }
  console.log("on ice candidate");
  //this would run when the answer offer sdp is generated and is reached to thr use 
  if (VideoChat.role == "C") {
    captionText.text("   Ringing ...... ......")
  }
}

// triggered when there is a change in connection state
VideoChat.pc.oniceconnectionstatechange = (e) => {
  console.log(e)
  console.log("state changed");
}

//when this peer gets the desired track
VideoChat.pc.ontrack = (e) => {
  VideoChat.remoteVideo.srcObject = e.streams[0]
  console.log("on track");
  captionText.text("")
}

//when this pc gets the candidate
VideoChat.socket.on('candidate', (data) => {
  VideoChat.pc.addIceCandidate(new RTCIceCandidate(data))
  console.log("video call started");
  //this action would happen as soon as pc gets the candidate 
  //for the patient it would happen on when patient gets offer 
  // and for doctor this would happen when he gets answer
  // we are pausing the ringtone and jpg of DOC on this event
  //for patient we will stop jpg and ringtone when he clicks the answer button
  if (VideoChat.role == "C") {
    ringtone.pause()
    frontgif.style.background = "url('')";
    captionText.text(" If call Not Connected PLease try refreshing the browser or press ctrl+r. If the problem persist please Consider calling through watsaap. Thank you, Team JanElaaj....")
    var fade_out = function () {
      captionText.text("");
    }
    setTimeout(fade_out, 10000);
  }
})

var myinterval;
VideoChat.socket.on('offerOrAnswer', (data) => {
  frontgif.style.backgroundImage = "url(../images/ringing.gif)";
  VideoChat.pc.setRemoteDescription(new RTCSessionDescription(data))

  if (VideoChat.role == "R") {
    myinterval = setInterval(function () {
      let el = document.getElementById('answercallid');
      if (el.className === 'fas fa-phone fa-xs') {
        el.className = 'fas fa-phone fa-xs fa-2x';
      } else {
        el.className = 'fas fa-phone fa-xs';
      }
    }, 500);
    frontgif.style.backgroundImage = "url(../images/ringing.gif)";
    ringtone.loop = true;
    ringtone.play();
  }
})

// notify doctor for patient arrival
VideoChat.socket.on('notifydoctorforpatient', (data) => {
  if (VideoChat.role == "C") {
    function showNotification() {
      const notification = new Notification("Patient Online Now", {
        body: "your Patient is online now please call him/her.",
        requireInteraction: true
      })
    }
    window.alert("Your Patient is Now Online Please Call Him.")
    showNotification()
  } else {
    frontgif.style.backgroundImage = "url(../images/dotorcommingforpatients.gif)";
    function showNotification() {

      const notification = new Notification("Doctor Is Online Now", {
        body: "Doctor is online now he would call you shortly.",
        requireInteraction: true
      })
    }
    window.alert("Your Doctor is now online he would call you in a bit, Please be ready.")

    showNotification()
  }
})


// on click of call button
createOffer = () => {
  console.log("creating offer");
  VideoChat.pc.createOffer({ offerToReceiveVideo: 1 })
    .then((sdp) => {
      VideoChat.pc.setLocalDescription(sdp)
      const data = {
        socketID: VideoChat.socket.id,
        payload: sdp,
        role: VideoChat.role,
        passstring: VideoChat.passstring
      }
      VideoChat.socket.emit('offerOrAnswer', data)
      frontgif.style.backgroundImage = "url(../images/ringing.gif)";
      ringtone.loop = true;
      ringtone.play();
      captionText.text("   Connecting ..... .....")
    }).catch((e) => {
      console.log(e);
    })
}

// on click of answer button
createAnswer = () => {
  console.log("creating answer sdp");
  VideoChat.pc.createAnswer({ offerToReceiveVideo: 1 })
    .then((sdp) => {
      console.log(JSON.stringify(sdp));
      VideoChat.pc.setLocalDescription(sdp)
      const data = {
        socketID: VideoChat.socket.id,
        payload: sdp,
        role: VideoChat.role,
        passstring: VideoChat.passstring
      }
      VideoChat.socket.emit('offerOrAnswer', data)
      ringtone.pause()
      clearInterval(myinterval)
      document.getElementById('answercallid').className = "fas fa-phone fa-xs"
      // stops the ringing hover button
      clearInterval(myinterval)
      frontgif.style.background = "url('')";
    }).catch((e) => {
      console.log(e);
    })
}

//searchPatientOrDoctor button method
searchPatientOrDoctor = () => {
  console.log("searching");
  const data = {
    socketID: VideoChat.socket.id,
    payload: sdp,
    role: VideoChat.role,
    passstring: VideoChat.passstring
  }
  VideoChat.socket.emit('searchPatientOrDoctor', data)
}



// Pause Video
function pauseVideo() {
  console.log("paused video");

  var videoTrack = null;
  // Get video track to pause
  VideoChat.pc.getSenders().find(function (s) {
    if (s.track.kind === "video") {
      videoTrack = s.track;
    }
  });
  videoIsPaused = !videoTrack.enabled;
  videoTrack.enabled = videoIsPaused;
  videoIsPaused = !videoIsPaused;
  // select video button and video button text
  const videoButtonIcon = document.getElementById("video-icon");
  const videoButtonText = document.getElementById("video-text");
  // update pause button icon and text
  if (videoIsPaused) {
    localVideoText.text("Video is paused");
    localVideoText.show();
    videoButtonIcon.classList.remove("fa-video");
    videoButtonIcon.classList.add("fa-video-slash");
    videoButtonText.innerText = "Unpause Video";
  } else {
    localVideoText.text("Video unpaused");
    setTimeout(() => localVideoText.fadeOut(), 2000);
    videoButtonIcon.classList.add("fa-video");
    videoButtonIcon.classList.remove("fa-video-slash");
    videoButtonText.innerText = "Pause Video";
  }
}


// Mute microphone
function muteMicrophone() {
  var audioTrack = null;
  // Get audio track to mute
  VideoChat.pc.getSenders().find(function (s) {
    if (s.track.kind === "audio") {
      audioTrack = s.track;
    }
  });
  isMuted = !audioTrack.enabled;
  audioTrack.enabled = isMuted;
  isMuted = !isMuted;
  // select mic button and mic button text
  const micButtonIcon = document.getElementById("mic-icon");
  const micButtonText = document.getElementById("mic-text");
  // Update mute button text and icon
  if (isMuted) {
    micButtonIcon.classList.remove("fa-microphone");
    micButtonIcon.classList.add("fa-microphone-slash");
    micButtonText.innerText = "Unmute";
  } else {
    micButtonIcon.classList.add("fa-microphone");
    micButtonIcon.classList.remove("fa-microphone-slash");
    micButtonText.innerText = "Mute";
  }
}
// Get name of browser session using user agent
function getBrowserName() {
  var name = "Unknown";
  if (window.navigator.userAgent.indexOf("MSIE") !== -1) {
  } else if (window.navigator.userAgent.indexOf("Firefox") !== -1) {
    name = "Firefox";
  } else if (window.navigator.userAgent.indexOf("Opera") !== -1) {
    name = "Opera";
  } else if (window.navigator.userAgent.indexOf("Chrome") !== -1) {
    name = "Chrome";
  } else if (window.navigator.userAgent.indexOf("Safari") !== -1) {
    name = "Safari";
  }
  return name;
}

// Basic logging class wrapper
function logIt(message, error) {
  console.log(message);
}


// Reposition local video to top left of remote video
function rePositionLocalVideo() {
  // Get position of remote video
  var bounds = remoteVideo.position();
  let localVideo = $("#local-video");
  if (
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    )
  ) {
    bounds.top = $(window).height() * 0.7;
    bounds.left += 10;
  } else {
    bounds.top += 10;
    bounds.left += 10;
  }
  // Set position of local video
  $("#moveable").css(bounds);
}

// Reposition captions to bottom of video
function rePositionCaptions() {
  // Get remote video position
  var bounds = remoteVideo.position();
  bounds.top -= 10;
  bounds.top = bounds.top + remoteVideo.height() - 1 * captionText.height();
  // Reposition captions
  captionText.css(bounds);
}

// Called when window is resized
function windowResized() {
  rePositionLocalVideo();
  rePositionCaptions();
}


// End Mute microphone




function startUp() {
  //  Try and detect in-app browsers and redirect
  var ua = navigator.userAgent || navigator.vendor || window.opera;
  if (
    DetectRTC.isMobileDevice &&
    (ua.indexOf("FBAN") > -1 ||
      ua.indexOf("FBAV") > -1 ||
      ua.indexOf("Instagram") > -1)
  ) {
    if (DetectRTC.osName === "iOS") {
      window.location.href = "/notsupportedios";
    } else {
      window.location.href = "/notsupported";
    }
  }

  // Redirect all iOS browsers that are not Safari
  if (DetectRTC.isMobileDevice) {
    if (DetectRTC.osName === "iOS" && !DetectRTC.browser.isSafari) {
      window.location.href = "/notsupportedios";
    }
  }

  if (!isWebRTCSupported || browserName === "MSIE") {
    window.location.href = "/notsupported";
  }


  // get webcam on load
  VideoChat.requestMediaStream();

  // Captions hidden by default
  captionText.text("").fadeOut();

  // Make local video draggable
  $("#moveable").draggable({ containment: "window" });

  // Hide button labels on load
  $(".HoverState").hide();

  // Show hide button labels on hover
  $(document).ready(function () {
    $(".hoverButton").mouseover(function () {
      $(".HoverState").hide();
      $(this).next().show();
    });
    $(".hoverButton").mouseout(function () {
      $(".HoverState").hide();
    });
  });

  // Fade out / show UI on mouse move
  var timedelay = 1;
  function delayCheck() {
    if (timedelay === 5) {
      // $(".multi-button").fadeOut();
      $("#header").fadeOut();
      timedelay = 1;
    }
    timedelay = timedelay + 1;
  }

  $(document).mousemove(function () {
    $(".multi-button").fadeIn();
    $("#header").fadeIn();
    $(".multi-button").style = "";
    timedelay = 1;
    clearInterval(_delay);
    _delay = setInterval(delayCheck, 500);
  });
  _delay = setInterval(delayCheck, 500);


  // Set caption text on start
  captionText.text("Please Enter Your Meeting Id ").fadeIn();

  // Reposition captions on start
  rePositionCaptions();

  // On change media devices refresh page and switch to system default
  navigator.mediaDevices.ondevicechange = () => window.location.reload();
}

startUp();
