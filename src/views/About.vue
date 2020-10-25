<template>
  <div class="about">
    <h1>Voice control YouTube videos</h1>
    <p>
      When your hands are busy doing something (e.g. learning how to play the
      piano, or cooking, or making dance moves, or pottery, or underwater basket
      weaving), then it helps to be able to voice control a YouTube video.
    </p>

    <p>
      Just paste a link on the
      <router-link :to="{ name: 'Home' }">home page</router-link> to start.
    </p>

    <p>The following voice commands are currently supported:</p>
    <ul>
      <li><code>play</code>: Plays video.</li>
      <li><code>pause</code>: Pauses video.</li>
      <li><code>rewind/back</code>: Rewinds by 10 seconds.</li>
      <li>
        <code>slow/fast/normal</code>: Play video at 0.5 / 1.5 / 1 play rate.
      </li>
      <li>
        <code>move to SECONDS</code>: Seek to <code>SECONDS</code> position on
        the video.
      </li>
    </ul>

    <p>Made with love by <a href="https://musicallyut.in">@musically_ut</a>.</p>
  </div>
</template>

<style lang="less" scoped>
.about {
  max-width: 720px;
  margin: auto;
}

p,
ul {
  text-align: left;
}
</style>
