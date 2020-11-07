/* globals windows.YT */
<template>
  <div class="home">
    <input type="url" placeholder="YouTube URL or Id" v-model="youTubeURL" />
    <div class="player-container">
      <div :id="playerDivId">
        <p>Paste a YouTube URL or VideoId to load the player.</p>
      </div>
      <form action="#" v-if="youTubeURLIsValid">
        <p>Location = {{ currentTimeInSecs }}</p>
        <button v-if="!isPlaying" type="button" @click="onPlay">Play</button>
        <button v-else type="button" @click="onPause">Pause</button>
        <button v-if="isManuallyStopped" @click="onManuallyStart">
          Strat recording
        </button>
        <button v-if="!isManuallyStopped" @click="onManuallyStop">
          Stop recording
        </button>
      </form>
    </div>
    <div class="speech-container">
      <div class="match">{{ matchStr }}</div>
      <div class="action">
        <ul>
          <li v-for="(action, index) in actions" :key="index">
            {{ index }} -- {{ action }}
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Options, Vue } from "vue-class-component";
import getYouTubeId from "get-youtube-id";
import YouTubePlayer from "youtube-player";

declare global {
  interface Window {
    webkitSpeechGrammarList: SpeechGrammarList;
    webkitSpeechRecognition: SpeechRecognition;
  }
}

@Options({
  components: {},

  data() {
    return {
      youTubeURL: null,
      player: null,
      playerDivId: "player-div",
      isPlaying: false,
      recognition: null,
      throttle: false,
      currentTimeInSecs: 0,
      matchStr: "",
      actions: [],
      isManuallyStopped: false
    };
  },

  computed: {
    videoId() {
      return getYouTubeId(this.youTubeURL, { fuzzy: true });
    },

    youTubeURLIsValid(): boolean {
      return !!this.videoId;
    }
  },

  mounted() {
    localStorage.debug = "youtube-player:*";

    // Update the currentTimeInSecs continuously
    setInterval(async () => {
      if (this.player) {
        this.currentTimeInSecs = parseInt(await this.player.getCurrentTime());
      }
    }, 500);

    const grammar =
      "#JSGF V1.0; grammar action; public <action> = play | pause | back | rewind | slow | fast | normal | move to <number>;";
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    const SpeechGrammarList =
      window.SpeechGrammarList || window.webkitSpeechGrammarList;
    const recognition: SpeechRecognition = new SpeechRecognition(); // eslint-disable-line
    const speechRecognitionList: SpeechGrammarList = new SpeechGrammarList(); // eslint-disable-line
    speechRecognitionList.addFromString(grammar, 1);
    recognition.grammars = speechRecognitionList;
    recognition.continuous = true;
    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    this.recognition = recognition;

    this.recognition.onresult = (ev: SpeechRecognitionEvent) => {
      const action = ev.results[ev.results.length - 1][0].transcript;
      const isFinal = ev.results[ev.results.length - 1].isFinal;

      // console.log("results = ", ev.results);
      console.log(
        "action = ",
        action,
        " isFinal = ",
        isFinal,
        " player = ",
        this.player,
        " throttle = ",
        this.throttle
      );

      this.matchStr = action + (isFinal ? "." : "…");

      if (!this.throttle && this.player) {
        let toThrottle = true;

        switch (action.trim()) {
          case "play":
            this.onPlay();
            break;
          case "pause":
            this.onPause();
            break;
          case "rewind":
          case "back":
            this.onRewind();
            break;
          case "slow":
            this.onSlow();
            break;
          case "fast":
            this.onFast();
            break;
          case "normal":
            this.onNormal();
            break;
          default:
            if (action.trim().startsWith("move to")) {
              const toTime = parseInt(action.trim().slice("move to".length));
              if (!isNaN(toTime)) {
                this.onMoveTo(toTime);
              }
            } else {
              console.log("Action not understood.");
              toThrottle = false;
            }
        }

        if (toThrottle) {
          // Throttle commands by 1 second
          this.throttle = true;
          setTimeout(() => {
            this.throttle = false;
          }, 1000);
        }
      }
    };

    this.recognition.onspeechend = () => {
      this.actions.unshift("onspeechend");
      // this.recognition.stop();
    };

    this.recognition.onerror = (event: any) => {
      this.actions.unshift(`onerror (${event.error})`);
    };

    this.recognition.onaudiostart = (event: SpeechRecognitionEvent) => {
      this.actions.unshift(`onaudiostart`);
      //Fired when the user agent has started to capture audio.
      console.log("SpeechRecognition.onaudiostart");
    };

    this.recognition.onaudioend = (event: SpeechRecognitionEvent) => {
      this.actions.unshift(`onaudioend`);
      //Fired when the user agent has finished capturing audio.
      console.log("SpeechRecognition.onaudioend");
    };

    this.recognition.onend = (event: SpeechRecognitionEvent) => {
      this.actions.unshift(`onend`);
      //Fired when the speech recognition service has disconnected.
      console.log("SpeechRecognition.onend");

      if (!this.isManuallyStopped) {
        // Continuously restart listening unless manually stopped
        this.recognition.start();
      }
    };

    this.recognition.onnomatch = (event: SpeechRecognitionEvent) => {
      this.actions.unshift(`onmatch`);
      //Fired when the speech recognition service returns a final result with no significant recognition. This may involve some degree of recognition, which doesn't meet or exceed the confidence threshold.
      console.log("SpeechRecognition.onnomatch");
    };

    this.recognition.onsoundstart = (event: SpeechRecognitionEvent) => {
      this.actions.unshift(`onsoundstart`);
      //Fired when any sound — recognisable speech or not — has been detected.
      console.log("SpeechRecognition.onsoundstart");
    };

    this.recognition.onsoundend = (event: SpeechRecognitionEvent) => {
      this.actions.unshift(`onsoundend`);
      //Fired when any sound — recognisable speech or not — has stopped being detected.
      console.log("SpeechRecognition.onsoundend");
    };

    this.recognition.onspeechstart = (event: SpeechRecognitionEvent) => {
      this.actions.unshift(`onspeechstart`);
      //Fired when sound that is recognised by the speech recognition service as speech has been detected.
      console.log("SpeechRecognition.onspeechstart");
    };

    this.recognition.onstart = (event: SpeechRecognitionEvent) => {
      this.actions.unshift(`onstart`);
      //Fired when the speech recognition service has begun listening to incoming audio with intent to recognize grammars associated with the current SpeechRecognition.
      console.log("SpeechRecognition.onstart");
    };
  },

  watch: {
    actions() {
      if (this.actions.length > 25) {
        this.actions = this.actions.splice(0, 25);
      }
    },

    youTubeURLIsValid() {
      if (this.youTubeURLIsValid) {
        this.player = YouTubePlayer(this.playerDivId, {
          videoId: this.videoId
        });
        this.isManuallyStopped = false;
        this.recognition.start();
      } else {
        this.player = null;
        this.isPlaying = false;
        this.isManuallyStopped = true;
        this.recognition.stop();
      }
    }
  },

  methods: {
    onManuallyStart() {
      this.isManuallyStopped = false;
      this.recognition.start();
    },

    onManuallyStop() {
      this.isManuallyStopped = true;
      this.recognition.stop();
    },

    onPlay() {
      this.isPlaying = true;
      this.player.playVideo();
    },

    onPause() {
      this.isPlaying = false;
      this.player.pauseVideo();
    },

    async onRewind() {
      const currentTime = await this.player.getCurrentTime();
      console.log("Current time = ", currentTime);
      this.player.seekTo(currentTime - 10);
    },

    onSlow() {
      this.player.setPlaybackRate(0.5);
    },

    onFast() {
      this.player.setPlaybackRate(1.5);
    },

    onNormal() {
      this.player.setPlaybackRate(1);
    },

    onMoveTo(secs: number) {
      this.player.seekTo(secs);
    }
  }
})
export default class Home extends Vue {}
</script>

<style lang="less">
input {
  min-width: 300px;
  margin: 32px 0px;
}
</style>
