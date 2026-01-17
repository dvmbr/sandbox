<script setup>
import CusorFollower from "./components/CusorFollower.vue";
import DialType from "./components/DialType.vue";
import FogBackground from "./components/FogBackground.vue";
import MeteorBackground from "./components/MeteorBackground.vue";
import SnowBackground from "./components/SnowBackground.vue";
import SnowPileExample from "./components/SnowPileExample.vue";
import SpaceBackground from "./components/SpaceBackground.vue";
import Typewriter from "./components/Typewriter.vue";
</script>

<template>
  <div>
    <Typewriter
      text="DVMBR"
      :accent-indexes="[]"
      :min-type-ms="35"
      :max-type-ms="80"
      :delete-ms="22"
      :hold-after-type="1100"
      :loop="true"
    />
  </div>
  <div>
    <DialType text="dvmbr" :delay-ms="160" :duration-ms="480" />
  </div>
  <SnowBackground />
  <SnowPileExample />
  <CusorFollower />
  <SpaceBackground />
  <MeteorBackground />
  <FogBackground />
</template>

<style scoped></style>
